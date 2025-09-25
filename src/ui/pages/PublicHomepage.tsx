import React, { useEffect, useMemo, useState } from 'react'

type PublicCVE = {
  cve_id: string
  curated_title?: string | null
  curated_summary?: string | null
  curated_body_md?: string | null
  tags?: string[]
  references?: Array<{ title?: string; url: string }>
  public_extras?: any
  published_at?: string | null
  cve_published?: string | null
  cvss_score?: number | null
  cvss_severity?: string | null
  cvss_v40_score?: number | null
  cvss_v40_severity?: string | null
  cvss_v31_score?: number | null
  cvss_v31_severity?: string | null
  is_kev?: boolean
}

type PublicAlert = {
  id: string
  slug: string
  title: string
  body_md?: string
  severity?: string
  categories?: string[]
  references?: Array<{ title?: string; url: string }>
  public_extras?: any
  published_at?: string | null
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString()
  } catch {
    return String(d)
  }
}

export default function PublicHomepage() {
  const [q, setQ] = useState('')
  const [severity, setSeverity] = useState('')
  const [hasKev, setHasKev] = useState('')
  const [limit, setLimit] = useState(25)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [cves, setCves] = useState<PublicCVE[]>([])
  const [alerts, setAlerts] = useState<PublicAlert[]>([])
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
          fetch(`/public/cves?${params.toString()}`, { headers: { accept: 'application/json' } }),
          fetch(`/public/alerts?${params.toString()}`, { headers: { accept: 'application/json' } }),
        ])
        if (cvesResp.ok) {
          const data = await cvesResp.json()
          if (mounted) {
            setCves(Array.isArray(data.cves) ? data.cves : Array.isArray(data.items) ? data.items : data)
            setTotalCves(data.total_count ?? data.total ?? data.count ?? (Array.isArray(data.cves) ? data.cves.length : 0))
          }
        } else {
          if (mounted) { setCves([]); setTotalCves(0) }
        }
        if (alertsResp.ok) {
          const data = await alertsResp.json()
          if (mounted) {
            setAlerts(Array.isArray(data.alerts) ? data.alerts : Array.isArray(data.items) ? data.items : data)
            setTotalAlerts(data.total_count ?? data.total ?? data.count ?? (Array.isArray(data.alerts) ? data.alerts.length : 0))
          }
        } else {
          if (mounted) { setAlerts([]); setTotalAlerts(0) }
        }
      } catch (e) {
        if (mounted) { setCves([]); setAlerts([]); setTotalCves(0); setTotalAlerts(0) }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchPublic()
    return () => { mounted = false }
  }, [q, severity, hasKev, limit, offset])

  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.max(1, Math.ceil(totalCves / limit))
  const hasNext = offset + limit < totalCves
  const hasPrev = offset > 0

  return (
    <main className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Public Security Feed</h1>
        <p className="text-gray-600">Curated CVEs and Alerts that have been published.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <aside className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-3">
            <div>
              <label className="text-sm text-gray-600">Search</label>
              <input value={q} onChange={(e) => { setQ(e.target.value); setOffset(0) }} className="mt-1 block w-full rounded border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" placeholder="Search title or CVE ID"/>
            </div>
            <div>
              <label className="text-sm text-gray-600">Severity</label>
              <select value={severity} onChange={(e) => { setSeverity(e.target.value); setOffset(0) }} className="mt-1 block w-full rounded border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2">
                <option value="">Any</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">CISA KEV</label>
              <div className="mt-1 text-sm">
                <label className="inline-flex items-center mr-4"><input type="radio" name="kev" value="" checked={hasKev === ''} onChange={() => { setHasKev(''); setOffset(0) }} className="mr-2" />Any</label>
                <label className="inline-flex items-center mr-4"><input type="radio" name="kev" value="true" checked={hasKev === 'true'} onChange={() => { setHasKev('true'); setOffset(0) }} className="mr-2" />Only KEV</label>
                <label className="inline-flex items-center"><input type="radio" name="kev" value="false" checked={hasKev === 'false'} onChange={() => { setHasKev('false'); setOffset(0) }} className="mr-2" />Exclude KEV</label>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Per page</label>
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0) }} className="mt-1 block w-full rounded border-gray-200 text-sm p-2">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Curated CVEs</h2>
              <div className="text-sm text-gray-600">Page {currentPage} of {totalPages} ({totalCves} results)</div>
            </div>
            {loading ? (
              <div className="py-10 text-center text-gray-500">Loading…</div>
            ) : cves.length ? (
              <ul className="divide-y">
                {cves.map((c) => (
                  <li key={c.cve_id} className="py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <a href={`/public/cve/${encodeURIComponent(c.cve_id)}`} className="text-pink-600 font-semibold hover:underline">{c.cve_id}</a>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{c.cvss_severity ?? 'UNKNOWN'}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-white">CVSS {c.cvss_score ?? 'N/A'}</span>
                          {c.is_kev ? <span className="text-xs px-2 py-0.5 rounded bg-red-600 text-white">KEV</span> : null}
                        </div>
                        <div className="mt-1 text-gray-900 font-medium">{c.curated_title || 'No title'}</div>
                        <div className="mt-1 text-gray-600 text-sm line-clamp-2">{c.curated_summary || 'No summary available'}</div>
                        <div className="mt-2 text-xs text-gray-500">Published: {formatDate(c.published_at)} • CVE Published: {formatDate(c.cve_published)}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 text-center text-gray-500">No curated CVEs published.</div>
            )}

            <div className="mt-3 flex items-center justify-between text-sm">
              <button disabled={!hasPrev} onClick={() => setOffset((o) => Math.max(0, o - limit))} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
              <button disabled={!hasNext} onClick={() => setOffset((o) => o + limit)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Alerts</h2>
              <div className="text-sm text-gray-600">{totalAlerts} results</div>
            </div>
            {loading ? (
              <div className="py-6 text-center text-gray-500">Loading…</div>
            ) : alerts.length ? (
              <ul className="divide-y">
                {alerts.map((a) => (
                  <li key={a.slug} className="py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <a href={`/public/alert/${encodeURIComponent(a.slug)}`} className="text-pink-600 font-semibold hover:underline">{a.title}</a>
                        <div className="mt-1 text-xs text-gray-500">Severity: {a.severity ?? 'UNKNOWN'} • Published: {formatDate(a.published_at)}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 text-center text-gray-500">No alerts published.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
