"""MuiThiCong (Work Front) CRUD API."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
from app.dependencies.auth import get_scope_filter
from app.models.mui_thi_cong import MuiThiCong
from app.schemas.schemas import (
    MuiThiCongCreate, MuiThiCongUpdate,
    MuiThiCongResponse, MuiThiCongDetail,
)

router = APIRouter()


@router.get("", response_model=List[MuiThiCongResponse])
def list_mui_thi_cong(
    cong_truong_id: Optional[str] = None,
    trang_thai: Optional[str] = None,
    db: Session = Depends(get_db),
    scope: dict = Depends(get_scope_filter)
):
    """List work fronts, optionally filtered by construction site or status."""
    query = db.query(MuiThiCong)
    
    if scope["mui_ids"] is not None:
        query = query.filter(MuiThiCong.id.in_(scope["mui_ids"]))
    elif scope["cong_truong_ids"] is not None:
        query = query.filter(MuiThiCong.cong_truong_id.in_(scope["cong_truong_ids"]))
        
    if cong_truong_id:
        query = query.filter(MuiThiCong.cong_truong_id == cong_truong_id)
    if trang_thai:
        query = query.filter(MuiThiCong.trang_thai == trang_thai)
    return query.order_by(MuiThiCong.created_at).all()


@router.get("/{mui_id}", response_model=MuiThiCongDetail)
def get_mui_thi_cong(mui_id: str, db: Session = Depends(get_db)):
    """Get a work front with its equipment list."""
    mui = (
        db.query(MuiThiCong)
        .options(joinedload(MuiThiCong.thiet_bis))
        .filter(MuiThiCong.id == mui_id)
        .first()
    )
    if not mui:
        raise HTTPException(status_code=404, detail="Mũi thi công không tồn tại")
    return mui


@router.post("", response_model=MuiThiCongResponse, status_code=201)
def create_mui_thi_cong(data: MuiThiCongCreate, db: Session = Depends(get_db)):
    """Create a new work front."""
    mui = MuiThiCong(**data.model_dump())
    db.add(mui)
    db.commit()
    db.refresh(mui)
    return mui


@router.put("/{mui_id}", response_model=MuiThiCongResponse)
def update_mui_thi_cong(mui_id: str, data: MuiThiCongUpdate, db: Session = Depends(get_db)):
    """Update a work front."""
    mui = db.query(MuiThiCong).filter(MuiThiCong.id == mui_id).first()
    if not mui:
        raise HTTPException(status_code=404, detail="Mũi thi công không tồn tại")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(mui, key, value)
    db.commit()
    db.refresh(mui)
    return mui


@router.delete("/{mui_id}", status_code=204)
def delete_mui_thi_cong(mui_id: str, db: Session = Depends(get_db)):
    """Delete a work front."""
    mui = db.query(MuiThiCong).filter(MuiThiCong.id == mui_id).first()
    if not mui:
        raise HTTPException(status_code=404, detail="Mũi thi công không tồn tại")
    
    try:
        # Manually unassign in related tables to ensure consistency
        from app.models.thiet_bi import ThietBi
        from app.models.yeu_cau_dieu_phoi import YeuCauDieuPhoi
        from app.models.nhat_ky_su_kien import NhatKySuKien
        from app.models.ca_lam_viec import CaLamViec
        
        db.query(ThietBi).filter(ThietBi.mui_id == mui_id).update({ThietBi.mui_id: None})
        db.query(YeuCauDieuPhoi).filter(YeuCauDieuPhoi.tu_mui_id == mui_id).update({YeuCauDieuPhoi.tu_mui_id: None})
        db.query(YeuCauDieuPhoi).filter(YeuCauDieuPhoi.den_mui_id == mui_id).update({YeuCauDieuPhoi.den_mui_id: None})
        db.query(NhatKySuKien).filter(NhatKySuKien.mui_id == mui_id).update({NhatKySuKien.mui_id: None})
        db.query(NhatKySuKien).filter(NhatKySuKien.tu_mui_id == mui_id).update({NhatKySuKien.tu_mui_id: None})
        db.query(NhatKySuKien).filter(NhatKySuKien.den_mui_id == mui_id).update({NhatKySuKien.den_mui_id: None})
        db.query(CaLamViec).filter(CaLamViec.mui_id == mui_id).update({CaLamViec.mui_id: None})
        
        # Cleanup Account Scopes (TaiKhoanPhamVi)
        from app.models.tai_khoan import TaiKhoanPhamVi
        db.query(TaiKhoanPhamVi).filter(TaiKhoanPhamVi.mui_thi_cong_id == mui_id).delete(synchronize_session=False)
        
        db.delete(mui)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error deleting work front: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Không thể xóa mũi thi công do có dữ liệu liên quan: {str(e)}"
        )
    return None
