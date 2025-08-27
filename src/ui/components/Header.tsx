import React from 'react'

export default function Header({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-pink-400 shadow-md">
      <header className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button className="text-white mr-4 p-0 bg-transparent border-0" aria-label="Open menu">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
          <button className="text-white mr-1 p-0 bg-transparent border-0" aria-label="Open menu" onClick={() => window.location.href = "http://localhost:5173/"}>
            <img alt="NSC-TIP Logo" className="h-12" src="/logo.png" />
          </button>
          <span className="text-2xl font-bold text-white ml-2">NSC-TIP</span>
        </div>
        <div>{children}</div>
      </header>
    </div>
  )
}
