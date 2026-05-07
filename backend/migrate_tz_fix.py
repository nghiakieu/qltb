
from app.db.database import SessionLocal
from app.models.nhat_ky_su_kien import NhatKySuKien
from app.models.ca_lam_viec import CaLamViec
from app.models.yeu_cau_dieu_phoi import YeuCauDieuPhoi
from app.models.thiet_bi import ThietBi
from app.models.cong_truong import CongTruong
from app.models.mui_thi_cong import MuiThiCong
from app.models.nhan_su import NhanSu
from datetime import timedelta, datetime

db = SessionLocal()

def fix_times(model, field_names):
    items = db.query(model).all()
    count = 0
    for item in items:
        updated = False
        for field in field_names:
            if not hasattr(item, field):
                continue
            val = getattr(item, field)
            if val and val.date() == datetime(2026, 5, 7).date():
                # Nếu giờ < 12 (UTC), cộng thêm 7 tiếng
                if val.hour < 12:
                    setattr(item, field, val + timedelta(hours=7))
                    updated = True
        if updated:
            count += 1
    print(f"Fixed {count} records in {model.__tablename__}")

fix_times(NhatKySuKien, ["thoi_gian"])
fix_times(CaLamViec, ["created_at", "updated_at"])
fix_times(YeuCauDieuPhoi, ["created_at"])
fix_times(ThietBi, ["created_at", "updated_at"])

db.commit()
db.close()
