import React, { useMemo, useState, useEffect } from "react";
import { authFetch, getUserInfo } from "../../lib/auth";
import { hasPermission } from "../../lib/rbac";
import { payloadToSourceEntries } from "../../lib/adapter";
import { sampleRaw as _sampleRaw } from "../../data/sampleRaw";

// utils copied from VulnerabilityPage
function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toISOString().replace("T", " ").split(".")[0];
  } catch (e) {
    return String(d);
  }
}

function severityLevel(s: string) {
  if (!s) return 0;
  const map: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
  return map[s.toUpperCase()] ?? 0;
}

function severityColor(s: string) {
  const sev = s?.toUpperCase();
  if (sev === "CRITICAL") return "bg-red-700 text-white";
  if (sev === "HIGH") return "bg-red-500 text-white";
  if (sev === "MEDIUM") return "bg-yellow-400 text-black";
  return "bg-green-400 text-black";
}

function CVSSDonut({ score }: { score: number | null }) {
  const pct = score && score > 0 ? Math.max(0, Math.min(100, (score / 10) * 100)) : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;
  const remaining = circumference - dash;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden>
      <g transform="translate(50,50)">
        <circle r={radius} stroke="#e5e7eb" strokeWidth={10} fill="none" />
        <circle
          r={radius}
          stroke="#ec4899"
          strokeWidth={10}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${remaining}`}
          transform="rotate(-90)"
        />
        <text x="0" y="6" textAnchor="middle" fontSize={14} className="text-gray-800 dark:text-gray-100">
          {score?.toFixed(1) ?? "—"}
        </text>
      </g>
    </svg>
  );
}

// Simple editable primitives with placeholder + data-original-value
const EditableText = ({
  value,
  onChange,
  placeholder,
  multiline = false,
  originalValue = "",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean | number;
  originalValue?: string;
  className?: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const save = () => {
    onChange(draft);
    setEditing(false);
  };
  if (editing) {
    return multiline ? (
      <textarea
        className={`w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 ${className}`}
        rows={typeof multiline === "number" ? multiline : 3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && save()}
        placeholder={originalValue || placeholder}
        data-original-value={originalValue}
        autoFocus
      />
    ) : (
      <input
        className={`w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 ${className}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder={originalValue || placeholder}
        data-original-value={originalValue}
        autoFocus
      />
    );
  }
  return (
    <div
      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded min-h-[1.5rem] ${className}`}
      onClick={() => setEditing(true)}
      data-original-value={originalValue}
    >
      {value || <span className="text-gray-400 italic">{originalValue || placeholder || "Click to edit..."}</span>}
    </div>
  );
};

const EditableSelect = ({
  value,
  options,
  onChange,
  originalValue = "",
  className = "",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  originalValue?: string;
  className?: string;
}) => {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <select
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setEditing(false);
        }}
        onBlur={() => setEditing(false)}
        className={`px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 ${className}`}
        data-original-value={originalValue}
        autoFocus
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <div
      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded min-h-[1.5rem] ${className}`}
      onClick={() => setEditing(true)}
      data-original-value={originalValue}
    >
      {options.find((o) => o.value === value)?.label || value || (
        <span className="text-gray-400 italic">{originalValue || "Click to select..."}</span>
      )}
    </div>
  );
};

