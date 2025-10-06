'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      text: "Hi! I'm your NSW Real Estate AI assistant. I can help you with property price predictions, investment recommendations, and market analysis. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestions = [
    "What's the average house price in Castle Hill?",
    "Show me market trends in Newcastle from 2020 to 2024",
    "What are the top 10 most expensive suburbs in NSW?",
    "Find properties under $600,000 in the Central Coast",
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length,
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input, queryType: 'analysis' }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await res.json();
      
      const botMessage: Message = {
        id: messages.length + 1,
        text: data.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: messages.length + 1,
        text: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
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
    // Enhanced markdown formatting
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={i} className="font-semibold text-base mt-4 mb-2">{line.slice(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="font-semibold text-lg mt-4 mb-2">{line.slice(3)}</h2>;
      }
      
      // Bullet points
      if (line.match(/^\s*[\*\-•]\s+/)) {
        const content = line.replace(/^\s*[\*\-•]\s+/, '');
        // Handle bold within bullets
        const formattedContent = content.split(/\*\*(.*?)\*\*/g).map((part, j) => 
          j % 2 === 0 ? part : <strong key={j} className="font-semibold">{part}</strong>
        );
        return <li key={i} className="ml-4 mb-1 list-disc">{formattedContent}</li>;
      }
      
      // Numbered lists
      if (line.match(/^\s*\d+\.\s+/)) {
        const content = line.replace(/^\s*\d+\.\s+/, '');
        const formattedContent = content.split(/\*\*(.*?)\*\*/g).map((part, j) => 
          j % 2 === 0 ? part : <strong key={j} className="font-semibold">{part}</strong>
        );
        return <li key={i} className="ml-4 mb-1 list-decimal">{formattedContent}</li>;
      }
      
      // Bold text in paragraphs
      if (line.trim() && line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const formatted = parts.map((part, j) => 
          j % 2 === 0 ? part : <strong key={j} className="font-semibold">{part}</strong>
        );
        return <p key={i} className="mb-2 leading-relaxed">{formatted}</p>;
      }
      
      // Regular paragraphs
      if (line.trim()) {
        return <p key={i} className="mb-2 leading-relaxed">{line}</p>;
      }
      
      // Empty lines
      return <div key={i} className="h-2"></div>;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* Enhanced Header */}
      <header className="border-b border-gray-900/50 sticky top-0 z-10 bg-[#0a0a0a]/98 backdrop-blur-md shadow-lg">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white to-gray-200 flex items-center justify-center text-black text-sm font-bold shadow-lg">
              AI
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">NSW Property Assistant</h1>
              <p className="text-xs text-gray-400 mt-0.5">Real-time market insights</p>
            </div>
          </div>
          <div className="text-xs flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-slow shadow-sm shadow-green-500"></div>
            <span className="text-green-400 font-medium">Live</span>
          </div>
        </div>
      </header>

      {/* Enhanced Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              {!message.isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white to-gray-200 flex items-center justify-center text-black text-xs mr-3 flex-shrink-0 font-bold shadow-md">
                  AI
                </div>
              )}
              <div className={message.isUser ? 'message-user' : 'message-bot'}>
                <div className="chat-markdown" style={message.isUser ? { color: '#000000' } : {}}>
                  {formatMessage(message.text)}
                </div>
                <div className={`text-xs mt-2.5 ${message.isUser ? 'text-black opacity-50' : 'text-gray-400 opacity-60'}`} suppressHydrationWarning>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {message.isUser && (
                <div className="w-8 h-8 rounded-xl bg-gray-700 flex items-center justify-center text-white text-xs ml-3 flex-shrink-0 font-semibold shadow-md">
                  You
                </div>
              )}
            </div>
          ))}

          {/* Enhanced Loading */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white to-gray-200 flex items-center justify-center text-black text-xs mr-3 flex-shrink-0 font-bold shadow-md">
                AI
              </div>
              <div className="message-bot">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Suggestions */}
          {messages.length === 1 && !isLoading && (
            <div className="space-y-3 animate-fade-in mt-6">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Try asking</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="text-left px-5 py-3.5 bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-gray-600 hover:bg-[#252525] transition-all duration-200 text-sm text-gray-300 hover:text-white shadow-sm hover:shadow-md"
                  >
                    <span className="text-gray-500 mr-2">→</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Input Area */}
      <div className="border-t border-gray-900/50 px-4 py-5 bg-[#0a0a0a] shadow-2xl">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about NSW properties..."
                rows={1}
                disabled={isLoading}
                className="w-full px-5 py-3.5 bg-[#1a1a1a] border border-gray-800 rounded-xl resize-none focus:bg-[#1f1f1f] focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all duration-200 text-white placeholder-gray-500 disabled:opacity-50 text-[15px] shadow-lg"
                style={{ maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3.5 bg-gradient-to-br from-white to-gray-200 text-black rounded-xl font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:from-gray-100 hover:to-gray-300 transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95"
            >
              {isLoading ? (
                <span className="opacity-50">...</span>
              ) : (
                '→'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-3 ml-1">
            Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 border border-gray-700">Enter</kbd> to send
          </p>
        </div>
      </div>
    </div>
  );
}

