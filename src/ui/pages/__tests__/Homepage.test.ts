import { describe, it, expect } from 'vitest'
import { buildSearchParamsObj, mapApiRowToItem } from '../Homepage'
import { flattenFiltersApplied } from '../Homepage'

describe('buildSearchParamsObj', () => {
  it('builds repeated params and basic fields', () => {
    const params = buildSearchParamsObj({ q: 'router', severity_in: ['HIGH','CRITICAL'], sources: ['nvd','cisa'], limit: 25, offset: 0 })
    const s = params.toString()
    expect(s).toContain('q=router')
    // repeated params must appear
    expect(s).toContain('severity_in=HIGH')
    expect(s).toContain('severity_in=CRITICAL')
    expect(s).toContain('sources=nvd')
    expect(s).toContain('sources=cisa')
    expect(s).toContain('limit=25')
    expect(s).toContain('offset=0')
  })
})

describe('flattenFiltersApplied', () => {
  it('flattens object with arrays and scalars', () => {
    const f = { severity_in: ['HIGH','CRITICAL'], sources: ['nvd'], kev: true, note: 'applied' }
    const flat = flattenFiltersApplied(f)
    // expect entries for each array element and scalars
    expect(flat).toEqual(expect.arrayContaining([
      { key: 'severity_in', value: 'HIGH' },
      { key: 'severity_in', value: 'CRITICAL' },
      { key: 'sources', value: 'nvd' },
      { key: 'kev', value: true },
      { key: 'note', value: 'applied' }
    ]))
  })
})

describe('mapApiRowToItem', () => {
  it('maps a typical row correctly', () => {
    const row = {
      cve_id: 'CVE-2025-12345',
      description: 'Test description',
      cvss_v31_score: 7.5,
      cvss_v31_severity: 'HIGH',
      source: 'NVD',
      vendor: 'Acme',
      last_modified: '2025-08-26T15:15:35Z',
      table_source: 'nvd'
    }
    const out = mapApiRowToItem(row)
    expect(out.id).toBe('CVE-2025-12345')
    expect(out.cvss).toBe(7.5)
    expect(out.severity).toBe('HIGH')
    expect(out.category).toBe('NVD')
    expect(out.product).toBe('Acme')
  })
})
