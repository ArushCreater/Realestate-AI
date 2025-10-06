'use client';

import { useState } from 'react';

interface LocalityData {
  locality: string;
  avg_price: number;
  median_price: number;
  total_sales: number;
  min_price: number;
  max_price: number;
}

export default function ExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<LocalityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSuburbs, setSelectedSuburbs] = useState<LocalityData[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000'}/locality-stats/${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error('Suburb not found');
      }

      const data = await response.json();
      
      const localityData: LocalityData = {
        locality: searchQuery,
        avg_price: data.average_price,
        median_price: data.median_price,
        total_sales: data.total_sales,
        min_price: data.min_price,
        max_price: data.max_price,
      };

      setResults([localityData]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const addToComparison = (suburb: LocalityData) => {
    if (selectedSuburbs.length >= 4) {
      alert('Maximum 4 suburbs for comparison');
      return;
    }
    if (selectedSuburbs.find(s => s.locality === suburb.locality)) {
      alert('Suburb already added');
      return;
    }
    setSelectedSuburbs([...selectedSuburbs, suburb]);
  };

  const removeFromComparison = (locality: string) => {
    setSelectedSuburbs(selectedSuburbs.filter(s => s.locality !== locality));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
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
            Market Explorer
          </h1>
          <p className="text-lg text-zinc-400">
            Search and compare suburbs across NSW
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 animate-slide-up">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter suburb name (e.g., Castle Hill, Newcastle, Bondi)"
              className="flex-1 bg-[#1a1a1a] text-white rounded-xl px-6 py-4 border border-white/10 focus:border-white/30 transition-all"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>
          {error && (
            <p className="text-red-400 mt-3 text-sm">{error}</p>
          )}
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="mb-12 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4">Search Results</h2>
            <div className="grid grid-cols-1 gap-4">
              {results.map((result) => (
                <div key={result.locality} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{result.locality}</h3>
                      <p className="text-zinc-400">Total Sales: {result.total_sales.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => addToComparison(result)}
                      className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm hover:bg-zinc-700 transition-all"
                    >
                      + Compare
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase mb-1">Average Price</p>
                      <p className="text-xl font-bold text-white">{formatPrice(result.avg_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase mb-1">Median Price</p>
                      <p className="text-xl font-bold text-white">{formatPrice(result.median_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase mb-1">Min Price</p>
                      <p className="text-xl font-bold text-white">{formatPrice(result.min_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase mb-1">Max Price</p>
                      <p className="text-xl font-bold text-white">{formatPrice(result.max_price)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Section */}
        {selectedSuburbs.length > 0 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-4">
              Comparison ({selectedSuburbs.length}/4)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedSuburbs.map((suburb) => (
                <div key={suburb.locality} className="card relative">
                  <button
                    onClick={() => removeFromComparison(suburb.locality)}
                    className="absolute top-3 right-3 w-6 h-6 bg-red-500/20 text-red-400 rounded-full text-xs hover:bg-red-500/30 transition-all"
                  >
                    ✕
                  </button>
                  <h3 className="text-lg font-bold text-white mb-4 pr-8">{suburb.locality}</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase mb-1">Avg Price</p>
                      <p className="text-lg font-semibold text-white">{formatPrice(suburb.avg_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase mb-1">Median</p>
                      <p className="text-lg font-semibold text-white">{formatPrice(suburb.median_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase mb-1">Sales</p>
                      <p className="text-lg font-semibold text-white">{suburb.total_sales.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Suburbs */}
        <div className="mt-12 animate-fade-in">
          <h2 className="text-2xl font-bold mb-4">Popular Suburbs</h2>
          <div className="flex flex-wrap gap-2">
            {['Sydney', 'Newcastle', 'Wollongong', 'Castle Hill', 'Parramatta', 'Bondi', 'Manly', 'Penrith'].map((suburb) => (
              <button
                key={suburb}
                onClick={() => {
                  setSearchQuery(suburb);
                  setTimeout(handleSearch, 100);
                }}
                className="px-4 py-2 bg-[#1a1a1a] text-zinc-300 rounded-lg text-sm hover:bg-[#222] hover:text-white border border-white/10 hover:border-white/20 transition-all"
              >
                {suburb}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

