"""NhatKySuKien (Event Log) model - tracks all equipment state changes."""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, generate_uuid
from app.core.datetime_utils import now_ict


class NhatKySuKien(Base):
    __tablename__ = "nhat_ky_su_kien"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    loai_su_kien = Column(
        String(30),
        nullable=False,
        comment="PHAN_BO | DIEU_CHUYEN | BAO_TRI | HONG | BAT_DAU_CA | KET_THUC_CA | DOI_TRANG_THAI",
    )
    thiet_bi_id = Column(
        String(36),
        ForeignKey("thiet_bi.id", ondelete="CASCADE"),
        nullable=False,
    )
    mui_id = Column(
        String(36),
        ForeignKey("mui_thi_cong.id", ondelete="SET NULL"),
        nullable=True,
    )
    thoi_gian = Column(
        DateTime,
        default=now_ict,
        nullable=False,
    )
    nguoi_thuc_hien_id = Column(
        String(36),
        ForeignKey("nhan_su.id", ondelete="SET NULL"),
        nullable=True,
    )
    ghi_chu = Column(Text)
    
    # Track transfers
    tu_mui_id = Column(String(36), ForeignKey("mui_thi_cong.id", ondelete="SET NULL"), nullable=True)
    den_mui_id = Column(String(36), ForeignKey("mui_thi_cong.id", ondelete="SET NULL"), nullable=True)
    tu_ct_id = Column(String(36), ForeignKey("cong_truong.id", ondelete="SET NULL"), nullable=True)
    den_ct_id = Column(String(36), ForeignKey("cong_truong.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    thiet_bi = relationship("ThietBi", back_populates="nhat_ky_su_kiens", foreign_keys=[thiet_bi_id])
    mui_thi_cong = relationship("MuiThiCong", foreign_keys=[mui_id])
    nguoi_thuc_hien = relationship("NhanSu", foreign_keys=[nguoi_thuc_hien_id])
    
    tu_mui = relationship("MuiThiCong", foreign_keys=[tu_mui_id])
    den_mui = relationship("MuiThiCong", foreign_keys=[den_mui_id])
    tu_ct = relationship("CongTruong", foreign_keys=[tu_ct_id])
    den_ct = relationship("CongTruong", foreign_keys=[den_ct_id])
