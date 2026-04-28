"""Reports API - Aggregated statistics and exports."""

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_

from app.db.database import get_db
from app.models.ca_lam_viec import CaLamViec
from app.models.thiet_bi import ThietBi
from app.models.mui_thi_cong import MuiThiCong
from app.models.cong_truong import CongTruong
from pydantic import BaseModel

router = APIRouter()

class ReportItem(BaseModel):
    thiet_bi_id: str
    ten_tb: str
    ma_tb: str
    loai: str
    bien_so: Optional[str]
    tong_gio: float
    tong_nhien_lieu: float
    so_ca: int
    mui_hien_tai: Optional[str]
    ct_hien_tai: Optional[str]

@router.get("/tong-hop", response_model=List[ReportItem])
def get_aggregated_report(
    tu_ngay: Optional[date] = Query(None),
    den_ngay: Optional[date] = Query(None),
    cong_truong_id: Optional[str] = Query(None),
    mui_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get aggregated equipment statistics for a given period and location."""
    
    # 1. Base query for CaLamViec
    query = db.query(
        CaLamViec.thiet_bi_id,
        func.sum(CaLamViec.gio_hoat_dong_thuc_te).label("tong_gio"),
        func.sum(CaLamViec.xang_dau_cap).label("tong_nhien_lieu"),
        func.count(CaLamViec.id).label("so_ca")
    )
    
    filters = []
    if tu_ngay:
        filters.append(CaLamViec.ngay_lam_viec >= tu_ngay)
    if den_ngay:
        filters.append(CaLamViec.ngay_lam_viec <= den_ngay)
    if mui_id:
        filters.append(CaLamViec.mui_id == mui_id)
    elif cong_truong_id:
        # Join MuiThiCong to filter by cong_truong_id
        query = query.join(MuiThiCong, CaLamViec.mui_id == MuiThiCong.id)
        filters.append(MuiThiCong.cong_truong_id == cong_truong_id)
    
    if filters:
        query = query.filter(and_(*filters))
        
    # Group by equipment
    stats = query.group_by(CaLamViec.thiet_bi_id).all()
    stats_map = {s.thiet_bi_id: s for s in stats}
    
    # 2. Get equipment details
    tb_query = db.query(ThietBi).options(
        joinedload(ThietBi.mui_thi_cong).joinedload(MuiThiCong.cong_truong)
    )
    
    if cong_truong_id:
        tb_query = tb_query.filter(ThietBi.cong_truong_id == cong_truong_id)
    if mui_id:
        tb_query = tb_query.filter(ThietBi.mui_id == mui_id)
        
    equipment = tb_query.all()
    
    # 3. Assemble report
    report = []
    for tb in equipment:
        s = stats_map.get(tb.id)
        report.append(ReportItem(
            thiet_bi_id=tb.id,
            ten_tb=tb.ten_tb,
            ma_tb=tb.ma_tb or "",
            loai=tb.loai,
            bien_so=tb.bien_so,
            tong_gio=float(s.tong_gio) if s and s.tong_gio else 0.0,
            tong_nhien_lieu=float(s.tong_nhien_lieu) if s and s.tong_nhien_lieu else 0.0,
            so_ca=int(s.so_ca) if s and s.so_ca else 0,
            mui_hien_tai=tb.mui_thi_cong.ten_mui if tb.mui_thi_cong else "Chưa phân bổ",
            ct_hien_tai=tb.mui_thi_cong.cong_truong.ten_ct if tb.mui_thi_cong and tb.mui_thi_cong.cong_truong else "N/A"
        ))
        
    # Sort by total hours descending
    report.sort(key=lambda x: x.tong_gio, reverse=True)
    
    return report

class TimeSeriesItem(BaseModel):
    ngay: date
    tong_gio: float
    tong_nhien_lieu: float

@router.get("/theo-thoi-gian", response_model=List[TimeSeriesItem])
def get_time_series_report(
    tu_ngay: Optional[date] = Query(None),
    den_ngay: Optional[date] = Query(None),
    cong_truong_id: Optional[str] = Query(None),
    mui_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get aggregated statistics over time for charting."""
    
    query = db.query(
        CaLamViec.ngay_lam_viec.label("ngay"),
        func.sum(CaLamViec.gio_hoat_dong_thuc_te).label("tong_gio"),
        func.sum(CaLamViec.xang_dau_cap).label("tong_nhien_lieu")
    )
    
    filters = []
    if tu_ngay:
        filters.append(CaLamViec.ngay_lam_viec >= tu_ngay)
    if den_ngay:
        filters.append(CaLamViec.ngay_lam_viec <= den_ngay)
    if mui_id:
        filters.append(CaLamViec.mui_id == mui_id)
    elif cong_truong_id:
        # If site filtered but not mui, need to join to mui or filter by tb that belong to that site
        # Simplest is to join MuiThiCong
        query = query.join(MuiThiCong, CaLamViec.mui_id == MuiThiCong.id)
        filters.append(MuiThiCong.cong_truong_id == cong_truong_id)
    
    if filters:
        query = query.filter(and_(*filters))
        
    stats = query.group_by(CaLamViec.ngay_lam_viec).order_by(CaLamViec.ngay_lam_viec).all()
    
    return [
        TimeSeriesItem(
            ngay=s.ngay,
            tong_gio=float(s.tong_gio) if s.tong_gio else 0.0,
            tong_nhien_lieu=float(s.tong_nhien_lieu) if s.tong_nhien_lieu else 0.0
        ) for s in stats
    ]

@router.get("/export")
def export_report(
    tu_ngay: Optional[date] = Query(None),
    den_ngay: Optional[date] = Query(None),
    cong_truong_id: Optional[str] = Query(None),
    mui_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Export report as CSV."""
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    data = get_aggregated_report(tu_ngay, den_ngay, cong_truong_id, mui_id, db)
    
    output = io.StringIO()
    # Add BOM for Excel
    output.write('\ufeff')
    
    writer = csv.writer(output)
    writer.writerow([
        "Tên thiết bị", "Mã thiết bị", "Loại", "Biển số", 
        "Tổng giờ máy", "Tổng nhiên liệu (L)", "Số ca làm việc",
        "Mũi hiện tại", "Công trường hiện tại"
    ])
    
    for item in data:
        writer.writerow([
            item.ten_tb, item.ma_tb, item.loai, item.bien_so or "",
            item.tong_gio, item.tong_nhien_lieu, item.so_ca,
            item.mui_hien_tai, item.ct_hien_tai
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=bao_cao_thiet_bi_{date.today()}.csv"}
    )
