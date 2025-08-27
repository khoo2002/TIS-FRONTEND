# NSC-TIP Frontend (scalable)

This repository is a frontend-only scaffold (Vite + React + TypeScript + Tailwind) prepared for connecting to a future API backend.

Goals implemented here
- Responsive, componentized browser UI with sample widgets (CVE list, Threat feed).
- Light / dark theme toggle.
- Scalable project layout ready for expansion.

Recommended architecture & operations (meets user's non-functional requirements)

1) Scalability & availability
- Serve static build from a CDN-backed origin (Netlify, Vercel, CloudFront + S3) behind a regional load balancer.
- Use two or more regions for failover; configure DNS health checks (AWS Route53 or equivalent) to switch to healthy regions.
- Aim for multi-AZ hosting and an origin with automatic scaling to meet the 99.5% uptime target.

2) Redundancy & failover
- Deploy identical builds to at least two regions.
- Configure active-passive or active-active routing with health checks.
- Use immutable deployments and versioned assets to avoid cache poisoning.

3) Monitoring & alerting
- Collect metrics: availability (HTTP 200s), latency (p95/p99), error rates (4xx/5xx), and user-facing telemetry (JS errors via Sentry or LogRocket).
- Synthetic monitoring: run scheduled Canary tests from multiple regions.
- Alerts: set thresholds and integrate with PagerDuty/Slack/Teams. Example: uptime < 99.5% (24h window) triggers P1.

4) Observability
- Centralize logs/metrics (CloudWatch, Datadog, Prometheus + Grafana).
- Instrument front-end for RUM (Real User Monitoring) and collect trace data when possible.

5) CI/CD & release strategy
- GitHub Actions (or equivalent) building artifacts and running unit/lint tests.
- Automatic deployments on successful builds to staging; manual gate to production.

6) Next steps for backend integration
- Provide a small API contract: endpoints for /cves and /threats returning JSON arrays. Use feature flags for rollout.

How to run locally
1. Install dependencies: npm install
2. Start dev server: npm run dev

Notes
- This scaffold does not include production infra automation. I can add GitHub Actions, Dockerfile, or Terraform templates next.
