# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `my-app/`:

```bash
npm run dev        # Dev server → http://localhost:3000
npm run build      # Static export → dist/
npm run lint       # ESLint
```

No test suite exists. Manual testing is the only validation path (see AGENTS.md → Testing Instructions).

To add a shadcn/ui component:
```bash
npx shadcn add <component-name>
```

## Environment

Create `my-app/.env.local`:
```
NEXT_PUBLIC_PAGESPEED_API_KEY=your_google_api_key_here
```
Without an API key, PageSpeed API rate-limits to ~1 req/100s. The key is client-side (`NEXT_PUBLIC_`), which is acceptable for this demo-grade app.

## Architecture

### Data Flow (the whole pipeline)

```
/audit (form) → sessionStorage("audit-form-data")
    ↓
/audit/progress → runAudit() → PageSpeed API (mobile + desktop per page)
    ↓
saveAuditStateAsync() → IndexedDB (primary) + localStorage (light copy)
setSavedRunId() → "View Results" link activates → /results?runId=<uuid>
    ↓
/results → useAuditState(runId) → getAuditStateByRunId() → renders
```

**Critical**: `saveAuditStateAsync()` must be **awaited** before enabling the results link. The `savedRunId` state in `progress/page.tsx` gates this — it is set only after IndexedDB confirms the write. Never revert to the sync `saveAuditState()` for this path.

### Storage Layer (`src/services/`)

| Function | Mechanism | Notes |
|---|---|---|
| `saveAuditStateAsync()` | IndexedDB (via `db.ts`) + localStorage light copy | Primary save path; awaitable |
| `saveAuditState()` | localStorage sync + IndexedDB fire-and-forget | Do NOT use for post-audit save |
| `getAuditStateByRunId(runId)` | IndexedDB only | Used by results page via URL param |
| `getAuditStateAsync()` | IndexedDB → localStorage fallback | Used when no runId available |
| `getSessionAuditState()` | sessionStorage | Fast path; may be absent for large audits |

IndexedDB wrapper is in `src/services/db.ts` (store name: `audits`, DB: `AIAuditDB`).

### Audit Engine (`src/services/audit.ts`)

- `PAGE_CONCURRENCY = 1` — pages are processed strictly sequentially to avoid Google API rate-limiting. Do not increase without testing.
- `PAGESPEED_TIMEOUT_MS = 120_000` — PSI can be very slow; 120s is intentional.
- Data source priority per metric: **URL-level CrUX** → **origin-level CrUX** → **Lighthouse lab data**
- `MAX_RETRY_ATTEMPTS = 3` with exponential backoff (2s, 4s, 8s). `retryFailedItems()` only re-runs failed page+device combos; successful results are preserved.
- The PSI API URL must include all four category params: `&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO` — dropping any category silently omits that section's Lighthouse data.
- Lighthouse CLI fallback (`runLighthouse()`) always throws — it is not implemented. The "fallback" is actually origin-level CrUX and Lighthouse lab data extracted from the PSI response itself.

### State in `progress/page.tsx`

Key states and their roles:
- `status`: `'running' | 'completed' | 'failed'` — controls bottom bar UI
- `isSaving`: true while `saveAuditStateAsync` is in progress — shows spinner, blocks navigation
- `savedRunId`: set only after save confirms — gates the "View Results" link (renders `null` until truthy)
- `lastSavedStateRef`: holds the last persisted `AuditState` so `retryFailedItems()` can merge against it

### `useAuditState` Hook (`src/hooks/useAuditState.ts`)

Load priority: `getAuditStateByRunId(runId)` → `getSessionAuditState()` → `getAuditStateAsync()`. If the specific runId lookup returns null, it retries 3× with 600ms delay (guards against any remaining write timing gap). The results page always calls this with `runId` from `useSearchParams()`.

### Results Page Components (`src/components/results/`)

The results page (`src/app/results/page.tsx`) is decomposed into:
- `AuditHeader` — title bar with export buttons
- `SummaryCards` — health score, page count, metric count
- `ExecutiveSummaryCard` — pass/fail CWV summary with partial-run warnings
- `ResultsChartsSection` — Recharts bar/pie charts
- `MetricsMatrix` — filterable cross-page × metric table
- `DiagnosticWorkspace` — deep-dive panel; controlled by `useDiagnosticWorkspace` hook
- `AuditMetadata` — run metadata footer
- `ComparisonDialog` — baseline upload and delta display

### CLS Value Rule

PageSpeed returns CLS as a float (e.g. `0.12`). **Never divide by 100.** Use the value directly from `loadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile`. Values > 1 are divided by 100 as a normalization guard, but the API does not return values > 1 in practice.

### Export (`src/services/export.ts`)

`generateReportPackage()` assembles a `ReportPackage` from `AuditState`. `downloadPackage()` produces a ZIP containing `report.json` + `report.pdf`. jsPDF uses mm-based coordinate positioning.

### Static Export Constraint

`next.config.ts` sets `output: 'export'` — this is a fully static build. No server-side API routes, no Node.js runtime. All API calls (PageSpeed) happen client-side. `distDir: 'dist'` (not `.next`).
