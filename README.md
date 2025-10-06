# 🏘️ NSW Real Estate AI Chatbot

AI chatbot with **Gemini function calling** + **Pandas/Parquet backend** for fast, accurate property data queries.

## 🚀 Quick Start

### 0. Get Data Files (Required)

⚠️ **Data files are NOT included in this repo** (too large for GitHub: 238MB CSV)

You need the NSW property sales CSV file:
- Place `nsw-property-sales-data-updated20251006.csv` in the **project root**
- The Python backend will convert it to Parquet format

### 1. Setup Python Backend

```bash
cd python-backend
pip install -r requirements.txt
python convert_to_parquet.py  # One-time: converts CSV to Parquet (~5 min)
uvicorn main:app --reload      # Start API server
```

### 2. Setup Next.js Frontend

```bash
npm install
```

Get API key from: https://makersuite.google.com/app/apikey

Edit `.env.local`:
```bash
GEMINI_API_KEY=your_api_key_here
PYTHON_API_URL=http://localhost:8000
```

```bash
npm run dev  # Start chatbot at http://localhost:3000
```

## ✨ Architecture

**Frontend (Next.js)**: Chatbot UI with smooth animations
↓
**Gemini 2.0 Flash**: AI with function calling capabilities
↓
**Python FastAPI**: REST API for data queries
↓
**Pandas + Parquet**: 1.8M records, 10x faster than CSV

## 🔧 How It Works

1. **User**: "What's the average house price in Castle Hill in 2022?"
2. **Gemini**: Calls `get_average_price(locality="Castle Hill", year=2022)`
3. **Python API**: Queries Parquet with Pandas → returns structured data
4. **Gemini**: Interprets results → conversational response
5. **User**: Gets accurate answer with context and analysis

## 📊 Available Functions

Gemini can call these functions automatically:

- `get_average_price` - Average prices by locality/year/type
- `get_market_trends` - Year-over-year price changes
- `get_top_localities` - Best suburbs by various metrics
- `get_price_range` - Find properties in budget
- `get_locality_stats` - Comprehensive area statistics

## 🎨 Features

- 💬 Natural chat interface
- 🎯 Accurate data (not hallucinated!)
- ⚡ Fast queries (<1 second)
- 📊 1.8M+ real property records
- ✨ Smooth animations
- 🔮 Price predictions & investment advice

## 🌐 Deploy

**Python Backend**: Deploy to Railway, Render, or AWS
**Next.js Frontend**: Deploy to Vercel

Add environment variables:
- `GEMINI_API_KEY`
- `PYTHON_API_URL` (your deployed Python API URL)

Built with Next.js 15, React 18, TypeScript, FastAPI, Pandas

