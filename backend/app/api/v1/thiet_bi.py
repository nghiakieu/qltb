"""ThietBi (Equipment) CRUD API with state transitions + Excel upload."""

from typing import List, Optional
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
from app.models.thiet_bi import ThietBi
from app.models.mui_thi_cong import MuiThiCong
from app.models.cong_truong import CongTruong
from app.models.nhat_ky_su_kien import NhatKySuKien
from app.models.base import generate_uuid
from app.models.yeu_cau_dieu_phoi import YeuCauDieuPhoi
from app.models.ca_lam_viec import CaLamViec
from app.schemas.schemas import (
    ThietBiCreate, ThietBiUpdate,
    ThietBiResponse, ThietBiDetail,
    NhatKySuKienResponse, EquipmentHistoryResponse,
)

router = APIRouter()

# Valid state transitions
VALID_TRANSITIONS = {
    "CHO": ["HOAT_DONG", "DIEU_CHUYEN"],
    "HOAT_DONG": ["CHO", "BAO_TRI", "HONG", "DIEU_CHUYEN"],
    "BAO_TRI": ["CHO"],
    "HONG": ["BAO_TRI"],
    "DIEU_CHUYEN": ["HOAT_DONG", "CHO"],
}


def get_next_ma_tb(db: Session) -> str:
    """Generate sequential code TB-XXXX."""
    from sqlalchemy import func
    max_ma = db.query(func.max(ThietBi.ma_tb)).filter(ThietBi.ma_tb.like('TB-%')).scalar()
    num = 1
    if max_ma:
        try:
            num = int(max_ma.split('-')[1]) + 1
        except (IndexError, ValueError):
            pass
    return f"TB-{num:04d}"


@router.get("", response_model=List[ThietBiDetail])
def list_thiet_bi(
    loai: Optional[str] = None,
    trang_thai: Optional[str] = None,
    mui_id: Optional[str] = None,
    cong_truong_id: Optional[str] = None,
    chua_phan_bo: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """List equipment with optional filters including site filter."""
    query = db.query(ThietBi).options(
        joinedload(ThietBi.lai_xe),
        joinedload(ThietBi.mui_thi_cong),
    )
    if loai:
        query = query.filter(ThietBi.loai == loai)
    if trang_thai:
        query = query.filter(ThietBi.trang_thai == trang_thai)
    if mui_id:
        query = query.filter(ThietBi.mui_id == mui_id)
    if cong_truong_id:
        query = query.filter(ThietBi.cong_truong_id == cong_truong_id)
    if chua_phan_bo:
        query = query.filter(ThietBi.mui_id.is_(None))
    return query.order_by(ThietBi.loai, ThietBi.ten_tb).all()


@router.get("/{tb_id}", response_model=ThietBiDetail)
def get_thiet_bi(tb_id: str, db: Session = Depends(get_db)):
    """Get equipment detail with operator and work front info."""
    tb = (
        db.query(ThietBi)
        .options(
            joinedload(ThietBi.lai_xe),
            joinedload(ThietBi.mui_thi_cong),
        )
        .filter(ThietBi.id == tb_id)
        .first()
    )
    if not tb:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return tb


@router.post("", response_model=ThietBiResponse, status_code=201)
def create_thiet_bi(data: ThietBiCreate, db: Session = Depends(get_db)):
    """Create a new equipment entry."""
    tb_data = data.model_dump()
    if not tb_data.get('ma_tb'):
        tb_data['ma_tb'] = get_next_ma_tb(db)
    tb = ThietBi(**tb_data)
    db.add(tb)
    db.commit()
    db.refresh(tb)
    return tb


@router.post("/upload-csv", status_code=201)
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload equipment from CSV/Excel-exported CSV file.

    Expected columns: ten_tb, loai, bien_so, nam_sx, hang_sx, cong_suat_gio_max
    """
    if not file.filename or not (file.filename.endswith('.csv') or file.filename.endswith('.txt')):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    text = content.decode('utf-8-sig')  # Handle BOM from Excel
    reader = csv.DictReader(io.StringIO(text))

    created = []
    errors = []
    for i, row in enumerate(reader, start=2):
        try:
            ten_tb = row.get('ten_tb', '').strip()
            loai = row.get('loai', '').strip()
            if not ten_tb or not loai:
                errors.append(f"Row {i}: Missing ten_tb or loai")
                continue

            tb = ThietBi(
                id=generate_uuid(),
                ten_tb=ten_tb,
                loai=loai,
                bien_so=row.get('bien_so', '').strip() or None,
                ma_tb=get_next_ma_tb(db),
                nam_sx=int(row['nam_sx']) if row.get('nam_sx', '').strip() else None,
                hang_sx=row.get('hang_sx', '').strip() or None,
                cong_suat_gio_max=float(row['cong_suat_gio_max']) if row.get('cong_suat_gio_max', '').strip() else None,
                trang_thai='CHO',
            )
            db.add(tb)
            db.flush() # Ensure ma_tb sequence is updated for next item in loop
            created.append(ten_tb)
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    db.commit()
    return {"created": len(created), "errors": errors, "items": created}


@router.put("/{tb_id}", response_model=ThietBiResponse)
def update_thiet_bi(tb_id: str, data: ThietBiUpdate, db: Session = Depends(get_db)):
    """Update equipment info."""
    tb = db.query(ThietBi).filter(ThietBi.id == tb_id).first()
    if not tb:
        raise HTTPException(status_code=404, detail="Equipment not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(tb, key, value)
    db.commit()
    db.refresh(tb)
    return tb


@router.patch("/{tb_id}/trang-thai", response_model=ThietBiResponse)
def change_trang_thai(
    tb_id: str,
    trang_thai_moi: str,
    ghi_chu: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Change equipment status with state machine validation."""
    tb = db.query(ThietBi).filter(ThietBi.id == tb_id).first()
    if not tb:
        raise HTTPException(status_code=404, detail="Equipment not found")

    current = tb.trang_thai
    allowed = VALID_TRANSITIONS.get(current, [])
    if trang_thai_moi not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{current}' to '{trang_thai_moi}'. Allowed: {allowed}",
        )

    # Log the event
    event = NhatKySuKien(
        loai_su_kien="DOI_TRANG_THAI",
        thiet_bi_id=tb.id,
        mui_id=tb.mui_id,
        ghi_chu=f"{current} -> {trang_thai_moi}. {ghi_chu or ''}",
    )
    db.add(event)

    tb.trang_thai = trang_thai_moi
    db.commit()
    db.refresh(tb)
    return tb


