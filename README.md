# Python Backend for NSW Property Data

Fast Pandas + Parquet backend for querying 1.8M+ property records.

## Setup

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Convert CSV to Parquet** (one-time, takes ~5 minutes):
   ```bash
   python convert_to_parquet.py
   ```
   This converts the 238MB CSV to ~50MB Parquet file with 10x faster queries.

3. **Start the API server**:
   ```bash
   uvicorn main:app --reload
   ```
   
   API will run on http://localhost:8000

## API Endpoints

- `POST /average-price` - Get average prices for a locality
- `POST /market-trends` - Get year-over-year trends
- `POST /top-localities` - Get top suburbs by various metrics
- `POST /price-range` - Find properties in a price range
- `GET /locality-stats/{locality}` - Comprehensive locality stats
- `GET /suburbs` - List available suburbs

## Test the API

Visit http://localhost:8000/docs for interactive API documentation.

## How It Works

1. User asks question in Next.js chatbot
2. Gemini analyzes the question and calls appropriate functions
3. Functions query the Parquet data via this Python API
4. Structured results return to Gemini
5. Gemini interprets and explains the data conversationally

