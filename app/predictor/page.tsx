'use client';

import { useState } from 'react';

export default function PredictorPage() {
  const [suburb, setSuburb] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<string>('');

  const handlePredict = async () => {
    if (!suburb.trim()) return;

    setLoading(true);
    setPrediction('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `Analyze the property market in ${suburb}. Provide: 1) Current average price 2) Price trends over the last 3-5 years 3) Prediction for future price movement 4) Investment recommendation with reasons. Be specific and data-driven.`
        }),
      });

      const data = await response.json();
      setPrediction(data.response || 'Unable to generate prediction');
    } catch (error) {
      setPrediction('Error generating prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrediction = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('### ') || line.startsWith('## ')) {
        return <h3 key={i} className="text-xl font-semibold mt-6 mb-3 text-white">{line.replace(/^#+\s/, '')}</h3>;
      }
      if (line.match(/^\d+\.\s/) || line.match(/^\d+\)\s/)) {
        return <p key={i} className="mb-2 pl-4 text-zinc-300">{line}</p>;
      }
      if (line.match(/^[\*\-•]\s/)) {
        return <p key={i} className="mb-2 pl-4 text-zinc-300">{line}</p>;
      }
      if (line.includes('**')) {
        const formatted = line.split(/\*\*(.*?)\*\*/g).map((part, j) => 
          j % 2 === 0 ? part : <strong key={j} className="text-white font-semibold">{part}</strong>
        );
        return <p key={i} className="mb-3 text-zinc-300 leading-relaxed">{formatted}</p>;
      }
      if (line.trim()) {
        return <p key={i} className="mb-3 text-zinc-300 leading-relaxed">{line}</p>;
      }
      return <div key={i} className="h-2"></div>;
    });
  };

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Price Predictor
          </h1>
          <p className="text-lg text-zinc-400">
            Get AI-powered price predictions and investment recommendations
          </p>
        </div>

        {/* Input Form */}
        <div className="card mb-8 animate-slide-up">
          <h2 className="text-2xl font-semibold mb-6 text-white">Enter Suburb Details</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Suburb Name *
              </label>
              <input
                type="text"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePredict()}
                placeholder="e.g., Castle Hill, Newcastle, Bondi"
                className="w-full bg-[#0f0f0f] text-white rounded-xl px-5 py-4 border border-white/10 focus:border-white/30 transition-all text-lg"
                disabled={loading}
              />
            </div>

            <button
              onClick={handlePredict}
              disabled={loading || !suburb.trim()}
              className="w-full px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-95 text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">Analyzing Market Data...</span>
                </span>
              ) : (
                'Generate Prediction'
              )}
            </button>
          </div>
        </div>

        {/* Prediction Results */}
        {prediction && (
          <div className="card animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">Market Analysis for {suburb}</h2>
            </div>
            <div className="prose prose-invert max-w-none">
              {formatPrediction(prediction)}
            </div>
          </div>
        )}

        {/* Info Cards */}
        {!prediction && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-2">Current Prices</h3>
              <p className="text-sm text-zinc-400">Get up-to-date average and median prices</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-2">Trend Analysis</h3>
              <p className="text-sm text-zinc-400">Historical price movements and patterns</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-2">AI Predictions</h3>
              <p className="text-sm text-zinc-400">Data-driven future price forecasts</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

