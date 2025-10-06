'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'AI Chat', path: '/chat' },
    { name: 'Market Explorer', path: '/explorer' },
    { name: 'Price Predictor', path: '/predictor' },
    { name: 'Top Suburbs', path: '/top-suburbs' },
    { name: 'Analytics', path: '/analytics' },
  ];

  return (
    <nav className="nav-container">
      <div className="nav-wrapper">
        {/* Logo */}
        <Link href="/" className="nav-logo">
          <svg 
            className="nav-logo-icon" 
            width="32" 
            height="32" 
            viewBox="0 0 32 32" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="4" y="12" width="10" height="16" rx="1" stroke="white" strokeWidth="2" fill="none"/>
            <rect x="18" y="8" width="10" height="20" rx="1" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M9 16v8M9 20h4M23 12v12M23 18h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="9" cy="14" r="0.5" fill="white"/>
            <circle cx="23" cy="10" r="0.5" fill="white"/>
          </svg>
          <span className="nav-logo-text">NSW Property Insights</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-links-desktop">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-link ${pathname === item.path ? 'active' : ''}`}
            >
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span>{mobileMenuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="nav-links-mobile">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-link-mobile ${pathname === item.path ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

