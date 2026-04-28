"""MuiThiCong (Work Front) CRUD API."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
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
):
    """List work fronts, optionally filtered by construction site or status."""
    query = db.query(MuiThiCong)
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
    db.delete(mui)
    db.commit()
