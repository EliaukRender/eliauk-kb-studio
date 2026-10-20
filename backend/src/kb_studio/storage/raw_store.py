from pathlib import Path

from kb_studio.settings import DATA_DIR, RAW_DIR


def save(doc_id: int, version: int, filename: str, content: bytes) -> str:
    """保存原文件，返回相对 data/ 的路径；每个版本单独一个目录，旧版本不覆盖，便于回退。"""
    target = RAW_DIR / str(doc_id) / f"v{version}" / Path(filename).name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(content)
    return str(target.relative_to(DATA_DIR))


def read_text(raw_path: str) -> str:
    return (DATA_DIR / raw_path).read_text(encoding="utf-8")
