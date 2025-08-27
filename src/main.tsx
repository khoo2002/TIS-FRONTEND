import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './ui/App'
import './styles.css'

import { ThemeProvider } from 'next-themes'

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system">
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
