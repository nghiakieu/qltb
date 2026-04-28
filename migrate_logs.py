import sqlite3
import os

db_path = 'backend/qltb.db'
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Applying database migrations...")

# Update thiet_bi table
try:
    cursor.execute("ALTER TABLE thiet_bi ADD COLUMN ngay_den_ct TEXT")
    print("Added ngay_den_ct to thiet_bi")
except sqlite3.OperationalError:
    print("ngay_den_ct already exists in thiet_bi")

# Update nhat_ky_su_kien table
cols = [
    ("tu_mui_id", "TEXT"),
    ("den_mui_id", "TEXT"),
    ("tu_ct_id", "TEXT"),
    ("den_ct_id", "TEXT")
]

for col_name, col_type in cols:
    try:
        cursor.execute(f"ALTER TABLE nhat_ky_su_kien ADD COLUMN {col_name} {col_type}")
        print(f"Added {col_name} to nhat_ky_su_kien")
    except sqlite3.OperationalError:
        print(f"{col_name} already exists in nhat_ky_su_kien")

conn.commit()
conn.close()
print("Migration completed.")
