from kb_studio.db.connection import get_conn, now, rows_to_dicts

STATUS_BUILDING = "building"
STATUS_EVALUATING = "evaluating"
STATUS_READY = "ready"
STATUS_FAILED = "failed"


def collection_name(index_id: int) -> str:
    return f"kb_v{index_id}"


def create(embedding_model: str, chunk_size: int, chunk_overlap: int, status: str) -> dict:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO index_versions (embedding_model, chunk_size, chunk_overlap, status, created_at) VALUES (?, ?, ?, ?, ?)",
            (embedding_model, chunk_size, chunk_overlap, status, now()),
        )
        index_id = cur.lastrowid
        conn.execute(
            "UPDATE index_versions SET collection = ? WHERE id = ?", (collection_name(index_id), index_id)
        )
    return get(index_id)


def get(index_id: int) -> dict | None:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM index_versions WHERE id = ?", (index_id,)).fetchone()
    return dict(row) if row else None


def list_all() -> list[dict]:
    with get_conn() as conn:
        return rows_to_dicts(conn.execute("SELECT * FROM index_versions ORDER BY id DESC").fetchall())


def update(index_id: int, **fields) -> None:
    columns = ", ".join(f"{k} = ?" for k in fields)
    with get_conn() as conn:
        conn.execute(f"UPDATE index_versions SET {columns} WHERE id = ?", (*fields.values(), index_id))


def delete(index_id: int) -> None:
    with get_conn() as conn:
        conn.execute("DELETE FROM index_versions WHERE id = ?", (index_id,))
