"""问答应用：面向使用者，只读，不包含任何管理接口与鉴权逻辑。"""

from fastapi import FastAPI

from kb_studio.api.public import chat
from kb_studio.apps.common import lifespan, mount_frontend
from kb_studio.settings import CHAT_ENTRY_HTML

app = FastAPI(title="KB Studio · 问答", lifespan=lifespan)
app.include_router(chat.router)
mount_frontend(app, CHAT_ENTRY_HTML)
