"""NhanSu (Personnel) model."""

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class NhanSu(Base, TimestampMixin):
    __tablename__ = "nhan_su"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ho_ten = Column(String(255), nullable=False)
    chuc_vu = Column(
        String(30),
        nullable=False,
        comment="CHI_HUY_TRUONG | DIEU_PHOI | LAI_XE | THO_MAY | GIAM_SAT",
    )
    so_dien_thoai = Column(String(15))
    cong_truong_id = Column(
        String(36),
        ForeignKey("cong_truong.id", ondelete="SET NULL"),
        nullable=True,
    )
    quan_ly_id = Column(
        String(36),
        ForeignKey("nhan_su.id", ondelete="SET NULL"),
        nullable=True,
        comment="Cấp trên trực tiếp",
    )

    # Relationships
    cong_truong = relationship("CongTruong", back_populates="nhan_sus")
    thiet_bis = relationship("ThietBi", back_populates="lai_xe", foreign_keys="ThietBi.lai_xe_id")
    cap_duoi = relationship("NhanSu", backref="quan_ly_ref", remote_side="NhanSu.id",
                            foreign_keys="NhanSu.quan_ly_id")
