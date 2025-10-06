#!/bin/bash

echo "🏘️  NSW Real Estate AI - Setup Script"
echo "======================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Python and Node.js are installed"
echo ""

# Setup Python backend
echo "📦 Setting up Python backend..."
cd python-backend || exit

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv 2>/dev/null || python -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

echo "Installing Python dependencies..."
pip install -r requirements.txt --quiet

echo ""
echo "🔄 Converting CSV to Parquet..."
echo "This will take a few minutes (one-time operation)..."
python convert_to_parquet.py

cd ..

# Setup Next.js frontend
echo ""
echo "📦 Setting up Next.js frontend..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo ""
echo "Terminal 1 - Python Backend:"
echo "  cd python-backend"
echo "  source venv/bin/activate  (or venv\\Scripts\\activate on Windows)"
echo "  uvicorn main:app --reload"
echo ""
echo "Terminal 2 - Next.js Frontend:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "⚠️  Don't forget to add your GEMINI_API_KEY to .env.local!"

