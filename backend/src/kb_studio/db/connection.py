import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime

from kb_studio.settings import DATA_DIR, DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    filename        TEXT NOT NULL UNIQUE,
    current_version INTEGER NOT NULL,
    content_hash    TEXT NOT NULL,
    status          TEXT NOT NULL,
    chunk_count     INTEGER NOT NULL DEFAULT 0,
    error           TEXT,
    updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS document_versions (
    doc_id       INTEGER NOT NULL REFERENCES documents(id),
    version      INTEGER NOT NULL,
    content_hash TEXT NOT NULL,
    raw_path     TEXT NOT NULL,
    created_at   TEXT NOT NULL,
    PRIMARY KEY (doc_id, version)
);

CREATE TABLE IF NOT EXISTS index_versions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    collection      TEXT UNIQUE,
    embedding_model TEXT NOT NULL,
    chunk_size      INTEGER NOT NULL,
    chunk_overlap   INTEGER NOT NULL,
    status          TEXT NOT NULL,
    doc_count       INTEGER NOT NULL DEFAULT 0,
    chunk_count     INTEGER NOT NULL DEFAULT 0,
    eval_pass_rate  REAL,
    error           TEXT,
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kv (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS eval_cases (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    question          TEXT NOT NULL,
    expected_keywords TEXT NOT NULL,
    should_refuse     INTEGER NOT NULL DEFAULT 0
);
"""


def now() -> str:
    return datetime.now().isoformat(timespec="seconds")


@contextmanager
def get_conn() -> Iterator[sqlite3.Connection]:
    # 每次调用新建连接：FastAPI 同步接口跑在线程池里，SQLite 连接不能跨线程共享
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.executescript(SCHEMA)


def rows_to_dicts(rows: list[sqlite3.Row]) -> list[dict]:
    return [dict(r) for r in rows]
