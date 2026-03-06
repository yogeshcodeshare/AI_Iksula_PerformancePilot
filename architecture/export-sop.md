# SOP: Report Export Generation

## Purpose
Define how to generate standardized export packages.

## Package Structure

```
report-package/
├── report.pdf          # Human-readable audit report
├── report.json         # Machine-readable canonical data
└── metadata.json       # Package metadata
```

## Metadata Format

```json
{
  "schemaVersion": "1.0.0",
  "appVersion": "1.0.0",
  "generatedAt": "2026-03-06T13:37:06.659Z",
  "thresholdProfile": "core-web-vitals-default",
  "sourcePolicy": "pagespeed-first-lighthouse-fallback",
  "content": {
    "runId": "...",
    "projectName": "...",
    "pageCount": 5,
    "metricsPerPage": 10
  }
}
```

## Report.json Schema

Must match the canonical schema defined in gemini.md:

```typescript
interface ReportPackage {
  metadata: ReportPackageMetadata;
  auditRun: AuditRun;
  pages: AuditPage[];
  metrics: MetricResult[];
  evidence: Evidence[];
}
```

## PDF Report Sections (Required)

1. **Cover Page**
   - Project/site name
   - Audit label
   - Environment
   - Audit date
   - Auditor (optional)
   - Source policy statement

2. **Methodology**
   - PageSpeed-first rule
   - Lighthouse fallback rule
   - Threshold definitions
   - Device coverage

3. **Audit Scope**
   - Table of all pages audited
   - Page labels, types, URLs

4. **Executive Summary**
   - Overall health score (average of all metrics)
   - Total pages audited
   - Count by status (Good/Needs Improvement/Poor)
   - Highest-risk pages list

5. **Cross-Page Results Matrix**
   - All pages in one table
   - Mobile and Desktop columns
   - LCP, INP, CLS, FCP, TTFB
   - Status indicators
   - Source used (PageSpeed/Lighthouse)

6. **Per-Page Detail**
   - Full metric breakdown per page
   - Evidence links
   - Fallback notes (if any)

7. **Comparison Section** (if applicable)
   - Baseline metadata
   - Delta summary
   - Regressions and improvements

8. **Appendix**
   - Schema version
   - Raw report URLs
   - Glossary

## Comparison PDF Sections

1. **Baseline vs Current Header**
2. **Delta Summary Chart**
3. **Regressions Table** (sorted by impact)
4. **Improvements Table**
5. **Missing/New Pages Notes**
6. **Side-by-side Metrics Comparison**

## Generation Rules

1. PDF must be client-side generated (no server storage)
2. JSON must validate against schema
3. All timestamps in ISO 8601 format
4. File names should include runId for uniqueness
5. Package downloadable as .zip
