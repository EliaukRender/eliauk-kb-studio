from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from kb_studio.auth import require_admin
from kb_studio.db import index_versions_repo, kv_repo
from kb_studio.ingest import index_state, rebuild

router = APIRouter(prefix="/api/admin/indexes", tags=["admin-indexes"], dependencies=[Depends(require_admin)])


@router.get("")
def list_indexes() -> dict:
    return {"current_id": kv_repo.get_current_index_id(), "items": index_versions_repo.list_all()}


@router.post("/rebuild")
def start_rebuild(background: BackgroundTasks) -> dict:
    index = rebuild.start_rebuild()
    background.add_task(rebuild.run_rebuild, index["id"])
    return index


@router.post("/{index_id}/activate")
def activate(index_id: int) -> dict:
    try:
        return index_state.activate(index_id)
    except index_state.IndexStateError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.delete("/{index_id}")
def delete(index_id: int) -> dict:
    try:
        index_state.remove(index_id)
    except index_state.IndexStateError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return {}
