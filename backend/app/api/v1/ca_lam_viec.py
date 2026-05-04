"""API for CaLamViec (Work Shift) management."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import date

from app.db.database import get_db
from app.models.ca_lam_viec import CaLamViec
from app.models.mui_thi_cong import MuiThiCong
from app.schemas.schemas import CaLamViecCreate, CaLamViecResponse
from app.dependencies.auth import get_scope_filter

router = APIRouter()

@router.post("", response_model=CaLamViecResponse, status_code=201)
def create_ca_lam_viec(data: CaLamViecCreate, db: Session = Depends(get_db)):
    """Ghi nhận một ca làm việc mới."""
    ca = CaLamViec(**data.model_dump())
    db.add(ca)
    db.commit()
    db.refresh(ca)
    return ca

@router.get("", response_model=List[CaLamViecResponse])
def list_ca_lam_viec(
    thiet_bi_id: Optional[str] = None,
    mui_id: Optional[str] = None,
    ngay_bat_dau: Optional[date] = None,
    ngay_ket_thuc: Optional[date] = None,
    db: Session = Depends(get_db),
    scope: dict = Depends(get_scope_filter)
):
    """Lấy danh sách ca làm việc với các bộ lọc."""
    query = db.query(CaLamViec).options(
        joinedload(CaLamViec.thiet_bi),
        joinedload(CaLamViec.nhan_su),
        joinedload(CaLamViec.mui_thi_cong)
    )
    
    if scope["mui_ids"] is not None:
        query = query.filter(CaLamViec.mui_id.in_(scope["mui_ids"]))
    elif scope["cong_truong_ids"] is not None:
        query = query.join(MuiThiCong, CaLamViec.mui_id == MuiThiCong.id).filter(
            MuiThiCong.cong_truong_id.in_(scope["cong_truong_ids"])
        )

    if thiet_bi_id:
        query = query.filter(CaLamViec.thiet_bi_id == thiet_bi_id)
    if mui_id:
        query = query.filter(CaLamViec.mui_id == mui_id)
    if ngay_bat_dau:
        query = query.filter(CaLamViec.ngay_lam_viec >= ngay_bat_dau)
    if ngay_ket_thuc:
        query = query.filter(CaLamViec.ngay_lam_viec <= ngay_ket_thuc)
        
    return query.order_by(CaLamViec.ngay_lam_viec.desc(), CaLamViec.ca_so.desc()).all()

@router.get("/stats/thiet-bi")
def get_stats_by_thiet_bi(
    ngay_bat_dau: Optional[date] = None,
    ngay_ket_thuc: Optional[date] = None,
    db: Session = Depends(get_db),
    scope: dict = Depends(get_scope_filter)
):
    """Thống kê tổng giờ hoạt động và nhiên liệu theo từng thiết bị."""
    query = db.query(
        CaLamViec.thiet_bi_id,
        func.sum(CaLamViec.gio_hoat_dong_thuc_te).label("tong_gio"),
        func.sum(CaLamViec.xang_dau_cap).label("tong_nhien_lieu")
    )
    
    if scope["mui_ids"] is not None:
        query = query.filter(CaLamViec.mui_id.in_(scope["mui_ids"]))
    elif scope["cong_truong_ids"] is not None:
        query = query.join(MuiThiCong, CaLamViec.mui_id == MuiThiCong.id).filter(
            MuiThiCong.cong_truong_id.in_(scope["cong_truong_ids"])
        )
    
    if ngay_bat_dau:
        query = query.filter(CaLamViec.ngay_lam_viec >= ngay_bat_dau)
    if ngay_ket_thuc:
        query = query.filter(CaLamViec.ngay_lam_viec <= ngay_ket_thuc)
        
    results = query.group_by(CaLamViec.thiet_bi_id).all()
    
    return [
        {
            "thiet_bi_id": r.thiet_bi_id,
            "tong_gio": r.tong_gio or 0,
            "tong_nhien_lieu": r.tong_nhien_lieu or 0
        }
        for r in results
    ]

@router.delete("/{id}", status_code=204)
def delete_ca_lam_viec(id: str, db: Session = Depends(get_db)):
    """Xóa một bản ghi ca làm việc."""
    ca = db.query(CaLamViec).filter(CaLamViec.id == id).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Không tìm thấy ca làm việc")
    db.delete(ca)
    db.commit()
