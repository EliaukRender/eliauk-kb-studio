from fastapi import FastAPI
from fastapi.testclient import TestClient

from kb_studio.api.admin import documents
from kb_studio.auth import require_admin
from kb_studio.settings import UPLOAD_MAX_FILE_BYTES, UPLOAD_MAX_FILES

# 只挂载文档路由并跳过鉴权；被拒绝的请求不会走到入库，不会调用模型接口
app = FastAPI()
app.include_router(documents.router)
app.dependency_overrides[require_admin] = lambda: "test"
client = TestClient(app)


def test_rejects_too_many_files():
    files = [("files", (f"{i}.md", b"x")) for i in range(UPLOAD_MAX_FILES + 1)]
    res = client.post("/api/admin/documents", files=files)
    assert res.status_code == 400
    assert str(UPLOAD_MAX_FILES) in res.json()["detail"]


def test_rejects_oversized_file():
    res = client.post("/api/admin/documents", files=[("files", ("big.md", b"x" * (UPLOAD_MAX_FILE_BYTES + 1)))])
    assert res.status_code == 200
    [result] = res.json()
    assert result["action"] == "rejected"
    assert "10MB" in result["error"]
