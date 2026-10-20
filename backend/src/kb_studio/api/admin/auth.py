from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from kb_studio import auth
from kb_studio.settings import ADMIN_PASSWORD_MIN_LENGTH

router = APIRouter(prefix="/api/admin/auth", tags=["admin-auth"])


class PasswordRequest(BaseModel):
    password: str


@router.get("/status")
def status() -> dict:
    return {"initialized": auth.is_initialized()}


@router.post("/setup")
def setup(req: PasswordRequest) -> dict:
    if auth.is_initialized():
        raise HTTPException(status_code=409, detail="管理员密码已设置，请直接登录")
    if len(req.password) < ADMIN_PASSWORD_MIN_LENGTH:
        raise HTTPException(status_code=400, detail=f"密码至少 {ADMIN_PASSWORD_MIN_LENGTH} 位")
    auth.set_password(req.password)
    return {"token": auth.issue_token()}


@router.post("/login")
def login(req: PasswordRequest) -> dict:
    if not auth.check_password(req.password):
        raise HTTPException(status_code=401, detail="密码错误")
    return {"token": auth.issue_token()}


@router.post("/logout")
def logout(token: str = Depends(auth.require_admin)) -> dict:
    auth.revoke_token(token)
    return {}
