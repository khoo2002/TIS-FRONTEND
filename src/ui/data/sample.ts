export const sampleCves = [
  {
    id: 'CVE-2025-2847',
    description:
      'Critical remote code execution vulnerability in network routers affecting packet processing engine. Allows unauthenticated attackers to execute arbitrary code.',
    cvss: 9.8,
    category: 'Network Device',
    product: 'ASR 9000 Series',
    time: '2 hours ago',
  },
  {
    id: 'CVE-2025-2834',
    description:
      'Authentication bypass vulnerability in network management software allowing unauthorized access to base station management functions.',
    cvss: 8.1,
    category: 'Software',
    product: 'eNodeB v22.1',
    time: '4 hours ago',
  },
  {
    id: 'CVE-2025-2819',
    description:
      'SQL injection vulnerability in network management system allowing unauthorized database access and potential service disruption.',
    cvss: 7.5,
    category: 'Management Tool',
    product: 'NetAct v6.5',
    time: '6 hours ago',
  },
  {
    id: 'CVE-2025-2801',
    description:
      'Cross-site scripting (XSS) vulnerability in web interface allowing session hijacking and privilege escalation.',
    cvss: 6.1,
    category: 'Software',
    product: 'OSS/BSS Web Interface',
    time: '8 hours ago',
  },
]

export const sampleThreats = [
  {
    source: 'CERT-Malaysia',
    time: '13:45 MYT',
    description:
      'APT group targeting Southeast Asian telecom infrastructure with new malware variant "TelecomSpy"',
    severity: 'high' as const,
  },
  {
    source: 'US-CERT',
    time: '12:20 MYT',
    description:
      'Increased scanning activity detected on 5G core network ports across multiple ISPs',
    severity: 'medium' as const,
  },
  {
    source: 'MISP-MY',
    time: '11:30 MYT',
    description: 'New IoCs related to telecom equipment compromise shared by regional partners',
    severity: 'low' as const,
  },
  {
    source: 'CyberSecurity Malaysia',
    time: '10:15 MYT',
    description: 'Security advisory: Patch management recommendations for critical infrastructure',
    severity: 'info' as const,
  },
]
