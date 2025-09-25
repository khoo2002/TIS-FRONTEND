import React, { useEffect, useState } from 'react'
import { api } from '../lib/apiBase'

function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleString() } catch { return String(d) }
}

export default function PublicHomepage() {
  const [q, setQ] = useState('')
  const [severity, setSeverity] = useState('')
  const [hasKev, setHasKev] = useState('')
  const [limit, setLimit] = useState(25)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [cves, setCves] = useState([])
  const [alerts, setAlerts] = useState([])
  const [totalCves, setTotalCves] = useState(0)
  const [totalAlerts, setTotalAlerts] = useState(0)

  useEffect(() => {
    let mounted = true
    async function fetchPublic() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (severity) params.set('severity', severity)
        if (hasKev) params.set('has_kev', hasKev)
        params.set('limit', String(limit))
        params.set('offset', String(offset))

        const [cvesResp, alertsResp] = await Promise.all([
          fetch(api(`/public/cves?${params.toString()}`), { headers: { accept: 'application/json' } }),
          fetch(api(`/public/alerts?${params.toString()}`), { headers: { accept: 'application/json' } }),
        ])
        if (cvesResp.ok) {
          const data = await cvesResp.json()
          if (mounted) {
            const list = Array.isArray(data.cves) ? data.cves : Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : [])
            setCves(list)
            setTotalCves(data.total_count ?? data.total ?? data.count ?? list.length)
          }
        } else { if (mounted) { setCves([]); setTotalCves(0) } }

        if (alertsResp.ok) {
          const data = await alertsResp.json()
          if (mounted) {
            const list = Array.isArray(data.alerts) ? data.alerts : Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : [])
            setAlerts(list)
            setTotalAlerts(data.total_count ?? data.total ?? data.count ?? list.length)
          }
        } else { if (mounted) { setAlerts([]); setTotalAlerts(0) } }
      } catch (e) {
        if (mounted) { setCves([]); setAlerts([]); setTotalCves(0); setTotalAlerts(0) }
      } finally { if (mounted) setLoading(false) }
    }
    fetchPublic()
    return () => { mounted = false }
  }, [q, severity, hasKev, limit, offset])

  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.max(1, Math.ceil(totalCves / limit))
  const hasNext = offset + limit < totalCves
  const hasPrev = offset > 0

  return (
    React.createElement('main', { className: 'container mx-auto px-6 py-8' }, [
      React.createElement('div', { key: 'hdr', className: 'mb-6' }, [
        React.createElement('h1', { key: 'h1', className: 'text-2xl font-bold text-gray-800' }, 'Public Security Feed'),
        React.createElement('p', { key: 'p', className: 'text-gray-600' }, 'Curated CVEs and Alerts that have been published.'),
      ]),

      React.createElement('div', { key: 'grid', className: 'grid grid-cols-1 lg:grid-cols-10 gap-6' }, [
        React.createElement('aside', { key: 'aside', className: 'lg:col-span-3' },
          React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded shadow space-y-3' }, [
            React.createElement('div', { key: 'q' }, [
              React.createElement('label', { className: 'text-sm text-gray-600' }, 'Search'),
              React.createElement('input', { value: q, onChange: (e) => { setQ(e.target.value); setOffset(0) }, className: 'mt-1 block w-full rounded border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2', placeholder: 'Search title or CVE ID' })
            ]),
            React.createElement('div', { key: 'sev' }, [
              React.createElement('label', { className: 'text-sm text-gray-600' }, 'Severity'),
              React.createElement('select', { value: severity, onChange: (e) => { setSeverity(e.target.value); setOffset(0) }, className: 'mt-1 block w-full rounded border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2' }, [
                React.createElement('option', { value: '', key: 'any' }, 'Any'),
                React.createElement('option', { value: 'LOW', key: 'low' }, 'Low'),
                React.createElement('option', { value: 'MEDIUM', key: 'med' }, 'Medium'),
                React.createElement('option', { value: 'HIGH', key: 'hi' }, 'High'),
                React.createElement('option', { value: 'CRITICAL', key: 'crit' }, 'Critical'),
              ])
            ]),
            React.createElement('div', { key: 'kev' }, [
              React.createElement('label', { className: 'text-sm text-gray-600' }, 'CISA KEV'),
              React.createElement('div', { className: 'mt-1 text-sm' }, [
                React.createElement('label', { className: 'inline-flex items-center mr-4', key: 'any' }, [React.createElement('input', { type: 'radio', name: 'kev', value: '', checked: hasKev === '', onChange: () => { setHasKev(''); setOffset(0) }, className: 'mr-2' }), 'Any']),
                React.createElement('label', { className: 'inline-flex items-center mr-4', key: 'only' }, [React.createElement('input', { type: 'radio', name: 'kev', value: 'true', checked: hasKev === 'true', onChange: () => { setHasKev('true'); setOffset(0) }, className: 'mr-2' }), 'Only KEV']),
                React.createElement('label', { className: 'inline-flex items-center', key: 'ex' }, [React.createElement('input', { type: 'radio', name: 'kev', value: 'false', checked: hasKev === 'false', onChange: () => { setHasKev('false'); setOffset(0) }, className: 'mr-2' }), 'Exclude KEV']),
              ])
            ]),
            React.createElement('div', { key: 'pp' }, [
              React.createElement('label', { className: 'text-sm text-gray-600' }, 'Per page'),
              React.createElement('select', { value: limit, onChange: (e) => { setLimit(Number(e.target.value)); setOffset(0) }, className: 'mt-1 block w-full rounded border-gray-200 text-sm p-2' }, [
                React.createElement('option', { value: 10, key: 10 }, '10'),
                React.createElement('option', { value: 25, key: 25 }, '25'),
                React.createElement('option', { value: 50, key: 50 }, '50'),
              ])
            ]),
          ])
        ),

        React.createElement('section', { key: 'list', className: 'lg:col-span-7 space-y-6' }, [
          React.createElement('div', { key: 'cves', className: 'bg-white dark:bg-gray-800 p-4 rounded shadow' }, [
            React.createElement('div', { className: 'flex items-center justify-between mb-3' }, [
              React.createElement('h2', { className: 'text-lg font-semibold' }, 'Curated CVEs'),
              React.createElement('div', { className: 'text-sm text-gray-600' }, `Page ${currentPage} of ${Math.max(1, Math.ceil(totalCves / limit))} (${totalCves} results)`),
            ]),
            loading ? React.createElement('div', { className: 'py-10 text-center text-gray-500' }, 'Loading…') : (
              cves.length ? React.createElement('ul', { className: 'divide-y' }, cves.map((c) => (
                React.createElement('li', { key: c.cve_id, className: 'py-3' },
                  React.createElement('div', { className: 'flex items-start justify-between' },
                    React.createElement('div', null, [
                      React.createElement('div', { className: 'flex items-center gap-2' }, [
                        React.createElement('a', { href: `/viewer/cve/${encodeURIComponent(c.cve_id)}`, className: 'text-pink-600 font-semibold hover:underline' }, c.cve_id),
                        React.createElement('span', { className: 'text-xs px-2 py-0.5 rounded bg-gray-100' }, c.cvss_severity ?? 'UNKNOWN'),
                        React.createElement('span', { className: 'text-xs px-2 py-0.5 rounded bg-gray-800 text-white' }, `CVSS ${c.cvss_score ?? 'N/A'}`),
                        c.is_kev ? React.createElement('span', { className: 'text-xs px-2 py-0.5 rounded bg-red-600 text-white' }, 'KEV') : null,
                      ]),
                      React.createElement('div', { className: 'mt-1 text-gray-900 font-medium' }, c.curated_title || 'No title'),
                      React.createElement('div', { className: 'mt-1 text-gray-600 text-sm' }, c.curated_summary || 'No summary available'),
                      React.createElement('div', { className: 'mt-2 text-xs text-gray-500' }, `Published: ${formatDate(c.published_at)} • CVE Published: ${formatDate(c.cve_published)}`),
                    ])
                  )
                )
              ))) : React.createElement('div', { className: 'py-6 text-center text-gray-500' }, 'No curated CVEs published.')
            ),
            React.createElement('div', { className: 'mt-3 flex items-center justify-between text-sm' }, [
              React.createElement('button', { disabled: !hasPrev, onClick: () => setOffset((o) => Math.max(0, o - limit)), className: 'px-3 py-1 border rounded disabled:opacity-50' }, 'Previous'),
              React.createElement('button', { disabled: !(offset + limit < totalCves), onClick: () => setOffset((o) => o + limit), className: 'px-3 py-1 border rounded disabled:opacity-50' }, 'Next'),
            ])
          ]),

          React.createElement('div', { key: 'alerts', className: 'bg-white dark:bg-gray-800 p-4 rounded shadow' }, [
            React.createElement('div', { className: 'flex items-center justify-between mb-3' }, [
              React.createElement('h2', { className: 'text-lg font-semibold' }, 'Alerts'),
              React.createElement('div', { className: 'text-sm text-gray-600' }, `${totalAlerts} results`),
            ]),
            loading ? React.createElement('div', { className: 'py-6 text-center text-gray-500' }, 'Loading…') : (
              alerts.length ? React.createElement('ul', { className: 'divide-y' }, alerts.map((a) => (
                React.createElement('li', { key: a.slug, className: 'py-3' },
                  React.createElement('div', { className: 'flex items-start justify-between' },
                    React.createElement('div', null, [
                      React.createElement('a', { href: `/viewer/alert/${encodeURIComponent(a.slug)}`, className: 'text-pink-600 font-semibold hover:underline' }, a.title),
                      React.createElement('div', { className: 'mt-1 text-xs text-gray-500' }, `Severity: ${a.severity ?? 'UNKNOWN'} • Published: ${formatDate(a.published_at)}`),
                    ])
                  )
                )
              ))) : React.createElement('div', { className: 'py-6 text-center text-gray-500' }, 'No alerts published.')
            )
          ]),
        ])
      ])
    ])
  )
}
