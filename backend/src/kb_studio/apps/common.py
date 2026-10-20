from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from kb_studio.db.connection import init_db
from kb_studio.db.eval_repo import seed_if_empty
from kb_studio.settings import FRONTEND_DIST


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    seed_if_empty()
    yield


def mount_frontend(app: FastAPI, entry_html: str) -> None:
    """托管前端构建产物的指定入口页。只暴露该入口和 assets，另一个入口页在本端口不可访问。"""
    entry = FRONTEND_DIST / entry_html
    if not entry.exists():
        return
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/", include_in_schema=False)
    def index() -> FileResponse:
        return FileResponse(entry)
