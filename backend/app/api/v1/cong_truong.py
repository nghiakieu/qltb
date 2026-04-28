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

router = APIRouter()


@router.get("", response_model=List[CongTruongResponse])
def list_cong_truong(
    trang_thai: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all construction sites, optionally filtered by status."""
    query = db.query(CongTruong)
    if trang_thai:
        query = query.filter(CongTruong.trang_thai == trang_thai)
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
    db.delete(ct)
    db.commit()
