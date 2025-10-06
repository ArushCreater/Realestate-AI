'use client';

import { useState, useEffect } from 'react';

interface Suburb {
  locality: string;
  avg_price: number;
  total_sales: number;
}

export default function TopSuburbsPage() {
  const [suburbs, setSuburbs] = useState<Suburb[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'residence'>('residence');
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    fetchTopSuburbs();
  }, [filter, limit]);

  const fetchTopSuburbs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/top-localities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: limit,
          property_type: filter === 'residence' ? 'residence' : null,
        }),
      });
      const data = await response.json();
      setSuburbs(data.top_localities || []);
    } catch (error) {
      console.error('Error fetching top suburbs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
    if (rank === 2) return 'bg-gray-400/20 border-gray-400/40 text-gray-300';
    if (rank === 3) return 'bg-orange-600/20 border-orange-600/40 text-orange-400';
    return 'bg-zinc-800/50 border-zinc-700 text-zinc-400';
  };

  const getRankIcon = (rank: number) => {
    return rank;
  };

  return (
    <div className="page-container">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Top Suburbs
          </h1>
          <p className="text-lg text-zinc-400">
            Discover the highest-valued suburbs in NSW
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center animate-slide-up">
          <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setFilter('residence')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filter === 'residence'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Residential Only
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Properties
            </button>
          </div>

          <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-xl border border-white/10">
            {[10, 20, 50].map((num) => (
              <button
                key={num}
                onClick={() => setLimit(num)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  limit === num
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Top {num}
              </button>
            ))}
          </div>
        </div>

        {/* Rankings Table */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {suburbs.map((suburb, index) => {
              const rank = index + 1;
              return (
                <div
                  key={suburb.locality}
                  className={`card flex items-center gap-6 hover:scale-[1.01] transition-all ${
                    rank <= 3 ? 'border-2' : ''
                  } ${rank === 1 ? 'border-yellow-500/30' : rank === 2 ? 'border-gray-400/30' : rank === 3 ? 'border-orange-600/30' : ''}`}
                  style={{ animationDelay: `${index * 0.02}s` }}
                >
                  {/* Rank */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold ${getRankColor(rank)}`}>
                    {getRankIcon(rank)}
                  </div>

                  {/* Suburb Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-white mb-1 truncate">
                      {suburb.locality}
                    </h3>
                    <p className="text-sm text-zinc-500">
                      {suburb.total_sales.toLocaleString()} sales recorded
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {formatPrice(suburb.avg_price)}
                    </p>
                    <p className="text-xs text-zinc-500 uppercase">Avg Price</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-12 card text-center animate-fade-in">
          <h3 className="text-xl font-semibold text-white mb-2">About These Rankings</h3>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Rankings are based on average property prices across all recorded sales. 
            Residential filter excludes commercial and industrial properties for more accurate home buyer insights.
          </p>
        </div>
      </div>
    </div>
  );
}

