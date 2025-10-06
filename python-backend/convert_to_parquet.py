"""
Convert the massive CSV file to Parquet format for 10x faster queries
Run this once: python convert_to_parquet.py
"""
import pandas as pd
import os

print("🔄 Converting CSV to Parquet format...")
print("This will take a few minutes but only needs to run once.\n")

csv_path = "../nsw-property-sales-data-updated20251006.csv"
parquet_path = "property_data.parquet"

# Check if CSV exists
if not os.path.exists(csv_path):
    print(f"❌ CSV file not found at: {csv_path}")
    print("Make sure the CSV is in the parent directory.")
    exit(1)

# Read CSV in chunks and convert to Parquet
print("📖 Reading CSV file...")
chunk_size = 100000
chunks = []

for i, chunk in enumerate(pd.read_csv(csv_path, chunksize=chunk_size, low_memory=False)):
    chunks.append(chunk)
    print(f"   Processed {(i+1) * chunk_size:,} rows...")

print(f"\n✅ Read {len(chunks)} chunks")

# Combine chunks
print("🔗 Combining chunks...")
df = pd.concat(chunks, ignore_index=True)

print(f"📊 Total rows: {len(df):,}")
print(f"📊 Total columns: {len(df.columns)}")
print(f"💾 CSV size: {os.path.getsize(csv_path) / (1024**2):.2f} MB")

# Clean column names
df.columns = df.columns.str.strip()

# Convert dates
print("\n🗓️  Converting date columns...")
df['Contract date'] = pd.to_datetime(df['Contract date'], errors='coerce')
df['Settlement date'] = pd.to_datetime(df['Settlement date'], errors='coerce')

# Convert numeric columns
print("🔢 Converting numeric columns...")
df['Purchase price'] = pd.to_numeric(df['Purchase price'], errors='coerce')
df['Area'] = pd.to_numeric(df['Area'], errors='coerce')
df['Property post code'] = pd.to_numeric(df['Property post code'], errors='coerce')

# Add year columns for easier querying
df['Contract year'] = df['Contract date'].dt.year
df['Contract month'] = df['Contract date'].dt.month

# Save to Parquet
print(f"\n💾 Saving to Parquet: {parquet_path}")
df.to_parquet(parquet_path, compression='snappy', index=False)

parquet_size = os.path.getsize(parquet_path) / (1024**2)
print(f"\n✅ Done!")
print(f"📦 Parquet size: {parquet_size:.2f} MB")
print(f"🚀 Compression ratio: {os.path.getsize(csv_path) / os.path.getsize(parquet_path):.1f}x smaller")
print(f"\n🎉 You can now run the FastAPI server: uvicorn main:app --reload")

