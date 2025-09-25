import React, { useState, useEffect, useMemo } from 'react'
import { api } from '../lib/apiBase'
import { getUserInfo } from '../lib/auth'
import { hasPermission } from '../lib/rbac'

// Collapsible CVSS Vector Display Component (matching VulnerabilityPage)
const CVSSVectorDisplay = ({ vector, version, compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!vector) return null

  // Ensure the vector string includes the CVSS version prefix
  let normalizedVector = String(vector || "")
  if (!/\bCVSS[:]?/i.test(normalizedVector)) {
    normalizedVector = `CVSS:${version}/${normalizedVector}`
  }

  const maxLength = compact ? 20 : 30
  const shouldTruncate = normalizedVector.length > maxLength
  const displayText = shouldTruncate && !isExpanded
    ? `${normalizedVector.substring(0, maxLength)}...`
    : normalizedVector

  return React.createElement('div', { className: 'mt-1' }, [
    React.createElement('div', {
      key: 'text',
      className: `text-xs ${compact ? "text-gray-600 dark:text-gray-400" : "text-gray-500 dark:text-gray-400"} break-all`
    }, displayText),
    shouldTruncate ? React.createElement('button', {
      key: 'btn',
      onClick: () => setIsExpanded(!isExpanded),
      className: 'text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-1'
    }, isExpanded ? "Show less" : "Show full vector") : null
  ])
}

function formatDate(d) {
  if (!d) return "—"
  try {
    return new Date(d).toISOString().replace("T", " ").split(".")[0]
  } catch (e) {
    return String(d)
  }
}

// Inline component to show preferred score and optional expandable vector (matching VulnerabilityPage)
const PreferredVectorSummary = ({ normalized, rawScores }) => {
  const [open, setOpen] = useState(false)
  if (!normalized) return React.createElement('span', {}, '—')

  const score = normalized.cvss ?? "—"
  const src = normalized.preferred_cvss_source ?? "Unknown"

  // find vector for version
  let vector = null
  if (src === "v4.0") vector = rawScores?.v40Vector ?? null
  else if (src === "v3.1") vector = rawScores?.v31Vector ?? null
  else if (src === "v3.0") vector = rawScores?.v30Vector ?? null
  else if (src === "v2.0") vector = rawScores?.v2Vector ?? null

  return React.createElement('div', {}, [
    React.createElement('span', { key: 'summary' }, [
      'Preferred Score Summary: ',
      React.createElement('span', { className: 'font-semibold' }, score),
      ' ',
      src && src !== "Unknown" ? React.createElement('span', {}, `(${src})`) : null
    ]),
    vector ? React.createElement('div', { key: 'vector', className: 'mt-1' }, [
      React.createElement('div', { key: 'text', className: 'text-xs text-gray-500' }, 
        open ? vector : `${String(vector).substring(0, 40)}${String(vector).length > 40 ? "..." : ""}`
      ),
      String(vector).length > 40 ? React.createElement('button', {
        key: 'btn',
        onClick: () => setOpen(s => !s),
        className: 'text-xs text-blue-600 dark:text-blue-400 mt-1'
      }, open ? "Show less" : "Show full vector") : null
    ]) : null
  ])
}

function severityLevel(s) {
  if (!s) return 0
  const map = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
  return map[s.toUpperCase()] ?? 0
}

function severityColor(s) {
  const sev = s?.toUpperCase()
  if (sev === "CRITICAL") return "bg-red-700 text-white"
  if (sev === "HIGH") return "bg-red-500 text-white"
  if (sev === "MEDIUM") return "bg-yellow-400 text-black"
  return "bg-green-400 text-black"
}

function CVSSDonut({ score }) {
  const pct = score && score > 0 ? Math.max(0, Math.min(100, (score / 10) * 100)) : 0
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const dash = (pct / 100) * circumference
  const remaining = circumference - dash

  return React.createElement('svg', { width: "100", height: "100", viewBox: "0 0 100 100", 'aria-hidden': true }, [
    React.createElement('g', { key: 'g', transform: "translate(50,50)" }, [
      React.createElement('circle', { key: 'bg', r: radius, stroke: "#e5e7eb", strokeWidth: 10, fill: "none" }),
      React.createElement('circle', {
        key: 'fg',
        r: radius,
        stroke: "#ec4899",
        strokeWidth: 10,
        strokeLinecap: "round",
        fill: "none",
        strokeDasharray: `${dash} ${remaining}`,
        transform: "rotate(-90)"
      }),
      React.createElement('text', {
        key: 'text',
        x: "0",
        y: "6",
        textAnchor: "middle",
        fontSize: 14,
        className: "text-gray-800 dark:text-gray-100"
      }, score?.toFixed?.(1) ?? score ?? "—")
    ])
  ])
}

