# Gemini.md - Project Constitution

## Project
AI Performance Audit Agent - A QA-friendly web application for standardized website performance audits.

## Data Schemas (Canonical)

### AuditRun
```typescript
interface AuditRun {
  runId: string;              // UUID v4
  projectName: string;        // e.g., "Converse Australia"
  auditLabel: string;         // e.g., "Pre-Release Audit"
  environment: string;        // e.g., "production", "staging"
  deploymentTag?: string;     // optional build tag
  generatedAt: string;        // ISO 8601 timestamp
  schemaVersion: string;      // "1.0.0"
}
```

### AuditPage
```typescript
interface AuditPage {
  pageId: string;             // UUID v4
  runId: string;              // FK to AuditRun
  pageLabel: string;          // e.g., "Homepage"
  pageType: string;           // e.g., "homepage", "category", "pdp", "plp", "search"
  url: string;                // Full URL
  sortOrder: number;          // Display order
}
```

### MetricResult
```typescript
interface MetricResult {
  pageId: string;
  device: 'mobile' | 'desktop';
  metricName: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB' | 'performance_score';
  value: number;
  unit: 's' | 'ms' | '';
  thresholdGood: number;
  thresholdWarn: number;
  status: 'good' | 'needs-improvement' | 'poor';
  sourceAttempted: 'pagespeed' | 'lighthouse';
  sourceUsed: 'pagespeed' | 'lighthouse';
  fallbackTriggered: boolean;
  fallbackReason?: string;
  reportUrl?: string;
  capturedAt: string;
}
```

### Evidence
```typescript
interface Evidence {
  pageId: string;
  device: 'mobile' | 'desktop';
  screenshotUrl?: string;
  rawReferenceId?: string;
  notes?: string;
}
```

### ComparisonDelta
```typescript
interface ComparisonDelta {
  baselineRunId: string;
  currentRunId: string;
  pageKey: string;            // pageLabel or pageId
  metricName: string;
  device: 'mobile' | 'desktop';
  baselineValue: number;
  currentValue: number;
  deltaValue: number;
  deltaDirection: 'improved' | 'regressed' | 'unchanged';
}
```

### ReportPackageMetadata
```typescript
interface ReportPackageMetadata {
  schemaVersion: string;
  appVersion: string;
  generatedAt: string;
  thresholdProfile: string;
  sourcePolicy: 'pagespeed-first-lighthouse-fallback';
}
```

### Complete Report Package
```typescript
interface ReportPackage {
  metadata: ReportPackageMetadata;
  auditRun: AuditRun;
  pages: AuditPage[];
  metrics: MetricResult[];
  evidence: Evidence[];
}
```

## Thresholds (Core Web Vitals)

| Metric | Good | Needs Improvement | Poor | Unit |
|--------|------|-------------------|------|------|
| LCP | ≤2.5s | ≤4.0s | >4.0s | s |
| INP | ≤200ms | ≤500ms | >500ms | ms |
| CLS | ≤0.1 | ≤0.25 | >0.25 | - |
| FCP | ≤1.8s | ≤3.0s | >3.0s | s |
| TTFB | ≤0.8s | ≤1.8s | >1.8s | s |

## Behavioral Rules

1. **PageSpeed First Rule**: Always attempt Google PageSpeed Insights API first
2. **Fallback Rule**: Trigger Lighthouse only when PageSpeed fails/is incomplete
3. **Transparency Rule**: Always show sourceUsed and fallbackReason in UI and PDF
4. **No Database Rule**: Use portable report packages instead of Postgres
5. **Standardized Report Rule**: One audit = one standardized website report (all pages combined)
6. **Anti-Hallucination Rule**: Only use data from actual API responses
7. **Baseline-Before-Change Rule**: For any update to the existing website, first capture current state (inventory, UI, performance, etc.). Every update must compare before vs after wherever possible.

## Architecture Invariants

- Layer 1 (architecture/): SOPs and logic contracts only
- Layer 2 (navigation): Orchestration logic
- Layer 3 (tools/): Deterministic Python/TypeScript scripts
- No business logic in LLM responses - all logic is code
- All thresholds centralized in config
- All exports deterministic and repeatable

## Source Policy

```
- Device-specific failure
```

## B.L.A.S.T. Principles

The project follows the **B.L.A.S.T.** protocol:
- **Blueprint**: Define goals, personas, and success criteria in `task_plan.md`.
- **Link**: Verify all API and environment dependencies before implementation.
- **Architect**: Separate reasoning (SOPs) from orchestration (UI) and deterministic tools.
- **Stylize**: Maintain high UX/UI quality with structured output and accessibility.
- **Trigger**: Validate, benchmark, and monitor all releases with a post-release review.

## Mandatory Validation Gates

Before any feature is considered "Done", it must pass:
1. **Product Gates**: Requirements mapped to implementation, acceptance criteria covered.
2. **Engineering Gates**: Type safety, deterministic behavior, error handling.
3. **Quality Gates**: Responsive checks, accessibility (WCAG), SEO, Performance (PSI).
4. **Evidence Gates**: Screenshots, logs, or benchmark comparisons (Before vs After).

## UI/UX Guidelines

1. **Clean & Modern SaaS UI**: Desktop-first design optimized for QA users, automation testers, leads, and stakeholders.
2. **Design Style**: Clean white background, strong spacing, and low visual clutter. Not overly flashy, heavily emphasizing usability.
3. **Color Palette**: 
   - **Primary**: Deep navy blue
   - **Status/Accents**: Green (passing/good), Amber (warning/needs improvement), Red (poor/failed), and Blue (informational).
4. **Components**: Rounded cards, soft borders, subtle shadows, highly scannable tables, clear typography with accessible contrast and status pills.
5. **Data Visualization**: Interactive charts (e.g., Recharts) and deep diagnostic accordions for actionable performance findings.

## File Structure

```
/
├── gemini.md              # This file - Project Constitution
├── task_plan.md           # Scope, phases, and checklist
├── findings.md            # Research notes and edge cases
├── progress.md            # Work log and test outcomes
├── decisions.md           # Architecture and product decisions with rationale
├── change_log.md          # Technical and user-visible changes across updates
├── architecture/          # Layer 1: SOPs
│   ├── threshold-sop.md
│   ├── fallback-sop.md
│   ├── comparison-sop.md
│   └── export-sop.md
├── tools/                 # Layer 3: Scripts
│   └── (deterministic scripts)
├── .tmp/                  # Temporary artifacts
└── src/                   # Application code
    ├── app/               # Next.js app
    ├── components/        # UI components
    ├── lib/               # Utilities
    └── types/             # TypeScript types
```
