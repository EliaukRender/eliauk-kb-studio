from kb_studio.db.connection import get_conn, now, rows_to_dicts

STATUS_PENDING = "pending"
STATUS_INDEXED = "indexed"
STATUS_FAILED = "failed"
STATUS_DELETED = "deleted"


def list_documents(include_deleted: bool = False) -> list[dict]:
    sql = "SELECT * FROM documents"
    if not include_deleted:
        sql += f" WHERE status != '{STATUS_DELETED}'"
    with get_conn() as conn:
        return rows_to_dicts(conn.execute(sql + " ORDER BY updated_at DESC").fetchall())


def get(doc_id: int) -> dict | None:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    return dict(row) if row else None


def get_by_filename(filename: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM documents WHERE filename = ?", (filename,)).fetchone()
    return dict(row) if row else None


def create(filename: str, content_hash: str) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO documents (filename, current_version, content_hash, status, updated_at) VALUES (?, 0, ?, ?, ?)",
            (filename, content_hash, STATUS_PENDING, now()),
        )
        return cur.lastrowid


def next_version(doc_id: int) -> int:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT COALESCE(MAX(version), 0) AS v FROM document_versions WHERE doc_id = ?", (doc_id,)
        ).fetchone()
    return row["v"] + 1


def add_version(doc_id: int, version: int, content_hash: str, raw_path: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO document_versions (doc_id, version, content_hash, raw_path, created_at) VALUES (?, ?, ?, ?, ?)",
            (doc_id, version, content_hash, raw_path, now()),
        )


def list_versions(doc_id: int) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM document_versions WHERE doc_id = ? ORDER BY version DESC", (doc_id,)
        ).fetchall()
    return rows_to_dicts(rows)


def get_version(doc_id: int, version: int) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM document_versions WHERE doc_id = ? AND version = ?", (doc_id, version)
        ).fetchone()
    return dict(row) if row else None


def set_current_version(doc_id: int, version: int, content_hash: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE documents SET current_version = ?, content_hash = ?, status = ?, error = NULL, updated_at = ? WHERE id = ?",
            (version, content_hash, STATUS_PENDING, now(), doc_id),
        )


def set_status(doc_id: int, status: str, chunk_count: int = 0, error: str | None = None) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE documents SET status = ?, chunk_count = ?, error = ?, updated_at = ? WHERE id = ?",
            (status, chunk_count, error, now(), doc_id),
        )
