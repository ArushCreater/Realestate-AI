# ⚡ Quick Start Guide

## Step 1: Install Python Dependencies

```bash
cd python-backend
pip install -r requirements.txt
```

## Step 2: Convert CSV to Parquet (one-time, ~5 minutes)

```bash
python convert_to_parquet.py
```

This creates a `property_data.parquet` file (~50MB) that's 10x faster than CSV.

## Step 3: Start Python API

```bash
uvicorn main:app --reload
```

Keep this terminal open. API runs on http://localhost:8000

## Step 4: Configure Frontend (new terminal)

Edit `.env.local`:
```bash
GEMINI_API_KEY=your_key_here
PYTHON_API_URL=http://localhost:8000
```

Get API key: https://makersuite.google.com/app/apikey

## Step 5: Start Next.js

```bash
npm run dev
```

Open http://localhost:3000

## Try These Queries

- "What's the average house price in Castle Hill?"
- "Show me market trends in Newcastle from 2020 to 2024"
- "What are the top 10 most expensive suburbs in NSW?"
- "Find properties under $600,000 in Sydney"

## How It Works

```
You ask: "Average price in Castle Hill?"
    ↓
Gemini decides to call: get_average_price(locality="Castle Hill")
    ↓
Python API queries Parquet with Pandas
    ↓
Returns: {avg_price: 1250000, total_sales: 342, ...}
    ↓
Gemini explains: "The average price in Castle Hill is $1.25M based on 342 sales..."
```

## Troubleshooting

**"Python backend is not running"**
→ Make sure you started: `uvicorn main:app --reload` in python-backend folder

**"Parquet file not found"**
→ Run: `python convert_to_parquet.py` first

**Slow queries**
→ First query loads data into memory, subsequent queries are instant

**"No data found for X"**
→ Check spelling, use `/suburbs` endpoint to see available localities

