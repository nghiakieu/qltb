import sys
import os
from sqlalchemy import func

# Add the backend directory to sys.path
backend_path = os.path.join(os.getcwd(), 'backend')
if os.path.exists(backend_path):
    sys.path.append(backend_path)
else:
    sys.path.append(os.getcwd())

from app.db.database import SessionLocal
from app.models.thiet_bi import ThietBi
from app.models.mui_thi_cong import MuiThiCong
from app.models.cong_truong import CongTruong
from app.models.nhan_su import NhanSu
from app.models.nhat_ky_su_kien import NhatKySuKien

def update_ma_tb():
    db = SessionLocal()
    try:
        # Get all equipment without ma_tb, ordered by created_at or id
        equipment = db.query(ThietBi).filter(ThietBi.ma_tb == None).order_by(ThietBi.created_at).all()
        
        # Get the current maximum number if any
        max_ma = db.query(func.max(ThietBi.ma_tb)).filter(ThietBi.ma_tb.like('TB-%')).scalar()
        
        start_num = 1
        if max_ma:
            try:
                start_num = int(max_ma.split('-')[1]) + 1
            except (IndexError, ValueError):
                pass
        
        print(f"Starting update from number {start_num} for {len(equipment)} items.")
        
        for i, tb in enumerate(equipment):
            tb.ma_tb = f"TB-{start_num + i:04d}"
            # print(f"Assigned {tb.ma_tb} to {tb.ten_tb}")
            
        db.commit()
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_ma_tb()
