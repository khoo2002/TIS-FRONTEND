import React, { useEffect, useState } from 'react'
import Header from './components/Header'
import CVEList from './components/CVEList'
import ThreatFeed from './components/ThreatFeed'
import FloatingA11y from './components/FloatingA11y'
import ScrollToTopButton from './components/ScrollToTopButton'
import { sampleCves, sampleThreats } from './data/sample'
import './i18n'
import VulnerabilityPage from './pages/VulnerabilityPage'
import Homepage from './pages/Homepage'

export default function App() {
  const [cves] = useState(sampleCves)
  const [threats] = useState(sampleThreats)
  const [lastUpdated] = useState('16 Jul 2025, 14:30 MYT')

  const [pathname, setPathname] = useState(window.location.pathname || '')

  useEffect(() => {
    document.documentElement.classList.add('bg-gray-100')

    const onPop = () => setPathname(window.location.pathname || '')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const isVulPage = pathname.startsWith('/vul/')

  return (
    <div className="min-h-screen font-roboto">
      <Header />

      <div className="w-full h-1 bg-pink-600"></div>

      {/* Main content area: render VulnerabilityPage inside the same layout so A11Y and header persist */}
      {isVulPage ? (
        <div>
          <VulnerabilityPage />
        </div>
      ) : (
        <Homepage cves={cves} threats={threats} lastUpdated={lastUpdated} />
      )}

      <FloatingA11y />
      <ScrollToTopButton />
    </div>
  )
}
