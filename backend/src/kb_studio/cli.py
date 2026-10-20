import asyncio

import uvicorn

from kb_studio.settings import ADMIN_PORT, CHAT_PORT, HOST


def _server(app: str, port: int) -> uvicorn.Server:
    return uvicorn.Server(uvicorn.Config(app, host=HOST, port=port))


def run_chat() -> None:
    _server("kb_studio.apps.chat_app:app", CHAT_PORT).run()


def run_admin() -> None:
    _server("kb_studio.apps.admin_app:app", ADMIN_PORT).run()


async def _serve_all() -> None:
    await asyncio.gather(
        _server("kb_studio.apps.chat_app:app", CHAT_PORT).serve(),
        _server("kb_studio.apps.admin_app:app", ADMIN_PORT).serve(),
    )


def run_all() -> None:
    """本地默认方式：两个应用在同一进程、不同端口运行，共享本地 Chroma 客户端，无需单独启动向量库服务。"""
    asyncio.run(_serve_all())
