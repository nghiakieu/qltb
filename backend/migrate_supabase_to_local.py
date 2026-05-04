"""
migrate_supabase_to_local.py
============================
Export all data from Supabase (PostgreSQL) and import into local SQLite.

Usage:
    python migrate_supabase_to_local.py

This script will:
1. Connect to Supabase using DATABASE_URL in .env
2. Read all tables in correct order (respecting FK dependencies)
3. Switch connection to local SQLite
4. Create tables if not exist
5. Insert all rows into SQLite (skip duplicates by primary key)

Run from the backend/ directory.
"""

import os
import sys
from pathlib import Path

# Add backend to sys.path so app.* imports work
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv

# ── Step 0: Load env then override DATABASE_URL ──────────────────────────────
load_dotenv(".env")

SUPABASE_URL = os.environ.get("DATABASE_URL", "")
if not SUPABASE_URL or "supabase" not in SUPABASE_URL:
    print("[ERROR] .env DATABASE_URL không trỏ đến Supabase. Kiểm tra lại.")
    sys.exit(1)

LOCAL_SQLITE = "sqlite:///./qltb_local.db"

print(f"[INFO] Supabase URL: {SUPABASE_URL[:60]}...")
print(f"[INFO] Local SQLite: {LOCAL_SQLITE}")
print()

# ── Step 1: Connect to Supabase ───────────────────────────────────────────────
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

supabase_engine = create_engine(SUPABASE_URL)
SupabaseSession = sessionmaker(bind=supabase_engine)

# ── Step 2: Setup local SQLite engine ─────────────────────────────────────────
from sqlalchemy import event

local_engine = create_engine(
    LOCAL_SQLITE,
    connect_args={"check_same_thread": False},
    echo=False,
)

# Enable foreign keys on SQLite
@event.listens_for(local_engine, "connect")
def set_sqlite_pragma(conn, _):
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys=OFF")  # OFF during migration to avoid FK order issues
    cursor.close()

# ── Step 3: Create all tables in SQLite ───────────────────────────────────────
# Import all models so Base.metadata is populated
from app.models.base import Base
from app.models.cong_truong import CongTruong
from app.models.mui_thi_cong import MuiThiCong
from app.models.nhan_su import NhanSu
from app.models.thiet_bi import ThietBi
from app.models.nhat_ky_su_kien import NhatKySuKien
from app.models.yeu_cau_dieu_phoi import YeuCauDieuPhoi
from app.models.ca_lam_viec import CaLamViec
from app.models.tai_khoan import TaiKhoan, TaiKhoanPhamVi

print("[INFO] Tạo bảng trong SQLite local...")
Base.metadata.create_all(bind=local_engine)
print("[OK]  Tất cả bảng đã sẵn sàng.")
print()

# ── Step 4: Define migration order (FK parent → child) ────────────────────────
# Each entry: (ModelClass, table_name)
MIGRATION_ORDER = [
    (CongTruong,       "cong_truong"),
    (MuiThiCong,       "mui_thi_cong"),
    (NhanSu,           "nhan_su"),
    (ThietBi,          "thiet_bi"),
    (NhatKySuKien,     "nhat_ky_su_kien"),
    (YeuCauDieuPhoi,   "yeu_cau_dieu_phoi"),
    (CaLamViec,        "ca_lam_viec"),
    (TaiKhoan,         "tai_khoan"),
    (TaiKhoanPhamVi,   "tai_khoan_pham_vi"),
]

# ── Step 5: Migrate each table ────────────────────────────────────────────────
LocalSession = sessionmaker(bind=local_engine)

total_migrated = 0

with SupabaseSession() as sb_db, LocalSession() as local_db:
    for Model, table_name in MIGRATION_ORDER:
        print(f"[MIGRATE] {table_name}...", end=" ", flush=True)

        # Fetch all rows from Supabase
        try:
            rows = sb_db.query(Model).all()
        except Exception as e:
            print(f"\n[WARN] Không thể đọc bảng '{table_name}': {e}")
            continue

        if not rows:
            print("(trống)")
            continue

        # Get primary key column name
        pk_col = Model.__table__.primary_key.columns.keys()[0]

        # Get existing PKs in SQLite to skip duplicates
        existing_pks = {
            row[0]
            for row in local_db.execute(
                text(f"SELECT {pk_col} FROM {table_name}")
            )
        }

        inserted = 0
        skipped = 0

        for row in rows:
            pk_val = getattr(row, pk_col)
            if pk_val in existing_pks:
                skipped += 1
                continue

            # Detach from Supabase session and make a fresh copy
            row_dict = {
                col.name: getattr(row, col.name)
                for col in Model.__table__.columns
            }

            local_db.execute(Model.__table__.insert().values(**row_dict))
            inserted += 1

        local_db.commit()
        total_migrated += inserted
        print(f"{len(rows)} dòng → inserted={inserted}, skipped={skipped}")

print()
print(f"[DONE] Đã migrate {total_migrated} dòng tổng cộng vào '{LOCAL_SQLITE}'")
print()

# ── Step 6: Seed admin account if not present ────────────────────────────────
from app.core.security import hash_password
from app.core.config import settings

with LocalSession() as local_db:
    admin_exists = local_db.query(TaiKhoan).filter(TaiKhoan.vai_tro == "ADMIN").first()
    if not admin_exists:
        admin = TaiKhoan(
            username=settings.ADMIN_USERNAME,
            password_hash=hash_password(settings.ADMIN_PASSWORD),
            ho_ten=settings.ADMIN_HO_TEN,
            vai_tro="ADMIN",
            is_active=True,
        )
        local_db.add(admin)
        local_db.commit()
        print(f"[SEED] Tạo tài khoản admin: '{settings.ADMIN_USERNAME}' / '{settings.ADMIN_PASSWORD}'")
    else:
        print(f"[OK]  Admin đã tồn tại: '{admin_exists.username}'")

print()
print("=" * 60)
print("HOÀN TẤT! Bước tiếp theo:")
print(f"  Sửa .env: DATABASE_URL={LOCAL_SQLITE}")
print("  Hoặc chạy lệnh dưới đây:")
print()
print('  python switch_db.py local   # chuyển sang SQLite')
print('  python switch_db.py supa    # chuyển lại Supabase')
print("=" * 60)
