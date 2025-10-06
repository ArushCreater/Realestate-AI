import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NSW Real Estate AI - Property Price Predictions & Insights',
  description: 'AI-powered NSW property market analysis, price predictions, and investment recommendations powered by comprehensive historical sales data.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

