from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from kb_studio.api import admin_auth, admin_documents, admin_eval, admin_indexes, admin_settings, chat
from kb_studio.db.connection import init_db
from kb_studio.db.eval_repo import seed_if_empty
from kb_studio.settings import FRONTEND_DIST


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    seed_if_empty()
    yield


app = FastAPI(title="kb-studio", lifespan=lifespan)

for module in (chat, admin_auth, admin_documents, admin_indexes, admin_eval, admin_settings):
    app.include_router(module.router)

# 生产模式由后端直接托管前端构建产物；开发时前端走 Vite，通过代理访问 /api
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
