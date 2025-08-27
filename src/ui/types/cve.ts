export type CVSSMetric = {
  version?: string
  baseScore?: number | null
  vectorString?: string | null
  // keep original bucket for any provider-specific fields
  raw?: Record<string, any>
}

export type Reference = {
  url: string
  source?: string
}

export type CanonicalCVE = {
  id: string
  descriptions: { lang: string; value: string }[]
  summary?: string
  severity?: string
  cvss: CVSSMetric[]
  cwe_ids: string[]
  references: Reference[]
  published?: string | null
  lastModified?: string | null
  vulnStatus?: string | null
  sourceIdentifiers: string[] // list of source identifiers that contributed
  rawSources?: any[]
}
