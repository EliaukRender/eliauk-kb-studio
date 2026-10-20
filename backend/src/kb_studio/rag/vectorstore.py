import chromadb
from langchain_chroma import Chroma

from kb_studio.rag.models import get_embeddings
from kb_studio.settings import CHROMA_DIR


def get_store(index: dict) -> Chroma:
    """index 为 index_versions 表的一行；每个索引版本对应一个独立 collection，互不影响。"""
    return Chroma(
        collection_name=index["collection"],
        embedding_function=get_embeddings(index["embedding_model"]),
        persist_directory=str(CHROMA_DIR),
        # 默认是 L2 距离，文本语义检索用余弦更合适；建库后不可更改
        collection_metadata={"hnsw:space": "cosine"},
    )


def delete_doc_chunks(store: Chroma, doc_id: int) -> None:
    store.delete(where={"doc_id": doc_id})


def drop_collection(collection: str) -> None:
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    if collection in [c.name for c in client.list_collections()]:
        client.delete_collection(collection)
