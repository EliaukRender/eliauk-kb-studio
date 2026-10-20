import hashlib
from pathlib import Path

from kb_studio.db import documents_repo
from kb_studio.ingest.index_state import ensure_current_index, refresh_counts
from kb_studio.rag.splitter import build_chunks
from kb_studio.rag.vectorstore import delete_doc_chunks, get_store
from kb_studio.settings import SUPPORTED_SUFFIXES
from kb_studio.storage import raw_store

ACTION_CREATE = "created"
ACTION_NEW_VERSION = "updated"
ACTION_SKIP = "skipped"


class InvalidDocumentError(ValueError):
    pass


def content_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def decide_action(existing: dict | None, new_hash: str) -> str:
    """内容哈希没变就跳过，省掉一次 Embedding 调用；已删除的文档重新上传视为新版本。"""
    if existing is None:
        return ACTION_CREATE
    if existing["status"] != documents_repo.STATUS_DELETED and existing["content_hash"] == new_hash:
        return ACTION_SKIP
    return ACTION_NEW_VERSION


def _validate(filename: str, content: bytes) -> None:
    if Path(filename).suffix.lower() not in SUPPORTED_SUFFIXES:
        raise InvalidDocumentError(f"{filename}：只支持 {' / '.join(SUPPORTED_SUFFIXES)} 文件")
    try:
        content.decode("utf-8")
    except UnicodeDecodeError as e:
        raise InvalidDocumentError(f"{filename}：不是 UTF-8 编码的文本") from e


def index_document(doc_id: int) -> dict:
    """把文档当前版本写入当前索引：先按 doc_id 删除旧块，再写入新块。失败时记录错误而不抛出。"""
    doc = documents_repo.get(doc_id)
    version = documents_repo.get_version(doc_id, doc["current_version"])
    try:
        index = ensure_current_index()
        ids, chunks = build_chunks(
            doc_id,
            version["version"],
            doc["filename"],
            raw_store.read_text(version["raw_path"]),
            index["chunk_size"],
            index["chunk_overlap"],
        )
        store = get_store(index)
        delete_doc_chunks(store, doc_id)
        if chunks:
            store.add_documents(chunks, ids=ids)
        documents_repo.set_status(doc_id, documents_repo.STATUS_INDEXED, len(chunks))
        refresh_counts(index)
    except Exception as e:  # noqa: BLE001 入库失败要落到文档状态上，供后台展示和重试
        documents_repo.set_status(doc_id, documents_repo.STATUS_FAILED, 0, str(e))
    return documents_repo.get(doc_id)


def upload_document(filename: str, content: bytes) -> dict:
    filename = Path(filename).name
    _validate(filename, content)
    new_hash = content_hash(content)
    existing = documents_repo.get_by_filename(filename)
    action = decide_action(existing, new_hash)
    if action == ACTION_SKIP:
        return {"filename": filename, "action": action, "document": existing}

    doc_id = existing["id"] if existing else documents_repo.create(filename, new_hash)
    version = documents_repo.next_version(doc_id)
    raw_path = raw_store.save(doc_id, version, filename, content)
    documents_repo.add_version(doc_id, version, new_hash, raw_path)
    documents_repo.set_current_version(doc_id, version, new_hash)
    return {"filename": filename, "action": action, "document": index_document(doc_id)}


def delete_document(doc_id: int) -> None:
    """软删除：原文件和版本记录保留，只从当前索引移除；旧索引版本是快照，不受影响。"""
    if not documents_repo.get(doc_id):
        raise InvalidDocumentError("文档不存在")
    index = ensure_current_index()
    delete_doc_chunks(get_store(index), doc_id)
    documents_repo.set_status(doc_id, documents_repo.STATUS_DELETED)
    refresh_counts(index)


def rollback_document(doc_id: int, version: int) -> dict:
    target = documents_repo.get_version(doc_id, version)
    if not target:
        raise InvalidDocumentError(f"文档不存在 v{version} 版本")
    documents_repo.set_current_version(doc_id, version, target["content_hash"])
    return index_document(doc_id)
