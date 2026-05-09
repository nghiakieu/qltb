"""CongTruong (Construction Site) CRUD API."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
from app.models.cong_truong import CongTruong
from app.schemas.schemas import (
    CongTruongCreate, CongTruongUpdate,
    CongTruongResponse, CongTruongDetail,
)

from app.dependencies.auth import get_scope_filter

router = APIRouter()


@router.get("", response_model=List[CongTruongResponse])
def list_cong_truong(
    trang_thai: Optional[str] = None,
    db: Session = Depends(get_db),
    scope: dict = Depends(get_scope_filter),
):
    """List all construction sites, optionally filtered by status and RBAC scope."""
    query = db.query(CongTruong)
    if trang_thai:
        query = query.filter(CongTruong.trang_thai == trang_thai)
        
    if scope["cong_truong_ids"] is not None:
        query = query.filter(CongTruong.id.in_(scope["cong_truong_ids"]))
        
    return query.order_by(CongTruong.created_at.desc()).all()


@router.get("/{ct_id}", response_model=CongTruongDetail)
def get_cong_truong(ct_id: str, db: Session = Depends(get_db)):
    """Get a construction site with its work fronts."""
    ct = (
        db.query(CongTruong)
        .options(joinedload(CongTruong.mui_thi_congs))
        .filter(CongTruong.id == ct_id)
        .first()
    )
    if not ct:
        raise HTTPException(status_code=404, detail="Công trường không tồn tại")
    return ct


@router.post("", response_model=CongTruongResponse, status_code=201)
def create_cong_truong(data: CongTruongCreate, db: Session = Depends(get_db)):
    """Create a new construction site."""
    ct = CongTruong(**data.model_dump())
    db.add(ct)
    db.commit()
    db.refresh(ct)
    return ct


@router.put("/{ct_id}", response_model=CongTruongResponse)
def update_cong_truong(ct_id: str, data: CongTruongUpdate, db: Session = Depends(get_db)):
    """Update a construction site."""
    ct = db.query(CongTruong).filter(CongTruong.id == ct_id).first()
    if not ct:
        raise HTTPException(status_code=404, detail="Công trường không tồn tại")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(ct, key, value)
    db.commit()
    db.refresh(ct)
    return ct


@router.delete("/{ct_id}", status_code=204)
def delete_cong_truong(ct_id: str, db: Session = Depends(get_db)):
    """Delete a construction site and all related data."""
    ct = db.query(CongTruong).filter(CongTruong.id == ct_id).first()
    if not ct:
        raise HTTPException(status_code=404, detail="Công trường không tồn tại")
    
    try:
        # Manually unassign personnel and equipment to avoid FK issues
        from app.models.nhan_su import NhanSu
        from app.models.thiet_bi import ThietBi
        from app.models.nhat_ky_su_kien import NhatKySuKien
        from app.models.tai_khoan import TaiKhoanPhamVi
        
        from app.models.yeu_cau_dieu_phoi import YeuCauDieuPhoi
        from app.models.ca_lam_viec import CaLamViec
        
        db.query(NhanSu).filter(NhanSu.cong_truong_id == ct_id).update({NhanSu.cong_truong_id: None})
        db.query(ThietBi).filter(ThietBi.cong_truong_id == ct_id).update({ThietBi.cong_truong_id: None, ThietBi.mui_id: None})
        
        # Cleanup logs
        db.query(NhatKySuKien).filter(NhatKySuKien.cong_truong_id == ct_id).update({NhatKySuKien.cong_truong_id: None})
        db.query(NhatKySuKien).filter(NhatKySuKien.tu_ct_id == ct_id).update({NhatKySuKien.tu_ct_id: None})
        db.query(NhatKySuKien).filter(NhatKySuKien.den_ct_id == ct_id).update({NhatKySuKien.den_ct_id: None})
        
        # Cleanup dispatch requests
        db.query(YeuCauDieuPhoi).filter(YeuCauDieuPhoi.tu_ct_id == ct_id).update({YeuCauDieuPhoi.tu_ct_id: None})
        db.query(YeuCauDieuPhoi).filter(YeuCauDieuPhoi.den_ct_id == ct_id).update({YeuCauDieuPhoi.den_ct_id: None})
        
        # Cleanup shifts
        db.query(CaLamViec).filter(CaLamViec.cong_truong_id == ct_id).update({CaLamViec.cong_truong_id: None})
        
        # Clean up account scopes
        db.query(TaiKhoanPhamVi).filter(TaiKhoanPhamVi.cong_truong_id == ct_id).delete(synchronize_session=False)
        
        # Note: mui_thi_congs has cascade="all, delete-orphan", so they will be deleted automatically.
        
        db.delete(ct)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error deleting construction site: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Không thể xóa công trường do có dữ liệu liên quan: {str(e)}"
        )
    return None
