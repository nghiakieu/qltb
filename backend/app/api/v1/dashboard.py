"""Dashboard API - KPI statistics overview with per-site breakdown."""

from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.cong_truong import CongTruong
from app.models.mui_thi_cong import MuiThiCong
from app.models.thiet_bi import ThietBi
from app.models.nhan_su import NhanSu
from app.models.yeu_cau_dieu_phoi import YeuCauDieuPhoi
from app.models.ca_lam_viec import CaLamViec
from app.schemas.schemas import DashboardStats
from app.core.datetime_utils import today_ict

router = APIRouter()


class SiteStats(BaseModel):
    """Per-site equipment statistics."""
    cong_truong_id: str
    ten_ct: str
    tong_thiet_bi: int = 0
    hoat_dong: int = 0
    cho: int = 0
    bao_tri: int = 0
    hong: int = 0
    dieu_chuyen: int = 0
    tong_mui: int = 0


class DashboardFull(DashboardStats):
    """Extended dashboard with per-site breakdown."""
    per_site: List[SiteStats] = []


@router.get("", response_model=DashboardFull)
def get_dashboard(db: Session = Depends(get_db)):
    """Get overview statistics + per-site breakdown."""
    total_tb = db.query(func.count(ThietBi.id)).scalar() or 0

    # Count by status (company-wide)
    status_counts = (
        db.query(ThietBi.trang_thai, func.count(ThietBi.id))
        .group_by(ThietBi.trang_thai)
        .all()
    )
    status_map = {s: c for s, c in status_counts}

    # Per-site breakdown
    sites = db.query(CongTruong).all()
    per_site = []
    for ct in sites:
        # Get all mui_ids for this site
        mui_ids = [m.id for m in db.query(MuiThiCong.id).filter(MuiThiCong.cong_truong_id == ct.id).all()]

        # Count all equipment assigned to this site (including unassigned to muis)
        site_tb_query = (
            db.query(ThietBi.trang_thai, func.count(ThietBi.id))
            .filter(ThietBi.cong_truong_id == ct.id)
            .group_by(ThietBi.trang_thai)
            .all()
        )

        site_status = {s: c for s, c in site_tb_query}
        site_total = sum(site_status.values())

        per_site.append(SiteStats(
            cong_truong_id=ct.id,
            ten_ct=ct.ten_ct,
            tong_thiet_bi=site_total,
            hoat_dong=site_status.get("HOAT_DONG", 0),
            cho=site_status.get("CHO", 0),
            bao_tri=site_status.get("BAO_TRI", 0),
            hong=site_status.get("HONG", 0),
            dieu_chuyen=site_status.get("DIEU_CHUYEN", 0),
            tong_mui=len(mui_ids),
        ))

    # New stats for Sprint 5
    cho_duyet_count = db.query(func.count(YeuCauDieuPhoi.id)).filter(YeuCauDieuPhoi.trang_thai_yeu_cau == "CHO_DUYET").scalar() or 0
    
    today = today_ict()
    today_stats = (
        db.query(
            func.sum(CaLamViec.gio_hoat_dong_thuc_te),
            func.sum(CaLamViec.xang_dau_cap)
        )
        .filter(CaLamViec.ngay_lam_viec == today)
        .first()
    )
    
    total_hours_today = today_stats[0] if today_stats and today_stats[0] else 0.0
    total_fuel_today = today_stats[1] if today_stats and today_stats[1] else 0.0

    return DashboardFull(
        tong_thiet_bi=total_tb,
        hoat_dong=status_map.get("HOAT_DONG", 0),
        cho=status_map.get("CHO", 0),
        bao_tri=status_map.get("BAO_TRI", 0),
        hong=status_map.get("HONG", 0),
        dieu_chuyen=status_map.get("DIEU_CHUYEN", 0),
        tong_cong_truong=db.query(func.count(CongTruong.id)).scalar() or 0,
        tong_mui=db.query(func.count(MuiThiCong.id)).scalar() or 0,
        tong_nhan_su=db.query(func.count(NhanSu.id)).scalar() or 0,
        cho_duyet_dieu_phoi=cho_duyet_count,
        tong_gio_hom_nay=total_hours_today,
        tong_nhien_lieu_hom_nay=total_fuel_today,
        per_site=per_site,
    )
