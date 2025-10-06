# 🏠 NSW Property Insights

A comprehensive, AI-powered real estate analytics platform for NSW properties. Built with Next.js, FastAPI, and Google's Gemini AI.

## ✨ Features

### 📊 **Dashboard**
- Real-time market statistics
- Total sales records and average prices
- Quick access to all features

### 💬 **AI Chat Assistant**
- Natural language queries about property data
- Intelligent insights powered by Gemini AI
- Function calling for precise data retrieval

### 🔍 **Market Explorer**
- Search any NSW suburb
- Compare up to 4 suburbs side-by-side
- Detailed price statistics (avg, median, min, max)

### 📈 **Price Predictor**
- AI-powered price predictions
- Historical trend analysis
- Investment recommendations

### 🏆 **Top Suburbs**
- Rankings of most expensive suburbs
- Filter by residential or all properties
- Customizable top 10/20/50 views

### 📉 **Market Analytics**
- Interactive price trend charts
- Sales volume analysis
- Year-over-year comparisons
- Historical statistics

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (for Next.js frontend)
- **Python** 3.11+ (for FastAPI backend)
- **Gemini API Key** (get from [Google AI Studio](https://makersuite.google.com/app/apikey))

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ArushCreater/Realestate-AI.git
cd Realestate-AI
```

### 2️⃣ Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your API keys
# GEMINI_API_KEY=your_key_here
# PYTHON_API_URL=http://localhost:8000
# NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000
```

### 3️⃣ Start the Python Backend

```bash
cd python-backend

# Install dependencies
pip install -r requirements.txt

# Download the property data (see Data Setup section)
# The data will auto-download from GitHub Releases on first run if PARQUET_FILE_URL is set

# Start the server
uvicorn main:app --reload
```

The backend will be running at `http://localhost:8000`

### 4️⃣ Start the Next.js Frontend

```bash
# In a new terminal, from the project root
npm install
npm run dev
```

The frontend will be running at `http://localhost:3000`

---

## 📦 Data Setup

**Important:** The property data files (`property_data.parquet`, `nsw-property-sales-data-updated20251006.csv`) are **NOT** included in this repository due to their size (>200MB).

### Option 1: Auto-Download (Recommended)
The backend will automatically download the parquet file from GitHub Releases on first startup if configured:

1. Ensure `PARQUET_FILE_URL` is set in `python-backend/main.py` (default: GitHub Release URL)
2. Start the backend - it will download automatically

### Option 2: Manual Download
1. Download `property_data.parquet` from [GitHub Releases](https://github.com/ArushCreater/Realestate-AI/releases)
2. Place it in the `python-backend/` directory

### Option 3: Convert from CSV
If you have the original CSV file:

```bash
cd python-backend
python convert_to_parquet.py
```

---

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Next.js   │─────▶│  Gemini AI   │─────▶│  FastAPI        │
│  Frontend   │      │  (Function   │      │  Backend        │
│             │◀─────│   Calling)   │◀─────│                 │
└─────────────┘      └──────────────┘      └─────────────────┘
                                                    │
                                                    ▼
                                            ┌─────────────────┐
                                            │  Parquet Data   │
                                            │  (Pandas)       │
                                            └─────────────────┘
```

1. **User** asks a question via the Next.js UI
2. **Next.js** sends the query to Gemini AI
3. **Gemini** decides which data it needs and calls the appropriate FastAPI function
4. **FastAPI** queries the Parquet dataset using Pandas
5. **FastAPI** returns structured data to Gemini
6. **Gemini** analyzes the data and generates a natural language response
7. **Next.js** displays the formatted response to the user

---

## 🌐 Deployment

### Frontend (Vercel)
```bash
# Push to GitHub
git push origin main

# Deploy on Vercel
# 1. Import your GitHub repo
# 2. Add environment variables:
#    - GEMINI_API_KEY
#    - PYTHON_API_URL (your EC2/backend URL)
#    - NEXT_PUBLIC_PYTHON_API_URL (same as PYTHON_API_URL)
# 3. Deploy
```

### Backend (AWS EC2, Render, or similar)

**AWS EC2:**
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Clone and setup
git clone https://github.com/ArushCreater/Realestate-AI.git
cd Realestate-AI/python-backend
pip install -r requirements.txt

# Create systemd service
sudo nano /etc/systemd/system/nsw-property-api.service

# Start service
sudo systemctl start nsw-property-api
sudo systemctl enable nsw-property-api
```

**Render (Alternative):**
1. Connect your GitHub repo
2. Select the `python-backend-deploy` branch
3. Add `PARQUET_FILE_URL` environment variable
4. Deploy

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📁 Project Structure

```
realestate-ai/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Dashboard home
│   ├── chat/              # AI Chat page
│   ├── explorer/          # Market Explorer
│   ├── predictor/         # Price Predictor
│   ├── top-suburbs/       # Top Suburbs rankings
│   ├── analytics/         # Interactive charts
│   └── api/analyze/       # API route for Gemini
├── components/            # React components
│   └── Navigation.tsx     # Site navigation
├── lib/                   # Utilities
│   └── gemini-tools.ts    # Gemini AI integration
├── python-backend/        # FastAPI backend
│   ├── main.py           # API endpoints
│   ├── requirements.txt  # Python dependencies
│   └── convert_to_parquet.py
├── .env.example          # Environment template
└── README.md             # This file
```

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, Recharts
- **Backend:** FastAPI, Python, Pandas, PyArrow
- **AI:** Google Gemini 2.0 Flash (Function Calling)
- **Data:** Parquet (columnar storage for fast queries)
- **Deployment:** Vercel (Frontend) + AWS EC2 (Backend)

---

## 📊 Available API Endpoints

- `GET /` - Health check and total records
- `GET /average-price/{locality}` - Average price for a suburb
- `GET /market-trends/{locality}` - Yearly trends
- `GET /top-localities` - Top suburbs by price
- `GET /price-range` - Properties within a price range
- `GET /locality-stats/{locality}` - Comprehensive stats

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - feel free to use this project for your own purposes.

---

## 🔗 Links

- **GitHub:** [https://github.com/ArushCreater/Realestate-AI](https://github.com/ArushCreater/Realestate-AI)
- **Live Demo:** [Your Vercel URL]
- **API Docs:** Visit `http://YOUR_BACKEND_URL/docs` for interactive API documentation

---

## 💡 Tips

- Use the **Chat Assistant** for quick questions
- **Market Explorer** is great for comparing suburbs
- **Analytics** shows historical trends with interactive charts
- Filter **Top Suburbs** by "Residential Only" for accurate home buyer rankings

---

Built with ❤️ by Arush
