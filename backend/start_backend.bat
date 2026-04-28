@echo off
echo ============================================
echo   QLTB - Quan Ly Thiet Bi Cong Truong
echo   Backend Development Server
echo ============================================
echo.

cd /d %~dp0

REM Install dependencies if needed
if not exist "venv" (
    echo [SETUP] Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo [SETUP] Installing dependencies...
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

echo.
echo [START] Running backend on http://localhost:8000
echo [DOCS]  Swagger UI: http://localhost:8000/docs
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
