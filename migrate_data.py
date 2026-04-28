import sqlite3
import os

db_path = 'backend/qltb.db'
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Update based on mui_id
print("Updating cong_truong_id based on mui_id...")
cursor.execute('''
    UPDATE thiet_bi 
    SET cong_truong_id = (
        SELECT cong_truong_id 
        FROM mui_thi_cong 
        WHERE mui_thi_cong.id = thiet_bi.mui_id
    ) 
    WHERE mui_id IS NOT NULL
''')

# Manually assign unassigned machines in demo data
print("Assigning unassigned machines to sites...")
cursor.execute("UPDATE thiet_bi SET cong_truong_id = 'ct-001' WHERE id IN ('tb-016', 'tb-017', 'tb-018')")
cursor.execute("UPDATE thiet_bi SET cong_truong_id = 'ct-002' WHERE id IN ('tb-029', 'tb-030')")

conn.commit()
conn.close()
print("Migration completed successfully.")
