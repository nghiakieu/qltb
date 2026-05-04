"""NhanSu (Personnel) CRUD API."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import get_scope_filter
from app.models.nhan_su import NhanSu
from app.schemas.schemas import NhanSuCreate, NhanSuUpdate, NhanSuResponse

router = APIRouter()


@router.get("", response_model=List[NhanSuResponse])
def list_nhan_su(
    cong_truong_id: Optional[str] = None,
    chuc_vu: Optional[str] = None,
    db: Session = Depends(get_db),
    scope: dict = Depends(get_scope_filter)
):
    """List personnel, optionally filtered by site or role."""
    query = db.query(NhanSu)
    
    if scope["cong_truong_ids"] is not None:
        query = query.filter(NhanSu.cong_truong_id.in_(scope["cong_truong_ids"]))
        
    if cong_truong_id:
        query = query.filter(NhanSu.cong_truong_id == cong_truong_id)
    if chuc_vu:
        query = query.filter(NhanSu.chuc_vu == chuc_vu)
    return query.order_by(NhanSu.ho_ten).all()


@router.get("/{ns_id}", response_model=NhanSuResponse)
def get_nhan_su(ns_id: str, db: Session = Depends(get_db)):
    """Get personnel detail."""
    ns = db.query(NhanSu).filter(NhanSu.id == ns_id).first()
    if not ns:
        raise HTTPException(status_code=404, detail="Nhân sự không tồn tại")
    return ns


@router.post("", response_model=NhanSuResponse, status_code=201)
def create_nhan_su(data: NhanSuCreate, db: Session = Depends(get_db)):
    """Create a new personnel entry."""
    ns = NhanSu(**data.model_dump())
    db.add(ns)
    db.commit()
    db.refresh(ns)
    return ns


@router.put("/{ns_id}", response_model=NhanSuResponse)
def update_nhan_su(ns_id: str, data: NhanSuUpdate, db: Session = Depends(get_db)):
    """Update personnel info."""
    ns = db.query(NhanSu).filter(NhanSu.id == ns_id).first()
    if not ns:
        raise HTTPException(status_code=404, detail="Nhân sự không tồn tại")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(ns, key, value)
    db.commit()
    db.refresh(ns)
    return ns


@router.delete("/{ns_id}", status_code=204)
def delete_nhan_su(ns_id: str, db: Session = Depends(get_db)):
    """Delete a personnel entry."""
    ns = db.query(NhanSu).filter(NhanSu.id == ns_id).first()
    if not ns:
        raise HTTPException(status_code=404, detail="Nhân sự không tồn tại")
    db.delete(ns)
    db.commit()
