import React from 'react'

type Threat = {
  source: string
  time: string
  description: string
  severity: 'high' | 'medium' | 'low' | 'info'
}

function getThreatBorderColor(sev: Threat['severity']) {
  const colors: Record<Threat['severity'], string> = {
    high: 'border-red-400',
    medium: 'border-yellow-400',
    low: 'border-green-400',
    info: 'border-blue-400',
  }
  return colors[sev] || 'border-gray-400'
}

export default function ThreatFeed({ items }: { items: Threat[] }) {
  return (
    <div className="space-y-4" id="threat-feed-container">
      {items.map((t, i) => (
        <div key={i} className={`border-l-4 ${getThreatBorderColor(t.severity)} pl-4 py-2`}>
          <p className="text-sm text-gray-500">{t.source} • {t.time}</p>
          <p className="text-gray-700">{t.description}</p>
        </div>
      ))}
    </div>
  )
}
