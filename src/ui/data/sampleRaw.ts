export const sampleRaw = {
  cve: {
    id: 'CVE-2024-8068',
    cveTags: [],
    metrics: {
      cvssMetricV31: [
        {
          type: 'Primary',
          source: 'nvd@nist.gov',
          cvssData: {
            scope: 'UNCHANGED',
            version: '3.1',
            baseScore: 8.0,
            attackVector: 'ADJACENT_NETWORK',
            baseSeverity: 'HIGH',
            vectorString: 'CVSS:3.1/AV:A/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
            integrityImpact: 'HIGH',
            userInteraction: 'NONE',
            attackComplexity: 'LOW',
            availabilityImpact: 'HIGH',
            privilegesRequired: 'LOW',
            confidentialityImpact: 'HIGH',
          },
          impactScore: 5.9,
          exploitabilityScore: 2.1,
        },
      ],
      cvssMetricV40: [
        {
          type: 'Secondary',
          source: 'secure@citrix.com',
          cvssData: {
            Safety: 'NOT_DEFINED',
            version: '4.0',
            Recovery: 'NOT_DEFINED',
            baseScore: 5.1,
            Automatable: 'NOT_DEFINED',
            attackVector: 'ADJACENT',
            baseSeverity: 'MEDIUM',
            valueDensity: 'NOT_DEFINED',
            vectorString:
              'CVSS:4.0/AV:A/AC:L/AT:N/PR:L/UI:N/VC:L/VI:L/VA:L/SC:N/SI:N/SA:N/E:X/CR:X/IR:X/AR:X/MAV:X/MAC:X/MAT:X/MPR:X/MUI:X/MVC:X/MVI:X/MVA:X/MSC:X/MSI:X/MSA:X/S:X/AU:X/R:X/V:X/RE:X/U:X',
            exploitMaturity: 'NOT_DEFINED',
            providerUrgency: 'NOT_DEFINED',
            userInteraction: 'NONE',
            attackComplexity: 'LOW',
            attackRequirements: 'NONE',
            privilegesRequired: 'LOW',
            subIntegrityImpact: 'NONE',
            vulnIntegrityImpact: 'LOW',
            integrityRequirement: 'NOT_DEFINED',
            modifiedAttackVector: 'NOT_DEFINED',
            subAvailabilityImpact: 'NONE',
            vulnAvailabilityImpact: 'LOW',
            availabilityRequirement: 'NOT_DEFINED',
            modifiedUserInteraction: 'NOT_DEFINED',
            modifiedAttackComplexity: 'NOT_DEFINED',
            subConfidentialityImpact: 'NONE',
            vulnConfidentialityImpact: 'LOW',
            confidentialityRequirement: 'NOT_DEFINED',
            modifiedAttackRequirements: 'NOT_DEFINED',
            modifiedPrivilegesRequired: 'NOT_DEFINED',
            modifiedSubIntegrityImpact: 'NOT_DEFINED',
            modifiedVulnIntegrityImpact: 'NOT_DEFINED',
            vulnerabilityResponseEffort: 'NOT_DEFINED',
            modifiedSubAvailabilityImpact: 'NOT_DEFINED',
            modifiedVulnAvailabilityImpact: 'NOT_DEFINED',
            modifiedSubConfidentialityImpact: 'NOT_DEFINED',
            modifiedVulnConfidentialityImpact: 'NOT_DEFINED',
          },
        },
      ],
    },
    published: '2024-11-12T18:15:47.450',
    references: [
      {
        url: 'https://support.citrix.com/s/article/CTX691941-citrix-session-recording-security-bulletin-for-cve20248068-and-cve20248069?language=en_US',
        tags: ['Vendor Advisory'],
        source: 'secure@citrix.com',
      },
    ],
    vulnStatus: 'Analyzed',
    weaknesses: [
      {
        type: 'Secondary',
        source: 'secure@citrix.com',
        description: [{ lang: 'en', value: 'CWE-269' }],
      },
    ],
    descriptions: [
      {
        lang: 'en',
        value:
          'Privilege escalation to NetworkService Account access in Citrix Session Recording when an attacker is an authenticated user in the same Windows Active Directory domain as the session recording server domain',
      },
      {
        lang: 'es',
        value:
          'Escalada de privilegios para acceder a la cuenta de NetworkService en Citrix Session Recording cuando un atacante es un usuario autenticado en el mismo dominio de Windows Active Directory que el dominio del servidor de grabación de sesiones',
      },
    ],
    lastModified: '2025-08-26T01:00:02.657',
    cisaActionDue: '2025-09-15',
    cisaExploitAdd: '2025-08-25',
    configurations: [
      {
        nodes: [
          {
            negate: false,
            cpeMatch: [
              {
                criteria: 'cpe:2.3:a:citrix:session_recording:*:*:*:*:-:*:*:*',
                vulnerable: true,
                matchCriteriaId: 'FCF54DB8-BBE4-4E48-9037-6FD0E3E3426E',
                versionEndExcluding: '2407',
              },
              {
                criteria: 'cpe:2.3:a:citrix:session_recording:1912:-:*:*:ltsr:*:*:*',
                vulnerable: true,
                matchCriteriaId: '7F7F0822-5777-4970-A81F-2FECDE137E53',
              },
              {
                criteria: 'cpe:2.3:a:citrix:session_recording:1912:cu1:*:*:ltsr:*:*:*',
                vulnerable: true,
                matchCriteriaId: 'E0A17B51-A720-4DB7-BF84-CE13B9517C91',
              },
            ],
            operator: 'OR',
          },
        ],
      },
    ],
    sourceIdentifier: 'secure@citrix.com',
    cisaRequiredAction:
      'Apply mitigations per vendor instructions, follow applicable BOD 22-01 guidance for cloud services, or discontinue use of the product if mitigations are unavailable.',
    cisaVulnerabilityName:
      'Citrix Session Recording Improper Privilege Management Vulnerability',
  },
}
