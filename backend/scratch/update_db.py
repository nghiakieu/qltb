
import sqlite3
import os

db_path = 'c:/QLTB/backend/qltb.db'
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get existing columns
cursor.execute("PRAGMA table_info(nhat_ky_su_kien)")
columns = [row[1] for row in cursor.fetchall()]
print(f"Current columns in nhat_ky_su_kien: {columns}")

# Columns to add
new_cols = [
    ('tu_mui_id', 'VARCHAR(36)'),
    ('den_mui_id', 'VARCHAR(36)'),
    ('tu_ct_id', 'VARCHAR(36)'),
    ('den_ct_id', 'VARCHAR(36)')
]

for col_name, col_type in new_cols:
    if col_name not in columns:
        print(f"Adding column {col_name}...")
        cursor.execute(f"ALTER TABLE nhat_ky_su_kien ADD COLUMN {col_name} {col_type}")

# Check ThietBi table for ma_tb and ngay_den_ct
cursor.execute("PRAGMA table_info(thiet_bi)")
tb_columns = [row[1] for row in cursor.fetchall()]
if 'ma_tb' not in tb_columns:
    print("Adding ma_tb to thiet_bi...")
    cursor.execute("ALTER TABLE thiet_bi ADD COLUMN ma_tb VARCHAR(50)")
if 'ngay_den_ct' not in tb_columns:
    print("Adding ngay_den_ct to thiet_bi...")
    cursor.execute("ALTER TABLE thiet_bi ADD COLUMN ngay_den_ct VARCHAR(20)")

conn.commit()
conn.close()
print("Done.")
