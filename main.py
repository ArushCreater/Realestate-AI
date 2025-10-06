"""
FastAPI backend for NSW Property Data
Provides structured query endpoints for Gemini to use via function calling
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import os

app = FastAPI(title="NSW Property Data API", version="1.0.0")

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Set to False when using wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Parquet data
# For deployment: Set PARQUET_PATH env var to point to your uploaded file
# Or set PARQUET_FILE_URL to auto-download from cloud storage
PARQUET_PATH = os.getenv("PARQUET_PATH", "property_data.parquet")
PARQUET_FILE_URL = os.getenv("PARQUET_FILE_URL")  # Optional: URL to download from
df = None

@app.on_event("startup")
async def load_data():
    global df
    
    # Auto-download from URL if file doesn't exist (useful for deployment)
    if not os.path.exists(PARQUET_PATH) and PARQUET_FILE_URL:
        print(f"📥 Downloading parquet file from {PARQUET_FILE_URL[:50]}...")
        try:
            import requests
            response = requests.get(PARQUET_FILE_URL, timeout=300)
            response.raise_for_status()
            with open(PARQUET_PATH, 'wb') as f:
                f.write(response.content)
            print(f"✅ Downloaded parquet file ({len(response.content) / 1024 / 1024:.1f} MB)")
        except Exception as e:
            raise Exception(f"❌ Failed to download parquet file: {e}")
    
    if not os.path.exists(PARQUET_PATH):
        raise Exception(
            f"❌ Parquet file not found at {PARQUET_PATH}\n"
            "Options:\n"
            "1. Run: python convert_to_parquet.py (local dev)\n"
            "2. Upload property_data.parquet to deployment server\n"
            "3. Set PARQUET_FILE_URL env var to auto-download"
        )
    
    print(f"📊 Loading property data from {PARQUET_PATH}...")
    df = pd.read_parquet(PARQUET_PATH)
    print(f"✅ Loaded {len(df):,} property records")

# Pydantic models
class AveragePriceQuery(BaseModel):
    locality: str
    year: Optional[int] = None
    property_type: Optional[str] = None

class PriceRangeQuery(BaseModel):
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    locality: Optional[str] = None
    year: Optional[int] = None

class MarketTrendsQuery(BaseModel):
    locality: str
    start_year: int
    end_year: int

class TopLocalitiesQuery(BaseModel):
    year: Optional[int] = None
    limit: int = 10
    sort_by: str = "avg_price"  # avg_price, total_sales, median_price
    property_type: Optional[str] = None  # Filter by property type (e.g., "residence")

# API Endpoints
@app.get("/")
async def root():
    # Calculate overall average price
    avg_price = float(df['Purchase price'].mean()) if df is not None and not df.empty else 0
    
    return {
        "message": "NSW Property Data API",
        "total_records": int(len(df)) if df is not None else 0,
        "avg_price": avg_price,
        "endpoints": {
            "average_price": "/average-price",
            "price_range": "/price-range",
            "market_trends": "/market-trends",
            "top_localities": "/top-localities",
            "locality_stats": "/locality-stats/{locality}",
            "suburbs_list": "/suburbs",
        }
    }

@app.post("/average-price")
async def get_average_price(query: AveragePriceQuery):
    """Get average property price for a locality, optionally filtered by year and type"""
    filtered = df[df['Property locality'].str.lower() == query.locality.lower()]
    
    if filtered.empty:
        return {
            "locality": query.locality,
            "error": f"No data found for {query.locality}",
            "suggestion": "Try checking the spelling or use /suburbs to see available localities"
        }
    
    if query.year:
        filtered = filtered[filtered['Contract year'] == query.year]
    
    if query.property_type:
        filtered = filtered[filtered['Primary purpose'].str.lower() == query.property_type.lower()]
    
    if filtered.empty:
        return {
            "locality": query.locality,
            "year": query.year,
            "property_type": query.property_type,
            "error": "No matching records found with these filters"
        }
    
    avg_price = filtered['Purchase price'].mean()
    median_price = filtered['Purchase price'].median()
    min_price = filtered['Purchase price'].min()
    max_price = filtered['Purchase price'].max()
    total_sales = len(filtered)
    
    return {
        "locality": query.locality,
        "year": query.year,
        "property_type": query.property_type,
        "average_price": float(round(avg_price, 2)),
        "median_price": float(round(median_price, 2)),
        "min_price": float(round(min_price, 2)),
        "max_price": float(round(max_price, 2)),
        "total_sales": int(total_sales),
        "price_per_sqm": float(round(avg_price / filtered['Area'].mean(), 2)) if filtered['Area'].mean() > 0 else None
    }

@app.post("/price-range")
async def get_properties_in_range(query: PriceRangeQuery):
    """Find properties within a price range"""
    filtered = df.copy()
    
    if query.min_price:
        filtered = filtered[filtered['Purchase price'] >= query.min_price]
    if query.max_price:
        filtered = filtered[filtered['Purchase price'] <= query.max_price]
    if query.locality:
        filtered = filtered[filtered['Property locality'].str.lower() == query.locality.lower()]
    if query.year:
        filtered = filtered[filtered['Contract year'] == query.year]
    
    if filtered.empty:
        return {"error": "No properties found in this price range", "count": 0}
    
    locality_breakdown = filtered.groupby('Property locality').agg({
        'Purchase price': ['mean', 'count']
    }).round(2)
    
    top_localities = locality_breakdown.nlargest(10, ('Purchase price', 'count'))
    
    return {
        "total_properties": int(len(filtered)),
        "average_price": float(round(filtered['Purchase price'].mean(), 2)),
        "price_range": {
            "min": query.min_price,
            "max": query.max_price
        },
        "top_localities": [
            {
                "locality": str(idx),
                "avg_price": float(row[('Purchase price', 'mean')]),
                "count": int(row[('Purchase price', 'count')])
            }
            for idx, row in top_localities.iterrows()
        ]
    }

@app.post("/market-trends")
async def get_market_trends(query: MarketTrendsQuery):
    """Get year-over-year trends for a locality"""
    filtered = df[
        (df['Property locality'].str.lower() == query.locality.lower()) &
        (df['Contract year'] >= query.start_year) &
        (df['Contract year'] <= query.end_year)
    ]
    
    if filtered.empty:
        return {"error": f"No data found for {query.locality} between {query.start_year}-{query.end_year}"}
    
    yearly_stats = filtered.groupby('Contract year').agg({
        'Purchase price': ['mean', 'median', 'count']
    }).round(2)
    
    trends = []
    for year, row in yearly_stats.iterrows():
        trends.append({
            "year": int(year),
            "avg_price": float(row[('Purchase price', 'mean')]),
            "median_price": float(row[('Purchase price', 'median')]),
            "total_sales": int(row[('Purchase price', 'count')])
        })
    
    # Calculate growth
    if len(trends) >= 2:
        first_year = trends[0]['avg_price']
        last_year = trends[-1]['avg_price']
        growth_rate = ((last_year - first_year) / first_year) * 100
    else:
        growth_rate = 0
    
    return {
        "locality": query.locality,
        "period": f"{query.start_year}-{query.end_year}",
        "trends": trends,
        "overall_growth_rate": float(round(growth_rate, 2)),
        "total_transactions": int(len(filtered))
    }

@app.post("/top-localities")
async def get_top_localities(query: TopLocalitiesQuery):
    """Get top localities by various metrics"""
    filtered = df.copy()
    
    if query.year:
        filtered = filtered[filtered['Contract year'] == query.year]
    
    if query.property_type:
        filtered = filtered[filtered['Primary purpose'].str.lower() == query.property_type.lower()]
    
    locality_stats = filtered.groupby('Property locality').agg({
        'Purchase price': ['mean', 'median', 'count']
    }).round(2)
    
    if query.sort_by == "avg_price":
        top = locality_stats.nlargest(query.limit, ('Purchase price', 'mean'))
    elif query.sort_by == "median_price":
        top = locality_stats.nlargest(query.limit, ('Purchase price', 'median'))
    else:  # total_sales
        top = locality_stats.nlargest(query.limit, ('Purchase price', 'count'))
    
    results = []
    for idx, row in top.iterrows():
        results.append({
            "locality": str(idx),
            "avg_price": float(row[('Purchase price', 'mean')]),
            "median_price": float(row[('Purchase price', 'median')]),
            "total_sales": int(row[('Purchase price', 'count')])
        })
    
    return {
        "year": query.year,
        "sort_by": query.sort_by,
        "top_localities": results
    }

@app.get("/locality-stats/{locality}")
async def get_locality_stats(locality: str):
    """Get comprehensive statistics for a specific locality"""
    filtered = df[df['Property locality'].str.lower() == locality.lower()]
    
    if filtered.empty:
        raise HTTPException(status_code=404, detail=f"Locality '{locality}' not found")
    
    # Overall stats
    overall_stats = {
        "locality": locality,
        "total_sales": int(len(filtered)),
        "avg_price": float(round(filtered['Purchase price'].mean(), 2)),
        "median_price": float(round(filtered['Purchase price'].median(), 2)),
        "min_price": float(round(filtered['Purchase price'].min(), 2)),
        "max_price": float(round(filtered['Purchase price'].max(), 2)),
        "std_deviation": float(round(filtered['Purchase price'].std(), 2))
    }
    
    # By property type
    by_type = filtered.groupby('Primary purpose').agg({
        'Purchase price': ['mean', 'count']
    }).round(2)
    
    property_types = [
        {
            "type": str(idx),
            "avg_price": float(row[('Purchase price', 'mean')]),
            "count": int(row[('Purchase price', 'count')])
        }
        for idx, row in by_type.iterrows()
    ]
    
    # Yearly trends (last 5 years with data)
    yearly = filtered.groupby('Contract year').agg({
        'Purchase price': 'mean'
    }).tail(5).round(2)
    
    yearly_trends = [
        {"year": int(year), "avg_price": float(price)}
        for year, price in yearly['Purchase price'].items()
    ]
    
    return {
        **overall_stats,
        "by_property_type": property_types,
        "recent_trends": yearly_trends
    }

@app.get("/suburbs")
async def get_suburbs(limit: int = 100, search: Optional[str] = None):
    """Get list of available suburbs/localities"""
    localities = df['Property locality'].dropna().unique()
    
    if search:
        localities = [loc for loc in localities if search.lower() in loc.lower()]
    
    localities = sorted(localities)[:limit]
    
    return {
        "total": len(localities),
        "localities": localities
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

