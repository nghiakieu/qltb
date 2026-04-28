"""Pydantic schemas for all entities - request/response validation."""

from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# ============================================================
# CongTruong (Construction Site)
# ============================================================
class CongTruongBase(BaseModel):
    ten_ct: str
    dia_chi: Optional[str] = None
    trang_thai: str = "DANG_THI_CONG"
    coords: Optional[dict] = None
    ngay_bat_dau: Optional[date] = None
    ngay_ket_thuc: Optional[date] = None
    chu_dau_tu: Optional[str] = None


class CongTruongCreate(CongTruongBase):
    pass


class CongTruongUpdate(BaseModel):
    ten_ct: Optional[str] = None
    dia_chi: Optional[str] = None
    trang_thai: Optional[str] = None
    coords: Optional[dict] = None
    ngay_bat_dau: Optional[date] = None
    ngay_ket_thuc: Optional[date] = None
    chu_dau_tu: Optional[str] = None


class CongTruongResponse(CongTruongBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CongTruongDetail(CongTruongResponse):
    """Includes nested work fronts."""
    mui_thi_congs: List["MuiThiCongResponse"] = []


# ============================================================
# MuiThiCong (Work Front)
# ============================================================
class MuiThiCongBase(BaseModel):
    ten_mui: str
    cong_truong_id: str
    vi_tri: Optional[str] = None
    trang_thai: str = "DANG_THI_CONG"
    khoi_luong: Optional[str] = None
    han_hoan_thanh: Optional[date] = None


class MuiThiCongCreate(MuiThiCongBase):
    pass


class MuiThiCongUpdate(BaseModel):
    ten_mui: Optional[str] = None
    vi_tri: Optional[str] = None
    trang_thai: Optional[str] = None
    khoi_luong: Optional[str] = None
    han_hoan_thanh: Optional[date] = None


class MuiThiCongResponse(MuiThiCongBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class MuiThiCongDetail(MuiThiCongResponse):
    """Includes nested equipment list."""
    thiet_bis: List["ThietBiResponse"] = []


# ============================================================
# ThietBi (Equipment)
# ============================================================
class ThietBiBase(BaseModel):
    ten_tb: str
    loai: str
    bien_so: Optional[str] = None
    ma_tb: Optional[str] = None
    nam_sx: Optional[int] = None
    hang_sx: Optional[str] = None
    trang_thai: str = "CHO"
    mui_id: Optional[str] = None
    cong_truong_id: Optional[str] = None
    lai_xe_id: Optional[str] = None
    cong_suat_gio_max: Optional[float] = None
    ngay_den_ct: Optional[str] = None


class ThietBiCreate(ThietBiBase):
    pass


class ThietBiUpdate(BaseModel):
    ten_tb: Optional[str] = None
    loai: Optional[str] = None
    bien_so: Optional[str] = None
    ma_tb: Optional[str] = None
    nam_sx: Optional[int] = None
    hang_sx: Optional[str] = None
    trang_thai: Optional[str] = None
    mui_id: Optional[str] = None
    cong_truong_id: Optional[str] = None
    lai_xe_id: Optional[str] = None
    cong_suat_gio_max: Optional[float] = None
    hinh_anh: Optional[str] = None


class ThietBiResponse(ThietBiBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ThietBiDetail(ThietBiResponse):
    """Includes operator name and work front name."""
    lai_xe: Optional["NhanSuResponse"] = None
    mui_thi_cong: Optional[MuiThiCongResponse] = None


# ============================================================
# NhanSu (Personnel)
# ============================================================
class NhanSuBase(BaseModel):
    ho_ten: str
    chuc_vu: str
    so_dien_thoai: Optional[str] = None
    cong_truong_id: Optional[str] = None
    quan_ly_id: Optional[str] = None


class NhanSuCreate(NhanSuBase):
    pass


class NhanSuUpdate(BaseModel):
    ho_ten: Optional[str] = None
    chuc_vu: Optional[str] = None
    so_dien_thoai: Optional[str] = None
    cong_truong_id: Optional[str] = None
    quan_ly_id: Optional[str] = None


class NhanSuResponse(NhanSuBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ============================================================
# NhatKySuKien (Event Log)
# ============================================================
class NhatKySuKienResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    loai_su_kien: str
    thiet_bi_id: str
    mui_id: Optional[str] = None
    thoi_gian: datetime
    nguoi_thuc_hien_id: Optional[str] = None
    ghi_chu: Optional[str] = None
    
    # Nested info
    thiet_bi: Optional[ThietBiResponse] = None
    tu_ct: Optional[CongTruongResponse] = None
    den_ct: Optional[CongTruongResponse] = None
    tu_mui: Optional[MuiThiCongResponse] = None
    den_mui: Optional[MuiThiCongResponse] = None


# ============================================================
# YeuCauDieuPhoi (Dispatch Request)
# ============================================================
class YeuCauDieuPhoiCreate(BaseModel):
    tu_mui_id: Optional[str] = None
    den_mui_id: str
    thiet_bi_id: str
    ly_do: Optional[str] = None
    nguoi_yeu_cau_id: Optional[str] = None


class YeuCauDieuPhoiResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tu_mui_id: Optional[str] = None
    den_mui_id: str
    thiet_bi_id: str
    trang_thai_yeu_cau: str
    nguoi_yeu_cau_id: Optional[str] = None
    nguoi_duyet_id: Optional[str] = None
    ly_do: Optional[str] = None
    created_at: Optional[datetime] = None
    
    # Nested info
    thiet_bi: Optional[ThietBiResponse] = None
    tu_mui: Optional[MuiThiCongResponse] = None
    den_mui: Optional[MuiThiCongResponse] = None


class YeuCauDieuPhoiUpdateStatus(BaseModel):
    trang_thai: str  # DA_DUYET | TU_CHOI | DA_THUC_HIEN
    nguoi_duyet_id: Optional[str] = None


# ============================================================
# Dashboard / Statistics
# ============================================================
class DashboardStats(BaseModel):
    tong_thiet_bi: int = 0
    hoat_dong: int = 0
    cho: int = 0
    bao_tri: int = 0
    hong: int = 0
    dieu_chuyen: int = 0
    tong_cong_truong: int = 0
    tong_mui: int = 0
    tong_nhan_su: int = 0
    # Thêm thống kê mới cho Sprint 5
    cho_duyet_dieu_phoi: int = 0
    tong_gio_hom_nay: float = 0.0
    tong_nhien_lieu_hom_nay: float = 0.0


class EquipmentHistoryResponse(BaseModel):
    logs: List[NhatKySuKienResponse] = []
    shifts: List["CaLamViecResponse"] = []
    requests: List["YeuCauDieuPhoiResponse"] = []


# ============================================================
# CaLamViec (Work Shift)
# ============================================================
from datetime import time

class CaLamViecBase(BaseModel):
    thiet_bi_id: str
    nhan_su_id: Optional[str] = None
    mui_id: Optional[str] = None
    ngay_lam_viec: date
    ca_so: str = "1"
    gio_bat_dau: Optional[time] = None
    gio_ket_thuc: Optional[time] = None
    gio_hoat_dong_thuc_te: float = 0.0
    chi_so_dong_ho_dau: Optional[float] = None
    chi_so_dong_ho_cuoi: Optional[float] = None
    xang_dau_cap: float = 0.0
    ghi_chu: Optional[str] = None


class CaLamViecCreate(CaLamViecBase):
    pass


class CaLamViecResponse(CaLamViecBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Optional nested info
    thiet_bi: Optional[ThietBiResponse] = None
    nhan_su: Optional[NhanSuResponse] = None
    mui_thi_cong: Optional[MuiThiCongResponse] = None


# Rebuild models for forward references
CongTruongDetail.model_rebuild()
MuiThiCongDetail.model_rebuild()
ThietBiDetail.model_rebuild()
NhatKySuKienResponse.model_rebuild()
CaLamViecResponse.model_rebuild()
