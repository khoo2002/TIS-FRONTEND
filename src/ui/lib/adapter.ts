import { normalizeFromVuldb } from './normalize'

export type SourceEntry = {
  cve_id: string
  description: string
  cvss_v3_score: number | null
  cvss_v3_vector: string | null
  cvss_v2_score: number | null
  cvss_v2_vector: string | null
  severity: string
  published_date: string | null
  last_modified: string | null
  cwe_ids: string[]
  reference_urls: string[]
  vulnerable_configurations: string[]
  source: string
  updated_at: string | null
  [key: string]: any
}

function extractConfigs(payload: any): string[] {
  const out: string[] = []
  const cfgs = payload.configurations ?? payload.cve?.configurations ?? []
  for (const cfg of cfgs) {
    for (const node of cfg.nodes ?? []) {
      for (const m of node.cpeMatch ?? []) {
        if (m.criteria) out.push(m.criteria)
      }
    }
  }
  return out
}

export function payloadToSourceEntries(payload: any): SourceEntry[] {
  const canonical = normalizeFromVuldb(payload)

  // prefer values from a top-level `cve` object when present
  const rawCve = payload?.cve ?? null
  const primary = rawCve ?? payload

  const cvssV3 = (canonical.cvss || [])
    .find((c: any) => String(c.version || '').startsWith('3')) ?? null
  const cvssV2 = (canonical.cvss || [])
    .find((c: any) => String(c.version || '').startsWith('2')) ?? null

  // helper to pull a value from canonical, falling back to primary (raw cve)
  const pick = (key: string, nested?: string) => {
    const can = (canonical as any)[key]
    if (can !== undefined && can !== null) return can
    if (!primary) return null
    return nested ? primary[key]?.[nested] ?? primary[key] ?? null : primary[key] ?? null
  }

  const entry: SourceEntry = {
    cve_id: (canonical.id ?? primary?.id) as string,
    description: (canonical.summary ?? pick('descriptions')?.[0]?.value ?? primary?.descriptions?.[0]?.value ?? '') as string,
    cvss_v3_score: cvssV3?.baseScore ?? primary?.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore ?? null,
    cvss_v3_vector: cvssV3?.vectorString ?? primary?.metrics?.cvssMetricV31?.[0]?.cvssData?.vectorString ?? null,
    cvss_v2_score: cvssV2?.baseScore ?? primary?.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore ?? null,
    cvss_v2_vector: cvssV2?.vectorString ?? primary?.metrics?.cvssMetricV2?.[0]?.cvssData?.vectorString ?? null,
    severity: canonical.severity ?? primary?.vulnStatus ?? 'UNKNOWN',
    published_date: canonical.published ?? primary?.published ?? null,
    last_modified: canonical.lastModified ?? primary?.lastModified ?? null,
    cwe_ids: canonical.cwe_ids ?? (primary?.weaknesses ? primary.weaknesses.map((w: any) => (w.description?.[0]?.value ?? w).toString()).filter(Boolean) : []),
    reference_urls: (canonical.references ?? primary?.references ?? []).map((r: any) => r?.url || r).filter(Boolean),
    vulnerable_configurations: extractConfigs(payload),
    source: (canonical.sourceIdentifiers && canonical.sourceIdentifiers[0]) || primary?.sourceIdentifier || 'unknown',
    updated_at: canonical.lastModified ?? canonical.published ?? primary?.lastModified ?? primary?.published ?? null,
    // include raw payload and some additional fields for diagnostics and richer UI
    raw_payload: payload,
    raw_metrics: primary?.metrics ?? payload?.metrics ?? null,
    descriptions: canonical.descriptions ?? primary?.descriptions ?? [],
    cisa_required_action: primary?.cisaRequiredAction ?? payload?.cisaRequiredAction ?? null,
    cisa_vulnerability_name: primary?.cisaVulnerabilityName ?? payload?.cisaVulnerabilityName ?? null,
    cisa_action_due: primary?.cisaActionDue ?? payload?.cisaActionDue ?? null,
    cisa_exploit_add: primary?.cisaExploitAdd ?? payload?.cisaExploitAdd ?? null,
    // expose raw cve object and commonly requested raw fields so they are not "unmapped"
    raw_cve: rawCve ?? null,
    cve_tags: primary?.cveTags ?? primary?.cve_tags ?? [],
    published_raw: primary?.published ?? payload?.published ?? null,
    vuln_status_raw: primary?.vulnStatus ?? payload?.vulnStatus ?? null,
    weaknesses_raw: primary?.weaknesses ?? payload?.weaknesses ?? [],
    last_modified_raw: primary?.lastModified ?? payload?.lastModified ?? null,
    source_identifier_raw: primary?.sourceIdentifier ?? payload?.sourceIdentifier ?? null,
  }

  return [entry]
}
