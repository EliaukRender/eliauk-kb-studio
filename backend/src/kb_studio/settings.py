import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent

load_dotenv(BACKEND_DIR / ".env")

# 部署相关配置全部可由环境变量覆盖，默认值面向本机单用户
HOST = os.getenv("KB_HOST", "127.0.0.1")
CHAT_PORT = int(os.getenv("KB_CHAT_PORT", "8765"))
ADMIN_PORT = int(os.getenv("KB_ADMIN_PORT", "8766"))

DATA_DIR = Path(os.getenv("KB_DATA_DIR", PROJECT_ROOT / "data"))
DB_PATH = DATA_DIR / "app.db"
RAW_DIR = DATA_DIR / "raw"
CHROMA_DIR = DATA_DIR / "chroma"
# 设置后改用 Chroma 服务端（如 http://127.0.0.1:8000）；问答与管理分进程部署时必须设置，见 ADR 0007
CHROMA_URL = os.getenv("KB_CHROMA_URL", "")

FRONTEND_DIST = Path(os.getenv("KB_FRONTEND_DIST", PROJECT_ROOT / "frontend" / "dist"))
CHAT_ENTRY_HTML = "index.html"
ADMIN_ENTRY_HTML = "admin.html"

CHAT_MODEL = "deepseek:deepseek-flash"
DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"

SUPPORTED_SUFFIXES = (".md", ".txt")
# 前端同样校验；后端兜底，防止绕过页面直接调用接口
UPLOAD_MAX_FILES = 10
UPLOAD_MAX_FILE_BYTES = 10 * 1024 * 1024
ADMIN_TOKEN_TTL_SECONDS = 8 * 3600
ADMIN_PASSWORD_MIN_LENGTH = 6

# 运行参数的初始值，之后以 SQLite kv 表为准，可在后台修改
DEFAULT_RUNTIME_SETTINGS = {
    "embedding_model": "text-embedding-v4",
    "chunk_size": 400,
    "chunk_overlap": 60,
    "top_k": 4,
    "score_threshold": 0.4,
}
