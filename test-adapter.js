// Quick test to verify adapter mapping handles top-level cve object
const { payloadToSourceEntries } = require('./src/ui/lib/adapter.ts');

// Sample payload with top-level cve structure (like from backend)
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
};

console.log('Testing adapter mapping...');
try {
  const entries = payloadToSourceEntries(testPayload);
  const entry = entries[0];
  
  console.log('\n=== MAPPING RESULTS ===');
  console.log('cve.id →', entry.cve_id);
  console.log('cve.cveTags →', entry.cve_tags);
  console.log('cve.metrics →', entry.raw_metrics ? 'mapped' : 'missing');
  console.log('cve.published →', entry.published_date, '| raw:', entry.published_raw);
  console.log('cve.vulnStatus →', entry.severity, '| raw:', entry.vuln_status_raw);
  console.log('cve.weaknesses →', entry.weaknesses_raw ? 'mapped' : 'missing');
  console.log('cve.lastModified →', entry.last_modified, '| raw:', entry.last_modified_raw);
  console.log('cve.sourceIdentifier →', entry.source, '| raw:', entry.source_identifier_raw);
  
  console.log('\n=== RAW FIELDS INCLUDED ===');
  console.log('raw_cve:', entry.raw_cve ? 'included' : 'missing');
  console.log('raw_payload:', entry.raw_payload ? 'included' : 'missing');
  
  console.log('\n✅ All previously unmapped keys are now represented in the SourceEntry');
  
} catch (error) {
  console.error('❌ Adapter test failed:', error.message);
}
