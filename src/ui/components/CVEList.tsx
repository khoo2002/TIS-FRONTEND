import React from 'react'

type CVE = {
  id: string
  description: string
  cvss: number
  severity: string
  category: string
  product: string
  time: string
  table_source: string
  is_kev: boolean
  kev_due_date?: string | null
}

function getCVSSColor(score: number) {
  if (score >= 9.0) return 'bg-red-500'
  if (score >= 7.0) return 'bg-orange-500'
  if (score >= 4.0) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getSeverityColor(severity: string) {
  const sev = severity?.toUpperCase()
  if (sev === 'CRITICAL') return 'bg-red-700 text-white'
  if (sev === 'HIGH') return 'bg-red-500 text-white'
  if (sev === 'MEDIUM') return 'bg-yellow-400 text-black'
  if (sev === 'LOW') return 'bg-green-400 text-black'
  return 'bg-gray-400 text-white'
}

function formatToLocalTime(dateStr: string) {
  if (!dateStr || dateStr === '—' || dateStr === 'Unknown') return '—'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch (e) {
    return '—'
  }
}

export default function CVEList({ items }: { items: CVE[] }) {
  const navigateTo = (id: string) => {
    const url = `/vul/${encodeURIComponent(id)}`
    // use history API to avoid full reload
    try {
      window.scrollTo({ top: 0, left: 0 })
    } catch (e) {}
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="space-y-6">
      {items.map((cve) => {
        const url = `/vul/${encodeURIComponent(cve.id)}`
        return (
          <a
            key={cve.id}
            href={url}
            onClick={(e) => {
              // allow ctrl/cmd/shift clicks and middle click to open in new tab
              if (e.metaKey || e.ctrlKey || e.shiftKey || (e as any).button === 1) return
              e.preventDefault()
              navigateTo(cve.id)
            }}
            className="block bg-white p-6 rounded-lg shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-400"
            aria-label={`Open details for ${cve.id}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{cve.id}</h3>
                <p className="text-gray-600 mt-2">{cve.description}</p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {cve.is_kev && (
                  <span 
                    className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse"
                    title={`Known Exploited Vulnerability${cve.kev_due_date ? ` - Due: ${formatToLocalTime(cve.kev_due_date)}` : ''}`}
                  >
                    🚨 KEV
                  </span>
                )}
                <span className={`${getSeverityColor(cve.severity)} text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap`}>
                  {(cve.severity && cve.severity !== 'UNKNOWN') ? cve.severity : 'UNKNOWN'}
                </span>
                <span className={`${getCVSSColor(cve.cvss)} text-white text-xs font-semibold px-2 py-1 rounded whitespace-nowrap`}>
                  CVSS: {cve.cvss > 0 ? cve.cvss.toFixed(1) : 'N/A'}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-2 text-sm">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {(cve.category && cve.category !== 'Unknown Source') ? cve.category : 'Unknown Source'}
              </span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                {(cve.product && cve.product !== 'General') ? cve.product : 'General'}
              </span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {(cve.table_source && cve.table_source !== 'Unknown') ? cve.table_source : 'Unknown'}
              </span>
              <span className="text-gray-500">{formatToLocalTime(cve.time)}</span>
            </div>
          </a>
        )
      })}
    </div>
  )
}
