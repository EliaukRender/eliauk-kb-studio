from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, model_validator

from kb_studio.auth import require_admin
from kb_studio.db import kv_repo

router = APIRouter(prefix="/api/admin/settings", tags=["admin-settings"], dependencies=[Depends(require_admin)])


class RuntimeSettings(BaseModel):
    embedding_model: str = Field(min_length=1)
    chunk_size: int = Field(ge=100, le=4000)
    chunk_overlap: int = Field(ge=0, le=1000)
    top_k: int = Field(ge=1, le=20)
    score_threshold: float = Field(ge=0, le=1)

    @model_validator(mode="after")
    def check_overlap(self):
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError("chunk_overlap 必须小于 chunk_size")
        return self


@router.get("")
def get_settings() -> dict:
    return kv_repo.get_runtime_settings()


@router.put("")
def update_settings(req: RuntimeSettings) -> dict:
    # embedding_model / chunk_* 只在重建索引时生效；top_k / score_threshold 立即作用于问答
    return kv_repo.update_runtime_settings(req.model_dump())
