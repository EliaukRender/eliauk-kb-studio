from kb_studio.db import documents_repo, index_versions_repo, kv_repo
from kb_studio.rag.vectorstore import drop_collection, get_store


class IndexStateError(ValueError):
    pass


def get_current_index() -> dict | None:
    index_id = kv_repo.get_current_index_id()
    return index_versions_repo.get(index_id) if index_id else None


def ensure_current_index() -> dict:
    """首次入库时还没有任何索引版本，按当前运行参数自动创建 kb_v1 并设为当前。"""
    current = get_current_index()
    if current:
        return current
    s = kv_repo.get_runtime_settings()
    index = index_versions_repo.create(
        s["embedding_model"], s["chunk_size"], s["chunk_overlap"], index_versions_repo.STATUS_READY
    )
    kv_repo.set_current_index_id(index["id"])
    return index


def refresh_counts(index: dict) -> None:
    """增量入库后按 collection 实际内容回写统计，保证索引列表里的文档数、块数准确。"""
    metas = get_store(index).get(include=["metadatas"])["metadatas"]
    index_versions_repo.update(
        index["id"], doc_count=len({m.get("doc_id") for m in metas}), chunk_count=len(metas)
    )


def sync_documents_with_index(index: dict) -> None:
    """切换索引后，按该索引里实际存在的块刷新文档状态，旧快照里缺失或版本落后的文档会被标出来。"""
    store = get_store(index)
    for doc in documents_repo.list_documents():
        metas = store.get(where={"doc_id": doc["id"]}, include=["metadatas"])["metadatas"]
        if not metas:
            documents_repo.set_status(doc["id"], documents_repo.STATUS_PENDING, 0, "当前索引中不包含该文档")
            continue
        versions = {m.get("version") for m in metas}
        if versions != {doc["current_version"]}:
            documents_repo.set_status(
                doc["id"], documents_repo.STATUS_PENDING, len(metas),
                f"当前索引中是 v{max(versions)}，与当前版本 v{doc['current_version']} 不一致",
            )
            continue
        documents_repo.set_status(doc["id"], documents_repo.STATUS_INDEXED, len(metas))


def activate(index_id: int) -> dict:
    index = index_versions_repo.get(index_id)
    if not index:
        raise IndexStateError("索引版本不存在")
    if index["status"] != index_versions_repo.STATUS_READY:
        raise IndexStateError("只能切换到构建完成的索引版本")
    kv_repo.set_current_index_id(index_id)
    sync_documents_with_index(index)
    refresh_counts(index)
    return index_versions_repo.get(index_id)


def remove(index_id: int) -> None:
    if index_id == kv_repo.get_current_index_id():
        raise IndexStateError("不能删除当前正在使用的索引版本")
    index = index_versions_repo.get(index_id)
    if not index:
        raise IndexStateError("索引版本不存在")
    if index["status"] in (index_versions_repo.STATUS_BUILDING, index_versions_repo.STATUS_EVALUATING):
        raise IndexStateError("索引正在构建或评估中，请稍后再删除")
    drop_collection(index["collection"])
    index_versions_repo.delete(index_id)
