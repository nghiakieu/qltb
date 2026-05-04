"""QLTB - Quản Lý Thiết Bị Công Trường
Main FastAPI application entry point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.limiter import limiter

from app.core.config import settings
from app.db.database import engine, SessionLocal
from app.models.base import Base

# Import all models so they register with Base.metadata
from app.models.cong_truong import CongTruong  # noqa: F401
from app.models.mui_thi_cong import MuiThiCong  # noqa: F401
from app.models.thiet_bi import ThietBi  # noqa: F401
from app.models.nhan_su import NhanSu  # noqa: F401
from app.models.nhat_ky_su_kien import NhatKySuKien  # noqa: F401
from app.models.yeu_cau_dieu_phoi import YeuCauDieuPhoi  # noqa: F401
from app.models.ca_lam_viec import CaLamViec  # noqa: F401
from app.models.tai_khoan import TaiKhoan, TaiKhoanPhamVi  # noqa: F401

from app.api.v1.router import router as api_router
from app.core.security import hash_password
from app.db.database import SessionLocal
from app.db.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables & seed data. Shutdown: cleanup."""
    print(f"[START] Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables verified/created")

    # Seed default admin account if none exists
    db = SessionLocal()
    try:
        admin_exists = db.query(TaiKhoan).filter(TaiKhoan.vai_tro == "ADMIN").first()
        if not admin_exists:
            admin = TaiKhoan(
                username=settings.ADMIN_USERNAME,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                ho_ten=settings.ADMIN_HO_TEN,
                vai_tro="ADMIN",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print(f"[SEED] Admin account created: '{settings.ADMIN_USERNAME}'")
        else:
            print(f"[OK] Admin account already exists: '{admin_exists.username}'")
    finally:
        db.close()

    yield

    print("[STOP] Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Equipment Management System for Bridge & Road Construction Sites",
    lifespan=lifespan,
)

# Add slowapi limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # MVP: allow all. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)


@app.get("/", tags=["Health"])
def root():
    """Health check endpoint."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }
