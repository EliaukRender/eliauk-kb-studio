from kb_studio.db.documents_repo import STATUS_DELETED, STATUS_INDEXED
from kb_studio.ingest.incremental import (
    ACTION_CREATE,
    ACTION_NEW_VERSION,
    ACTION_SKIP,
    content_hash,
    decide_action,
)


def test_new_file_is_created():
    assert decide_action(None, "h1") == ACTION_CREATE


def test_same_hash_is_skipped():
    assert decide_action({"status": STATUS_INDEXED, "content_hash": "h1"}, "h1") == ACTION_SKIP


def test_changed_hash_creates_new_version():
    assert decide_action({"status": STATUS_INDEXED, "content_hash": "h1"}, "h2") == ACTION_NEW_VERSION


def test_reupload_deleted_document_creates_new_version_even_if_same_content():
    assert decide_action({"status": STATUS_DELETED, "content_hash": "h1"}, "h1") == ACTION_NEW_VERSION


def test_content_hash_is_stable():
    assert content_hash(b"abc") == content_hash(b"abc") != content_hash(b"abd")
