import json
from collections.abc import Iterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from kb_studio.db import documents_repo
from kb_studio.query import service

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


def _sse(event: str, data) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _chat_events(question: str) -> Iterator[str]:
    try:
        index = service.get_current_index()
        if not index:
            yield _sse("token", "知识库还没有内容，请先在管理后台上传文档。")
            yield _sse("done", {})
            return
        hits = service.search(index, question)
        yield _sse("sources", service.to_sources(hits))
        for chunk in service.stream_answer(question, hits):
            yield _sse("token", chunk)
        yield _sse("done", {})
    except Exception as e:  # noqa: BLE001 流已经开始后无法再改状态码，只能通过事件告知前端
        yield _sse("error", str(e))


@router.post("/chat")
def chat(req: ChatRequest) -> StreamingResponse:
    return StreamingResponse(_chat_events(req.question.strip()), media_type="text/event-stream")


@router.get("/status")
def status() -> dict:
    index = service.get_current_index()
    return {
        "has_index": index is not None,
        "current_index": index["collection"] if index else None,
        "document_count": len(documents_repo.list_documents()),
    }
