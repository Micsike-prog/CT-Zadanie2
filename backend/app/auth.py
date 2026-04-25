from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt
from fastapi import HTTPException, status

from .config import get_settings


JWT_ALGORITHM = "HS256"


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user: dict[str, Any]) -> tuple[str, int]:
    settings = get_settings()
    expires_delta = timedelta(seconds=settings.jwt_expires_seconds)
    expires_at = datetime.now(timezone.utc) + expires_delta
    payload = {
        "sub": str(user["id"]),
        "email": user["email"],
        "exp": expires_at,
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=JWT_ALGORITHM)
    return token, settings.jwt_expires_seconds


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, get_settings().jwt_secret, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
