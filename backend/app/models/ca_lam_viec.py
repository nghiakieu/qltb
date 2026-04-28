"""CaLamViec (Work Shift) model - recording daily equipment activity."""

from sqlalchemy import Column, String, Float, Date, Time, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin, generate_uuid

class CaLamViec(Base, TimestampMixin):
    __tablename__ = "ca_lam_viec"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    thiet_bi_id = Column(String(36), ForeignKey("thiet_bi.id", ondelete="CASCADE"), nullable=False)
    nhan_su_id = Column(String(36), ForeignKey("nhan_su.id", ondelete="SET NULL"), nullable=True, comment="Người vận hành")
    mui_id = Column(String(36), ForeignKey("mui_thi_cong.id", ondelete="SET NULL"), nullable=True)
    
    ngay_lam_viec = Column(Date, nullable=False)
    ca_so = Column(String(10), default="1", comment="Ca 1, Ca 2, Ca 3")
    
    gio_bat_dau = Column(Time, nullable=True)
    gio_ket_thuc = Column(Time, nullable=True)
    
    gio_hoat_dong_thuc_te = Column(Float, default=0.0, comment="Số giờ máy chạy thực tế")
    
    chi_so_dong_ho_dau = Column(Float, nullable=True, comment="Số giờ trên đồng hồ lúc bắt đầu")
    chi_so_dong_ho_cuoi = Column(Float, nullable=True, comment="Số giờ trên đồng hồ lúc kết thúc")
    
    xang_dau_cap = Column(Float, default=0.0, comment="Lít dầu cấp trong ca")
    
    ghi_chu = Column(Text, nullable=True)
    
    # Relationships
    thiet_bi = relationship("ThietBi")
    nhan_su = relationship("NhanSu")
    mui_thi_cong = relationship("MuiThiCong")
