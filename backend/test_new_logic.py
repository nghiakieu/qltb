
from app.db.database import SessionLocal
from app.models.nhat_ky_su_kien import NhatKySuKien
from app.core.datetime_utils import now_ict_naive
import uuid

db = SessionLocal()
new_id = str(uuid.uuid4())
event = NhatKySuKien(
    id=new_id,
    loai_su_kien="TEST",
    thiet_bi_id="any", # won't commit if FK fails, but we just want to see the object
    thoi_gian=now_ict_naive()
)
print(f"New event thoi_gian (naive ICT): {event.thoi_gian}")
db.close()
