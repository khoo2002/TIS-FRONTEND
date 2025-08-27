import { getAllSources } from './configLoader'

export async function applySourceUrlsToRecord(record: any, cveId: string) {
  const sources = await getAllSources()
  let canonicalPriority = record.__canonical_priority ?? 9999

  for (const [name, cfg] of Object.entries(sources)) {
    if (!cfg || !cfg.enabled || !cfg.urlTemplate || !cfg.updateKey) continue
    const url = cfg.urlTemplate.replace('{cveId}', encodeURIComponent(cveId))
    record[cfg.updateKey] = url
    if ((cfg.canonicalPriority ?? 9999) < canonicalPriority) {
      record.canonical_url = url
      canonicalPriority = cfg.canonicalPriority ?? 9999
      record.__canonical_priority = canonicalPriority
    }
  }

  return record
}
