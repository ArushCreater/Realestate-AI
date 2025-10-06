'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendData {
  year: number;
  avg_price: number;
  median_price: number;
  total_sales: number;
}

export default function AnalyticsPage() {
  const [suburb, setSuburb] = useState('');
  const [searchedSuburb, setSearchedSuburb] = useState('');
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTrends = async (localityName: string) => {
    setLoading(true);
    setError('');
    setTrendData([]);

    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000'}/market-trends`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            locality: localityName,
            start_year: 2010,
            end_year: currentYear,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Suburb not found or no data available');
      }

      const data = await response.json();
      
      // Check if there's an error
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Backend returns trends as an array, already sorted by year
      const trendsArray = data.trends.map((item: any) => ({
        year: item.year,
        avg_price: item.avg_price,
        median_price: item.median_price,
        total_sales: item.total_sales,
      }));

      setTrendData(trendsArray);
      setSearchedSuburb(localityName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!suburb.trim()) return;
    fetchTrends(suburb);
  };

  const formatPrice = (value: number) => {
    return `$${(value / 1000000).toFixed(1)}M`;
  };

  const formatFullPrice = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Market Analytics
          </h1>
          <p className="text-lg text-zinc-400">
            Interactive charts and historical trend analysis
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 animate-slide-up">
          <div className="flex gap-3">
            <input
              type="text"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter suburb name to analyze trends"
              className="flex-1 bg-[#1a1a1a] text-white rounded-xl px-6 py-4 border border-white/10 focus:border-white/30 transition-all"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !suburb.trim()}
              className="px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {loading ? '...' : 'Analyze'}
            </button>
          </div>
          {error && (
            <p className="text-red-400 mt-3 text-sm">{error}</p>
          )}
        </div>

        {/* Charts */}
        {trendData.length > 0 && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">{searchedSuburb}</h2>
              <p className="text-zinc-400">Historical market data from {trendData[0].year} to {trendData[trendData.length - 1].year}</p>
            </div>

            {/* Price Trends Chart */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-6">Price Trends Over Time</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis 
                    dataKey="year" 
                    stroke="#888"
                    style={{ fontSize: '14px' }}
                  />
                  <YAxis 
                    tickFormatter={formatPrice}
                    stroke="#888"
                    style={{ fontSize: '14px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: number) => formatFullPrice(value)}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avg_price" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    name="Average Price"
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="median_price" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    name="Median Price"
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Sales Volume Chart */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-6">Sales Volume by Year</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis 
                    dataKey="year" 
                    stroke="#888"
                    style={{ fontSize: '14px' }}
                  />
                  <YAxis 
                    stroke="#888"
                    style={{ fontSize: '14px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                  <Bar 
                    dataKey="total_sales" 
                    fill="#8b5cf6" 
                    name="Total Sales"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card">
                <p className="text-xs text-zinc-500 uppercase mb-2">Highest Avg Price</p>
                <p className="text-2xl font-bold text-white">
                  {formatFullPrice(Math.max(...trendData.map(d => d.avg_price)))}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  in {trendData.find(d => d.avg_price === Math.max(...trendData.map(t => t.avg_price)))?.year}
                </p>
              </div>

              <div className="card">
                <p className="text-xs text-zinc-500 uppercase mb-2">Lowest Avg Price</p>
                <p className="text-2xl font-bold text-white">
                  {formatFullPrice(Math.min(...trendData.map(d => d.avg_price)))}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  in {trendData.find(d => d.avg_price === Math.min(...trendData.map(t => t.avg_price)))?.year}
                </p>
              </div>

              <div className="card">
                <p className="text-xs text-zinc-500 uppercase mb-2">Total Sales</p>
                <p className="text-2xl font-bold text-white">
                  {trendData.reduce((sum, d) => sum + d.total_sales, 0).toLocaleString()}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  {trendData[0].year} - {trendData[trendData.length - 1].year}
                </p>
              </div>

              <div className="card">
                <p className="text-xs text-zinc-500 uppercase mb-2">Price Change</p>
                <p className="text-2xl font-bold text-white">
                  {trendData.length >= 2 ? (
                    ((trendData[trendData.length - 1].avg_price - trendData[0].avg_price) / trendData[0].avg_price * 100).toFixed(1)
                  ) : '0'}%
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  Overall growth
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Popular Suburbs for Quick Analysis */}
        {trendData.length === 0 && !loading && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-center">Quick Analysis</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Sydney', 'Newcastle', 'Wollongong', 'Castle Hill', 'Parramatta', 'Bondi', 'Manly', 'Penrith'].map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setSuburb(name);
                    fetchTrends(name);
                  }}
                  className="card hover:scale-105 transition-all text-center"
                >
                  <p className="text-lg font-semibold text-white">{name}</p>
                  <p className="text-xs text-zinc-500 mt-1">View trends</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

