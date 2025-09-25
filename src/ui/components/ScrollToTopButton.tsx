import React, { useState, useEffect } from 'react'
import AIChatbot from './AIChatbot'

const ScrollToTopButton = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)

  // Set the scroll event listener
  useEffect(() => {
    // No longer needed for visibility, but kept for potential future use
    return () => {
      // Cleanup if needed
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
    setIsExpanded(false)
  }

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    })
    setIsExpanded(false)
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleChatbotToggle = () => {
    setShowChatbot(!showChatbot)
    setIsExpanded(false)
  }

  return (
    <>
      {/* AI Chatbot Component */}
      <AIChatbot isOpen={showChatbot} onClose={() => setShowChatbot(false)} />
      
      {/* Floating Action Button Group - Always visible */}
      <div className="fixed bottom-6 right-6 z-50">
          {/* Sub-action buttons - appear when expanded */}
          <div className={`absolute transition-all duration-300 ease-in-out ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}>
            
            {/* Scroll to Top Button - Vertically parallel above main button */}
            <button
              onClick={scrollToTop}
              className="absolute -top-20 left-0 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-400"
              aria-label="Scroll to top"
              title="Scroll to top"
              style={{ boxShadow: '0 6px 24px rgba(34,197,94,0.18)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>

            {/* AI Chatbot Button - Diagonal top-left */}
            <button
              onClick={handleChatbotToggle}
              className="absolute -top-16 -left-16 bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400"
              aria-label="AI Assistant"
              title="AI CVE Assistant"
              style={{ boxShadow: '0 6px 24px rgba(139,92,246,0.18)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </button>

            {/* Scroll to Bottom Button - Horizontally parallel left of main button */}
            <button
              onClick={scrollToBottom}
              className="absolute top-0 -left-20 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-400"
              aria-label="Scroll to bottom"
              title="Scroll to bottom"
              style={{ boxShadow: '0 6px 24px rgba(251,146,60,0.18)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>

          {/* Main floating action button */}
          <button
            onClick={toggleExpanded}
            className={`bg-pink-600 hover:bg-pink-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
              isExpanded ? 'rotate-45' : 'rotate-0'
            }`}
            aria-label={isExpanded ? "Close menu" : "Open quick actions"}
            title={isExpanded ? "Close menu" : "Quick actions"}
          >
            {isExpanded ? (
              // Close icon (X)
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            ) : (
              // Three vertical dots icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="6" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="18" r="2" />
              </svg>
            )}
          </button>
        </div>
    </>
  )
}

export default ScrollToTopButton
