
from app.db.session import SessionLocal
from app.models.nhat_ky_su_kien import NhatKySuKien
from datetime import datetime

db = SessionLocal()
logs = db.query(NhatKySuKien).order_by(NhatKySuKien.thoi_gian.desc()).limit(5).all()

for l in logs:
    print(f"ID: {l.id} | Time: {l.thoi_gian} | Type: {type(l.thoi_gian)} | Event: {l.loai_su_kien}")

db.close()
