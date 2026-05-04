"""Authentication endpoints: login, refresh, me, change-password."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
    hash_password,
)
from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.core.limiter import limiter
from app.models.tai_khoan import TaiKhoan
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    UserInfo,
)

router = APIRouter()


@router.post("/login", response_model=TokenResponse, summary="Đăng nhập")
@limiter.limit("20/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate with username + password.
    Returns access_token (8h) and refresh_token (7d).
    """
    user: TaiKhoan | None = (
        db.query(TaiKhoan).filter(TaiKhoan.username == payload.username).first()
    )

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không đúng",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã bị khóa. Liên hệ Admin để được hỗ trợ.",
        )

    # Update last_login timestamp
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token_data = {"sub": user.id, "username": user.username, "vai_tro": user.vai_tro}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/refresh", response_model=TokenResponse, summary="Làm mới token")
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    """
    Use a valid refresh_token to obtain a new access_token + refresh_token pair.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Refresh token không hợp lệ hoặc đã hết hạn",
    )
    try:
        data = decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise credentials_exception
        tai_khoan_id: str = data.get("sub")
    except JWTError:
        raise credentials_exception

    user = db.query(TaiKhoan).filter(TaiKhoan.id == tai_khoan_id).first()
    if not user or not user.is_active:
        raise credentials_exception

    token_data = {"sub": user.id, "username": user.username, "vai_tro": user.vai_tro}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.get("/me", response_model=UserInfo, summary="Thông tin tài khoản hiện tại")
def get_me(current_user: TaiKhoan = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.post("/change-password", summary="Đổi mật khẩu")
def change_password(
    payload: ChangePasswordRequest,
    current_user: TaiKhoan = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Allow a user to change their own password."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không đúng",
        )
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}
