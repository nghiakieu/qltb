"""ThietBi (Equipment) model."""

from sqlalchemy import Column, String, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class ThietBi(Base, TimestampMixin):
    __tablename__ = "thiet_bi"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ten_tb = Column(String(255), nullable=False, comment="VD: Cẩu bánh xích 50T")
    loai = Column(
        String(30),
        nullable=False,
        comment="CAU | MAY_DAO | XE_BEN | XE_TRON | MAY_BOM_BT | MAY_LU | MAY_PHAT_DIEN | MAY_HAN | MAY_EP_COC | SA_LAN | MAY_SAN | XE_TAI | TRAM_TRON | KHAC",
    )
    bien_so = Column(String(20), comment="Biển số xe / Mã quản lý")
    ma_tb = Column(String(20), unique=True, index=True, comment="Mã thiết bị (TB-0001...)")
    nam_sx = Column(Integer, comment="Năm sản xuất")
    hang_sx = Column(String(100), comment="Hãng sản xuất")
    trang_thai = Column(
        String(20),
        nullable=False,
        default="CHO",
        comment="HOAT_DONG | CHO | BAO_TRI | HONG | DIEU_CHUYEN",
    )
    mui_id = Column(
        String(36),
        ForeignKey("mui_thi_cong.id", ondelete="SET NULL"),
        nullable=True,
        comment="NULL = chưa phân bổ",
    )
    cong_truong_id = Column(
        String(36),
        ForeignKey("cong_truong.id", ondelete="SET NULL"),
        nullable=True,
        comment="Công trường thiết bị thuộc về",
    )
    lai_xe_id = Column(
        String(36),
        ForeignKey("nhan_su.id", ondelete="SET NULL"),
        nullable=True,
        comment="Người vận hành",
    )
    cong_suat_gio_max = Column(Float, comment="Giờ máy tối đa/ngày")
    hinh_anh = Column(String(255), nullable=True, comment="Đường dẫn đến icon thiết bị")
    ngay_den_ct = Column(String(10), nullable=True, comment="Ngày thiết bị đến công trường")

    # Relationships
    mui_thi_cong = relationship("MuiThiCong", back_populates="thiet_bis")
    cong_truong = relationship("CongTruong", back_populates="thiet_bis")
    lai_xe = relationship("NhanSu", back_populates="thiet_bis", foreign_keys=[lai_xe_id])
    nhat_ky_su_kiens = relationship("NhatKySuKien", back_populates="thiet_bi")
