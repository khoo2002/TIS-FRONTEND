import yaml from 'js-yaml'

type SourceConfig = {
  enabled?: boolean
  urlTemplate?: string
  updateKey?: string
  canonicalPriority?: number
}

type ConfigFile = {
  sources?: Record<string, SourceConfig>
}

let cached: ConfigFile | null = null

async function fetchYaml(path = '/config/cve-sources.yml'): Promise<ConfigFile> {
  if (cached) return cached
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Unable to load config: ${res.status}`)
  const text = await res.text()

  // Perform env substitution for Vite env vars: ${VITE_FOO} -> import.meta.env.VITE_FOO
  const substituted = text.replace(/\$\{([A-Z0-9_]+)\}/g, (_, name) => {
    // @ts-ignore
    const v = import.meta.env[name]
    return typeof v === 'undefined' ? '' : String(v)
  })

  const parsed = yaml.load(substituted) as ConfigFile
  cached = parsed
  return parsed
}

export async function getSourceConfig(sourceName: string): Promise<SourceConfig | null> {
  const cfg = await fetchYaml()
  return cfg.sources?.[sourceName] ?? null
}

export async function buildSourceUrl(sourceName: string, cveId: string): Promise<string | null> {
  const s = await getSourceConfig(sourceName)
  if (!s || !s.enabled || !s.urlTemplate) return null
  return s.urlTemplate.replace('{cveId}', encodeURIComponent(cveId))
}

export async function getAllSources(): Promise<Record<string, SourceConfig>> {
  const cfg = await fetchYaml()
  return cfg.sources ?? {}
}
