from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from kb_studio.auth import require_admin
from kb_studio.db import eval_repo, index_versions_repo
from kb_studio.evaluation.runner import run_eval
from kb_studio.query.service import get_current_index

router = APIRouter(prefix="/api/admin/eval", tags=["admin-eval"], dependencies=[Depends(require_admin)])


class CaseRequest(BaseModel):
    question: str = Field(min_length=1)
    expected_keywords: list[str] = []
    should_refuse: bool = False


class RunRequest(BaseModel):
    index_id: int | None = None


@router.get("/cases")
def list_cases() -> list[dict]:
    return eval_repo.list_cases()


@router.post("/cases")
def create_case(req: CaseRequest) -> dict:
    keywords = [k.strip() for k in req.expected_keywords if k.strip()]
    if not keywords and not req.should_refuse:
        raise HTTPException(status_code=400, detail="非拒答用例至少需要一个期望关键词")
    return {"id": eval_repo.create(req.question.strip(), keywords, req.should_refuse)}


@router.delete("/cases/{case_id}")
def delete_case(case_id: int) -> dict:
    eval_repo.delete(case_id)
    return {}


@router.post("/run")
def run(req: RunRequest) -> dict:
    index = index_versions_repo.get(req.index_id) if req.index_id else get_current_index()
    if not index or index["status"] != index_versions_repo.STATUS_READY:
        raise HTTPException(status_code=400, detail="没有可用的索引版本")
    report = run_eval(index)
    index_versions_repo.update(index["id"], eval_pass_rate=report["pass_rate"])
    return report
