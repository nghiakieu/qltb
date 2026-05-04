"""Pydantic schemas for authentication and account management."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


# ---------------------------------------------------------------------------
# Auth: Login & Token
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ---------------------------------------------------------------------------
# Current user info (returned from /auth/me)
# ---------------------------------------------------------------------------

class UserInfo(BaseModel):
    id: str
    username: str
    ho_ten: str
    vai_tro: str
    email: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# TaiKhoan CRUD — used by Admin
# ---------------------------------------------------------------------------

class TaiKhoanCreate(BaseModel):
    username: str
    password: str
    ho_ten: str
    vai_tro: str
    email: Optional[str] = None
    nhan_su_id: Optional[str] = None

    @field_validator("vai_tro")
    @classmethod
    def validate_vai_tro(cls, v: str) -> str:
        allowed = {"ADMIN", "CHI_HUY_TRUONG", "DIEU_PHOI", "GIAM_SAT", "LAI_XE"}
        if v not in allowed:
            raise ValueError(f"vai_tro phải là một trong: {', '.join(sorted(allowed))}")
        return v


class TaiKhoanUpdate(BaseModel):
    ho_ten: Optional[str] = None
    email: Optional[str] = None
    vai_tro: Optional[str] = None
    is_active: Optional[bool] = None
    nhan_su_id: Optional[str] = None
    new_password: Optional[str] = None  # If set, admin resets password

    @field_validator("vai_tro")
    @classmethod
    def validate_vai_tro(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"ADMIN", "CHI_HUY_TRUONG", "DIEU_PHOI", "GIAM_SAT", "LAI_XE"}
        if v not in allowed:
            raise ValueError(f"vai_tro phải là một trong: {', '.join(sorted(allowed))}")
        return v


class TaiKhoanResponse(BaseModel):
    id: str
    username: str
    ho_ten: str
    vai_tro: str
    email: Optional[str] = None
    is_active: bool
    nhan_su_id: Optional[str] = None
    created_by: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# TaiKhoanAdminResponse = full detail (same fields, alias for clarity)
TaiKhoanAdminResponse = TaiKhoanResponse


# ---------------------------------------------------------------------------
# TaiKhoanPhamVi CRUD
# ---------------------------------------------------------------------------

class PhamViCreate(BaseModel):
    cong_truong_id: Optional[str] = None
    mui_thi_cong_id: Optional[str] = None


class PhamViResponse(BaseModel):
    id: str
    tai_khoan_id: str
    cong_truong_id: Optional[str] = None
    mui_thi_cong_id: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Change password
# ---------------------------------------------------------------------------

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
