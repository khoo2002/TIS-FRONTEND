import { CanonicalCVE, CVSSMetric, Reference } from '../types/cve'

// Small set of heuristics to convert a variety of source payloads into CanonicalCVE
export function normalizeFromVuldb(payload: any): CanonicalCVE {
  const cve = payload.cve || payload
  const id = cve.id || cve.cveID || cve.cve_id

  const cvss: CVSSMetric[] = []
  if (cve.metrics?.cvssMetricV31) {
    for (const m of cve.metrics.cvssMetricV31) {
      cvss.push({ version: m.cvssData?.version, baseScore: m.cvssData?.baseScore, vectorString: m.cvssData?.vectorString, raw: m })
    }
  }
  if (cve.metrics?.cvssMetricV2) {
    for (const m of cve.metrics.cvssMetricV2) {
      cvss.push({ version: m.cvssData?.version, baseScore: m.cvssData?.baseScore, vectorString: m.cvssData?.vectorString, raw: m })
    }
  }
  if (cve.metrics?.cvssMetricV40) {
    for (const m of cve.metrics.cvssMetricV40) {
      cvss.push({ version: m.cvssData?.version, baseScore: m.cvssData?.baseScore, vectorString: m.cvssData?.vectorString, raw: m })
    }
  }

  const descriptions = Array.isArray(cve.descriptions) ? cve.descriptions : [{ lang: 'en', value: cve.descriptions || cve.description || '' }]

  const references: Reference[] = []
  if (Array.isArray(cve.references)) {
    for (const r of cve.references) {
      references.push({ url: r.url || r, source: r.source })
    }
  }
  if (Array.isArray(cve.references_urls)) {
    for (const u of cve.references_urls) references.push({ url: u })
  }

  const cwe_ids: string[] = []
  if (Array.isArray(cve.weaknesses)) {
    for (const w of cve.weaknesses) {
      if (Array.isArray(w.description)) {
        for (const d of w.description) if (d.value) cwe_ids.push(d.value)
      }
    }
  }
  if (Array.isArray(cve.cwes)) {
    for (const cw of cve.cwes) cwe_ids.push(cw)
  }

  return {
    id: id,
    descriptions,
    summary: descriptions.find((d: any) => d.lang === 'en')?.value,
    severity: (cve.vulnStatus || cve.baseSeverity || cve.severity || '') as string,
    cvss,
    cwe_ids: Array.from(new Set(cwe_ids)),
    references,
    published: cve.published || cve.dateAdded || null,
    lastModified: cve.lastModified || cve.last_modified || cve.updated_at || null,
    vulnStatus: cve.vulnStatus || null,
    sourceIdentifiers: [cve.sourceIdentifier || cve.source || payload.sourceIdentifier || 'unknown'],
    rawSources: [payload],
  }
}

export function mergeCanonical(sources: CanonicalCVE[]): CanonicalCVE {
  if (!sources.length) throw new Error('no sources')
  const base = { ...sources[0] }
  const id = base.id
  const descriptions = Array.from(new Map(sources.flatMap(s => s.descriptions).map(d => [d.lang + '|' + d.value, d])).values())
  const references = Array.from(new Map(sources.flatMap(s => s.references).map(r => [r.url, r])).values())
  const cwe_ids = Array.from(new Set(sources.flatMap(s => s.cwe_ids)))
  const cvss = Array.from(new Map(sources.flatMap(s => s.cvss).map(c => [String(c.version) + '|' + String(c.baseScore), c])).values())
  const severity = sources.reduce((best, s) => {
    const map: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
    const bestNum = map[best?.toUpperCase?.() ?? ''] ?? 0
    const curNum = map[s.severity?.toUpperCase?.() ?? ''] ?? 0
    return curNum > bestNum ? s.severity : best
  }, sources[0].severity)

  const published = sources.map(s => s.published).filter(Boolean).sort()[0] || null
  const lastModified = sources.map(s => s.lastModified).filter(Boolean).sort().reverse()[0] || null
  const sourceIdentifiers = Array.from(new Set(sources.flatMap(s => s.sourceIdentifiers)))

  return {
    id,
    descriptions,
    summary: descriptions.find((d: any) => d.lang === 'en')?.value,
    severity,
    cvss,
    cwe_ids,
    references,
    published,
    lastModified,
    vulnStatus: sources.map(s => s.vulnStatus).find(Boolean) || null,
    sourceIdentifiers,
    rawSources: sources.flatMap(s => s.rawSources || []),
  }
}
