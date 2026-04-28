@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo   QLTB - QUAN LY THIET BI CONG TRUONG
echo   Khoi dong toan bo he thong (Frontend ^& Backend)
echo ======================================================
echo.

:: Lay duong dan hien tai
set "ROOT_DIR=%~dp0"

:: 1. Khoi dong Backend
echo [1/2] Dang khoi dong Backend trong cua so moi...
start "QLTB - Backend" cmd /c "cd /d !ROOT_DIR!backend && start_backend.bat"

:: Doi 2 giay de backend bat dau truoc
timeout /t 2 /nobreak > nul

:: 2. Khoi dong Frontend
echo [2/2] Dang khoi dong Frontend trong cua so moi...
start "QLTB - Frontend" cmd /c "cd /d !ROOT_DIR!frontend && npm run dev"

echo.
echo ======================================================
echo   HE THONG DANG DUOC KHOI DONG!
echo.
echo   - Backend: http://localhost:8000
echo   - Frontend: http://localhost:3000
echo.
echo   Luu y: Khong dong cac cua so cmd vua moi mo.
echo ======================================================
pause
