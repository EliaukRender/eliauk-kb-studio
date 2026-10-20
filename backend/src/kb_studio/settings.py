from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent

load_dotenv(BACKEND_DIR / ".env")

DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = DATA_DIR / "app.db"
RAW_DIR = DATA_DIR / "raw"
CHROMA_DIR = DATA_DIR / "chroma"
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"

HOST = "127.0.0.1"
PORT = 8765

CHAT_MODEL = "deepseek:deepseek-flash"
DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"

SUPPORTED_SUFFIXES = (".md", ".txt")
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
