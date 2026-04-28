"""MuiThiCong (Work Front / Construction Section) model."""

from sqlalchemy import Column, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class MuiThiCong(Base, TimestampMixin):
    __tablename__ = "mui_thi_cong"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ten_mui = Column(String(255), nullable=False, comment="VD: Mũi 1 - Đúc dầm")
    cong_truong_id = Column(
        String(36),
        ForeignKey("cong_truong.id", ondelete="CASCADE"),
        nullable=False,
    )
    vi_tri = Column(Text, comment="Mô tả vị trí trên công trường")
    trang_thai = Column(
        String(20),
        nullable=False,
        default="DANG_THI_CONG",
        comment="DANG_THI_CONG | CHO | HOAN_THANH",
    )
    khoi_luong = Column(Text, comment="Khối lượng công việc")
    han_hoan_thanh = Column(Date)

    # Relationships
    cong_truong = relationship("CongTruong", back_populates="mui_thi_congs")
    thiet_bis = relationship("ThietBi", back_populates="mui_thi_cong")
