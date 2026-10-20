"""只读查询层：解析当前索引、按运行参数检索。问答端只能经由这里访问知识库。"""

from collections.abc import Iterator

from langchain_core.documents import Document

from kb_studio.db import index_versions_repo, kv_repo
from kb_studio.rag import qa
from kb_studio.rag.vectorstore import get_store


def get_current_index() -> dict | None:
    index_id = kv_repo.get_current_index_id()
    return index_versions_repo.get(index_id) if index_id else None


def search(index: dict, question: str) -> list[tuple[Document, float]]:
    s = kv_repo.get_runtime_settings()
    return qa.retrieve(get_store(index), question, s["top_k"], s["score_threshold"])


def stream_answer(question: str, hits: list[tuple[Document, float]]) -> Iterator[str]:
    return qa.stream_answer(question, [doc for doc, _ in hits])


def answer(question: str, hits: list[tuple[Document, float]]) -> str:
    return qa.answer(question, [doc for doc, _ in hits])


def to_sources(hits: list[tuple[Document, float]]) -> list[dict]:
    return [qa.to_source(doc, score) for doc, score in hits]
