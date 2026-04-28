"""QLTB - Quản Lý Thiết Bị Công Trường
Main FastAPI application entry point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

from app.api.v1.router import router as api_router
from app.db.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables & seed data. Shutdown: cleanup."""
    print(f"[START] Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created")

    # Seed demo data
    db = SessionLocal()
    try:
        seed_database(db)
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
