"""Admin-only API: CRUD for user accounts (TaiKhoan) and scope assignment."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.tai_khoan import TaiKhoan, TaiKhoanPhamVi
from app.core.security import hash_password
from app.core.audit_log import log_audit_event
from app.schemas.auth import (
    UserInfo,
    TaiKhoanCreate,
    TaiKhoanUpdate,
    TaiKhoanAdminResponse,
    PhamViCreate,
    PhamViResponse,
)

router = APIRouter()

# ── Admin-only dependency ─────────────────────────────────────────────────────
AdminRequired = Depends(require_role("ADMIN"))


# ── List accounts ─────────────────────────────────────────────────────────────
@router.get("", response_model=List[TaiKhoanAdminResponse])
def list_tai_khoan(
    db: Session = Depends(get_db),
    _admin=AdminRequired,
):
    """List all user accounts (Admin only)."""
    users = db.query(TaiKhoan).order_by(TaiKhoan.created_at.desc()).all()
    return users


# ── Create account ────────────────────────────────────────────────────────────
@router.post("", response_model=TaiKhoanAdminResponse, status_code=201)
def create_tai_khoan(
    data: TaiKhoanCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_role("ADMIN")),
):
    """Create a new user account (Admin only)."""
    # Check duplicate username
    existing = db.query(TaiKhoan).filter(TaiKhoan.username == data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{data.username}' đã tồn tại.",
        )

    user = TaiKhoan(
        username=data.username,
        password_hash=hash_password(data.password),
        ho_ten=data.ho_ten,
        email=data.email,
        vai_tro=data.vai_tro,
        is_active=True,
        created_by=admin.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_audit_event(admin.username, "CREATE_ACCOUNT", f"Created account {user.username} with role {user.vai_tro}")
    return user


# ── Get single account ────────────────────────────────────────────────────────
@router.get("/{user_id}", response_model=TaiKhoanAdminResponse)
def get_tai_khoan(
    user_id: str,
    db: Session = Depends(get_db),
    _admin=AdminRequired,
):
    user = db.query(TaiKhoan).filter(TaiKhoan.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    return user


# ── Update account ────────────────────────────────────────────────────────────
@router.put("/{user_id}", response_model=TaiKhoanAdminResponse)
def update_tai_khoan(
    user_id: str,
    data: TaiKhoanUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_role("ADMIN")),
):
    """Update user info/role/status (Admin only). Password reset optional."""
    user = db.query(TaiKhoan).filter(TaiKhoan.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")

    update_data = data.model_dump(exclude_unset=True)

    # Handle password reset separately
    if "new_password" in update_data:
        new_pw = update_data.pop("new_password")
        if new_pw:
            user.password_hash = hash_password(new_pw)

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    log_audit_event(admin.username, "UPDATE_ACCOUNT", f"Updated account {user.username}")
    return user


# ── Toggle active status ──────────────────────────────────────────────────────
@router.patch("/{user_id}/toggle-active", response_model=TaiKhoanAdminResponse)
def toggle_active(
    user_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_role("ADMIN")),
):
    """Lock or unlock a user account."""
    user = db.query(TaiKhoan).filter(TaiKhoan.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Không thể khóa chính tài khoản của mình")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    status_str = "unlocked" if user.is_active else "locked"
    log_audit_event(admin.username, "TOGGLE_ACTIVE", f"Account {user.username} was {status_str}")
    return user


# ── Delete account ────────────────────────────────────────────────────────────
@router.delete("/{user_id}", status_code=204)
def delete_tai_khoan(
    user_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_role("ADMIN")),
):
    """Delete a user account (cannot delete self)."""
    user = db.query(TaiKhoan).filter(TaiKhoan.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Không thể xóa chính tài khoản của mình")
    username = user.username
    db.delete(user)
    db.commit()
    log_audit_event(admin.username, "DELETE_ACCOUNT", f"Deleted account {username}")


# ── Scope management ──────────────────────────────────────────────────────────
@router.get("/{user_id}/pham-vi", response_model=List[PhamViResponse])
def get_pham_vi(
    user_id: str,
    db: Session = Depends(get_db),
    _admin=AdminRequired,
):
    """Get access scopes for a user."""
    user = db.query(TaiKhoan).filter(TaiKhoan.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    return db.query(TaiKhoanPhamVi).filter(TaiKhoanPhamVi.tai_khoan_id == user_id).all()


@router.post("/{user_id}/pham-vi", response_model=PhamViResponse, status_code=201)
def add_pham_vi(
    user_id: str,
    data: PhamViCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_role("ADMIN")),
):
    """Assign a scope (site/front) to a user."""
    user = db.query(TaiKhoan).filter(TaiKhoan.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")

    pham_vi = TaiKhoanPhamVi(
        tai_khoan_id=user_id,
        cong_truong_id=data.cong_truong_id,
        mui_thi_cong_id=data.mui_thi_cong_id,
    )
    db.add(pham_vi)
    db.commit()
    db.refresh(pham_vi)
    log_audit_event(admin.username, "ADD_SCOPE", f"Added scope (CT:{data.cong_truong_id}, MUI:{data.mui_thi_cong_id}) to {user.username}")
    return pham_vi


@router.delete("/{user_id}/pham-vi/{pv_id}", status_code=204)
def remove_pham_vi(
    user_id: str,
    pv_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_role("ADMIN")),
):
    """Remove a scope from a user."""
    pv = db.query(TaiKhoanPhamVi).filter(
        TaiKhoanPhamVi.id == pv_id,
        TaiKhoanPhamVi.tai_khoan_id == user_id,
    ).first()
    if not pv:
        raise HTTPException(status_code=404, detail="Không tìm thấy phạm vi")
    user = db.query(TaiKhoan).filter(TaiKhoan.id == user_id).first()
    db.delete(pv)
    db.commit()
    username = user.username if user else user_id
    log_audit_event(admin.username, "REMOVE_SCOPE", f"Removed scope {pv_id} from {username}")
