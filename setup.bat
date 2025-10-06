@echo off
echo 🏘️  NSW Real Estate AI - Setup Script
echo ======================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo ✅ Python and Node.js are installed
echo.

REM Setup Python backend
echo 📦 Setting up Python backend...
cd python-backend

if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt --quiet

echo.
echo 🔄 Converting CSV to Parquet...
echo This will take a few minutes (one-time operation)...
python convert_to_parquet.py

cd ..

REM Setup Next.js frontend
echo.
echo 📦 Setting up Next.js frontend...
call npm install

echo.
echo ✅ Setup complete!
echo.
echo 🚀 To start the application:
echo.
echo Terminal 1 - Python Backend:
echo   cd python-backend
echo   venv\Scripts\activate
echo   uvicorn main:app --reload
echo.
echo Terminal 2 - Next.js Frontend:
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo.
echo ⚠️  Don't forget to add your GEMINI_API_KEY to .env.local!

pause

