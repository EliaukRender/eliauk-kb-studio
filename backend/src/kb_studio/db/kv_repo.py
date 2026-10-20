import json

from kb_studio.db.connection import get_conn
from kb_studio.settings import DEFAULT_RUNTIME_SETTINGS

CURRENT_INDEX_KEY = "current_index_id"
ADMIN_PASSWORD_KEY = "admin_password_hash"
RUNTIME_SETTINGS_KEY = "runtime_settings"


def get(key: str) -> str | None:
    with get_conn() as conn:
        row = conn.execute("SELECT value FROM kv WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else None


def put(key: str, value: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, value),
        )


def get_current_index_id() -> int | None:
    value = get(CURRENT_INDEX_KEY)
    return int(value) if value else None


def set_current_index_id(index_id: int) -> None:
    put(CURRENT_INDEX_KEY, str(index_id))


def get_runtime_settings() -> dict:
    stored = json.loads(get(RUNTIME_SETTINGS_KEY) or "{}")
    return {**DEFAULT_RUNTIME_SETTINGS, **stored}


def update_runtime_settings(changes: dict) -> dict:
    merged = {**get_runtime_settings(), **changes}
    put(RUNTIME_SETTINGS_KEY, json.dumps(merged))
    return merged
