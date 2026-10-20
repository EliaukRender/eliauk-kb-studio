from langchain_core.documents import Document
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

_HEADERS = [("#", "h1"), ("##", "h2"), ("###", "h3")]
_SEPARATORS = ["\n\n", "\n", "。", "！", "？", "；", "，", " ", ""]


def chunk_id(doc_id: int, index: int) -> str:
    # 稳定 ID：同一文档重新入库时可按 doc_id 精确删除旧块
    return f"{doc_id}:{index}"


def _section_title(metadata: dict) -> str:
    return " > ".join(metadata[k] for _, k in _HEADERS if metadata.get(k))


def split_text(text: str, chunk_size: int, chunk_overlap: int) -> list[Document]:
    """先按 Markdown 标题切成章节，再按长度切块；纯文本没有标题时整篇作为一个章节。"""
    sections = MarkdownHeaderTextSplitter(headers_to_split_on=_HEADERS, strip_headers=False).split_text(text)
    for section in sections:
        section.metadata = {"section": _section_title(section.metadata)}
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, chunk_overlap=chunk_overlap, separators=_SEPARATORS
    )
    return splitter.split_documents(sections)


def build_chunks(
    doc_id: int, version: int, filename: str, text: str, chunk_size: int, chunk_overlap: int
) -> tuple[list[str], list[Document]]:
    chunks = split_text(text, chunk_size, chunk_overlap)
    for chunk in chunks:
        chunk.metadata.update({"doc_id": doc_id, "version": version, "source": filename})
    return [chunk_id(doc_id, i) for i in range(len(chunks))], chunks
