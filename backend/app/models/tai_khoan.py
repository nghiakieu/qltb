"""TaiKhoan (User Account) and TaiKhoanPhamVi (Access Scope) models."""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class TaiKhoan(Base, TimestampMixin):
    """Login account — managed exclusively by Admin."""

    __tablename__ = "tai_khoan"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    ho_ten = Column(String(255), nullable=False)
    vai_tro = Column(
        String(20),
        nullable=False,
        comment="ADMIN | CHI_HUY_TRUONG | DIEU_PHOI | GIAM_SAT | LAI_XE",
    )
    nhan_su_id = Column(
        String(36),
        ForeignKey("nhan_su.id", ondelete="SET NULL"),
        nullable=True,
        comment="Optional link to NhanSu record",
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(
        String(36),
        ForeignKey("tai_khoan.id", ondelete="SET NULL"),
        nullable=True,
        comment="Admin who created this account",
    )
    last_login = Column(DateTime, nullable=True)

    # Relationships
    nhan_su = relationship("NhanSu", foreign_keys=[nhan_su_id])
    pham_vis = relationship(
        "TaiKhoanPhamVi",
        back_populates="tai_khoan",
        cascade="all, delete-orphan",
    )


class TaiKhoanPhamVi(Base):
    """
    Access scope assigned by Admin per account.

    Rules:
    - cong_truong_id set, mui_thi_cong_id = NULL  → full access to that site
    - both set                                     → access to that specific section only
    - ADMIN role ignores this table entirely
    """

    __tablename__ = "tai_khoan_pham_vi"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tai_khoan_id = Column(
        String(36),
        ForeignKey("tai_khoan.id", ondelete="CASCADE"),
        nullable=False,
    )
    cong_truong_id = Column(
        String(36),
        ForeignKey("cong_truong.id", ondelete="CASCADE"),
        nullable=True,
    )
    mui_thi_cong_id = Column(
        String(36),
        ForeignKey("mui_thi_cong.id", ondelete="CASCADE"),
        nullable=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "tai_khoan_id", "cong_truong_id", "mui_thi_cong_id",
            name="uq_tai_khoan_pham_vi",
        ),
    )

    # Relationships
    tai_khoan = relationship("TaiKhoan", back_populates="pham_vis")
    cong_truong = relationship("CongTruong")
    mui_thi_cong = relationship("MuiThiCong")
