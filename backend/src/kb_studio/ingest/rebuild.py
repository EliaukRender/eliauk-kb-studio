from kb_studio.db import documents_repo, index_versions_repo, kv_repo
from kb_studio.evaluation.runner import run_eval
from kb_studio.rag.splitter import build_chunks
from kb_studio.rag.vectorstore import drop_collection, get_store
from kb_studio.storage import raw_store


def start_rebuild() -> dict:
    """按当前运行参数登记一个新的索引版本；实际构建在后台任务 run_rebuild 中进行。"""
    s = kv_repo.get_runtime_settings()
    return index_versions_repo.create(
        s["embedding_model"], s["chunk_size"], s["chunk_overlap"], index_versions_repo.STATUS_BUILDING
    )


def run_rebuild(index_id: int) -> None:
    index = index_versions_repo.get(index_id)
    try:
        store = get_store(index)
        docs = documents_repo.list_documents()
        total_chunks = 0
        for doc in docs:
            version = documents_repo.get_version(doc["id"], doc["current_version"])
            ids, chunks = build_chunks(
                doc["id"],
                version["version"],
                doc["filename"],
                raw_store.read_text(version["raw_path"]),
                index["chunk_size"],
                index["chunk_overlap"],
            )
            if chunks:
                store.add_documents(chunks, ids=ids)
            total_chunks += len(chunks)
        index_versions_repo.update(
            index_id, status=index_versions_repo.STATUS_EVALUATING, doc_count=len(docs), chunk_count=total_chunks
        )
    except Exception as e:  # noqa: BLE001 后台任务没有调用方接收异常，失败信息写回索引记录
        drop_collection(index["collection"])
        index_versions_repo.update(index_id, status=index_versions_repo.STATUS_FAILED, error=str(e))
        return

    # 构建完只跑回归测试、记录通过率，是否切换由人决定
    try:
        report = run_eval(index_versions_repo.get(index_id))
        index_versions_repo.update(index_id, eval_pass_rate=report["pass_rate"])
    except Exception as e:  # noqa: BLE001 评估失败不影响索引本身可用
        index_versions_repo.update(index_id, error=f"回归测试失败：{e}")
    finally:
        index_versions_repo.update(index_id, status=index_versions_repo.STATUS_READY)
