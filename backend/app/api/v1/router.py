"""Main API v1 router - aggregates all endpoint routers."""

from fastapi import APIRouter

from app.api.v1 import (
    auth,
    admin,
    cong_truong,
    mui_thi_cong,
    thiet_bi,
    nhan_su,
    dashboard,
    dieu_phoi,
    ca_lam_viec,
    bao_cao,
)

router = APIRouter(prefix="/api/v1")

# Auth (public — no auth required)
router.include_router(auth.router, prefix="/auth", tags=["Xác thực"])

# Admin (ADMIN role only)
router.include_router(admin.router, prefix="/admin/tai-khoan", tags=["Admin - Tài khoản"])

# Data APIs (currently open — Phase 2 will progressively lock these)
router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
router.include_router(cong_truong.router, prefix="/cong-truong", tags=["Công trường"])
router.include_router(mui_thi_cong.router, prefix="/mui-thi-cong", tags=["Mũi thi công"])
router.include_router(thiet_bi.router, prefix="/thiet-bi", tags=["Thiết bị"])
router.include_router(nhan_su.router, prefix="/nhan-su", tags=["Nhân sự"])
router.include_router(dieu_phoi.router, prefix="/dieu-phoi", tags=["Điều phối"])
router.include_router(ca_lam_viec.router, prefix="/ca-lam-viec", tags=["Ca làm việc"])
router.include_router(bao_cao.router, prefix="/bao-cao", tags=["Báo cáo"])
