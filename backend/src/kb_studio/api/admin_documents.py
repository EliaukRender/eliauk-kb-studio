from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel

from kb_studio.auth import require_admin
from kb_studio.db import documents_repo
from kb_studio.ingest import incremental

router = APIRouter(prefix="/api/admin/documents", tags=["admin-documents"], dependencies=[Depends(require_admin)])


class RollbackRequest(BaseModel):
    version: int


def _get_or_404(doc_id: int) -> dict:
    doc = documents_repo.get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")
    return doc


@router.get("")
def list_documents() -> list[dict]:
    return documents_repo.list_documents()


# 用同步函数：入库要调用 Embedding 接口，放在 async 里会阻塞事件循环，同步接口由 FastAPI 放进线程池执行
@router.post("")
def upload(files: list[UploadFile]) -> list[dict]:
    results = []
    for f in files:
        content = f.file.read()
        try:
            results.append(incremental.upload_document(f.filename or "untitled.txt", content))
        except incremental.InvalidDocumentError as e:
            results.append({"filename": f.filename, "action": "rejected", "error": str(e)})
    return results


@router.get("/{doc_id}/versions")
def list_versions(doc_id: int) -> list[dict]:
    _get_or_404(doc_id)
    return documents_repo.list_versions(doc_id)


@router.post("/{doc_id}/rollback")
def rollback(doc_id: int, req: RollbackRequest) -> dict:
    _get_or_404(doc_id)
    try:
        return incremental.rollback_document(doc_id, req.version)
    except incremental.InvalidDocumentError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/{doc_id}/reindex")
def reindex(doc_id: int) -> dict:
    _get_or_404(doc_id)
    return incremental.index_document(doc_id)


@router.delete("/{doc_id}")
def delete(doc_id: int) -> dict:
    _get_or_404(doc_id)
    incremental.delete_document(doc_id)
    return {}
