import hashlib
import hmac
import secrets
import time

from fastapi import Header, HTTPException

from kb_studio.db import kv_repo
from kb_studio.settings import ADMIN_TOKEN_TTL_SECONDS

# token 只存在内存里，后端重启后需要重新登录
_tokens: dict[str, float] = {}


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    _, salt_hex, _ = stored.split("$")
    return hmac.compare_digest(hash_password(password, bytes.fromhex(salt_hex)), stored)


def is_initialized() -> bool:
    return kv_repo.get(kv_repo.ADMIN_PASSWORD_KEY) is not None


def set_password(password: str) -> None:
    kv_repo.put(kv_repo.ADMIN_PASSWORD_KEY, hash_password(password))


def check_password(password: str) -> bool:
    stored = kv_repo.get(kv_repo.ADMIN_PASSWORD_KEY)
    return stored is not None and verify_password(password, stored)


def issue_token() -> str:
    token = secrets.token_urlsafe(32)
    _tokens[token] = time.time() + ADMIN_TOKEN_TTL_SECONDS
    return token


def revoke_token(token: str) -> None:
    _tokens.pop(token, None)


def _extract_token(authorization: str | None) -> str | None:
    if authorization and authorization.startswith("Bearer "):
        return authorization.removeprefix("Bearer ")
    return None


def require_admin(authorization: str | None = Header(default=None)) -> str:
    token = _extract_token(authorization)
    expires_at = _tokens.get(token) if token else None
    if not expires_at or expires_at < time.time():
        if token:
            revoke_token(token)
        raise HTTPException(status_code=401, detail="未登录或登录已过期")
    return token
