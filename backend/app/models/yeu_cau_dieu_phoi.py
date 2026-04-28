"""YeuCauDieuPhoi (Dispatch Request) model - equipment transfer between work fronts."""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin, generate_uuid

from datetime import datetime, timezone


class YeuCauDieuPhoi(Base, TimestampMixin):
    __tablename__ = "yeu_cau_dieu_phoi"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tu_mui_id = Column(
        String(36),
        ForeignKey("mui_thi_cong.id", ondelete="SET NULL"),
        nullable=True,
        comment="Mũi nguồn (NULL = chưa phân bổ)",
    )
    den_mui_id = Column(
        String(36),
        ForeignKey("mui_thi_cong.id", ondelete="SET NULL"),
        nullable=False,
        comment="Mũi đích",
    )
    thiet_bi_id = Column(
        String(36),
        ForeignKey("thiet_bi.id", ondelete="CASCADE"),
        nullable=False,
    )
    trang_thai_yeu_cau = Column(
        String(20),
        nullable=False,
        default="CHO_DUYET",
        comment="CHO_DUYET | DA_DUYET | TU_CHOI | DA_THUC_HIEN",
    )
    nguoi_yeu_cau_id = Column(
        String(36),
        ForeignKey("nhan_su.id", ondelete="SET NULL"),
        nullable=True,
    )
    nguoi_duyet_id = Column(
        String(36),
        ForeignKey("nhan_su.id", ondelete="SET NULL"),
        nullable=True,
    )
    ly_do = Column(Text)

    # Relationships
    tu_mui = relationship("MuiThiCong", foreign_keys=[tu_mui_id])
    den_mui = relationship("MuiThiCong", foreign_keys=[den_mui_id])
    thiet_bi = relationship("ThietBi")
    nguoi_yeu_cau = relationship("NhanSu", foreign_keys=[nguoi_yeu_cau_id])
    nguoi_duyet = relationship("NhanSu", foreign_keys=[nguoi_duyet_id])
