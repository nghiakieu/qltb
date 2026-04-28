import sqlite3
import os

db_path = 'backend/qltb.db'
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Map Loai to filename
ICON_MAP = {
    'CAU': 'can_cau_banh_lop.png',
    'MAY_DAO': 'may_xuc_banh_xich.png',
    'XE_BEN': 'o_to_van_chuyen.png',
    'XE_TRON': 'xe_mix.png',
    'MAY_BOM_BT': 'may_bom_can.png',
    'MAY_LU': 'may_lu_rung.png',
    'MAY_PHAT_DIEN': 'may_phat_dien.png',
    'MAY_HAN': 'may_nen_khi.png',
    'MAY_EP_COC': 'may_khoan_CKN.png',
    'SA_LAN': 'can_cau_banh_xich.png',
    'MAY_SAN': 'may_san.png',
    'XE_TAI': 'o_to_van_chuyen.png',
    'TRAM_TRON': 'tram_tron BTXM.png',
    'KHAC': 'may_xuc_banh_xich.png'
}

print("Updating hinh_anh based on loai...")
for loai, filename in ICON_MAP.items():
    path = f"/icons/equipment/{filename}"
    cursor.execute("UPDATE thiet_bi SET hinh_anh = ? WHERE loai = ?", (path, loai))

conn.commit()
conn.close()
print("Migration of hinh_anh completed successfully.")
