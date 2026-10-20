"""管理应用：知识库运营与索引管理，部署时只应在内网或受控网络暴露。"""

from fastapi import FastAPI

from kb_studio.api.admin import auth, documents, eval, indexes, settings
from kb_studio.apps.common import lifespan, mount_frontend
from kb_studio.settings import ADMIN_ENTRY_HTML

app = FastAPI(title="KB Studio · 管理", lifespan=lifespan)
for module in (auth, documents, indexes, eval, settings):
    app.include_router(module.router)
mount_frontend(app, ADMIN_ENTRY_HTML)
