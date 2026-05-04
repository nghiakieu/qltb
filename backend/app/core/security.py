"""Security utilities: password hashing and JWT token management."""

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt  # noqa: F401 (re-exported for convenience)

from app.core.config import settings


# ---------------------------------------------------------------------------
# Password utilities (using bcrypt directly — passlib incompatible with bcrypt v5)
# ---------------------------------------------------------------------------

def hash_password(plain: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ---------------------------------------------------------------------------
# JWT utilities
# ---------------------------------------------------------------------------

ALGORITHM = "HS256"


def create_access_token(data: dict[str, Any]) -> str:
    """Create a signed JWT access token with expiry."""
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        hours=settings.ACCESS_TOKEN_EXPIRE_HOURS
    )
    payload["exp"] = expire
    payload["type"] = "access"
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict[str, Any]) -> str:
    """Create a signed JWT refresh token with longer expiry."""
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload["exp"] = expire
    payload["type"] = "refresh"
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and verify a JWT token.
    Raises JWTError if token is invalid or expired.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