export default function PublicCveDetail({ cveId }) {
  const [fetchedRaw, setFetchedRaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [descOpen, setDescOpen] = useState(true)
  const [tab, setTab] = useState("overview")

  // Check if user has admin permissions
  const user = getUserInfo()
  const isAdmin = hasPermission(user, 'ADMIN_FUNCTIONS')

  // Fetch CVE data from public API
  useEffect(() => {
    if (!cveId) return
    let mounted = true
    
    async function fetchData() {
      try {
        setLoading(true)
        console.log("=== PublicCveDetail API Fetch Debug ===")
        console.log("Fetching CVE details for:", cveId)
        console.log("API URL:", `/public/cve/${encodeURIComponent(cveId)}`)

        const resp = await fetch(api(`/public/cve/${encodeURIComponent(cveId)}`), {
          headers: { accept: 'application/json' }
        })
        
        console.log("Response status:", resp.status, resp.statusText)
        console.log("Response ok:", resp.ok)

        if (!resp.ok) {
          console.log("Response not OK, skipping processing")
          throw new Error(`HTTP ${resp.status}`)
        }

        const body = await resp.json()
        console.log("Raw response body:", body)
        console.log("Body type:", typeof body)

        if (mounted) {
          setFetchedRaw(body)
          console.log("Payload set to fetchedRaw state")
        }
      } catch (e) {
        console.log("=== CVE Fetch Error ===")
        console.log("Error details:", e)
        if (mounted) setError(String(e.message || e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    fetchData()
    return () => { mounted = false }
  }, [cveId])

  // Extract raw CVSS scores from original_data (matching VulnerabilityPage logic)
  const rawScores = useMemo(() => {
    if (!fetchedRaw?.original_data?.cve?.metrics) return null
    
    try {
      const metrics = fetchedRaw.original_data.cve.metrics

      // CVSS v2.0
      const rawV2 = metrics.cvssMetricV2?.[0]?.cvssData?.baseScore ?? null
      const v2 = rawV2 !== null && rawV2 !== undefined && rawV2 !== "" ? Number(rawV2) : null
      const v2Vector = metrics.cvssMetricV2?.[0]?.cvssData?.vectorString ?? null

      // CVSS v3.0
      const rawV30 = metrics.cvssMetricV30?.[0]?.cvssData?.baseScore ?? null
      const v30 = rawV30 !== null && rawV30 !== undefined && rawV30 !== "" ? Number(rawV30) : null
      const v30Vector = metrics.cvssMetricV30?.[0]?.cvssData?.vectorString ?? null

      // CVSS v3.1
      const rawV31 = metrics.cvssMetricV31?.[0]?.cvssData?.baseScore ?? null
      const v31 = rawV31 !== null && rawV31 !== undefined && rawV31 !== "" ? Number(rawV31) : null
      const v31Vector = metrics.cvssMetricV31?.[0]?.cvssData?.vectorString ?? null

      // CVSS v4.0
      const rawV40 = metrics.cvssMetricV40?.[0]?.cvssData?.baseScore ?? null
      const v40 = rawV40 !== null && rawV40 !== undefined && rawV40 !== "" ? Number(rawV40) : null
      const v40Vector = metrics.cvssMetricV40?.[0]?.cvssData?.vectorString ?? null

      console.log("=== Raw Scores Extraction Debug ===")
      console.log("Available metric types:", Object.keys(metrics))
      console.log("CVSS v2.0:", { score: v2, vector: v2Vector })
      console.log("CVSS v3.0:", { score: v30, vector: v30Vector })
      console.log("CVSS v3.1:", { score: v31, vector: v31Vector })
      console.log("CVSS v4.0:", { score: v40, vector: v40Vector })

      return { v2, v2Vector, v30, v30Vector, v31, v31Vector, v40, v40Vector }
    } catch (e) {
      console.log("Raw scores extraction failed:", e)
      return null
    }
  }, [fetchedRaw])

  // Normalized fields (matching VulnerabilityPage logic with curated overrides)
  const normalized = useMemo(() => {
    console.log("=== Normalization Debug ===")
    console.log("FetchedRaw available:", !!fetchedRaw)

    if (!fetchedRaw) {
      console.log("No fetchedRaw to normalize, returning null")
      return null
    }

    // Extract curated extras
    let curatedExtras = {}
    try {
      curatedExtras = typeof fetchedRaw.public_extras === 'string' 
        ? JSON.parse(fetchedRaw.public_extras) 
        : fetchedRaw.public_extras || {}
    } catch (e) {
      console.log("Failed to parse public_extras:", e)
    }

    // Determine best CVSS score with priority: curated > v4.0 > v3.1 > v3.0 > v2.0
    let bestScore = null
    let bestVersion = null
    let preferredCvssSource = "Unknown"

    // First check curated scores from main data
    if (fetchedRaw.cvss_score !== null && fetchedRaw.cvss_score !== undefined) {
      bestScore = Number(fetchedRaw.cvss_score)
      preferredCvssSource = "curated"
    } else if (fetchedRaw.cvss_v40_score !== null && fetchedRaw.cvss_v40_score !== undefined) {
      bestScore = Number(fetchedRaw.cvss_v40_score)
      preferredCvssSource = "v4.0"
    } else if (fetchedRaw.cvss_v31_score !== null && fetchedRaw.cvss_v31_score !== undefined) {
      bestScore = Number(fetchedRaw.cvss_v31_score)
      preferredCvssSource = "v3.1"
    }
    
    // Fallback to raw scores
    if (bestScore === null && rawScores) {
      const candidates = [
        { ver: "v4.0", score: rawScores.v40 },
        { ver: "v3.1", score: rawScores.v31 },
        { ver: "v3.0", score: rawScores.v30 },
        { ver: "v2.0", score: rawScores.v2 }
      ]
      for (const c of candidates) {
        if (c.score !== null && c.score !== undefined && !Number.isNaN(Number(c.score))) {
          bestScore = Number(c.score)
          bestVersion = c.ver
          preferredCvssSource = c.ver
          break
        }
      }
    }

    // Determine severity (curated overrides original)
    const severity = fetchedRaw.cvss_severity || 
                    fetchedRaw.cvss_v40_severity || 
                    fetchedRaw.cvss_v31_severity || 
                    fetchedRaw.original_data?.cve?.vulnStatus || 
                    "UNKNOWN"

    // Description (curated overrides original)
    const description = fetchedRaw.curated_summary || 
                       fetchedRaw.description ||
                       fetchedRaw.original_data?.cve?.descriptions?.[0]?.value || 
                       ""

    // CWE IDs (curated overrides original)
    const cwe_ids = curatedExtras.cwe_ids || 
                   fetchedRaw.original_data?.cve?.weaknesses?.flatMap(w => 
                     w.description?.map(d => d.value) || []
                   ) || []

    // References (curated overrides original)
    let references = []
    try {
      const curatedRefs = typeof fetchedRaw.references === 'string' 
        ? JSON.parse(fetchedRaw.references) 
        : fetchedRaw.references
      references = Array.isArray(curatedRefs) ? curatedRefs : []
    } catch (e) {
      // Fallback to original references
      references = fetchedRaw.original_data?.cve?.references?.map(r => ({ url: r.url, title: r.url })) || []
    }

    console.log("Preferred CVSS:", { bestScore, preferredCvssSource, bestVersion })
    console.log("Normalized severity:", severity)
    console.log("Normalized description length:", description.length)
    console.log("Normalized CWE IDs count:", cwe_ids.length)
    console.log("Normalized references count:", references.length)

    return {
      severity,
      cvss: bestScore,
      description,
      cwe_ids,
      references,
      all_cvss_scores: rawScores,
      preferred_cvss_source: preferredCvssSource
    }
  }, [fetchedRaw, rawScores])

  // Function to scroll to a section (matching VulnerabilityPage)
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  // Icon components (matching VulnerabilityPage)
  const IconOk = () => React.createElement('svg', {
    className: 'inline-block w-4 h-4 ml-2 text-green-500',
    viewBox: '0 0 20 20',
    fill: 'currentColor',
    'aria-hidden': true
  }, React.createElement('path', {
    fillRule: 'evenodd',
    d: 'M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z',
    clipRule: 'evenodd'
  }))

  const IconFail = () => React.createElement('svg', {
    className: 'inline-block w-4 h-4 ml-2 text-red-500',
    viewBox: '0 0 20 20',
    fill: 'currentColor',
    'aria-hidden': true
  }, React.createElement('path', {
    fillRule: 'evenodd',
    d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-10.707a1 1 0 00-1.414-1.414L10 8.586 7.707 6.293a1 1 0 10-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 101.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293z',
    clipRule: 'evenodd'
  }))

  function NavLink({ href, children }) {
    return React.createElement('a', {
      href,
      onClick: (e) => { 
        e.preventDefault()
        window.history.pushState({}, '', href)
        window.dispatchEvent(new PopStateEvent('popstate'))
      },
      className: 'text-pink-600 hover:underline'
    }, children)
  }

  if (!cveId) {
    return React.createElement('div', { className: 'p-6' }, 
      React.createElement('p', { className: 'text-gray-600' }, 'No case ID provided in URL.')
    )
  }

  if (loading) {
    return React.createElement('div', { className: 'min-h-screen flex items-center justify-center p-6' }, [
      React.createElement('div', { key: 'content', className: 'text-center' }, [
        React.createElement('div', { key: 'spinner', className: 'flex items-center justify-center mb-4', 'aria-hidden': true }, 
          React.createElement('svg', { className: 'animate-spin h-10 w-10 text-pink-600', viewBox: '0 0 24 24' }, [
            React.createElement('circle', { 
              key: 'bg',
              className: 'opacity-25', cx: '12', cy: '12', r: '10', 
              stroke: 'currentColor', strokeWidth: '4', fill: 'none' 
            }),
            React.createElement('path', { 
              key: 'fg',
              className: 'opacity-75', fill: 'currentColor', 
              d: 'M4 12a8 8 0 018-8v8z' 
            })
          ])
        ),
        React.createElement('div', { key: 'text', className: 'text-gray-700 dark:text-gray-300' }, 
          'Loading vulnerability details…'
        )
      ])
    ])
  }

  if (error && !fetchedRaw) {
    return React.createElement('div', { className: 'p-6 text-red-600' }, `Error: ${error}`)
  }

  if (!fetchedRaw) {
    return React.createElement('div', { className: 'p-6 text-gray-600' }, 'No data available')
  }

  // Extract curated extras for display
  let curatedExtras = {}
  try {
    curatedExtras = typeof fetchedRaw.public_extras === 'string' 
      ? JSON.parse(fetchedRaw.public_extras) 
      : fetchedRaw.public_extras || {}
  } catch (e) {
    console.log("Failed to parse public_extras for display:", e)
  }

  return React.createElement('div', { className: 'min-h-screen font-roboto bg-gray-50 dark:bg-gray-900 p-6' }, [
    React.createElement('div', { key: 'container', className: 'container mx-auto' }, [
      // Breadcrumb
      React.createElement('div', { key: 'breadcrumb', className: 'text-sm text-gray-600 mb-4' }, [
        React.createElement(NavLink, { key: 'home', href: '/viewer' }, 'Viewer'), 
        ' / ', 
        cveId
      ]),

      // Admin switch button - only show for admins
      isAdmin ? React.createElement('div', { key: 'admin-bar', className: 'mb-4 flex justify-end' }, 
        React.createElement('button', {
          onClick: () => window.location.href = `/vul/${cveId}`,
          className: 'inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200 shadow-sm',
          title: 'Switch to admin view to edit or delete this CVE'
        }, [
          React.createElement('svg', {
            key: 'icon',
            className: 'w-4 h-4 mr-2',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          }, 
            React.createElement('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: '2',
              d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
            })
          ),
          'Admin View'
        ])
      ) : null,

      // Header section (matching VulnerabilityPage)
      React.createElement('div', { key: 'header', className: 'mb-6 flex items-start justify-between' }, [
        React.createElement('div', { key: 'left' }, [
          React.createElement('h1', { className: 'text-3xl font-extrabold text-gray-900 dark:text-gray-100' }, cveId),
          React.createElement('div', { className: 'mt-2 flex items-center space-x-2' }, [
            React.createElement('span', { 
              className: `px-3 py-1 rounded ${severityColor(normalized?.severity ?? "")}` 
            }, normalized?.severity ?? "UNKNOWN"),
            React.createElement('span', { className: 'px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm' }, 
              'Status: Published'
            ),
            fetchedRaw.is_kev ? React.createElement('span', { 
              className: 'px-2 py-1 rounded bg-red-600 text-white text-sm font-medium' 
            }, 'KEV') : null,
            React.createElement('button', {
              onClick: () => setShowDebugPanel(s => !s),
              className: 'ml-2 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded'
            }, showDebugPanel ? "Hide Debug" : "Show Debug")
          ]),
          React.createElement('p', { className: 'mt-3 text-gray-600 dark:text-gray-300 max-w-3xl' }, 
            normalized?.description ?? "—"
          )
        ]),
        React.createElement('div', { key: 'right', className: 'ml-4 flex items-center space-x-4' }, [
          React.createElement('div', { key: 'cvss', className: 'text-center' }, [
            React.createElement('div', { className: 'w-24 h-24 mx-auto' }, 
              React.createElement(CVSSDonut, { score: normalized?.cvss ?? null })
            ),
            React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-300 mt-2' }, (() => {
              // infer donut label version (matching VulnerabilityPage logic)
              const src = normalized?.preferred_cvss_source
              const val = normalized?.cvss
              const tol = 0.0001
              if (src && src !== "Unknown" && src !== "entry" && src !== "none") {
                return `CVSS ${src}`
              }
              if (val != null && rawScores) {
                if (Math.abs(val - (rawScores.v40 ?? -999)) < tol) return "CVSS v4.0"
                if (Math.abs(val - (rawScores.v31 ?? -999)) < tol) return "CVSS v3.1"
                if (Math.abs(val - (rawScores.v30 ?? -999)) < tol) return "CVSS v3.0"
                if (Math.abs(val - (rawScores.v2 ?? -999)) < tol) return "CVSS v2.0"
              }
              return "CVSS (base)"
            })())
          ]),
          React.createElement('div', { key: 'dates', className: 'text-right' }, [
            React.createElement('div', { className: 'text-sm text-gray-500' }, 'Published'),
            React.createElement('div', { className: 'font-medium text-gray-800 dark:text-gray-100' }, 
              formatDate(fetchedRaw.published_at || fetchedRaw.cve_published)
            ),
            React.createElement('div', { className: 'text-sm text-gray-500 mt-2' }, 'Last modified'),
            React.createElement('div', { className: 'font-medium text-gray-800 dark:text-gray-100' }, 
              formatDate(fetchedRaw.last_modified)
            )
          ])
        ])
      ]),

      // Navigation tabs (matching VulnerabilityPage)
      React.createElement('div', { key: 'nav', className: 'mb-4' }, 
        React.createElement('nav', { className: 'sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-2' },
          React.createElement('div', { className: 'flex space-x-2' }, [
            React.createElement('button', {
              key: 'overview',
              className: `px-3 py-2 rounded ${tab === "overview" ? "bg-pink-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`,
              onClick: () => scrollToSection("overview")
            }, 'Overview'),
            React.createElement('button', {
              key: 'technical',
              className: `px-3 py-2 rounded ${tab === "technical" ? "bg-pink-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`,
              onClick: () => scrollToSection("technical")
            }, 'Technical'),
            React.createElement('button', {
              key: 'refs',
              className: `px-3 py-2 rounded ${tab === "refs" ? "bg-pink-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`,
              onClick: () => scrollToSection("references")
            }, 'References'),
            React.createElement('button', {
              key: 'timeline',
              className: `px-3 py-2 rounded ${tab === "timeline" ? "bg-pink-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`,
              onClick: () => scrollToSection("timeline")
            }, 'Timeline'),
            // Show KEV tab when vulnerability is in KEV catalog
            fetchedRaw.is_kev ? 
            React.createElement('button', {
              key: 'kev',
              className: `px-3 py-2 rounded ${tab === "kev" ? "bg-pink-500 text-white" : "bg-red-100 dark:bg-red-900"}`,
              onClick: () => scrollToSection("kev")
            }, React.createElement('span', { className: 'flex items-center gap-1' }, [
              React.createElement('span', { key: 'icon', className: 'text-xs bg-red-600 text-white px-1 rounded' }, 'KEV'),
              'Exploited'
            ])) : null,
            // Show curated tab when curated data is available
            (fetchedRaw.curated_title || fetchedRaw.curated_summary || fetchedRaw.curated_body_md || Object.keys(curatedExtras).length > 0) ? 
            React.createElement('button', {
              key: 'curated',
              className: `px-3 py-2 rounded ${tab === "curated" ? "bg-pink-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`,
              onClick: () => scrollToSection("curated")
            }, React.createElement('span', { className: 'flex items-center gap-1' }, [
              'Curated Analysis',
              React.createElement('span', { key: 'badge', className: 'text-xs bg-blue-600 text-white px-1 rounded' }, '✓')
            ])) : null
          ])
        )
      ),

      // Debug panel (matching VulnerabilityPage)
      showDebugPanel ? React.createElement('div', { key: 'debug', className: 'mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded' }, [
        React.createElement('div', { key: 'header', className: 'flex items-center justify-between' }, [
          React.createElement('div', { className: 'font-semibold' }, 'Debug Info'),
          React.createElement('div', { className: 'space-x-2' }, [
            React.createElement('button', {
              key: 'dump',
              onClick: () => console.debug("Debug dump", { cveId, fetchedRaw, rawScores, normalized, curatedExtras }),
              className: 'px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm'
            }, 'Dump Console'),
            React.createElement('button', {
              key: 'copy',
              onClick: () => {
                navigator.clipboard && navigator.clipboard.writeText(
                  JSON.stringify({ cveId, rawScores, curatedExtras }, null, 2)
                ).catch(() => {})
              },
              className: 'px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm'
            }, 'Copy Summary')
          ])
        ]),
        React.createElement('div', { key: 'content', className: 'mt-2 text-sm text-gray-700 dark:text-gray-200' }, [
          React.createElement('div', { key: 'cveid' }, [
            'cveId: ', React.createElement('span', { className: 'font-mono' }, cveId)
          ]),
          React.createElement('div', { key: 'fetched' }, [
            'fetchedRaw: ', React.createElement('span', { className: 'font-mono' }, fetchedRaw ? "present" : "none")
          ]),
          React.createElement('div', { key: 'scores' }, [
            'rawScores: ', React.createElement('span', { className: 'font-mono' }, rawScores ? JSON.stringify(rawScores) : "none")
          ]),
          React.createElement('div', { key: 'normalized' }, [
            'normalized: ', React.createElement('span', { className: 'font-mono' }, 
              normalized ? JSON.stringify({ severity: normalized.severity, cvss: normalized.cvss }) : "none"
            )
          ]),
          React.createElement('div', { key: 'curated' }, [
            'curatedExtras keys: ', React.createElement('span', { className: 'font-mono' }, Object.keys(curatedExtras).join(', '))
          ])
        ])
      ]) : null,

      // Main content grid (matching VulnerabilityPage layout)
      React.createElement('div', { key: 'content', className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' }, [
        // Left: main content (matching VulnerabilityPage structure)
        React.createElement('div', { key: 'main', className: 'lg:col-span-6' }, 
          React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded shadow' }, [
            // Overview section
            React.createElement('div', { key: 'overview', id: 'overview' }, [
              React.createElement('div', { key: 'content' }, [
                React.createElement('div', { key: 'header', className: 'flex items-start justify-between' }, [
                  React.createElement('h2', { className: 'text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4' }, 'Overview'),
                  React.createElement('button', {
                    onClick: () => setDescOpen(s => !s),
                    className: 'text-sm text-blue-600 dark:text-blue-400'
                  }, descOpen ? 'Collapse' : 'Expand')
                ]),
                descOpen ? React.createElement('div', { className: 'space-y-4' }, [
                  // Description
                  React.createElement('div', { key: 'desc' }, [
                    React.createElement('h3', { className: 'font-semibold mb-2' }, 'Description'),
                    React.createElement('p', { className: 'text-gray-700 dark:text-gray-200 whitespace-pre-wrap' }, 
                      normalized?.description ?? "No description available"
                    )
                  ]),
                  // Curated summary if different from description
                  fetchedRaw.curated_summary && fetchedRaw.curated_summary !== normalized?.description ? 
                  React.createElement('div', { key: 'curated-summary' }, [
                    React.createElement('h3', { className: 'font-semibold mb-2 text-blue-900 dark:text-blue-100' }, 'Curated Summary'),
                    React.createElement('p', { className: 'text-gray-700 dark:text-gray-200 whitespace-pre-wrap' }, 
                      fetchedRaw.curated_summary
                    )
                  ]) : null,
                  // Preferred Vector Summary
                  React.createElement('div', { key: 'vector' }, [
                    React.createElement('h3', { className: 'font-semibold mb-2' }, 'CVSS Assessment'),
                    React.createElement(PreferredVectorSummary, { normalized, rawScores })
                  ])
                ]) : null
              ])
            ]),

            React.createElement('hr', { key: 'hr1' }),

            // Technical section
            React.createElement('div', { key: 'technical', id: 'technical', className: 'mt-5' }, [
              React.createElement('h2', { className: 'text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4' }, 'Technical Details'),
              
              // CVSS Details
              rawScores ? React.createElement('div', { key: 'cvss-details', className: 'mb-6' }, [
                React.createElement('h3', { className: 'text-lg font-semibold mb-3' }, 'CVSS Metrics'),
                React.createElement('div', { className: 'space-y-4' }, [
                  rawScores.v40 ? React.createElement('div', { key: 'v40' }, [
                    React.createElement('h4', { className: 'font-medium' }, `CVSS v4.0: ${rawScores.v40}`),
                    React.createElement(CVSSVectorDisplay, { vector: rawScores.v40Vector, version: '4.0' })
                  ]) : null,
                  rawScores.v31 ? React.createElement('div', { key: 'v31' }, [
                    React.createElement('h4', { className: 'font-medium' }, `CVSS v3.1: ${rawScores.v31}`),
                    React.createElement(CVSSVectorDisplay, { vector: rawScores.v31Vector, version: '3.1' })
                  ]) : null,
                  rawScores.v30 ? React.createElement('div', { key: 'v30' }, [
                    React.createElement('h4', { className: 'font-medium' }, `CVSS v3.0: ${rawScores.v30}`),
                    React.createElement(CVSSVectorDisplay, { vector: rawScores.v30Vector, version: '3.0' })
                  ]) : null,
                  rawScores.v2 ? React.createElement('div', { key: 'v2' }, [
                    React.createElement('h4', { className: 'font-medium' }, `CVSS v2.0: ${rawScores.v2}`),
                    React.createElement(CVSSVectorDisplay, { vector: rawScores.v2Vector, version: '2.0' })
                  ]) : null
                ])
              ]) : null,

              // CWE Information
              normalized?.cwe_ids?.length ? React.createElement('div', { key: 'cwe', className: 'mb-6' }, [
                React.createElement('h3', { className: 'text-lg font-semibold mb-3' }, 'Weakness Types (CWE)'),
                React.createElement('div', { className: 'flex flex-wrap gap-2' }, 
                  normalized.cwe_ids.map((cwe, i) => 
                    React.createElement('span', { 
                      key: i, 
                      className: 'px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-full text-sm' 
                    }, cwe)
                  )
                )
              ]) : null
            ]),

            React.createElement('hr', { key: 'hr2' }),

            // References section
            React.createElement('div', { key: 'references', id: 'references', className: 'mt-5' }, [
              React.createElement('h2', { className: 'text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4' }, 'References'),
              normalized?.references?.length ? React.createElement('ul', { className: 'space-y-2' }, 
                normalized.references.map((ref, i) => 
                  React.createElement('li', { key: i }, [
                    React.createElement('a', { 
                      className: 'text-blue-600 dark:text-blue-400 hover:underline break-all',
                      href: ref.url,
                      target: '_blank',
                      rel: 'noreferrer'
                    }, ref.title || ref.url)
                  ])
                )
              ) : React.createElement('div', { className: 'text-gray-600' }, 'No references available')
            ]),

            React.createElement('hr', { key: 'hr3', className: 'mt-5' }),

            // Timeline section
            React.createElement('div', { key: 'timeline', id: 'timeline', className: 'mt-5' }, [
              React.createElement('h2', { className: 'text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4' }, 'Timeline'),
              React.createElement('div', { className: 'space-y-3' }, [
                React.createElement('div', { key: 'published' }, [
                  React.createElement('div', { className: 'font-semibold' }, 'CVE Published'),
                  React.createElement('div', { className: 'text-gray-600' }, formatDate(fetchedRaw.cve_published || fetchedRaw.original_data?.cve?.published))
                ]),
                React.createElement('div', { key: 'modified' }, [
                  React.createElement('div', { className: 'font-semibold' }, 'Last Modified'),
                  React.createElement('div', { className: 'text-gray-600' }, formatDate(fetchedRaw.last_modified || fetchedRaw.original_data?.cve?.lastModified))
                ]),
                fetchedRaw.published_at ? React.createElement('div', { key: 'curated' }, [
                  React.createElement('div', { className: 'font-semibold' }, 'Curated Published'),
                  React.createElement('div', { className: 'text-gray-600' }, formatDate(fetchedRaw.published_at))
                ]) : null,
                // KEV Information
                fetchedRaw.is_kev && fetchedRaw.kev_date_added ? React.createElement('div', { key: 'kev-added' }, [
                  React.createElement('div', { className: 'font-semibold text-red-700 dark:text-red-400' }, 'Added to KEV Catalog'),
                  React.createElement('div', { className: 'text-gray-600' }, formatDate(fetchedRaw.kev_date_added))
                ]) : null,
                fetchedRaw.is_kev && fetchedRaw.kev_due_date ? React.createElement('div', { key: 'kev-due' }, [
                  React.createElement('div', { className: 'font-semibold text-red-700 dark:text-red-400' }, 'KEV Due Date'),
                  React.createElement('div', { className: 'text-red-600 font-medium' }, formatDate(fetchedRaw.kev_due_date))
                ]) : null
              ])
            ]),

            // KEV Information section (if KEV)
            fetchedRaw.is_kev ? [
              React.createElement('hr', { key: 'hr-kev', className: 'mt-5' }),
              React.createElement('div', { key: 'kev-section', id: 'kev', className: 'mt-5' }, [
                React.createElement('h2', { className: 'text-xl font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2' }, [
                  React.createElement('span', { key: 'icon', className: 'px-2 py-1 bg-red-600 text-white text-sm rounded' }, 'KEV'),
                  'Known Exploited Vulnerability'
                ]),
                React.createElement('div', { className: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4' }, [
                  React.createElement('div', { key: 'warning', className: 'mb-4' }, [
                    React.createElement('p', { className: 'text-red-800 dark:text-red-200 font-medium' }, 
                      'This vulnerability is listed in CISA\'s Known Exploited Vulnerabilities (KEV) catalog, indicating active exploitation in the wild.'
                    )
                  ]),
                  fetchedRaw.kev_required_action ? React.createElement('div', { key: 'action', className: 'mb-4' }, [
                    React.createElement('h3', { className: 'text-lg font-semibold text-red-700 dark:text-red-300 mb-2' }, 'Required Action'),
                    React.createElement('p', { className: 'text-gray-700 dark:text-gray-200 whitespace-pre-wrap' }, fetchedRaw.kev_required_action)
                  ]) : null,
                  React.createElement('div', { key: 'dates', className: 'grid grid-cols-1 md:grid-cols-2 gap-4' }, [
                    fetchedRaw.kev_date_added ? React.createElement('div', { key: 'added' }, [
                      React.createElement('div', { className: 'text-sm font-medium text-red-700 dark:text-red-300' }, 'Date Added to KEV'),
                      React.createElement('div', { className: 'text-red-600 dark:text-red-400 font-semibold' }, formatDate(fetchedRaw.kev_date_added))
                    ]) : null,
                    fetchedRaw.kev_due_date ? React.createElement('div', { key: 'due' }, [
                      React.createElement('div', { className: 'text-sm font-medium text-red-700 dark:text-red-300' }, 'Due Date'),
                      React.createElement('div', { className: 'text-red-600 dark:text-red-400 font-semibold' }, formatDate(fetchedRaw.kev_due_date))
                    ]) : null
                  ])
                ])
              ])
            ] : null,

            // Curated Analysis section (only show if curated data exists)
            (fetchedRaw.curated_body_md || Object.keys(curatedExtras).length > 0) ? [
              React.createElement('hr', { key: 'hr4', className: 'mt-5' }),
              React.createElement('div', { key: 'curated', id: 'curated', className: 'mt-5' }, [
                React.createElement('h2', { className: 'text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4' }, 'Curated Analysis'),
                
                // Curated detailed body
                fetchedRaw.curated_body_md ? React.createElement('div', { key: 'body', className: 'mb-6' }, [
                  React.createElement('h3', { className: 'text-lg font-semibold mb-3' }, 'Detailed Analysis'),
                  React.createElement('div', { 
                    className: 'prose prose-sm max-w-none text-gray-800 dark:text-gray-100',
                    dangerouslySetInnerHTML: { __html: fetchedRaw.curated_body_md }
                  })
                ]) : null,

                // Technical Analysis
                curatedExtras.technical_analysis ? React.createElement('div', { key: 'tech', className: 'mb-4' }, [
                  React.createElement('h3', { className: 'text-lg font-semibold mb-2' }, 'Technical Analysis'),
                  React.createElement('p', { className: 'text-gray-700 dark:text-gray-200' }, curatedExtras.technical_analysis)
                ]) : null,

                // Business Impact
                curatedExtras.business_impact ? React.createElement('div', { key: 'business', className: 'mb-4' }, [
                  React.createElement('h3', { className: 'text-lg font-semibold mb-2' }, 'Business Impact'),
                  React.createElement('p', { className: 'text-gray-700 dark:text-gray-200' }, curatedExtras.business_impact)
                ]) : null,

                // Risk Assessment Grid
                (curatedExtras.risk_level || curatedExtras.priority || curatedExtras.exploitability) ? 
                React.createElement('div', { key: 'risk-grid', className: 'grid grid-cols-2 md:grid-cols-4 gap-4 mt-6' }, [
                  curatedExtras.exploitability ? React.createElement('div', { key: 'exploit', className: 'bg-gray-50 dark:bg-gray-700 p-3 rounded' }, [
                    React.createElement('div', { className: 'text-xs font-medium text-gray-600 dark:text-gray-400' }, 'Exploitability'),
                    React.createElement('div', { className: 'text-sm font-semibold' }, curatedExtras.exploitability)
                  ]) : null,
                  curatedExtras.confidentiality_impact ? React.createElement('div', { key: 'cia-c', className: 'bg-gray-50 dark:bg-gray-700 p-3 rounded' }, [
                    React.createElement('div', { className: 'text-xs font-medium text-gray-600 dark:text-gray-400' }, 'Confidentiality'),
                    React.createElement('div', { className: 'text-sm font-semibold' }, curatedExtras.confidentiality_impact)
                  ]) : null,
                  curatedExtras.integrity_impact ? React.createElement('div', { key: 'cia-i', className: 'bg-gray-50 dark:bg-gray-700 p-3 rounded' }, [
                    React.createElement('div', { className: 'text-xs font-medium text-gray-600 dark:text-gray-400' }, 'Integrity'),
                    React.createElement('div', { className: 'text-sm font-semibold' }, curatedExtras.integrity_impact)
                  ]) : null,
                  curatedExtras.availability_impact ? React.createElement('div', { key: 'cia-a', className: 'bg-gray-50 dark:bg-gray-700 p-3 rounded' }, [
                    React.createElement('div', { className: 'text-xs font-medium text-gray-600 dark:text-gray-400' }, 'Availability'),
                    React.createElement('div', { className: 'text-sm font-semibold' }, curatedExtras.availability_impact)
                  ]) : null,
                  curatedExtras.risk_level ? React.createElement('div', { key: 'risk', className: 'bg-gray-50 dark:bg-gray-700 p-3 rounded' }, [
                    React.createElement('div', { className: 'text-xs font-medium text-gray-600 dark:text-gray-400' }, 'Risk Level'),
                    React.createElement('div', { className: `text-sm font-semibold px-2 py-1 rounded ${severityColor(curatedExtras.risk_level)}` }, curatedExtras.risk_level)
                  ]) : null,
                  curatedExtras.priority ? React.createElement('div', { key: 'priority', className: 'bg-gray-50 dark:bg-gray-700 p-3 rounded' }, [
                    React.createElement('div', { className: 'text-xs font-medium text-gray-600 dark:text-gray-400' }, 'Priority'),
                    React.createElement('div', { className: `text-sm font-semibold px-2 py-1 rounded ${severityColor(curatedExtras.priority)}` }, curatedExtras.priority)
                  ]) : null
                ]) : null,

                // Dynamic Additional Curated Fields - handles all remaining fields including custom sections
                (() => {
                  // Define known fields that are already displayed above
                  const knownFields = new Set([
                    'cwe_ids', 'technical_analysis', 'business_impact', 'exploitability',
                    'confidentiality_impact', 'integrity_impact', 'availability_impact',
                    'risk_level', 'priority', 'affected_products'
                  ]);

                  // Get all remaining fields
                  const remainingFields = Object.keys(curatedExtras).filter(key => !knownFields.has(key));
                  
                  if (remainingFields.length === 0) return null;

                  return React.createElement('div', { key: 'additional-fields', className: 'mt-6' }, [
                    React.createElement('h3', { key: 'title', className: 'text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2' }, 
                      'Additional Curated Information'
                    ),
                    React.createElement('div', { key: 'content', className: 'space-y-4' }, 
                      remainingFields.map(fieldKey => {
                        const fieldValue = curatedExtras[fieldKey];
                        
                        // Handle different types of field values
                        if (typeof fieldValue === 'object' && fieldValue !== null) {
                          // This is a custom section (like "anything": {"Haha": "what"})
                          return React.createElement('div', { 
                            key: fieldKey, 
                            className: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4' 
                          }, [
                            React.createElement('h4', { 
                              key: 'section-title',
                              className: 'text-md font-semibold mb-3 text-blue-800 dark:text-blue-300 capitalize' 
                            }, fieldKey.replace(/_/g, ' ')),
                            React.createElement('div', { key: 'section-content', className: 'grid grid-cols-1 md:grid-cols-2 gap-3' },
                              Object.entries(fieldValue).map(([subKey, subValue]) => 
                                React.createElement('div', { 
                                  key: `${fieldKey}-${subKey}`,
                                  className: 'bg-white dark:bg-gray-800 p-3 rounded border border-blue-100 dark:border-blue-800' 
                                }, [
                                  React.createElement('div', { 
                                    key: 'sub-label',
                                    className: 'text-xs font-medium text-gray-600 dark:text-gray-400 mb-1' 
                                  }, subKey.replace(/_/g, ' ')),
                                  React.createElement('div', { 
                                    key: 'sub-value',
                                    className: 'text-sm text-gray-800 dark:text-gray-200 break-words' 
                                  }, String(subValue))
                                ])
                              )
                            )
                          ]);
                        } else if (Array.isArray(fieldValue)) {
                          // Handle arrays
                          return React.createElement('div', { 
                            key: fieldKey, 
                            className: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4' 
                          }, [
                            React.createElement('h4', { 
                              key: 'array-title',
                              className: 'text-md font-semibold mb-2 text-gray-800 dark:text-gray-200 capitalize' 
                            }, fieldKey.replace(/_/g, ' ')),
                            fieldValue.length > 0 ? 
                              React.createElement('div', { key: 'array-content', className: 'flex flex-wrap gap-2' },
                                fieldValue.map((item, index) => 
                                  React.createElement('span', { 
                                    key: index,
                                    className: 'bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-sm' 
                                  }, String(item))
                                )
                              ) :
                              React.createElement('div', { 
                                key: 'empty-array',
                                className: 'text-sm text-gray-500 dark:text-gray-400 italic' 
                              }, 'No items')
                          ]);
                        } else {
                          // Handle simple string/number values
                          return React.createElement('div', { 
                            key: fieldKey, 
                            className: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4' 
                          }, [
                            React.createElement('h4', { 
                              key: 'simple-title',
                              className: 'text-md font-semibold mb-2 text-gray-800 dark:text-gray-200 capitalize' 
                            }, fieldKey.replace(/_/g, ' ')),
                            React.createElement('div', { 
                              key: 'simple-value',
                              className: 'text-sm text-gray-700 dark:text-gray-300 break-words' 
                            }, String(fieldValue))
                          ]);
                        }
                      })
                    )
                  ]);
                })()
              ])
            ] : null
          ])
        )
      ])
    ])
  ])
}
