'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Stats {
  totalRecords: number;
  avgPrice: number;
  topSuburb: string;
  topSuburbPrice: number;
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatActive, setChatActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatActive && messages.length > 0) {
      // Scroll to top when chat first becomes active
      scrollToTop();
      // Then scroll to bottom of messages
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages, chatActive]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch basic stats via API route
      const response = await fetch('/api/stats');
      const data = await response.json();
      
      // Fetch top suburb using POST via API route
      const topSuburbResponse = await fetch('/api/top-localities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 1,
          property_type: 'residence',
        }),
      });
      const topSuburbData = await topSuburbResponse.json();
      
      setStats({
        totalRecords: data.total_records,
        avgPrice: Math.round(data.avg_price),
        topSuburb: topSuburbData.top_localities[0]?.locality || 'N/A',
        topSuburbPrice: Math.round(topSuburbData.top_localities[0]?.avg_price || 0),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Set chat as active on first message
    if (!chatActive) {
      setChatActive(true);
    }

    const currentInput = input.trim();
    const userMessage: Message = {
      id: messages.length,
      text: currentInput,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: currentInput }),
      });

      const data = await response.json();

      const aiMessage: Message = {
        id: messages.length + 1,
        text: data.response || 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 1,
        text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('### ')) {
        elements.push(<h3 key={key++}>{line.substring(4)}</h3>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={key++}>{line.substring(3)}</h2>);
      } else if (line.match(/^\d+\.\s/)) {
        const items: string[] = [line];
        while (i + 1 < lines.length && lines[i + 1].match(/^\d+\.\s/)) {
          i++;
          items.push(lines[i]);
        }
        elements.push(
          <ol key={key++}>
            {items.map((item, idx) => {
              const content = item.replace(/^\d+\.\s/, '');
              return (
                <li key={idx} dangerouslySetInnerHTML={{ 
                  __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                }} />
              );
            })}
          </ol>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        const items: string[] = [line];
        while (i + 1 < lines.length && (lines[i + 1].startsWith('- ') || lines[i + 1].startsWith('* '))) {
          i++;
          items.push(lines[i]);
        }
        elements.push(
          <ul key={key++}>
            {items.map((item, idx) => {
              const content = item.substring(2);
              return (
                <li key={idx} dangerouslySetInnerHTML={{ 
                  __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                }} />
              );
            })}
          </ul>
        );
      } else if (line.trim() !== '') {
        elements.push(
          <p key={key++} dangerouslySetInnerHTML={{ 
            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
          }} />
        );
      } else {
        elements.push(<br key={key++} />);
      }
    }

    return <div className="chat-markdown">{elements}</div>;
  };

  const suggestions = [
    "What's the average house price in Castle Hill?",
    "Show me market trends in Newcastle from 2020 to 2024",
    "What are the top 10 most expensive suburbs in NSW?",
    "Find properties under $600,000 in the Central Coast",
  ];

  const features = [
    {
      title: 'Market Explorer',
      description: 'Search and compare suburbs across NSW',
      link: '/explorer',
    },
    {
      title: 'Price Predictor',
      description: 'Get AI-powered price predictions for any suburb',
      link: '/predictor',
    },
    {
      title: 'Top Suburbs',
      description: 'Discover the best performing suburbs in NSW',
      link: '/top-suburbs',
    },
    {
      title: 'Market Analytics',
      description: 'Interactive charts and trend analysis',
      link: '/analytics',
    },
  ];

  return (
    <div className="flex flex-col bg-[#0a0a0a]" style={{ height: 'calc(100vh - 73px)' }}>
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className={chatActive ? 'w-full' : 'w-full'}>
          {/* Dashboard Content - Fades when chat is active */}
          <div className={`transition-opacity duration-500 ${chatActive ? 'opacity-0 hidden' : 'opacity-100'}`}>
            <div className="w-full max-w-6xl mx-auto px-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-32 mb-3"></div>
                <div className="h-10 bg-zinc-800 rounded w-40 mb-2"></div>
                <div className="h-4 bg-zinc-800 rounded w-24"></div>
              </div>
            ))}
          </>
        ) : (
          <>
             <div className="card animate-slide-up">
              <div className="card-label">Total Sales Records</div>
              <div className="card-value">
                {stats ? new Intl.NumberFormat('en-AU').format(stats.totalRecords) : 'N/A'}
              </div>
            </div>

            <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="card-label">Average Property Price</div>
              <div className="card-value">
                {stats ? formatNumber(stats.avgPrice) : 'N/A'}
              </div>
            </div>

            <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="card-label">Most Expensive Suburb</div>
              <div className="card-value">{stats?.topSuburb || 'N/A'}</div>
            </div>

            <div className="card animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="card-label">Top Suburb Avg Price</div>
              <div className="card-value text-2xl">
                {stats ? formatNumber(stats.topSuburbPrice) : 'N/A'}
              </div>
            </div>
          </>
            )}
            </div>

               {/* Features Grid */}
               <div>
                 <h2 className="text-3xl font-bold mb-6 text-center">Explore Features</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {features.map((feature, idx) => (
               <Link
                 key={idx}
                 href={feature.link}
                 className="card group animate-slide-up"
                 style={{ animationDelay: `${idx * 0.1}s` }}
               >
                 <h3 className="text-xl font-semibold mb-2 text-white">
                   {feature.title}
                 </h3>
                 <p className="text-zinc-400">
                   {feature.description}
                 </p>
                 <div className="mt-4 text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors flex items-center gap-2">
                   Explore <span className="group-hover:translate-x-1 transition-transform">→</span>
                 </div>
               </Link>
                 ))}
                 </div>
               </div>
             </div>
           </div>

          {/* Chat Messages - Shows when chat is active */}
          {chatActive && (
            <div className="w-full">
              <div className="max-w-4xl mx-auto px-8 pt-6 pb-4 animate-fade-in">
              {/* Back to Dashboard Button */}
              <button
                onClick={() => {
                  setChatActive(false);
                  setMessages([]);
                }}
                className="flex items-center gap-2 px-4 py-2 mb-6 text-sm text-zinc-400 hover:text-white bg-[#1a1a1a] hover:bg-[#222] border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to Dashboard
              </button>

              <div className="space-y-6">
                {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
                >
                  <div className="flex flex-col max-w-[85%]">
                    <div className={message.isUser ? 'message-user' : 'message-bot'}>
                      {message.isUser ? (
                        <p style={{ color: '#000000' }}>{message.text}</p>
                      ) : (
                        formatMessage(message.text)
                      )}
                    </div>
                    <span 
                      className={`text-xs text-zinc-600 mt-2 px-2 ${message.isUser ? 'text-right' : 'text-left'}`}
                      suppressHydrationWarning
                    >
                      {message.timestamp.toLocaleTimeString('en-AU', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </span>
                  </div>
                </div>
              ))}

                {isLoading && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="message-bot">
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Always visible */}
      <div className="flex-shrink-0">
        {/* Suggestions - Only shown if no chat started */}
        {!chatActive && (
          <div className="px-8 pb-4 bg-[#0a0a0a]">
            <div className="max-w-4xl mx-auto">
              <p className="text-xs text-zinc-500 mb-3 font-medium">Suggested questions:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(suggestion);
                      setTimeout(() => handleSend(), 100);
                    }}
                    className="text-left px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-zinc-300 hover:bg-[#222] hover:border-white/20 transition-all duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area - Always at bottom */}
        <div className="bg-[#0f0f0f] border-t border-white/10">
          <div className="max-w-4xl mx-auto px-8 py-4">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about property prices, trends, or recommendations..."
                className="flex-1 bg-[#1a1a1a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-white/30 resize-none transition-all duration-200"
                style={{ outline: 'none', minHeight: '44px', maxHeight: '120px' }}
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
