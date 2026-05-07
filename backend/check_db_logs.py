
from app.db.database import SessionLocal
from app.models.nhat_ky_su_kien import NhatKySuKien
from app.models.thiet_bi import ThietBi
from app.models.cong_truong import CongTruong
from app.models.mui_thi_cong import MuiThiCong
from app.models.nhan_su import NhanSu
from datetime import datetime

db = SessionLocal()
logs = db.query(NhatKySuKien).order_by(NhatKySuKien.thoi_gian.desc()).limit(5).all()

for l in logs:
    print(f"ID: {l.id} | Time: {l.thoi_gian} | Type: {type(l.thoi_gian)} | Event: {l.loai_su_kien}")

db.close()
