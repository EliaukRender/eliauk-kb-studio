import os

from langchain.chat_models import init_chat_model
from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings

from kb_studio.settings import CHAT_MODEL, DASHSCOPE_BASE_URL


class MissingApiKeyError(RuntimeError):
    pass


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise MissingApiKeyError(f"缺少 {name}，请在 backend/.env 中填写")
    return value


def get_chat_model(**kwargs):
    _require_env("DEEPSEEK_API_KEY")
    return init_chat_model(CHAT_MODEL, extra_body={"thinking": {"type": "disabled"}}, **kwargs)


def get_embeddings(model: str) -> Embeddings:
    return OpenAIEmbeddings(
        model=model,
        base_url=DASHSCOPE_BASE_URL,
        api_key=_require_env("DASHSCOPE_API_KEY"),
        # 百炼不接受 tiktoken 切出的 token id，必须直接发原文
        check_embedding_ctx_length=False,
        # 百炼单次请求最多 10 条文本
        chunk_size=10,
    )
