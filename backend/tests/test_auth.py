import pytest
from fastapi import HTTPException

from kb_studio import auth


def test_password_hash_roundtrip():
    stored = auth.hash_password("secret123")
    assert stored.startswith("scrypt$")
    assert auth.verify_password("secret123", stored)
    assert not auth.verify_password("wrong", stored)


def test_same_password_uses_different_salt():
    assert auth.hash_password("secret123") != auth.hash_password("secret123")


def test_require_admin_accepts_issued_token_and_rejects_revoked():
    token = auth.issue_token()
    assert auth.require_admin(f"Bearer {token}") == token
    auth.revoke_token(token)
    with pytest.raises(HTTPException):
        auth.require_admin(f"Bearer {token}")


def test_require_admin_rejects_missing_header():
    with pytest.raises(HTTPException):
        auth.require_admin(None)
