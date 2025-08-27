import { payloadToSourceEntries } from './adapter'

describe('Adapter mapping for top-level cve object', () => {
  const testPayload = {
    cve: {
      id: 'CVE-2024-8068',
      cveTags: ['disputed'],
      metrics: {
        cvssMetricV31: [{
          cvssData: { baseScore: 8.0, vectorString: 'CVSS:3.1/AV:A/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H' }
        }]
      },
      published: '2024-11-12T18:15:47.450',
      vulnStatus: 'Analyzed',
      weaknesses: [{ description: [{ value: 'CWE-269' }] }],
      lastModified: '2025-08-26T01:00:02.657',
      sourceIdentifier: 'secure@citrix.com',
      descriptions: [{ lang: 'en', value: 'Test vulnerability description' }],
      references: [{ url: 'https://example.com/advisory' }]
    }
  }

  test('maps all previously unmapped top-level cve keys', () => {
    const entries = payloadToSourceEntries(testPayload)
    const entry = entries[0]

    // Verify all previously unmapped keys are now represented
    expect(entry.cve_id).toBe('CVE-2024-8068') // cve.id
    expect(entry.cve_tags).toEqual(['disputed']) // cve.cveTags
    expect(entry.raw_metrics).toBeDefined() // cve.metrics
    expect(entry.published_date).toBe('2024-11-12T18:15:47.450') // cve.published
    expect(entry.published_raw).toBe('2024-11-12T18:15:47.450') // cve.published
    expect(entry.severity).toBe('Analyzed') // cve.vulnStatus
    expect(entry.vuln_status_raw).toBe('Analyzed') // cve.vulnStatus
    expect(entry.weaknesses_raw).toBeDefined() // cve.weaknesses
    expect(entry.last_modified).toBe('2025-08-26T01:00:02.657') // cve.lastModified
    expect(entry.last_modified_raw).toBe('2025-08-26T01:00:02.657') // cve.lastModified
    expect(entry.source).toBe('secure@citrix.com') // cve.sourceIdentifier
    expect(entry.source_identifier_raw).toBe('secure@citrix.com') // cve.sourceIdentifier

    // Verify raw fields are included for debug panel
    expect(entry.raw_cve).toBeDefined()
    expect(entry.raw_payload).toBeDefined()
  })

  test('handles missing top-level cve gracefully', () => {
    const payloadWithoutCve = {
      id: 'CVE-2024-1234',
      published: '2024-01-01T00:00:00.000Z'
    }

    const entries = payloadToSourceEntries(payloadWithoutCve)
    const entry = entries[0]

    expect(entry.cve_id).toBe('CVE-2024-1234')
    expect(entry.published_date).toBe('2024-01-01T00:00:00.000Z')
  })
})
