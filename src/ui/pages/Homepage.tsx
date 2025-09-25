import React, { useEffect, useMemo, useState } from 'react'
import CVEList from '../components/CVEList'
import ThreatFeed from '../components/ThreatFeed'
import { authFetch } from '../lib/auth'

type Props = {
  cves: any[]
  threats?: any[]
  lastUpdated: string
}

// Exported helpers for building search params and mapping API rows for unit tests
export function buildSearchParamsObj(opts: {
  days?: number
  q?: string
  cve_id?: string
  cve_id_contains?: string
  min_score?: number | null
  max_score?: number | null
  severity?: string
  severity_in?: string[]
  has_kev?: string
  date_from?: string
  date_to?: string
  last_modified_from?: string
  last_modified_to?: string
  sources?: string[]
  sort_by?: string
  sort_dir?: string
  limit?: number
  offset?: number
}) {
  const params = new URLSearchParams()
  if (opts.days) params.set('days', String(opts.days))
  if (opts.q) params.set('q', opts.q)
  if (opts.cve_id) params.set('cve_id', opts.cve_id)
  if (opts.cve_id_contains) params.set('cve_id_contains', opts.cve_id_contains)
  if (opts.min_score !== undefined && opts.min_score !== null) params.set('min_score', String(opts.min_score))
  if (opts.max_score !== undefined && opts.max_score !== null) params.set('max_score', String(opts.max_score))
  if (opts.severity) params.set('severity', opts.severity)
  for (const s of (opts.severity_in ?? [])) params.append('severity_in', s)
  if (opts.has_kev !== undefined && opts.has_kev !== null) params.set('has_kev', String(opts.has_kev))
  if (opts.date_from) params.set('date_from', opts.date_from)
  if (opts.date_to) params.set('date_to', opts.date_to)
  if (opts.last_modified_from) params.set('last_modified_from', opts.last_modified_from)
  if (opts.last_modified_to) params.set('last_modified_to', opts.last_modified_to)
  for (const s of (opts.sources ?? [])) params.append('sources', s)
  if (opts.sort_by) params.set('sort_by', opts.sort_by)
  if (opts.sort_dir) params.set('sort_dir', opts.sort_dir)
  if (opts.limit !== undefined) params.set('limit', String(opts.limit))
  if (opts.offset !== undefined) params.set('offset', String(opts.offset))
  return params
}

export function mapApiRowToItem(r: any) {
  return {
    id: r.cve_id || 'Unknown CVE',
    description: (r.description && r.description.trim()) ? r.description : 'No description available',
    cvss: Number(r.cvss_v40_score ?? r.cvss_v31_score ?? r.cvss_v30_score ?? r.cvss_v2_score ?? 0) || 0,
    severity: (r.cvss_v40_severity || r.cvss_v31_severity || r.cvss_v30_severity || '').toUpperCase() || 'UNKNOWN',
    category: (r.source && r.source.trim()) ? r.source : 'Unknown Source',
    product: (r.vendor && r.vendor.trim()) ? r.vendor : (r.product && r.product.trim()) ? r.product : 'General',
    time: r.last_modified || r.published || new Date().toISOString(),
    table_source: (r.table_source && r.table_source.trim()) ? r.table_source : 'Unknown',
    is_kev: Boolean(r.is_kev),
    kev_due_date: r.kev_due_date || null,
  }
}

// Helper used to convert server filters_applied into flat key/value pairs for UI chips and tests
export function flattenFiltersApplied(f: any): Array<{ key: string, value: any }> {
  if (!f) return []
  if (typeof f === 'string') return [{ key: 'info', value: f }]
  const out: Array<{ key: string, value: any }> = []
  for (const [k, v] of Object.entries(f)) {
    if (Array.isArray(v)) {
      for (const vv of v) out.push({ key: k, value: vv })
    } else {
      out.push({ key: k, value: v })
    }
  }
  return out
}

