from app.db.database import engine, SessionLocal
from app.models.base import Base
from app.models.tai_khoan import TaiKhoan
from app.core.security import hash_password
from app.core.config import settings

# Import all models to register them with Base.metadata
from app.models.cong_truong import CongTruong
from app.models.mui_thi_cong import MuiThiCong
from app.models.thiet_bi import ThietBi
from app.models.nhan_su import NhanSu
from app.models.nhat_ky_su_kien import NhatKySuKien
from app.models.yeu_cau_dieu_phoi import YeuCauDieuPhoi
from app.models.ca_lam_viec import CaLamViec

def init_db():
    print("Creating tables on Supabase...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        admin_exists = db.query(TaiKhoan).filter(TaiKhoan.vai_tro == "ADMIN").first()
        if not admin_exists:
            print(f"Creating admin user: {settings.ADMIN_USERNAME}")
            admin = TaiKhoan(
                username=settings.ADMIN_USERNAME,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                ho_ten=settings.ADMIN_HO_TEN,
                vai_tro="ADMIN",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print("Admin user created successfully.")
        else:
            print(f"Admin user already exists: {admin_exists.username}")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
