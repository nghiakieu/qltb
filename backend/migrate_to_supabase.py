import sqlite3
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Import models to ensure they are registered
from app.models.base import Base
from app.models.cong_truong import CongTruong
from app.models.mui_thi_cong import MuiThiCong
from app.models.thiet_bi import ThietBi
from app.models.nhan_su import NhanSu
from app.models.nhat_ky_su_kien import NhatKySuKien
from app.models.yeu_cau_dieu_phoi import YeuCauDieuPhoi
from app.models.ca_lam_viec import CaLamViec

# Load environment variables
load_dotenv()

SQLITE_DB = "qltb.db"
SUPABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    if not os.path.exists(SQLITE_DB):
        print(f"Error: {SQLITE_DB} not found!")
        return

    print(f"Connecting to SQLite: {SQLITE_DB}...")
    sqlite_conn = sqlite_connection = sqlite3.connect(SQLITE_DB)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    print(f"Connecting to Supabase PostgreSQL...")
    engine = create_engine(SUPABASE_URL)
    
    # Step 1: Create tables on Supabase
    print("Creating tables on Supabase if they don't exist...")
    Base.metadata.create_all(bind=engine)
    
    # Step 2: Migrate data table by table in specific order
    tables = [
        "cong_truong",
        "mui_thi_cong",
        "nhan_su",
        "thiet_bi",
        "ca_lam_viec",
        "nhat_ky_su_kien",
        "yeu_cau_dieu_phoi"
    ]

    with engine.connect() as pg_conn:
        for table in tables:
            print(f"Migrating table: {table}...")
            
            # Get data from SQLite
            try:
                sqlite_cursor.execute(f"SELECT * FROM {table}")
                rows = sqlite_cursor.fetchall()
                if not rows:
                    print(f"  - Table {table} is empty, skipping.")
                    continue
                
                # Prepare data for PostgreSQL
                for row in rows:
                    data = dict(row)
                    
                    # Construct INSERT statement
                    columns = ", ".join(data.keys())
                    placeholders = ", ".join([f":{k}" for k in data.keys()])
                    # Use ON CONFLICT DO NOTHING to avoid duplicate errors if script is re-run
                    sql = text(f"INSERT INTO {table} ({columns}) VALUES ({placeholders}) ON CONFLICT DO NOTHING")
                    
                    pg_conn.execute(sql, data)
                
                pg_conn.commit()
                print(f"  - Successfully migrated {len(rows)} rows to {table}")
            except Exception as e:
                print(f"  - Error migrating {table}: {e}")

    sqlite_conn.close()
    print("\nMigration finished!")

if __name__ == "__main__":
    migrate()
