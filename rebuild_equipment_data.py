import os
import sys
import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend to path to import models if needed, 
# but we'll use raw SQL for simplicity and speed of reset.

DB_URL = "sqlite:///backend/qltb.db"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
session = Session()

EQUIPMENT_DATA = [
    ('CAU_LOP', 'Cẩu bánh lốp 50T', '29C-123.45'),
    ('CAU_XICH', 'Cẩu bánh xích 100T', 'CX-001'),
    ('CAU_THAP', 'Cần trục tháp QTZ', 'CT-05'),
    ('XUC_XICH', 'Máy xúc bánh xích PC200', 'MX-200'),
    ('XUC_LOP', 'Máy xúc bánh lốp Solar', 'ML-02'),
    ('XUC_LAT', 'Máy xúc lật Liugong', 'XL-10'),
    ('MAY_UI', 'Máy ủi D6', 'MU-06'),
    ('MAY_SAN', 'Máy san GD511', 'MS-511'),
    ('MAY_RAI', 'Máy rải Voegele', 'MR-01'),
    ('LU_RUNG', 'Máy lu rung Hamm', 'LR-20'),
    ('LU_TINH', 'Máy lu tĩnh Sakai', 'LT-15'),
    ('LU_LOP', 'Máy lu bánh lốp Dynapac', 'LL-09'),
    ('BOM_CAN', 'Máy bơm cần Putzmeister', 'BC-37'),
    ('BOM_TINH', 'Máy bơm tĩnh Schwing', 'BT-01'),
    ('XE_MIX', 'Xe trộn bê tông Howo', '29H-555.66'),
    ('XE_BEN', 'Xe ben Shacman 4 chân', '29C-999.88'),
    ('XE_NUOC', 'Xe chở nước Dongfeng', '29C-111.22'),
    ('KHOAN_CKN', 'Máy khoan CKN Bauer', 'MK-01'),
    ('BUA_RUNG', 'Búa rung DZ-90', 'BR-90'),
    ('PHAT_DIEN', 'Máy phát điện Cummins', 'MP-250'),
    ('NEN_KHI', 'Máy nén khí Atlas Copco', 'NK-01'),
    ('TRAM_BTXM', 'Trạm trộn BTXM 120m3/h', 'T-BTXM'),
    ('TRAM_BTN', 'Trạm trộn BTN 160t/h', 'T-BTN'),
]

def rebuild():
    print("Deleting existing equipment...")
    session.execute(text("DELETE FROM thiet_bi"))
    
    print("Inserting new equipment data...")
    from datetime import datetime
    now = datetime.now().isoformat()
    for loai, ten, bien_so in EQUIPMENT_DATA:
        new_id = str(uuid.uuid4())
        session.execute(
            text("INSERT INTO thiet_bi (id, ten_tb, loai, bien_so, trang_thai, created_at, updated_at) VALUES (:id, :ten, :loai, :bien_so, :trang_thai, :now, :now)"),
            {"id": new_id, "ten": ten, "loai": loai, "bien_so": bien_so, "trang_thai": "HOAT_DONG", "now": now}
        )
    
    session.commit()
    print("Successfully rebuilt equipment data with 23 machine types.")

if __name__ == "__main__":
    rebuild()
