import React, { useState, useRef, useEffect } from 'react'
import { authFetch } from '../lib/auth'
import { getUserInfo } from '../lib/auth'
import { hasPermission } from '../lib/rbac'

// Enhanced markdown renderer for rich text formatting
const renderMarkdown = (text: string): string => {
  let html = text
    // Escape HTML first to prevent XSS
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    
    // Headers: # ## ### text
    .replace(/^###\s+(.+)$/gm, '<h3 class="font-semibold text-sm mt-3 mb-2 text-gray-800 dark:text-gray-200">$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2 class="font-bold text-base mt-3 mb-2 text-gray-800 dark:text-gray-200">$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1 class="font-bold text-lg mt-3 mb-2 text-gray-800 dark:text-gray-200">$1</h1>')
    
    // Bold: **text** (avoid conflicts with bullet points)
    .replace(/\*\*([^\*\n]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
    
    // Italic: *text* (be careful with bullet points)
    .replace(/(?<!\*)\*([^\*\n]+)\*(?!\*)/g, '<em class="italic">$1</em>')
    
    // Code: `code`
    .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    
    // Bullet points: * item or - item (improved to handle nested content)
    .replace(/^\s*[\*\-]\s+(.+)$/gm, '<div class="flex items-start my-1"><span class="text-blue-500 mr-2 mt-0.5">•</span><span class="flex-1">$1</span></div>')
    
    // Line breaks for paragraphs
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br>')
  
  // Wrap in paragraph tags if not already wrapped in other elements
  if (!html.includes('<h') && !html.includes('<div')) {
    html = `<p class="mb-2">${html}</p>`
  }
  
  return html
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIChatbotProps {
  isOpen: boolean
  onClose: () => void
}

const AIChatbot: React.FC<AIChatbotProps> = ({ isOpen, onClose }) => {
  // Array for system prompts
  const [systemPrompts, setSystemPrompts] = useState<string[]>([
    "You are an expert CVE security assistant.",
    "Must not answer questions unrelated to CVE analysis or security topics.",
    "You have been provided with the current page context including URL, content, and any form data.",
    "Use this context to provide specific, relevant assistance related to what the user is currently viewing or working on.",
    "If the page contains CVE information, vulnerability details, or security-related content, reference it directly in your responses."
  ])

  // Get current page info including full HTML or relevant details
  const getCurrentPageInfo = () => {
    const url = window.location.href
    const title = document.title
    const pathname = window.location.pathname
    
    // Get page content - prioritize main content areas
    const getPageContent = () => {
      // Try to get main content areas first
      const mainSelectors = [
        'main',
        '[role="main"]',
        '.main-content',
        '#main',
        '#content',
        '.content'
      ]
      
      for (const selector of mainSelectors) {
        const mainElement = document.querySelector(selector) as HTMLElement
        if (mainElement) {
          return mainElement.innerText.trim().substring(0, 3000) // Limit to 3000 chars
        }
      }
      
      // Fallback to body content, excluding script tags, style tags, and navigation
      const bodyClone = document.body.cloneNode(true) as HTMLElement
      
      // Remove unwanted elements
      const unwantedSelectors = [
        'script', 'style', 'nav', 'header', 'footer', 
        '.navigation', '.nav', '.header', '.footer',
        '.chatbot', '.chat', '[class*="chat"]'  // Exclude chatbot itself
      ]
      
      unwantedSelectors.forEach(selector => {
        const elements = bodyClone.querySelectorAll(selector)
        elements.forEach(el => el.remove())
      })
      
      return bodyClone.innerText.trim().substring(0, 3000) // Limit to 3000 chars
    }
    
    const pageContent = getPageContent()
    
    // Get meta information
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
    const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || ''
    
    // Get visible form data if any
    const getVisibleFormData = () => {
      const forms = document.querySelectorAll('form:not([style*="display: none"]):not(.hidden)')
      const formData: string[] = []
      
      forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select')
        const formInfo: string[] = []
        
        inputs.forEach(input => {
          const element = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          if (element.type !== 'password' && element.type !== 'hidden') {
            const label = form.querySelector(`label[for="${element.id}"]`)?.textContent || 
                         element.getAttribute('placeholder') || 
                         element.getAttribute('name') || 
                         element.getAttribute('aria-label') || ''
            
            if (label) {
              formInfo.push(`${label}: ${element.value || '[empty]'}`)
            }
          }
        })
        
        if (formInfo.length > 0) {
          formData.push(`Form: ${formInfo.join(', ')}`)
        }
      })
      
      return formData.join('\n')
    }
    
    const formData = getVisibleFormData()
    
    return `
CURRENT PAGE CONTEXT:
===================
URL: ${url}
Title: ${title}
Path: ${pathname}
Meta Description: ${metaDescription}
Meta Keywords: ${metaKeywords}

PAGE CONTENT:
${pageContent}

${formData ? `FORM DATA:\n${formData}` : ''}

Please use this page context to provide more relevant and specific assistance.
===================
    `.trim()
  }
  const [geminiStatus, setGeminiStatus] = useState<'active' | 'inactive'>('inactive')
  const currentUser = getUserInfo()

  useEffect(() => {
    async function checkGeminiStatus() {
      try {
        if (!currentUser?.sub) {
          setGeminiStatus('inactive')
          return
        }
        const res = await authFetch(`/admin/users/${currentUser.sub}`)
        if (res.ok) {
          const data = await res.json()
          setGeminiStatus(data.gemini_apikey ? 'active' : 'inactive')
        } else {
          setGeminiStatus('inactive')
        }
      } catch {
        setGeminiStatus('inactive')
      }
    }
    if (isOpen) checkGeminiStatus()
  }, [isOpen, currentUser])
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant for CVE analysis. I have access to the current page content and can provide context-aware assistance. I can help you understand vulnerabilities, assess risks, provide security recommendations, and analyze the content you\'re currently viewing. How can I assist you today?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSendMessage = async () => {
  // Log system prompts and chat history parts
  console.log('System Prompts:', systemPrompts)
//   console.log('Chat History Parts:', historyParts)
    // Re-check Gemini API key status before sending message
    try {
      if (!currentUser?.sub) {
        setGeminiStatus('inactive')
      } else {
        const res = await authFetch(`/admin/users/${currentUser.sub}`)
        if (res.ok) {
          const data = await res.json()
          setGeminiStatus(data.gemini_apikey ? 'active' : 'inactive')
        } else {
          setGeminiStatus('inactive')
        }
      }
    } catch {
      setGeminiStatus('inactive')
    }
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setError(null)

    try {
      // Check if user has admin permissions
      if (!currentUser?.sub || !hasPermission(currentUser, 'ADMIN_FUNCTIONS')) {
        throw new Error('Admin permissions required for AI assistance')
      }

      // Fetch Gemini API key for current user
      const userRes = await authFetch(`/admin/users/${currentUser.sub}`)
      if (!userRes.ok) {
        throw new Error('Unable to fetch Gemini API key')
      }
      const userData = await userRes.json()
      const geminiApiKey = userData.gemini_apikey
      if (!geminiApiKey) {
        throw new Error('Please configure your Gemini API key in Settings to use AI assistance')
      }


      // Build chat history with system prompts and current page info
      const historyParts = [
        { text: getCurrentPageInfo() },
        ...systemPrompts.map(p => ({ text: p })),
        ...messages.slice(-5).map(m => ({ text: `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}` }))
      ]

      // Call the Gemini API using the correct endpoint and header
      const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: historyParts
            }
          ]
        }),
      })

      if (!geminiRes.ok) {
        throw new Error('Gemini API error: ' + geminiRes.status)
      }
      const geminiData = await geminiRes.json()
      const aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.'

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiText,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (e) {
      console.error('AI chat error:', e)
      const errorMessage = e instanceof Error ? e.message : 'Failed to get AI response'
      setError(errorMessage)
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ ${errorMessage}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorChatMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Chat cleared. I can see the current page content and provide context-aware assistance. How can I help you with CVE analysis or the content you\'re viewing?',
        timestamp: new Date()
      }
    ])
    setError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-20" 
        onClick={onClose}
      />
      
      {/* Chatbot Container */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex flex-col items-start">
            <div className="flex items-center mb-1">
              <div className={`w-3 h-3 rounded-full mr-2 ${geminiStatus === 'active' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <h3 className="font-semibold">AI CVE Assistant</h3>
            </div>
            <span className={`text-xs ${geminiStatus === 'active' ? 'text-green-200' : 'text-red-200'}`}>Gemini API: {geminiStatus === 'active' ? 'Active' : 'Not Configured'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="text-white hover:text-gray-200 transition-colors"
              title="Clear chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <div 
                  className="text-sm" 
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                />
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {error && (
            <div className="mb-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {error}
            </div>
          )}
          
          <div className="flex flex-col space-y-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about CVEs, security analysis... (Supports markdown formatting)"
              disabled={isLoading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 Supports **bold**, *italic*, `code`, and bullet points
              </p>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-md transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIChatbot
