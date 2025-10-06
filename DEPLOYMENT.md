# 🚀 Deployment Guide

## Overview

This app has 2 components that need separate deployment:
1. **Python Backend** (FastAPI) - handles data queries
2. **Next.js Frontend** (React) - chatbot UI

## 🐍 Deploy Python Backend

### Option 1: Railway (Recommended - Easiest)

1. **Create account**: https://railway.app
2. **Upload Parquet file first**:
   - Railway allows direct file uploads in the dashboard
   - Or use Railway CLI to upload the file

3. **Deploy**:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Upload the parquet file to Railway's volume storage
# In Railway dashboard: Project → Data → Add Volume → Upload property_data.parquet

# Deploy
railway up
```

4. **Set path in main.py**:
```python
# If using Railway volume at /data
PARQUET_PATH = "/data/property_data.parquet"
```

5. **Get your backend URL**: `https://your-app.railway.app`

### Option 2: Render

1. **Create account**: https://render.com
2. **Create Web Service**:
   - Connect your GitHub repo
   - Root Directory: `python-backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Upload Parquet file**:
   - Use Render Disk (persistent storage)
   - Or upload via their file system
   - Update `PARQUET_PATH` in `main.py`

### Option 3: AWS EC2 / DigitalOcean (Most Control)

1. **Create a small VPS** ($5-10/month)
2. **SSH into server and upload file**:
```bash
scp python-backend/property_data.parquet user@your-server:/app/
```

3. **Setup on server**:
```bash
cd /app
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

4. **Use PM2 or systemd** to keep it running

### ⚡ IMPORTANT: Handling the Data File

The **63MB Parquet file** must be uploaded to your backend server. Options:

**A) Direct Upload** (Railway/Render dashboard)
- Most platforms allow file uploads via dashboard
- Upload `property_data.parquet` to persistent storage

**B) Download on First Run** (Auto-setup)
Add this to `main.py`:
```python
import requests
import os

@app.on_event("startup")
async def load_data():
    global df
    PARQUET_URL = os.getenv("PARQUET_FILE_URL")  # Store file on Dropbox/Drive/S3
    
    if not os.path.exists(PARQUET_PATH) and PARQUET_URL:
        print("📥 Downloading parquet file...")
        response = requests.get(PARQUET_URL)
        with open(PARQUET_PATH, 'wb') as f:
            f.write(response.content)
        print("✅ Parquet file downloaded")
    
    df = pd.read_parquet(PARQUET_PATH)
```

Then upload `property_data.parquet` to:
- Dropbox (get public link)
- Google Drive (make publicly accessible)
- AWS S3 bucket (make public read)
- GitHub Releases (max 2GB per file)

**C) Use Cloud Storage** (Best for production)
Instead of local file, use:
- AWS S3 + Pandas: `df = pd.read_parquet('s3://bucket/property_data.parquet')`
- Google Cloud Storage
- Azure Blob Storage

## 🌐 Deploy Next.js Frontend

### Deploy to Vercel (Easiest)

1. **Push code to GitHub** (already done ✅)

2. **Go to Vercel**: https://vercel.com

3. **Import Project**:
   - Click "Import Project"
   - Select your GitHub repo: `ArushCreater/Realestate-AI`
   - Vercel auto-detects Next.js

4. **Set Environment Variables**:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   PYTHON_API_URL=https://your-backend.railway.app
   ```

5. **Deploy**: Click "Deploy" - Done in ~2 minutes! 🎉

6. **Custom Domain** (optional):
   - Vercel provides: `your-app.vercel.app`
   - Or add custom domain in settings

### Alternative: Netlify

Same process as Vercel:
1. Import from GitHub
2. Set environment variables
3. Deploy

## 🔑 Environment Variables Summary

### Python Backend
- No env vars needed (unless using cloud storage)
- Optional: `PARQUET_FILE_URL` (if auto-downloading)

### Next.js Frontend
- `GEMINI_API_KEY` - Get from https://makersuite.google.com/app/apikey
- `PYTHON_API_URL` - Your deployed backend URL (e.g., `https://your-app.railway.app`)

## 🧪 Test Deployment

1. **Test backend**:
```bash
curl https://your-backend.railway.app
# Should return: {"message": "NSW Property API", "total_records": ...}
```

2. **Test frontend**:
   - Open your Vercel URL
   - Ask: "What's the average house price in Sydney?"
   - Should get real data response

## 💰 Cost Estimate

- **Railway**: $5/month (includes 500GB bandwidth)
- **Vercel**: Free tier (perfect for this)
- **Total**: ~$5/month for full deployment

## 🔧 Production Optimizations

### 1. Add Caching
In `python-backend/main.py`:
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_locality_data(locality: str):
    return df[df['property_locality'] == locality]
```

### 2. Add CORS for Production
Update `main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",
        "http://localhost:3000"  # for local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Add Rate Limiting
```bash
pip install slowapi
```

### 4. Monitor with Uptime
- Use UptimeRobot (free) to monitor both URLs
- Get alerts if backend goes down

## 🚨 Troubleshooting

**Backend shows "Module not found"**
- Ensure `requirements.txt` is in `python-backend/` folder
- Check build logs for pip install errors

**Frontend can't connect to backend**
- Check `PYTHON_API_URL` environment variable
- Ensure backend CORS allows your Vercel domain
- Test backend URL directly in browser

**Out of memory errors**
- 63MB Parquet file needs ~500MB RAM to load
- Use Railway's 512MB+ plan or Render's free tier (512MB)

## 📊 Alternative: Use PostgreSQL

For easier deployment, you could:
1. Import CSV into PostgreSQL database (Supabase free tier)
2. Query database instead of Parquet
3. Smaller Python backend (no 63MB file needed)

Would you like me to create a PostgreSQL version?

## 🎯 Quick Deploy Checklist

- [ ] Upload `property_data.parquet` to cloud storage or Railway
- [ ] Deploy Python backend to Railway
- [ ] Get backend URL
- [ ] Deploy Next.js to Vercel
- [ ] Add environment variables to Vercel
- [ ] Test the live app
- [ ] 🎉 Share your deployed link!

---

**Need help?** The deployment process takes about 15-20 minutes total.

