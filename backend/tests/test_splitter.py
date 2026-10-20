from kb_studio.rag.splitter import build_chunks, chunk_id

TEXT = "# 手册\n\n## 年假\n入职满 1 年有 5 天年假。\n\n## 病假\n需要病假证明。\n"


def test_chunk_id_format():
    assert chunk_id(3, 0) == "3:0"


def test_build_chunks_attaches_metadata_and_stable_ids():
    ids, chunks = build_chunks(7, 2, "员工手册.md", TEXT, chunk_size=200, chunk_overlap=20)
    assert ids == [f"7:{i}" for i in range(len(chunks))]
    assert {c.metadata["section"] for c in chunks} == {"手册 > 年假", "手册 > 病假"}
    assert all(c.metadata["doc_id"] == 7 and c.metadata["version"] == 2 for c in chunks)
    assert all(c.metadata["source"] == "员工手册.md" for c in chunks)


def test_plain_text_without_headers_still_splits():
    ids, chunks = build_chunks(1, 1, "a.txt", "没有标题的纯文本。" * 50, chunk_size=100, chunk_overlap=10)
    assert len(chunks) > 1
    assert chunks[0].metadata["section"] == ""
