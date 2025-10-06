'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatPage() {
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

  return (
    <div className="flex flex-col bg-[#0a0a0a]" style={{ height: 'calc(100vh - 73px)' }}>
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
              style={{ animationDelay: `${message.id * 0.05}s` }}
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

      {/* Suggestions - Only shown if no conversation started */}
      {messages.length === 1 && !isLoading && (
        <div className="px-8 pb-4">
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

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 bg-[#0f0f0f] border-t border-white/10">
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
  );
}