@router.patch("/{tb_id}/phan-bo", response_model=ThietBiResponse)
def phan_bo_thiet_bi(
    tb_id: str,
    mui_id: Optional[str] = None,
    cong_truong_id: Optional[str] = None,
    ghi_chu: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Assign or unassign equipment to a work front."""
    from datetime import datetime
    
    tb = db.query(ThietBi).filter(ThietBi.id == tb_id).first()
    if not tb:
        raise HTTPException(status_code=404, detail="Equipment not found")

    old_mui_id = tb.mui_id
    old_ct_id = tb.cong_truong_id
    
    # Use IDs as strings (they are UUIDs)
    # Robust check for various null-like strings from frontend
    def clean_id(val):
        if val is None or str(val).lower() in ["", "null", "undefined", "none"]:
            return None
        return str(val)

    target_ct_id = clean_id(cong_truong_id) or old_ct_id
    target_mui_id = clean_id(mui_id)

    # Check if internal movement
    is_internal = (target_ct_id == old_ct_id)

    # Update equipment
    tb.mui_id = target_mui_id
    if target_ct_id != old_ct_id:
        tb.cong_truong_id = target_ct_id
        tb.ngay_den_ct = datetime.now().strftime("%Y-%m-%d")
    
    # Status logic: If assigned to a mui OR staying within site, it should be HOAT_DONG
    if target_mui_id is not None or is_internal:
        tb.trang_thai = "HOAT_DONG"
    elif target_ct_id is None:
        tb.trang_thai = "CHO" # Warehouse
    else:
        # Moving to a different site but mui not specified yet
        tb.trang_thai = "DIEU_CHUYEN"

    # Log details
    old_ct_name = db.query(CongTruong.ten_ct).filter(CongTruong.id == old_ct_id).scalar() or 'Kho tổng'
    new_ct_name = db.query(CongTruong.ten_ct).filter(CongTruong.id == target_ct_id).scalar() or 'Kho tổng'
    old_mui_name = db.query(MuiThiCong.ten_mui).filter(MuiThiCong.id == old_mui_id).scalar() or 'Chờ phân bổ'
    new_mui_name = db.query(MuiThiCong.ten_mui).filter(MuiThiCong.id == target_mui_id).scalar() or 'Chờ phân bổ'

    if not is_internal:
        event_type = "DIEU_CHUYEN"
        note = f"Điều chuyển: {old_ct_name} ({old_mui_name}) -> {new_ct_name} ({new_mui_name})"
    else:
        event_type = "PHAN_BO"
        note = f"Phân bổ nội bộ: {old_mui_name} -> {new_mui_name}"

    if ghi_chu:
        note += f". Ghi chú: {ghi_chu}"

    # Create log
    event = NhatKySuKien(
        loai_su_kien=event_type,
        thiet_bi_id=tb.id,
        mui_id=target_mui_id,
        tu_mui_id=old_mui_id,
        den_mui_id=target_mui_id,
        tu_ct_id=old_ct_id,
        den_ct_id=target_ct_id,
        ghi_chu=note,
    )
    db.add(event)
    db.commit()
    db.refresh(tb)
    return tb


@router.delete("/{tb_id}", status_code=204)
def delete_thiet_bi(tb_id: str, db: Session = Depends(get_db)):
    """Delete an equipment entry."""
    tb = db.query(ThietBi).filter(ThietBi.id == tb_id).first()
    if not tb:
        raise HTTPException(status_code=404, detail="Equipment not found")
    db.delete(tb)
    db.commit()


@router.get("/logs/all", response_model=List[NhatKySuKienResponse])
def list_logs(
    thiet_bi_id: Optional[str] = None,
    cong_truong_id: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get transfer and status logs."""
    query = db.query(NhatKySuKien).options(
        joinedload(NhatKySuKien.thiet_bi),
        joinedload(NhatKySuKien.mui_thi_cong),
        joinedload(NhatKySuKien.tu_ct),
        joinedload(NhatKySuKien.den_ct),
        joinedload(NhatKySuKien.tu_mui),
        joinedload(NhatKySuKien.den_mui)
    )
    if thiet_bi_id:
        query = query.filter(NhatKySuKien.thiet_bi_id == thiet_bi_id)
    if cong_truong_id:
        # Filter logs related to this site (either source or destination)
        from sqlalchemy import or_
        query = query.filter(or_(
            NhatKySuKien.tu_ct_id == cong_truong_id,
            NhatKySuKien.den_ct_id == cong_truong_id
        ))
    
    return query.order_by(NhatKySuKien.thoi_gian.desc()).limit(limit).all()
    

@router.delete("/logs/{log_id}", status_code=204)
def delete_log(log_id: str, db: Session = Depends(get_db)):
    """Delete a log entry."""
    log = db.query(NhatKySuKien).filter(NhatKySuKien.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()


@router.patch("/logs/{log_id}", response_model=NhatKySuKienResponse)
def update_log_note(
    log_id: str,
    ghi_chu: str,
    db: Session = Depends(get_db)
):
    """Update the note of a log entry."""
    log = db.query(NhatKySuKien).filter(NhatKySuKien.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    log.ghi_chu = ghi_chu
    db.commit()
    db.refresh(log)
    return log


@router.get("/{tb_id}/history", response_model=EquipmentHistoryResponse)
def get_equipment_history(tb_id: str, db: Session = Depends(get_db)):
    """Get full history of equipment including status logs, work shifts, and dispatch requests."""
    # 1. Check if equipment exists
    tb = db.query(ThietBi).filter(ThietBi.id == tb_id).first()
    if not tb:
        raise HTTPException(status_code=404, detail="Equipment not found")

    # 2. Get status/transfer logs
    logs = (
        db.query(NhatKySuKien)
        .options(
            joinedload(NhatKySuKien.tu_ct),
            joinedload(NhatKySuKien.den_ct),
            joinedload(NhatKySuKien.tu_mui),
            joinedload(NhatKySuKien.den_mui)
        )
        .filter(NhatKySuKien.thiet_bi_id == tb_id)
        .order_by(NhatKySuKien.thoi_gian.desc())
        .all()
    )

    # 3. Get work shifts
    shifts = (
        db.query(CaLamViec)
        .options(
            joinedload(CaLamViec.nhan_su),
            joinedload(CaLamViec.mui_thi_cong)
        )
        .filter(CaLamViec.thiet_bi_id == tb_id)
        .order_by(CaLamViec.ngay_lam_viec.desc(), CaLamViec.ca_so.desc())
        .all()
    )

    # 4. Get dispatch requests
    requests = (
        db.query(YeuCauDieuPhoi)
        .options(
            joinedload(YeuCauDieuPhoi.tu_mui),
            joinedload(YeuCauDieuPhoi.den_mui)
        )
        .filter(YeuCauDieuPhoi.thiet_bi_id == tb_id)
        .order_by(YeuCauDieuPhoi.created_at.desc())
        .all()
    )

    return {
        "logs": logs,
        "shifts": shifts,
        "requests": requests
    }