function LoadingSpinner({ size = 6 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center">
      <svg className={`animate-spin h-${size} w-${size} text-pink-600`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
    </div>
  )
}

function PaginationControls({ 
  currentPage, 
  totalPages, 
  hasNextPage, 
  hasPrevPage, 
  onPageChange, 
  onNextPage, 
  onPrevPage,
  totalCount,
  offset,
  limit 
}: {
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  onPageChange: (page: number) => void
  onNextPage: () => void
  onPrevPage: () => void
  totalCount: number
  offset: number
  limit: number
}) {
  const startItem = offset + 1
  const endItem = Math.min(offset + limit, totalCount)
  
  // Generate page numbers to show (max 7 pages visible)
  const getVisiblePages = () => {
    const delta = 3
    const range = []
    const rangeWithDots = []
    
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }
    
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }
    
    rangeWithDots.push(...range)
    
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }
    
    return rangeWithDots
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={onPrevPage}
          disabled={!hasPrevPage}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={onNextPage}
          disabled={!hasNextPage}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalCount}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={onPrevPage}
              disabled={!hasPrevPage}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              ←
            </button>
            {getVisiblePages().map((page, idx) => (
              <span key={idx}>
                {page === '...' ? (
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => onPageChange(page as number)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                      currentPage === page
                        ? 'bg-pink-600 text-white ring-pink-600 hover:bg-pink-500'
                        : 'text-gray-900'
                    }`}
                  >
                    {page}
                  </button>
                )}
              </span>
            ))}
            <button
              onClick={onNextPage}
              disabled={!hasNextPage}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              →
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}

function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse p-4 bg-white dark:bg-gray-800 rounded shadow">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      ))}
    </div>
  )
}

export default function Homepage({ cves, threats, lastUpdated }: Props) {
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState<string>('')
  const [cveIdExact, setCveIdExact] = useState('')
  const [cveIdContains, setCveIdContains] = useState('')
  const [minScore, setMinScore] = useState<string>('')
  const [maxScore, setMaxScore] = useState<string>('')
  const [severityIn, setSeverityIn] = useState<string[]>([])
  const [hasKev, setHasKev] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [lastModifiedFrom, setLastModifiedFrom] = useState('')
  const [lastModifiedTo, setLastModifiedTo] = useState('')
  const [sources, setSources] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('last_modified')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(true)
  const [days, setDays] = useState<number>(365)
  const [limit, setLimit] = useState<number>(50)
  const [offset, setOffset] = useState<number>(0)
  const [items, setItems] = useState<any[]>(cves ?? [])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [filtersApplied, setFiltersApplied] = useState<any>(null)
  const [showServerFilters, setShowServerFilters] = useState(false)

  // debounce q
  const [debouncedQ, setDebouncedQ] = useState(query)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(query), 350)
    return () => clearTimeout(id)
  }, [query])
  // apply token to control when search actually runs (Apply button)
  const [applyToken, setApplyToken] = useState(0)

  // auto-refresh: read setting from localStorage and periodically trigger applyToken
  useEffect(() => {
    let mounted = true
    let interval: number | undefined
    try {
      const raw = localStorage.getItem('autoRefresh')
      const enabled = raw === null ? true : JSON.parse(raw)
      if (enabled) {
        // 2 minutes
        interval = window.setInterval(() => {
          if (!mounted) return
          // only trigger when component is mounted
          setApplyToken((t) => t + 1)
        }, 120000)
      }
    } catch (e) {
      // ignore
    }
    return () => {
      mounted = false
      if (interval) window.clearInterval(interval)
    }
  }, [])

  // fetch recent CVEs from API and normalize for CVEList
  useEffect(() => {
    let mounted = true
    async function fetchRecent() {
      try {
        setLoading(true)
  // build search params for /cves/search
  // validation: clamp scores and enforce sort whitelist
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  const sortWhitelist = new Set(['published','last_modified','cvss_v40_score','cvss_v31_score','cvss_v30_score','cvss_v2_score','kev_date_added','is_kev','cve_id'])
  const params = new URLSearchParams()
  // time window
  if (days) params.set('days', String(days))
  // text/q and cve id filters
  if (debouncedQ && debouncedQ.trim()) params.set('q', debouncedQ.trim())
  if (cveIdExact && cveIdExact.trim()) params.set('cve_id', cveIdExact.trim())
  if (cveIdContains && cveIdContains.trim()) params.set('cve_id_contains', cveIdContains.trim())
  // scores
        if (minScore !== '') {
          const n = Number(minScore)
          if (!Number.isNaN(n)) params.set('min_score', String(clamp(n, 0, 10)))
        }
        if (maxScore !== '') {
          const n = Number(maxScore)
          if (!Number.isNaN(n)) params.set('max_score', String(clamp(n, 0, 10)))
        }
  // severity single
  if (severity) params.set('severity', severity)
  // severity_in repeated
  for (const s of severityIn) params.append('severity_in', s)
  // KEV
  if (hasKev !== '') params.set('has_kev', String(hasKev))
  // dates
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)
  if (lastModifiedFrom) params.set('last_modified_from', lastModifiedFrom)
  if (lastModifiedTo) params.set('last_modified_to', lastModifiedTo)
  // sources repeated
  for (const s of sources) params.append('sources', s)
  // sorting
  if (sortBy && sortWhitelist.has(sortBy)) params.set('sort_by', sortBy)
  if (sortDir) params.set('sort_dir', sortDir)
  // pagination
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  const url = `/cves/search?${params.toString()}`
  const resp = await authFetch(url, { headers: { accept: 'application/json' } })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = await resp.json()
  console.log('=== API Response Debug ===')
  console.log('Full API Response:', data)
  console.log('CVE rows length:', data.cves?.length || 0)
  console.log('Total count:', data.total_count)
  console.log('Pagination info:', data.pagination)
  console.log('Current request params:', { days, limit, offset, query, cveIdExact, cveIdContains, minScore, maxScore, severityIn, hasKev, dateFrom, dateTo, lastModifiedFrom, lastModifiedTo, sources, sortBy, sortDir })
        
  // normalize to CVEList shape - handle all fields as potentially empty except id
  // API returns 'cves' array
  const mapped = (data.cves ?? []).map((r: any) => mapApiRowToItem(r))
        console.log('Mapped CVEs count:', mapped.length)
        console.log('Sample mapped CVE:', mapped[0])
        
        if (mounted) {
          setItems(mapped)
          // Set total count from API response - prioritize total_count field
          const calculatedTotalCount = data.total_count ?? data.pagination?.total_count ?? data.total ?? data.count ?? mapped.length
          setTotalCount(calculatedTotalCount)
          
          console.log('=== Pagination State Debug ===')
          console.log('Total count set to:', calculatedTotalCount)
          console.log('Current offset:', offset)
          console.log('Current limit:', limit)
          console.log('Calculated current page:', Math.floor(offset / limit) + 1)
          console.log('Calculated total pages:', Math.ceil(calculatedTotalCount / limit))
          console.log('Has next page:', offset + limit < calculatedTotalCount)
          console.log('Has prev page:', offset > 0)
          // capture server echo of filters for UI (if provided)
          setFiltersApplied(data.filters_applied ?? null)
        }
      } catch (e) {
        console.error('Failed to fetch recent CVEs', e)
        // Set empty array so the UI shows "No CVEs found" instead of crashing
        if (mounted) setItems([])
  } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchRecent()
    return () => {
      mounted = false
    }
  }, [days, limit, offset, applyToken])

  const filtered = useMemo(() => {
    if (!items) return []
    let list = items.slice()
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((it: any) => (it.id || '').toLowerCase().includes(q) || (it.description || '').toLowerCase().includes(q))
    }
    if (severity) {
      list = list.filter((it: any) => (it.severity || '').toLowerCase() === severity.toLowerCase())
    }
    return list
  }, [items, query, severity])

  // Pagination calculations
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(totalCount / limit)
  const hasNextPage = offset + limit < totalCount
  const hasPrevPage = offset > 0

  // Debug pagination calculations on every render
  console.log('=== Current Pagination State ===')
  console.log('Offset:', offset, 'Limit:', limit, 'Total Count:', totalCount)
  console.log('Current Page:', currentPage, 'Total Pages:', totalPages)
  console.log('Has Next:', hasNextPage, 'Has Prev:', hasPrevPage)
  console.log('Items count:', items?.length || 0)

  // Pagination handlers
  const goToPage = (page: number) => {
    const newOffset = (page - 1) * limit
    console.log('=== Page Navigation Debug ===')
    console.log('Going to page:', page)
    console.log('New offset:', newOffset)
    console.log('Current limit:', limit)
    setOffset(newOffset)
  }

  const nextPage = () => {
    if (hasNextPage) {
      const newOffset = offset + limit
      console.log('=== Next Page Debug ===')
      console.log('Current offset:', offset)
      console.log('New offset:', newOffset)
      console.log('Limit:', limit)
      setOffset(newOffset)
    } else {
      console.log('Next page blocked - no more pages available')
    }
  }

  const prevPage = () => {
    if (hasPrevPage) {
      const newOffset = Math.max(0, offset - limit)
      console.log('=== Previous Page Debug ===')
      console.log('Current offset:', offset)
      console.log('New offset:', newOffset)
      console.log('Limit:', limit)
      setOffset(newOffset)
    } else {
      console.log('Previous page blocked - already on first page')
    }
  }

  return (
    <main className="container mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Recent CVEs Affecting Network Infrastructure</h2>
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block text-sm text-gray-500">Last Updated: {new Date().toLocaleString()}</div>
          <div className="w-80">
            <label htmlFor="site-search" className="sr-only">Search CVEs</label>
            <div className="relative">
              <input
                id="site-search"
                className="w-full pl-3 pr-10 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                placeholder="Search CVE ID or description..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query ? (
                <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">Clear</button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left: advanced filters */}
        <aside className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Filters</h3>
              <button className="text-sm text-pink-600" onClick={() => setShowFilters((s) => !s)}>{showFilters ? 'Hide' : 'Show'}</button>
            </div>

            {showFilters && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Severity</label>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="mt-1 block w-full rounded border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2">
                    <option value="">Any</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600">CVE ID (exact)</label>
                  <input value={cveIdExact} onChange={(e) => setCveIdExact(e.target.value)} placeholder="CVE-2025-12345" className="mt-1 block w-full rounded border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" />
                </div>

                <div>
                  <label className="text-sm text-gray-600">CVE ID contains</label>
                  <input value={cveIdContains} onChange={(e) => setCveIdContains(e.target.value)} placeholder="2025-" className="mt-1 block w-full rounded border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-gray-600">Min score</label>
                    <input type="number" step="0.1" min="0" max="10" value={minScore} onChange={(e) => setMinScore(e.target.value)} className="mt-1 block w-full rounded border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Max score</label>
                    <input type="number" step="0.1" min="0" max="10" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} className="mt-1 block w-full rounded border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Severity (any-of)</label>
                  <div className="mt-1 space-y-1 text-sm">
                    {['LOW','MEDIUM','HIGH','CRITICAL'].map(s => (
                      <label key={s} className="inline-flex items-center mr-2">
                        <input type="checkbox" checked={severityIn.includes(s)} onChange={(e) => setSeverityIn(prev => e.target.checked ? [...prev, s] : prev.filter(x => x !== s))} className="mr-2" />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">CISA KEV</label>
                  <div className="mt-1">
                    <label className="inline-flex items-center mr-4"><input type="radio" name="kev" value="" checked={hasKev === ''} onChange={() => setHasKev('')} className="mr-2" />Any</label>
                    <label className="inline-flex items-center mr-4"><input type="radio" name="kev" value="true" checked={hasKev === 'true'} onChange={() => setHasKev('true')} className="mr-2" />Only KEV</label>
                    <label className="inline-flex items-center"><input type="radio" name="kev" value="false" checked={hasKev === 'false'} onChange={() => setHasKev('false')} className="mr-2" />Exclude KEV</label>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Sources</label>
                  <div className="mt-1 space-y-1 text-sm">
                    {['nvd','cisa'].map(s => (
                      <label key={s} className="inline-flex items-center mr-2">
                        <input type="checkbox" checked={sources.includes(s)} onChange={(e) => setSources(prev => e.target.checked ? [...prev, s] : prev.filter(x => x !== s))} className="mr-2" />
                        {s.toUpperCase()}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Sort by</label>
                  <div className="mt-1 flex space-x-2">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border-gray-200 text-sm p-2">
                      <option value="last_modified">Last modified</option>
                      <option value="published">Published</option>
                      <option value="cvss_v40_score">CVSS v4.0</option>
                      <option value="cvss_v31_score">CVSS v3.1</option>
                      <option value="cvss_v30_score">CVSS v3.0</option>
                      <option value="cvss_v2_score">CVSS v2.0</option>
                      <option value="is_kev">KEV</option>
                      <option value="cve_id">CVE ID</option>
                    </select>
                    <select value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc'|'desc')} className="rounded border-gray-200 text-sm p-2">
                      <option value="desc">Desc</option>
                      <option value="asc">Asc</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Date published</label>
                  <div className="flex space-x-2 mt-1">
                    <input 
                      type="date" 
                      value={dateFrom} 
                      onChange={(e) => setDateFrom(e.target.value)} 
                      className="block w-1/2 rounded border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" 
                      placeholder="From"
                    />
                    <input 
                      type="date" 
                      value={dateTo} 
                      onChange={(e) => setDateTo(e.target.value)} 
                      className="block w-1/2 rounded border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" 
                      placeholder="To"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Date last modified</label>
                  <div className="flex space-x-2 mt-1">
                    <input 
                      type="date" 
                      value={lastModifiedFrom} 
                      onChange={(e) => setLastModifiedFrom(e.target.value)} 
                      className="block w-1/2 rounded border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" 
                      placeholder="From"
                    />
                    <input 
                      type="date" 
                      value={lastModifiedTo} 
                      onChange={(e) => setLastModifiedTo(e.target.value)} 
                      className="block w-1/2 rounded border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" 
                      placeholder="To"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button onClick={() => { setOffset(0); setApplyToken(t => t + 1); }} className="flex-1 px-3 py-2 bg-pink-600 text-white rounded text-sm">Apply</button>
                  <button onClick={() => {
                    // clear filters
                    setQuery(''); setCveIdExact(''); setCveIdContains(''); setMinScore(''); setMaxScore(''); setSeverity(''); setSeverityIn([]); setHasKev(''); setDateFrom(''); setDateTo(''); setLastModifiedFrom(''); setLastModifiedTo(''); setSources([]); setSortBy('last_modified'); setSortDir('desc'); setOffset(0); setFiltersApplied(null); setApplyToken(t => t + 1);
                  }} className="flex-1 px-3 py-2 border rounded text-sm">Clear</button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right: CVE list */}
        <section className="lg:col-span-7">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            {loading ? (
              <div className="min-h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <LoadingSpinner size={8} />
                  </div>
                  <div className="text-gray-600">Loading CVEs...</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <div className="flex items-start justify-between">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages} ({totalCount} total results)
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Per page:</label>
                      <select
                        value={limit}
                        onChange={(e) => {
                          setLimit(Number(e.target.value))
                          setOffset(0) // Reset to first page when changing limit
                        }}
                        className="rounded border-gray-200 text-sm"
                      >
                        <option value={5}>5</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Active Filters Section */}
                  {(debouncedQ || cveIdExact || cveIdContains || minScore || maxScore || severity || severityIn.length || hasKev !== '' || dateFrom || dateTo || lastModifiedFrom || lastModifiedTo || sources.length || (sortBy && sortBy !== 'last_modified')) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                        <button 
                          onClick={() => {
                            setQuery(''); setCveIdExact(''); setCveIdContains(''); setMinScore(''); setMaxScore(''); setSeverity(''); setSeverityIn([]); setHasKev(''); setDateFrom(''); setDateTo(''); setLastModifiedFrom(''); setLastModifiedTo(''); setSources([]); setSortBy('last_modified'); setSortDir('desc'); setOffset(0); setFiltersApplied(null); setApplyToken(t => t + 1);
                          }}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {debouncedQ && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200">
                            <span className="font-medium">Search:</span> {debouncedQ}
                            <button onClick={() => setQuery('')} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                          </span>
                        )}
                        {cveIdExact && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full border border-purple-200">
                            <span className="font-medium">CVE ID:</span> {cveIdExact}
                            <button onClick={() => setCveIdExact('')} className="ml-1 text-purple-600 hover:text-purple-800">×</button>
                          </span>
                        )}
                        {cveIdContains && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full border border-purple-200">
                            <span className="font-medium">CVE Contains:</span> {cveIdContains}
                            <button onClick={() => setCveIdContains('')} className="ml-1 text-purple-600 hover:text-purple-800">×</button>
                          </span>
                        )}
                        {minScore && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full border border-orange-200">
                            <span className="font-medium">Min Score:</span> {minScore}
                            <button onClick={() => setMinScore('')} className="ml-1 text-orange-600 hover:text-orange-800">×</button>
                          </span>
                        )}
                        {maxScore && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full border border-orange-200">
                            <span className="font-medium">Max Score:</span> {maxScore}
                            <button onClick={() => setMaxScore('')} className="ml-1 text-orange-600 hover:text-orange-800">×</button>
                          </span>
                        )}
                        {severity && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full border border-red-200">
                            <span className="font-medium">Severity:</span> {severity}
                            <button onClick={() => setSeverity('')} className="ml-1 text-red-600 hover:text-red-800">×</button>
                          </span>
                        )}
                        {severityIn.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full border border-red-200">
                            <span className="font-medium">Severities:</span> {severityIn.join(', ')}
                            <button onClick={() => setSeverityIn([])} className="ml-1 text-red-600 hover:text-red-800">×</button>
                          </span>
                        )}
                        {hasKev && hasKev !== '' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full border border-yellow-200">
                            <span className="font-medium">KEV:</span> {hasKev === 'true' ? 'Only KEV' : 'Exclude KEV'}
                            <button onClick={() => setHasKev('')} className="ml-1 text-yellow-600 hover:text-yellow-800">×</button>
                          </span>
                        )}
                        {dateFrom && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full border border-green-200">
                            <span className="font-medium">From:</span> {dateFrom}
                            <button onClick={() => setDateFrom('')} className="ml-1 text-green-600 hover:text-green-800">×</button>
                          </span>
                        )}
                        {dateTo && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full border border-green-200">
                            <span className="font-medium">To:</span> {dateTo}
                            <button onClick={() => setDateTo('')} className="ml-1 text-green-600 hover:text-green-800">×</button>
                          </span>
                        )}
                        {lastModifiedFrom && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-800 text-sm rounded-full border border-cyan-200">
                            <span className="font-medium">Modified From:</span> {lastModifiedFrom}
                            <button onClick={() => setLastModifiedFrom('')} className="ml-1 text-cyan-600 hover:text-cyan-800">×</button>
                          </span>
                        )}
                        {lastModifiedTo && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-800 text-sm rounded-full border border-cyan-200">
                            <span className="font-medium">Modified To:</span> {lastModifiedTo}
                            <button onClick={() => setLastModifiedTo('')} className="ml-1 text-cyan-600 hover:text-cyan-800">×</button>
                          </span>
                        )}
                        {sources.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full border border-indigo-200">
                            <span className="font-medium">Sources:</span> {sources.join(', ').toUpperCase()}
                            <button onClick={() => setSources([])} className="ml-1 text-indigo-600 hover:text-indigo-800">×</button>
                          </span>
                        )}
                        {sortBy && sortBy !== 'last_modified' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full border border-gray-200">
                            <span className="font-medium">Sort:</span> {sortBy} ({sortDir})
                            <button onClick={() => { setSortBy('last_modified'); setSortDir('desc'); }} className="ml-1 text-gray-600 hover:text-gray-800">×</button>
                          </span>
                        )}
                      </div>
                      
                      {/* Server Applied Filters */}
                      {filtersApplied && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500">Server Applied Filters:</span>
                            <button 
                              onClick={() => setShowServerFilters(!showServerFilters)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            >
                              {showServerFilters ? (
                                <>
                                  <span>Hide</span>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  <span>Show</span>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </>
                              )}
                            </button>
                          </div>
                          {showServerFilters && (
                            <div className="flex flex-wrap gap-1">
                              {flattenFiltersApplied(filtersApplied).map((it, idx) => (
                                <span key={`${it.key}-${idx}`} className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded border">
                                  <span className="font-medium">{it.key}:</span>&nbsp;{String(it.value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {filtered.length > 0 ? (
                  <>
                    <CVEList items={filtered} />
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      hasNextPage={hasNextPage}
                      hasPrevPage={hasPrevPage}
                      onPageChange={goToPage}
                      onNextPage={nextPage}
                      onPrevPage={prevPage}
                      totalCount={totalCount}
                      offset={offset}
                      limit={limit}
                    />
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-2">No CVEs found</div>
                    <div className="text-sm text-gray-400">
                      {query ? `No results for "${query}"` : 'No recent CVEs available at this time'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
