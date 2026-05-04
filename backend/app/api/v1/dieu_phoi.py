"""API for YeuCauDieuPhoi (Equipment Dispatch Request)."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, aliased
from sqlalchemy import or_

from app.db.database import get_db
from app.dependencies.auth import get_scope_filter
from app.models.yeu_cau_dieu_phoi import YeuCauDieuPhoi
from app.models.thiet_bi import ThietBi
from app.models.mui_thi_cong import MuiThiCong
from app.models.nhat_ky_su_kien import NhatKySuKien
from app.schemas.schemas import (
    YeuCauDieuPhoiCreate,
    YeuCauDieuPhoiResponse,
    YeuCauDieuPhoiUpdateStatus,
)

router = APIRouter()

@router.post("", response_model=YeuCauDieuPhoiResponse, status_code=201)
def create_yeu_cau(data: YeuCauDieuPhoiCreate, db: Session = Depends(get_db)):
    """Tạo yêu cầu điều phối mới."""
    tb = db.query(ThietBi).filter(ThietBi.id == data.thiet_bi_id).first()
    if not tb:
        raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị")
    
    # Tự động lấy mui_id hiện tại của thiết bị làm mui_nguon nếu không cung cấp
    tu_mui_id = data.tu_mui_id or tb.mui_id
    
    yeu_cau = YeuCauDieuPhoi(
        tu_mui_id=tu_mui_id,
        den_mui_id=data.den_mui_id,
        thiet_bi_id=data.thiet_bi_id,
        nguoi_yeu_cau_id=data.nguoi_yeu_cau_id,
        ly_do=data.ly_do,
        trang_thai_yeu_cau="CHO_DUYET"
    )
    db.add(yeu_cau)
    db.commit()
    db.refresh(yeu_cau)
    return yeu_cau

@router.get("", response_model=List[YeuCauDieuPhoiResponse])
def list_yeu_cau(
    trang_thai: Optional[str] = None,
    thiet_bi_id: Optional[str] = None,
    db: Session = Depends(get_db),
    scope: dict = Depends(get_scope_filter)
):
    """Lấy danh sách yêu cầu điều phối."""
    query = db.query(YeuCauDieuPhoi).options(
        joinedload(YeuCauDieuPhoi.thiet_bi),
        joinedload(YeuCauDieuPhoi.tu_mui),
        joinedload(YeuCauDieuPhoi.den_mui)
    )
    
    if scope["mui_ids"] is not None:
        query = query.filter(
            or_(
                YeuCauDieuPhoi.tu_mui_id.in_(scope["mui_ids"]),
                YeuCauDieuPhoi.den_mui_id.in_(scope["mui_ids"])
            )
        )
    elif scope["cong_truong_ids"] is not None:
        TuMui = aliased(MuiThiCong)
        DenMui = aliased(MuiThiCong)
        query = query.outerjoin(TuMui, YeuCauDieuPhoi.tu_mui_id == TuMui.id) \
                     .outerjoin(DenMui, YeuCauDieuPhoi.den_mui_id == DenMui.id) \
                     .filter(
                         or_(
                             TuMui.cong_truong_id.in_(scope["cong_truong_ids"]),
                             DenMui.cong_truong_id.in_(scope["cong_truong_ids"])
                         )
                     )

    if trang_thai:
        query = query.filter(YeuCauDieuPhoi.trang_thai_yeu_cau == trang_thai)
    if thiet_bi_id:
        query = query.filter(YeuCauDieuPhoi.thiet_bi_id == thiet_bi_id)
    
    return query.order_by(YeuCauDieuPhoi.created_at.desc()).all()

@router.get("/{id}", response_model=YeuCauDieuPhoiResponse)
def get_yeu_cau(id: str, db: Session = Depends(get_db)):
    """Lấy chi tiết yêu cầu điều phối."""
    yeu_cau = db.query(YeuCauDieuPhoi).options(
        joinedload(YeuCauDieuPhoi.thiet_bi),
        joinedload(YeuCauDieuPhoi.tu_mui),
        joinedload(YeuCauDieuPhoi.den_mui)
    ).filter(YeuCauDieuPhoi.id == id).first()
    if not yeu_cau:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")
    return yeu_cau

@router.put("/{id}/trang-thai", response_model=YeuCauDieuPhoiResponse)
def update_status(id: str, data: YeuCauDieuPhoiUpdateStatus, db: Session = Depends(get_db)):
    """Cập nhật trạng thái yêu cầu (Duyệt/Từ chối/Hoàn thành)."""
    yeu_cau = db.query(YeuCauDieuPhoi).filter(YeuCauDieuPhoi.id == id).first()
    if not yeu_cau:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")
    
    new_status = data.trang_thai
    yeu_cau.trang_thai_yeu_cau = new_status
    if data.nguoi_duyet_id:
        yeu_cau.nguoi_duyet_id = data.nguoi_duyet_id
    
    # Logic: Khi trạng thái chuyển sang DA_THUC_HIEN -> Cập nhật vị trí thiết bị
    if new_status == "DA_THUC_HIEN":
        tb = db.query(ThietBi).filter(ThietBi.id == yeu_cau.thiet_bi_id).first()
        if tb:
            # Lấy thông tin công trường của mũi đích để cập nhật cho thiết bị
            den_mui = db.query(MuiThiCong).filter(MuiThiCong.id == yeu_cau.den_mui_id).first()
            den_ct_id = den_mui.cong_truong_id if den_mui else tb.cong_truong_id
            
            # Ghi nhật ký sự kiện
            event = NhatKySuKien(
                loai_su_kien="DIEU_CHUYEN",
                thiet_bi_id=tb.id,
                mui_id=yeu_cau.den_mui_id,
                tu_mui_id=yeu_cau.tu_mui_id,
                den_mui_id=yeu_cau.den_mui_id,
                tu_ct_id=tb.cong_truong_id,
                den_ct_id=den_ct_id,
                ghi_chu=f"Điều phối hoàn tất: {yeu_cau.ly_do or ''}"
            )
            db.add(event)
            
            # Cập nhật vị trí mới cho thiết bị
            tb.mui_id = yeu_cau.den_mui_id
            tb.cong_truong_id = den_ct_id
            tb.trang_thai = "HOAT_DONG"
            
    db.commit()
    db.refresh(yeu_cau)
    return yeu_cau

@router.delete("/{id}", status_code=204)
def delete_yeu_cau(id: str, db: Session = Depends(get_db)):
    """Xóa yêu cầu điều phối."""
    yeu_cau = db.query(YeuCauDieuPhoi).filter(YeuCauDieuPhoi.id == id).first()
    if not yeu_cau:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")
    db.delete(yeu_cau)
    db.commit()
