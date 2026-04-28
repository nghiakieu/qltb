"""CongTruong (Construction Site) model."""

from sqlalchemy import Column, String, Text, Date, JSON
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class CongTruong(Base, TimestampMixin):
    __tablename__ = "cong_truong"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ten_ct = Column(String(255), nullable=False, comment="Tên công trường")
    dia_chi = Column(Text, comment="Địa chỉ")
    trang_thai = Column(
        String(20),
        nullable=False,
        default="DANG_THI_CONG",
        comment="DANG_THI_CONG | TAM_DUNG | HOAN_THANH",
    )
    coords = Column(JSON, comment="{ lat, lng }")
    ngay_bat_dau = Column(Date)
    ngay_ket_thuc = Column(Date, comment="Dự kiến")
    chu_dau_tu = Column(String(255), comment="Chủ đầu tư")

    # Relationships
    mui_thi_congs = relationship("MuiThiCong", back_populates="cong_truong", cascade="all, delete-orphan")
    nhan_sus = relationship("NhanSu", back_populates="cong_truong")
    thiet_bis = relationship("ThietBi", back_populates="cong_truong")