const CVSSVector = ({
  value,
  onChange,
  version = "3.1",
  originalValue = "",
}: {
  value: string;
  onChange: (v: string) => void;
  version?: string;
  originalValue?: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const save = () => {
    onChange(draft);
    setEditing(false);
  };
  let display = draft || "";
  if (display && !/\bCVSS[:]?/i.test(display)) display = `CVSS:${version}/${display}`;
  return editing ? (
    <input
      className="w-full text-xs px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === "Enter" && save()}
      placeholder={originalValue || "Enter CVSS vector..."}
      data-original-value={originalValue}
      autoFocus
    />
  ) : (
    <div
      className="text-xs break-all cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-1 rounded"
      onClick={() => setEditing(true)}
      data-original-value={originalValue}
    >
      {display || <span className="text-gray-400 italic">{originalValue || "Click to edit vector..."}</span>}
    </div>
  );
};

// Types
type SourceEntry = {
  cve_id: string;
  description: string;
  cvss_v3_score: number | null;
  cvss_v3_vector: string | null;
  cvss_v2_score: number | null;
  cvss_v2_vector: string | null;
  severity?: string;
  published_date?: string | null;
  last_modified?: string | null;
  cwe_ids?: string[];
  reference_urls?: string[];
  vulnerable_configurations?: string[];
  source?: string;
  updated_at?: string | null;
  cisa_exploit_add?: string | null;
  cisa_required_action?: string | null;
  cisa_vulnerability_name?: string | null;
  cisa_action_due?: string | null;
  [key: string]: any;
};

export default function CurationEditPage() {
  const path = window.location.pathname || "";
  const cveId = decodeURIComponent(path.replace(/^\/curation\/edit\//, ""));
  const user = getUserInfo();
  const allowSampleFallback =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("useSample") === "true";

  const navigate = (url: string) => {
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  if (!hasPermission(user, "ADMIN_FUNCTIONS")) {
    navigate("/");
    return null;
  }

  // data states
  const [fetchedRaw, setFetchedRaw] = useState<any | null>(null);
  const [entries, setEntries] = useState<SourceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [initFromOriginal, setInitFromOriginal] = useState(false);

  // curation status states
  const [curationStatus, setCurationStatus] = useState<any | null>(null);
  const [curationLoading, setCurationLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // parse sample for local use only (like VulnerabilityPage)
  const sampleRaw = _sampleRaw ? [_sampleRaw] : [];
  const parsedSamples = useMemo(() => {
    try {
      return sampleRaw
        .map((s: any) => {
          try {
            if (typeof s === "string") return JSON.parse(s);
            return s;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as any[];
    } catch {
      return [] as any[];
    }
  }, []);

  // raw payload
  const rawPayload = useMemo(() => {
    return (
      fetchedRaw ?? (allowSampleFallback && parsedSamples.length ? parsedSamples[0] : null)
    );
  }, [fetchedRaw, parsedSamples, allowSampleFallback]);

  // raw scores extraction
  const rawScores = useMemo(() => {
    if (!rawPayload) return null;
    try {
      const metrics = rawPayload.cve?.metrics || {};
      const rawV2 = metrics.cvssMetricV2?.[0]?.cvssData?.baseScore ?? null;
      const v2 = rawV2 !== null && rawV2 !== undefined && rawV2 !== "" ? Number(rawV2) : null;
      const v2Vector = metrics.cvssMetricV2?.[0]?.cvssData?.vectorString ?? null;
      const rawV30 = metrics.cvssMetricV30?.[0]?.cvssData?.baseScore ?? null;
      const v30 = rawV30 !== null && rawV30 !== undefined && rawV30 !== "" ? Number(rawV30) : null;
      const v30Vector = metrics.cvssMetricV30?.[0]?.cvssData?.vectorString ?? null;
      const rawV31 = metrics.cvssMetricV31?.[0]?.cvssData?.baseScore ?? null;
      const v31 = rawV31 !== null && rawV31 !== undefined && rawV31 !== "" ? Number(rawV31) : null;
      const v31Vector = metrics.cvssMetricV31?.[0]?.cvssData?.vectorString ?? null;
      const rawV40 = metrics.cvssMetricV40?.[0]?.cvssData?.baseScore ?? null;
      const v40 = rawV40 !== null && rawV40 !== undefined && rawV40 !== "" ? Number(rawV40) : null;
      const v40Vector = metrics.cvssMetricV40?.[0]?.cvssData?.vectorString ?? null;
      return { v2, v2Vector, v30, v30Vector, v31, v31Vector, v40, v40Vector };
    } catch {
      return null;
    }
  }, [rawPayload]);

  // derived original entries
  const originalEntries = useMemo(() => {
    try {
      if (entries.length) return entries;
      if (rawPayload) {
        const out = payloadToSourceEntries(rawPayload);
        return Array.isArray(out) ? out : [];
      }
      return [] as any[];
    } catch {
      return [] as any[];
    }
  }, [entries, rawPayload]);

  // normalized aggregate
  const normalized = useMemo(() => {
    if (!originalEntries.length) return null;
    const severity = originalEntries.reduce(
      (best: any, e: any) => (severityLevel(e.severity) > severityLevel(best) ? e.severity : best),
      originalEntries[0].severity
    );
    const cvss = originalEntries.reduce((m: number | null, e: any) => {
      const cands: Array<number | null> = [];
      if (e.cvss_v3_score !== undefined) cands.push(Number(e.cvss_v3_score) || null);
      if (e.cvss_v2_score !== undefined) cands.push(Number(e.cvss_v2_score) || null);
      const v = cands.filter(Boolean).length ? Math.max(...(cands.filter(Boolean) as number[])) : null;
      return v && v > (m ?? 0) ? v : m;
    }, null as number | null);

    let bestRawScore: number | null = null;
    let bestRawVersion: string | null = null;
    if (rawScores) {
      const cands: Array<{ ver: string; score: number | null }> = [
        { ver: "v4.0", score: rawScores.v40 ?? null },
        { ver: "v3.1", score: rawScores.v31 ?? null },
        { ver: "v3.0", score: rawScores.v30 ?? null },
        { ver: "v2.0", score: rawScores.v2 ?? null },
      ];
      for (const c of cands) {
        if (c.score !== null && !Number.isNaN(Number(c.score))) {
          const s = Number(c.score);
          if (bestRawScore === null || s > bestRawScore) {
            bestRawScore = s;
            bestRawVersion = c.ver;
          }
        }
      }
    }
    let preferredCvss: number | null = null;
    let preferredSrc = "Unknown";
    if (cvss !== null && !Number.isNaN(Number(cvss))) {
      preferredCvss = Number(cvss);
      preferredSrc = "entry";
    }
    if (bestRawScore !== null) {
      if (preferredCvss === null || bestRawScore > preferredCvss) {
        preferredCvss = bestRawScore;
        preferredSrc = bestRawVersion ?? "raw";
      }
    }

    const description = originalEntries.find((e: any) => e.description)?.description ?? "";
    const cwe_ids = Array.from(new Set(originalEntries.flatMap((e: any) => e.cwe_ids ?? [])));
    const references = Array.from(new Set(originalEntries.flatMap((e: any) => e.reference_urls ?? [])));

    return { severity, cvss: preferredCvss, description, cwe_ids, references, all_cvss_scores: rawScores, preferred_cvss_source: preferredSrc };
  }, [originalEntries, rawScores]);

  // editable models
  const [editable, setEditable] = useState({
    description: "",
    severity: "",
    cvssScore: 0,
    cvssVector: "",
    cweIds: [] as string[],
    referenceUrls: [] as string[],
    publishedDate: "",
    lastModified: "",
  });

  const [curation, setCuration] = useState({
    technicalAnalysis: "",
    exploitability: "Unknown",
    businessImpact: "",
    affectedSystems: "",
    riskLevel: "Medium",
    priority: "Medium",
    confidentialityImpact: "None",
    integrityImpact: "None",
    availabilityImpact: "None",
    remediationSteps: "",
    workarounds: "",
    mitigationStrategies: "",
    patchAvailable: "Unknown",
    patchComplexity: "Medium",
    threatActors: "",
    exploitInWild: "No",
    exploitComplexity: "High",
    attackVector: "Network",
    assetCriticality: "Medium",
    environmentalScore: 0,
    temporalScore: 0,
    analystNotes: "",
    reviewStatus: "Draft",
    assignedAnalyst: "",
    reviewDate: "",
    approvalRequired: false,
    // CISA KEV fields
    cisaActionDue: "",
    cisaExploitAdd: "",
    cisaRequiredAction: "",
    cisaVulnerabilityName: "",
  });

  // Custom sections state - for unlimited user-defined sections
  const [customSections, setCustomSections] = useState<Array<{
    id: string;
    name: string;
    fields: Array<{ key: string; value: string }>;
  }>>([]);

  // fetch data
  useEffect(() => {
    (async () => {
      if (!cveId) return;
      try {
        setLoading(true);
        const resp = await authFetch(`/cve/${encodeURIComponent(cveId)}`, {
          headers: { accept: "application/json" },
        });
        if (!resp.ok) throw new Error(`Failed to fetch vulnerability data (${resp.status})`);
        const ct = resp.headers.get("content-type") || "";
        if (!/application\/json/i.test(ct)) throw new Error("Server returned non-JSON response");
        const body = await resp.json();

        // Parse JSONB-like `data` field if present
        let payload: any = body;
        try {
          if (body && typeof body.data === "string") {
            const parsed = JSON.parse(body.data);
            payload = parsed && typeof parsed === "object" ? parsed : body;
          } else if (body && typeof body.data === "object") {
            payload = body.data;
          }
        } catch {
          // fall back to body as-is
          payload = body;
        }

        setFetchedRaw(payload);
        const srcEntries = payloadToSourceEntries(payload);
        setEntries(srcEntries as SourceEntry[]);
        if (srcEntries.length > 0) {
          const e = srcEntries[0] as SourceEntry;
          setEditable({
            description: e.description || "",
            severity: e.severity || "",
            cvssScore: (e.cvss_v3_score ?? e.cvss_v2_score ?? 0) as number,
            cvssVector: (e.cvss_v3_vector ?? e.cvss_v2_vector ?? "") as string,
            cweIds: e.cwe_ids || [],
            referenceUrls: e.reference_urls || [],
            publishedDate: e.published_date || "",
            lastModified: (e.last_modified || e.updated_at || "") as string,
          });
        }
      } catch (err: any) {
        setError(err?.message || "Unknown error");
        // dev fallback for local testing only
        if (allowSampleFallback) {
          setFetchedRaw(parsedSamples[0] ?? null);
          try {
            const srcEntries = parsedSamples[0] ? payloadToSourceEntries(parsedSamples[0]) : [];
            setEntries(srcEntries as SourceEntry[]);
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [cveId, allowSampleFallback, parsedSamples]);

  // backfill from normalized if empty
  useEffect(() => {
    if (!normalized || initFromOriginal) return;
    const allEmpty = Object.values(editable).every((v) => (Array.isArray(v) ? v.length === 0 : !v));
    if (allEmpty) {
      setEditable((prev) => ({
        ...prev,
        description: normalized.description || prev.description,
        severity: (normalized.severity as string) || prev.severity,
        cvssScore: (normalized.cvss as number) || prev.cvssScore,
        cweIds: normalized.cwe_ids || prev.cweIds,
        referenceUrls: normalized.references || prev.referenceUrls,
      }));
      setInitFromOriginal(true);
    }
  }, [normalized, editable, initFromOriginal]);

  // Function to fetch full curation data and populate form fields
  const fetchFullCurationData = async (mounted: boolean) => {
    try {
      console.log("=== Fetching Full Curation Data ===");
      
      // Try the admin full endpoint first
      let resp = await authFetch(
        `/admin/curations/${encodeURIComponent(cveId)}/full`,
        { headers: { accept: "application/json" } }
      );

      // If that fails, try the public endpoint which contains the curated data
      if (!resp.ok) {
        console.log("Admin full endpoint failed, trying public endpoint");
        resp = await authFetch(
          `/public/cve/${encodeURIComponent(cveId)}`,
          { headers: { accept: "application/json" } }
        );
      }

      if (!resp.ok) {
        console.log("Failed to fetch curation data from any endpoint:", resp.status);
        return;
      }

      const fullCurationData = await resp.json();
      console.log("Full curation data received:", fullCurationData);

      if (!mounted) return;

      // Check if this has curated data - it's nested in curation object
      const curationData = fullCurationData.curation;
      if (!curationData || !curationData.public_extras) {
        console.log("No public_extras found in response - checking structure:", {
          hasCuration: !!curationData,
          hasPublicExtras: !!curationData?.public_extras,
          curationKeys: curationData ? Object.keys(curationData) : 'N/A'
        });
        return;
      }

      // Parse public_extras - it might be a string or object
      let extras;
      try {
        extras = typeof curationData.public_extras === 'string' 
          ? JSON.parse(curationData.public_extras)
          : curationData.public_extras;
        console.log("Parsed public_extras:", extras);
      } catch (e) {
        console.log("Failed to parse public_extras:", e);
        return;
      }

      // Populate editable fields
      setEditable(prev => ({
        ...prev,
        description: fullCurationData.curated_title || prev.description,
        cweIds: extras.cwe_ids || prev.cweIds,
        referenceUrls: fullCurationData.references ? 
          JSON.parse(fullCurationData.references).map((ref: any) => ref.url) : prev.referenceUrls,
      }));

      // Populate curation fields
      setCuration(prev => ({
        ...prev,
        technicalAnalysis: extras.technical_analysis || prev.technicalAnalysis,
        businessImpact: extras.business_impact || prev.businessImpact,
        exploitability: extras.exploitability || prev.exploitability,
        riskLevel: extras.risk_level || prev.riskLevel,
        priority: extras.priority || prev.priority,
        confidentialityImpact: extras.confidentiality_impact || prev.confidentialityImpact,
        integrityImpact: extras.integrity_impact || prev.integrityImpact,
        availabilityImpact: extras.availability_impact || prev.availabilityImpact,
        remediationSteps: extras.remediation_steps || prev.remediationSteps,
        workarounds: extras.workarounds || prev.workarounds,
        mitigationStrategies: extras.mitigation_strategies || prev.mitigationStrategies,
        patchAvailable: extras.patch_available || prev.patchAvailable,
        patchComplexity: extras.patch_complexity || prev.patchComplexity,
        threatActors: extras.threat_actors || prev.threatActors,
        exploitInWild: extras.exploit_in_wild || prev.exploitInWild,
        exploitComplexity: extras.exploit_complexity || prev.exploitComplexity,
        attackVector: extras.attack_vector || prev.attackVector,
        assetCriticality: extras.asset_criticality || prev.assetCriticality,
        environmentalScore: extras.environmental_score || prev.environmentalScore,
        temporalScore: extras.temporal_score || prev.temporalScore,
        analystNotes: extras.analyst_notes || prev.analystNotes,
        assignedAnalyst: extras.assigned_analyst || prev.assignedAnalyst,
        reviewDate: extras.review_date || prev.reviewDate,
        reviewStatus: curationData.curation_status || prev.reviewStatus,
        // CISA KEV fields from CVE data
        cisaActionDue: curationData.curated_data?.cve?.cisaActionDue || prev.cisaActionDue,
        cisaExploitAdd: curationData.curated_data?.cve?.cisaExploitAdd || prev.cisaExploitAdd,
        cisaRequiredAction: curationData.curated_data?.cve?.cisaRequiredAction || prev.cisaRequiredAction,
        cisaVulnerabilityName: curationData.curated_data?.cve?.cisaVulnerabilityName || prev.cisaVulnerabilityName,
      }));

      // Populate custom sections from public_extras
      console.log("=== Processing Custom Sections ===");
      console.log("All extras keys:", Object.keys(extras));
      console.log("All extras data:", extras);
      
      const knownFields = new Set([
        'cwe_ids', 'technical_analysis', 'business_impact', 'exploitability',
        'confidentiality_impact', 'integrity_impact', 'availability_impact',
        'risk_level', 'priority', 'affected_products', 'remediation_steps',
        'workarounds', 'mitigation_strategies', 'patch_available', 'patch_complexity',
        'threat_actors', 'exploit_in_wild', 'exploit_complexity', 'attack_vector',
        'asset_criticality', 'environmental_score', 'temporal_score', 'analyst_notes',
        'assigned_analyst', 'review_date', 'cisa_action_due', 'cisa_exploit_add',
        'cisa_required_action', 'cisa_vulnerability_name'
      ]);

      // Filter out known fields first
      const unknownKeys = Object.keys(extras).filter(key => !knownFields.has(key));
      console.log("Unknown keys (potential custom sections):", unknownKeys);
      
      // Then filter for objects (actual custom sections)
      const customSectionKeys = unknownKeys.filter(key => {
        const value = extras[key];
        const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
        console.log(`Key "${key}": type=${typeof value}, isObject=${isObject}, value=`, value);
        return isObject;
      });
      
      console.log("Custom section keys found:", customSectionKeys);

      const customSectionsData = customSectionKeys.map((sectionKey, index) => {
        const sectionData = extras[sectionKey];
        console.log(`Processing custom section "${sectionKey}":`, sectionData);
        
        const fields = Object.entries(sectionData).map(([fieldKey, fieldValue]) => ({
          key: fieldKey,
          value: String(fieldValue)
        }));
        
        const section = {
          id: `loaded_section_${index}_${Date.now()}`,
          name: sectionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          fields: fields
        };
        
        console.log(`Created section:`, section);
        return section;
      });

      console.log("Final custom sections data:", customSectionsData);
      
      if (customSectionsData.length > 0) {
        console.log("Setting custom sections state with:", customSectionsData);
        setCustomSections(customSectionsData);
      } else {
        console.log("No custom sections found to load");
      }
    } catch (e) {
      console.log("Error fetching full curation data:", e);
    }
  };

  // Fetch curation status
  useEffect(() => {
    if (!cveId) return;
    let mounted = true;
    (async () => {
      try {
        setCurationLoading(true);
        console.log("=== Fetching Curation Status for Edit Page ===");
        console.log("Curation API URL:", `/admin/curations/${encodeURIComponent(cveId)}/status`);

        const resp = await authFetch(
          `/admin/curations/${encodeURIComponent(cveId)}/status`,
          { headers: { accept: "application/json" } }
        );
        
        console.log("Curation response status:", resp.status, resp.statusText);

        if (resp.ok) {
          const curationData = await resp.json();
          console.log("Curation status data:", curationData);
          if (mounted) {
            setCurationStatus(curationData);
            // If curation exists, fetch the full data to populate form
            if (curationData && curationData.status) {
              console.log("Curation exists with status:", curationData.status, "- fetching full data");
              await fetchFullCurationData(mounted);
            } else {
              console.log("No curation status found, not fetching full data");
            }
          }
        } else if (resp.status === 404) {
          console.log("No curation found for this CVE - this is a new curation");
          if (mounted) setCurationStatus(null);
        } else {
          console.log("Error fetching curation status:", resp.status);
        }
      } catch (e) {
        console.log("Curation fetch error:", e);
      } finally {
        if (mounted) setCurationLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [cveId]);

  const handleSave = async (publish = false) => {
    // Build payload per backend spec for upsert
    const title = (editable.description || "").split(/\r?\n/)[0].slice(0, 120);
    const references = (editable.referenceUrls || []).filter(Boolean).map((url) => ({ url }));
    const affected_products = (curation.affectedSystems || "")
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const curated_patch: any = {
      cve: {
        metrics: {
          cvssMetricV31: [
            {
              cvssData: {
                baseScore: Number(editable.cvssScore) || undefined,
                baseSeverity: editable.severity || undefined,
              },
            },
          ],
        },
        // CISA KEV fields
        ...(curation.cisaActionDue && { cisaActionDue: curation.cisaActionDue }),
        ...(curation.cisaExploitAdd && { cisaExploitAdd: curation.cisaExploitAdd }),
        ...(curation.cisaRequiredAction && { cisaRequiredAction: curation.cisaRequiredAction }),
        ...(curation.cisaVulnerabilityName && { cisaVulnerabilityName: curation.cisaVulnerabilityName }),
      },
    };

    const upsertPayload: any = {
      cve_id: cveId,
      title: title || undefined,
      curation_status: curation.reviewStatus || "Draft",
      references,
      curated_patch,
      public_extras: {
        cwe_ids: editable.cweIds || [],
        affected_products,
        analyst_notes: curation.analystNotes || undefined,
        technical_analysis: curation.technicalAnalysis || undefined,
        business_impact: curation.businessImpact || undefined,
        exploitability: curation.exploitability || undefined,
        risk_level: curation.riskLevel || undefined,
        priority: curation.priority || undefined,
        confidentiality_impact: curation.confidentialityImpact || undefined,
        integrity_impact: curation.integrityImpact || undefined,
        availability_impact: curation.availabilityImpact || undefined,
        remediation_steps: curation.remediationSteps || undefined,
        workarounds: curation.workarounds || undefined,
        mitigation_strategies: curation.mitigationStrategies || undefined,
        patch_available: curation.patchAvailable || undefined,
        patch_complexity: curation.patchComplexity || undefined,
        threat_actors: curation.threatActors || undefined,
        exploit_in_wild: curation.exploitInWild || undefined,
        exploit_complexity: curation.exploitComplexity || undefined,
        attack_vector: curation.attackVector || undefined,
        asset_criticality: curation.assetCriticality || undefined,
        environmental_score: curation.environmentalScore || undefined,
        temporal_score: curation.temporalScore || undefined,
        assigned_analyst: curation.assignedAnalyst || undefined,
        review_date: curation.reviewDate || undefined,
        // Custom sections - convert to object format for API
        ...customSections.reduce((acc, section) => {
          if (section.name && section.fields.length > 0) {
            acc[section.name.toLowerCase().replace(/\s+/g, '_')] = section.fields.reduce((fieldAcc, field) => {
              if (field.key && field.value) {
                fieldAcc[field.key] = field.value;
              }
              return fieldAcc;
            }, {} as Record<string, string>);
          }
          return acc;
        }, {} as Record<string, any>),
      },
    };

    try {
      console.log("=== Saving Curation ===");
      console.log("Custom sections:", customSections);
      console.log("Saving curation with payload:", upsertPayload);
      
      // Upsert first
      const saveResp = await authFetch("/admin/curations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(upsertPayload),
      });
      
      console.log("Save response status:", saveResp.status);
      
      if (!saveResp.ok) {
        const errorText = await saveResp.text();
        console.error("Save failed with response:", errorText);
        throw new Error(`Upsert failed: ${saveResp.status} - ${errorText}`);
      }

      if (publish) {
        console.log("Publishing curation...");
        const pubResp = await authFetch(`/admin/curations/${encodeURIComponent(cveId)}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        
        console.log("Publish response status:", pubResp.status);
        
        if (!pubResp.ok) {
          const errorText = await pubResp.text();
          console.error("Publish failed with response:", errorText);
          throw new Error(`Publish failed: ${pubResp.status} - ${errorText}`);
        }
        alert("Curation published successfully!");
        navigate(`/vul/${cveId}`);
      } else {
        alert("Curation saved as draft!");
      }
    } catch (e: any) {
      console.error("Error saving curation:", e);
      alert(`Error saving curation: ${e?.message || "Unknown error"}`);
    }
  };

  const handleDelete = async () => {
    if (!curationStatus) {
      alert("No curation exists to delete");
      return;
    }

    try {
      setDeleteLoading(true);
      console.log("=== Deleting Curation ===");
      console.log("Delete API URL:", `/admin/curations/${encodeURIComponent(cveId)}`);

      const deleteResp = await authFetch(`/admin/curations/${encodeURIComponent(cveId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      
      console.log("Delete response status:", deleteResp.status);
      
      if (!deleteResp.ok) {
        const errorText = await deleteResp.text();
        console.error("Delete failed with response:", errorText);
        throw new Error(`Delete failed: ${deleteResp.status} - ${errorText}`);
      }

      alert("Curation deleted successfully!");
      navigate(`/vul/${cveId}`);
    } catch (e: any) {
      console.error("Error deleting curation:", e);
      alert(`Error deleting curation: ${e?.message || "Unknown error"}`);
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!cveId) {
    return (
      <div className="p-6 text-red-600">CVE ID not provided in URL.</div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center text-gray-700 dark:text-gray-200">Loading {cveId}…</div>
      </div>
    );
  }
  if (error && !editable.description) {
    return (
      <div className="p-6 text-red-600">Error: {error}</div>
    );
  }

  const severityOptions = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "CRITICAL", label: "Critical" },
  ];
  const riskOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
    { value: "Critical", label: "Critical" },
  ];
  const priorityOptions = riskOptions;

  return (
    <div className="min-h-screen font-roboto bg-gray-50 dark:bg-gray-900 p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Curating: {cveId}
                {curationStatus && (
                  <span className={`ml-3 px-2 py-1 rounded text-sm font-medium ${
                    curationStatus.status === 'Published' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                    curationStatus.status === 'Draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {curationStatus.status}
                  </span>
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {curationStatus ? 
                  "Editing existing curation. Form fields have been populated with current data." :
                  "All original fields are shown as placeholders and data-original-value for guidance."
                }
              </p>
              {curationLoading && (
                <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                  Loading existing curation data...
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate(`/vul/${cveId}`)} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md">Cancel</button>
              <button onClick={() => handleSave(false)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Save Draft</button>
              <button onClick={() => handleSave(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Publish</button>
            </div>
          </div>
        </div>

        {/* Curation Status Section */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Curation Status</h2>
            <div className="flex gap-3">
              {curationStatus && (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete Curation"}
                </button>
              )}
            </div>
          </div>
          
          {curationLoading ? (
            <div className="text-center py-4">
              <div className="text-gray-600 dark:text-gray-400">Loading curation status...</div>
            </div>
          ) : curationStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <div className={`inline-block ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                    curationStatus.status === 'Published' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                    curationStatus.status === 'Draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {curationStatus.status || 'Unknown'}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority:</span>
                  <div className={`inline-block ml-2 px-2 py-1 rounded text-sm font-medium ${
                    curationStatus.priority === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                    curationStatus.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' :
                    curationStatus.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  }`}>
                    {curationStatus.priority || 'Low'}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Level:</span>
                  <div className={`inline-block ml-2 px-2 py-1 rounded text-sm font-medium ${
                    curationStatus.risk_level === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                    curationStatus.risk_level === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' :
                    curationStatus.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  }`}>
                    {curationStatus.risk_level || 'Low'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Analyst:</span>
                  <div className="text-sm text-gray-900 dark:text-gray-100 ml-2">
                    {curationStatus.analyst || 'Unassigned'}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Created:</span>
                  <div className="text-sm text-gray-900 dark:text-gray-100 ml-2">
                    {curationStatus.created_at ? new Date(curationStatus.created_at).toLocaleString() : '—'}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated:</span>
                  <div className="text-sm text-gray-900 dark:text-gray-100 ml-2">
                    {curationStatus.updated_at ? new Date(curationStatus.updated_at).toLocaleString() : '—'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {curationStatus.version && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Version:</span>
                    <div className="text-sm text-gray-900 dark:text-gray-100 ml-2">
                      {curationStatus.version}
                    </div>
                  </div>
                )}
                {curationStatus.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes:</span>
                    <div className="text-sm text-gray-900 dark:text-gray-100 ml-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      {curationStatus.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-gray-600 dark:text-gray-400 mb-2">
                This is a new curation - no existing data found
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                Fill out the form below and save as draft or publish directly
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Confirm Delete Curation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this curation? This action cannot be undone and will remove all curation data and version history.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete Curation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Original snapshot (read-only) */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Original Vulnerability Information</h2>
            <button onClick={() => setShowDebug((s) => !s)} className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              {showDebug ? "Hide Debug" : "Show Debug"}
            </button>
          </div>

          {showDebug && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-800 dark:text-gray-200">
              <div>cveId: <span className="font-mono">{cveId}</span></div>
              <div>fetchedRaw: <span className="font-mono">{String(!!fetchedRaw)}</span></div>
              <div>rawPayload: <span className="font-mono">{String(!!rawPayload)}</span></div>
              <div>entries state: <span className="font-mono">{entries.length}</span></div>
              <div>originalEntries: <span className="font-mono">{originalEntries.length}</span></div>
              <div>normalized: <span className="font-mono">{normalized ? "yes" : "no"}</span></div>
              {normalized && (
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all">
{JSON.stringify({ severity: normalized.severity, cvss: normalized.cvss, cwe_ids: normalized.cwe_ids, refs: (normalized as any).references?.length }, null, 2)}
                </pre>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{cveId}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded ${severityColor(normalized?.severity ?? "")}`}>
                      {normalized?.severity ?? "UNKNOWN"}
                    </span>
                    <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm">Status: Published</span>
                  </div>
                  <p className="mt-3 text-gray-600 dark:text-gray-300">{normalized?.description || "—"}</p>
                </div>
              </div>

              {rawScores && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">CVSS Scores</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {rawScores.v40 && (<div>CVSS v4.0: {rawScores.v40}</div>)}
                    {rawScores.v31 && (<div>CVSS v3.1: {rawScores.v31}</div>)}
                    {rawScores.v30 && (<div>CVSS v3.0: {rawScores.v30}</div>)}
                    {rawScores.v2 && (<div>CVSS v2.0: {rawScores.v2}</div>)}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">CWE IDs</h4>
                  <div className="flex flex-wrap gap-1">
                    {normalized?.cwe_ids?.length ? (
                      normalized.cwe_ids.map((cwe) => (
                        <span key={cwe} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">{cwe}</span>
                      ))
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">References</h4>
                  <div className="text-sm space-y-1 max-h-32 overflow-y-auto">
                    {normalized?.references?.length ? (
                      normalized.references.slice(0, 6).map((ref: string, i: number) => (
                        <a key={i} href={ref} target="_blank" rel="noopener" className="block text-blue-600 dark:text-blue-400 underline truncate">{ref}</a>
                      ))
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto"><CVSSDonut score={normalized?.cvss ?? null} /></div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  {normalized?.preferred_cvss_source && normalized.preferred_cvss_source !== "Unknown" ? `CVSS ${normalized.preferred_cvss_source}` : "CVSS (base)"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Published</div>
                <div className="font-medium">{formatDate(entries[0]?.published_date)}</div>
                <div className="text-sm text-gray-500 mt-2">Last modified</div>
                <div className="font-medium">{formatDate(entries[0]?.updated_at)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Editable Overview */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Vulnerability Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <EditableText
                  value={editable.description}
                  onChange={(v) => setEditable((p) => ({ ...p, description: v }))}
                  multiline
                  originalValue={normalized?.description || entries[0]?.description || ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Severity</label>
                  <EditableSelect
                    value={editable.severity}
                    onChange={(v) => setEditable((p) => ({ ...p, severity: v }))}
                    options={severityOptions}
                    originalValue={normalized?.severity || ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CVSS Score</label>
                  <EditableText
                    value={String(editable.cvssScore ?? "")}
                    onChange={(v) => setEditable((p) => ({ ...p, cvssScore: parseFloat(v) || 0 }))}
                    originalValue={String(normalized?.cvss ?? "")}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CVSS Vector</label>
                <CVSSVector
                  value={editable.cvssVector}
                  onChange={(v) => setEditable((p) => ({ ...p, cvssVector: v }))}
                  originalValue={String(
                    (rawScores?.v31Vector || rawScores?.v30Vector || rawScores?.v40Vector || rawScores?.v2Vector || "") ?? ""
                  )}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 mx-auto"><CVSSDonut score={editable.cvssScore} /></div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">CVSS Score (editable)</div>
            </div>
          </div>
        </div>

        {/* Technical */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Technical Details</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">CWE IDs</label>
              <EditableText
                value={editable.cweIds.join(", ")}
                onChange={(v) => setEditable((p) => ({ ...p, cweIds: v.split(",").map((x) => x.trim()).filter(Boolean) }))}
                placeholder="e.g., CWE-79, CWE-89"
                originalValue={(normalized?.cwe_ids || []).join(", ")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">References (comma separated)</label>
              <EditableText
                value={editable.referenceUrls.join(", ")}
                onChange={(v) => setEditable((p) => ({ ...p, referenceUrls: v.split(",").map((x) => x.trim()).filter(Boolean) }))}
                placeholder="https://advisory1, https://advisory2"
                originalValue={(normalized?.references || []).join(", ")}
              />
            </div>
          </div>
        </div>

        {/* Curation extras */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Curation Analysis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Technical Analysis</label>
                <EditableText
                  value={curation.technicalAnalysis}
                  onChange={(v) => setCuration((p) => ({ ...p, technicalAnalysis: v }))}
                  multiline
                  placeholder="Detailed technical analysis..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Business Impact</label>
                <EditableText
                  value={curation.businessImpact}
                  onChange={(v) => setCuration((p) => ({ ...p, businessImpact: v }))}
                  multiline
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Affected Systems</label>
                <EditableText
                  value={curation.affectedSystems}
                  onChange={(v) => setCuration((p) => ({ ...p, affectedSystems: v }))}
                  multiline
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Exploitability</label>
                <EditableSelect
                  value={curation.exploitability}
                  onChange={(v) => setCuration((p) => ({ ...p, exploitability: v }))}
                  options={[
                    { value: "Unknown", label: "Unknown" },
                    { value: "Unproven", label: "Unproven" },
                    { value: "Proof-of-Concept", label: "Proof-of-Concept" },
                    { value: "Functional", label: "Functional" },
                    { value: "High", label: "High" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { k: "confidentialityImpact", l: "Confidentiality" },
                  { k: "integrityImpact", l: "Integrity" },
                  { k: "availabilityImpact", l: "Availability" },
                ] as const).map((f) => (
                  <div key={f.k}>
                    <label className="block text-sm font-medium mb-2">{f.l}</label>
                    <EditableSelect
                      value={(curation as any)[f.k]}
                      onChange={(v) => setCuration((p) => ({ ...p, [f.k]: v }))}
                      options={[
                        { value: "None", label: "None" },
                        { value: "Low", label: "Low" },
                        { value: "High", label: "High" },
                      ]}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Risk & Workflow */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Risk & Workflow</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Risk Level</label>
              <EditableSelect value={curation.riskLevel} onChange={(v) => setCuration((p) => ({ ...p, riskLevel: v }))} options={riskOptions} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <EditableSelect value={curation.priority} onChange={(v) => setCuration((p) => ({ ...p, priority: v }))} options={priorityOptions} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Asset Criticality</label>
              <EditableSelect value={curation.assetCriticality} onChange={(v) => setCuration((p) => ({ ...p, assetCriticality: v }))} options={riskOptions} />
            </div>
          </div>
        </div>

        {/* CISA KEV Information */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">CISA KEV Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">CISA Vulnerability Name</label>
              <EditableText 
                value={curation.cisaVulnerabilityName} 
                onChange={(v) => setCuration(p => ({...p, cisaVulnerabilityName: v}))} 
                placeholder="Enter CISA vulnerability name..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CISA Action Due Date</label>
              <EditableText 
                value={curation.cisaActionDue} 
                onChange={(v) => setCuration(p => ({...p, cisaActionDue: v}))} 
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CISA Exploit Add Date</label>
              <EditableText 
                value={curation.cisaExploitAdd} 
                onChange={(v) => setCuration(p => ({...p, cisaExploitAdd: v}))} 
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2">CISA Required Action</label>
              <EditableText 
                value={curation.cisaRequiredAction} 
                onChange={(v) => setCuration(p => ({...p, cisaRequiredAction: v}))} 
                placeholder="Enter CISA required action..."
                multiline={3}
              />
            </div>
          </div>
        </div>

        {/* Custom Sections */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Custom Sections</h2>
            <button
              onClick={() => {
                const newSection = {
                  id: `section_${Date.now()}`,
                  name: '',
                  fields: [{ key: '', value: '' }]
                };
                setCustomSections(prev => [...prev, newSection]);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
            >
              + Add Section
            </button>
          </div>
          
          {customSections.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No custom sections added yet.</p>
              <p className="text-sm mt-1">Click "Add Section" to create unlimited custom sections with key-value pairs.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {customSections.map((section, sectionIndex) => (
                <div key={section.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Section Name</label>
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => {
                          const newSections = [...customSections];
                          newSections[sectionIndex].name = e.target.value;
                          setCustomSections(newSections);
                        }}
                        placeholder="e.g., Compliance Information, Internal Notes, etc."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setCustomSections(prev => prev.filter((_, i) => i !== sectionIndex));
                      }}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm mt-6"
                    >
                      Delete Section
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Key-Value Pairs
                      </label>
                      <button
                        onClick={() => {
                          const newSections = [...customSections];
                          newSections[sectionIndex].fields.push({ key: '', value: '' });
                          setCustomSections(newSections);
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                      >
                        + Add Field
                      </button>
                    </div>
                    
                    {section.fields.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="flex gap-3 items-center">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={field.key}
                            onChange={(e) => {
                              const newSections = [...customSections];
                              newSections[sectionIndex].fields[fieldIndex].key = e.target.value;
                              setCustomSections(newSections);
                            }}
                            placeholder="Key (e.g., compliance_status)"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => {
                              const newSections = [...customSections];
                              newSections[sectionIndex].fields[fieldIndex].value = e.target.value;
                              setCustomSections(newSections);
                            }}
                            placeholder="Value (e.g., SOC2 Compliant)"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newSections = [...customSections];
                            newSections[sectionIndex].fields = newSections[sectionIndex].fields.filter((_, i) => i !== fieldIndex);
                            setCustomSections(newSections);
                          }}
                          className="px-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    {section.fields.length === 0 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">
                        No fields added yet. Click "Add Field" to add key-value pairs.
                      </div>
                    )}
                  </div>
                  
                  {/* Preview of how this section will be saved */}
                  {section.name && section.fields.some(f => f.key && f.value) && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Preview (will be saved in public_extras as):
                      </div>
                      <pre className="text-xs text-gray-800 dark:text-gray-200 font-mono">
                        {JSON.stringify({
                          [section.name.toLowerCase().replace(/\s+/g, '_')]: section.fields.reduce((acc, field) => {
                            if (field.key && field.value) {
                              acc[field.key] = field.value;
                            }
                            return acc;
                          }, {} as Record<string, string>)
                        }, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-end gap-3">
            <button onClick={() => navigate(`/vul/${cveId}`)} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md">Cancel</button>
            <button onClick={() => handleSave(false)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Save Draft</button>
            <button onClick={() => handleSave(true)} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Publish Curation</button>
          </div>
        </div>
      </div>
    </div>
  );
}
