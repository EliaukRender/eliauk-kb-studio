import pytest

from kb_studio.db import documents_repo
from kb_studio.db.connection import get_conn, init_db


@pytest.fixture(autouse=True)
def docs():
    init_db()
    with get_conn() as conn:
        conn.execute("DELETE FROM documents")
    for name in ["员工手册.md", "报销制度.md", "IT支持FAQ.md", "it_100%_guide.md", "readme.txt"]:
        documents_repo.create(name, "h")
    documents_repo.set_status(documents_repo.get_by_filename("readme.txt")["id"], documents_repo.STATUS_DELETED)


def names(items):
    return sorted(d["filename"] for d in items)


def test_paginates_and_excludes_deleted():
    first, total = documents_repo.page_documents("", 0, 3)
    second, _ = documents_repo.page_documents("", 3, 3)
    assert total == 4
    assert len(first) == 3 and len(second) == 1
    assert not {d["id"] for d in first} & {d["id"] for d in second}


def test_keyword_is_case_insensitive():
    items, total = documents_repo.page_documents("faq", 0, 10)
    assert total == 1 and names(items) == ["IT支持FAQ.md"]


def test_keyword_matches_chinese():
    items, _ = documents_repo.page_documents("制度", 0, 10)
    assert names(items) == ["报销制度.md"]


def test_like_wildcards_are_literal():
    assert names(documents_repo.page_documents("100%", 0, 10)[0]) == ["it_100%_guide.md"]
    assert documents_repo.page_documents("%", 0, 10)[1] == 1
    assert documents_repo.page_documents("_", 0, 10)[1] == 1
