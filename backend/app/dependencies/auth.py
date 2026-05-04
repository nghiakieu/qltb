"""
FastAPI dependencies for authentication and authorization.

Usage:
    get_current_user   → validates JWT, returns TaiKhoan
    require_role(...)  → factory: checks vai_tro, raises 403 if not allowed
    get_scope_filter   → returns cong_truong/mui IDs the user may access
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.database import get_db
from app.models.tai_khoan import TaiKhoan, TaiKhoanPhamVi

security = HTTPBearer()


# ---------------------------------------------------------------------------
# Core: get authenticated user from JWT
# ---------------------------------------------------------------------------

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Session = Depends(get_db),
) -> TaiKhoan:
    """
    Decode the Bearer JWT and return the corresponding TaiKhoan.
    Raises 401 if token is missing, invalid, or user not found/inactive.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token không hợp lệ hoặc đã hết hạn",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(credentials.credentials)
        tai_khoan_id: str = payload.get("sub")
        if not tai_khoan_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(TaiKhoan).filter(TaiKhoan.id == tai_khoan_id).first()
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã bị khóa. Liên hệ Admin để được hỗ trợ.",
        )
    return user


# ---------------------------------------------------------------------------
# Role guard
# ---------------------------------------------------------------------------

def require_role(*roles: str):
    """
    Dependency factory. Usage:

        @router.delete("/{id}")
        async def delete_item(user=Depends(require_role("ADMIN"))):
            ...
    """
    async def checker(user: TaiKhoan = Depends(get_current_user)) -> TaiKhoan:
        if user.vai_tro not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Vai trò '{user.vai_tro}' không có quyền thực hiện hành động này.",
            )
        return user
    return checker


# ---------------------------------------------------------------------------
# Scope filter: what data can this user see?
# ---------------------------------------------------------------------------

def get_scope_filter(
    user: TaiKhoan = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Return a dict of allowed IDs for the current user.

    ADMIN  → {"cong_truong_ids": None, "mui_ids": None}  (no filter = see all)
    Others → {"cong_truong_ids": set | None, "mui_ids": set | None}

    How to apply in a router:
        query = db.query(ThietBi)
        scope = Depends(get_scope_filter)
        if scope["cong_truong_ids"]:
            query = query.filter(ThietBi.cong_truong_id.in_(scope["cong_truong_ids"]))
    """
    if user.vai_tro == "ADMIN":
        return {"cong_truong_ids": None, "mui_ids": None}

    pham_vis: list[TaiKhoanPhamVi] = (
        db.query(TaiKhoanPhamVi)
        .filter(TaiKhoanPhamVi.tai_khoan_id == user.id)
        .all()
    )

    cong_truong_ids = {p.cong_truong_id for p in pham_vis if p.cong_truong_id}
    mui_ids = {p.mui_thi_cong_id for p in pham_vis if p.mui_thi_cong_id}

    return {
        "cong_truong_ids": cong_truong_ids if cong_truong_ids else None,
        "mui_ids": mui_ids if mui_ids else None,
    }
