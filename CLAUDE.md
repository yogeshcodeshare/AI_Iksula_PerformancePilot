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

### B.L.A.S.T. 3-Layer Pattern

The codebase follows the B.L.A.S.T. protocol (Blueprint, Link, Architect, Stylize, Trigger) organized in three layers:

1. **Layer 1 — SOPs** (`architecture/`): Markdown specs defining thresholds, fallback logic, comparison, and export rules. Update SOPs _before_ changing the corresponding service code.
2. **Layer 2 — Orchestration** (`src/app/`): Page components that route data between services and handle user interactions. No business logic here.
3. **Layer 3 — Services** (`src/services/`): Deterministic business logic. All data processing, API calls, persistence, and export happen here.

### State Management

No global state library (no Redux, Zustand, etc.). State flows through:
- **React `useState`/`useRef`** within page components
- **Custom hooks** (`useAuditState`, `useResultsFilters`, `useDiagnosticWorkspace`) for shared logic
- **Browser storage APIs** (sessionStorage → localStorage → IndexedDB) for persistence across pages

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

- **Dynamic concurrency** — `getPageConcurrency(pageCount)` (exported) scales parallelism based on audit size: 2 (≤8 pages), 3 (≤15), 4 (≤25), 5 (26+). Without an API key, falls back to 1 (sequential). Mobile + desktop for the same page always run sequentially (Google queues same-URL parallel calls). The progress page dynamically displays the concurrency level in the Protocol info card.
- `PAGESPEED_TIMEOUT_MS = 90_000` — 90s timeout. Heavy e-commerce pages (Amazon PDPs) can take 60-80s. Retry mechanism provides additional coverage.
- **Throttled fetch** — 300ms minimum gap between API calls to avoid burst pressure.
- **Adaptive throttle-back** — on HTTP 429, concurrency drops to 1 with 3s cooldown. Audit never aborts.
- Data source priority per metric: **URL-level CrUX** → **origin-level CrUX** → **Lighthouse lab data**
- `MAX_RETRY_ATTEMPTS = 3` with exponential backoff (2s, 4s, 8s). `retryFailedItems()` only re-runs failed page+device combos; successful results are preserved.
- The PSI API URL must include all four category params: `&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO` — dropping any category silently omits that section's Lighthouse data.
- Lighthouse CLI fallback (`runLighthouse()`) always throws — it is not implemented. The "fallback" is actually origin-level CrUX and Lighthouse lab data extracted from the PSI response itself.

### Services Overview (`src/services/`)

| File | Purpose |
|---|---|
| `audit.ts` | PageSpeed API calls, metric extraction, retry logic |
| `storage.ts` | localStorage/sessionStorage/IndexedDB persistence |
| `db.ts` | IndexedDB wrapper (`AIAuditDB` database) |
| `export.ts` | PDF + JSON ZIP generation via jsPDF and JSZip |
| `comparison.ts` | Delta calculation between two audit runs |
| `recommendations.ts` | Static map of Lighthouse diagnostic keys → human-readable guidance with suggested owners |

### State in `progress/page.tsx`

Key states and their roles:
- `status`: `'running' | 'completed' | 'failed'` — controls bottom bar UI
- `isSaving`: true while `saveAuditStateAsync` is in progress — shows spinner, blocks navigation
- `savedRunId`: set only after save confirms — gates the "View Results" link (renders `null` until truthy)
- `lastSavedStateRef`: holds the last persisted `AuditState` so `retryFailedItems()` can merge against it

### `useAuditState` Hook (`src/hooks/useAuditState.ts`)

Load priority: `getAuditStateByRunId(runId)` → `getSessionAuditState()` → `getAuditStateAsync()`. If the specific runId lookup returns null, it retries 3x with 600ms delay (guards against any remaining write timing gap). The results page always calls this with `runId` from `useSearchParams()`.

### Results Page Components (`src/components/results/`)

The results page (`src/app/results/page.tsx`) is decomposed into:
- `AuditHeader` — title bar with export buttons (frosted glass sticky header). When a baseline is loaded, shows a clickable "Comparing to: X" badge that links to `/compare/`. Badge uses theme-aware colors (`bg-primary/10`). Includes a clear (×) button to remove the baseline.
- `SummaryCards` — health score, page count, metric count. When comparison data is available, shows an inline health delta badge (e.g., "+5%" green or "-3%" red) below the health gauge.
- `CategoryScoreCards` — per-category Lighthouse scores rendered as **SVG circular gauges** with gradient arcs, glow layers, and color-coded scores (green 90+, amber 50-89, red <50). Uses `ScoreGauge` internal component.
- `CWVAssessmentCard` — Core Web Vitals pass/fail badge (used outside Diagnostic Workspace)
- `ExecutiveSummaryCard` — pass/fail CWV summary with partial-run warnings
- `ResultsChartsSection` — Recharts bar/pie charts
- `MetricsMatrix` — filterable cross-page x metric table. When comparison data is available, shows per-metric delta indicators (green ↓ for improved, red ↑ for regressed) below each metric value.
- `DiagnosticWorkspace` — deep-dive panel; controlled by `useDiagnosticWorkspace` hook. Contains a **PageSpeed Metrics** section (5-column horizontal grid showing LCP, FCP, TBT, CLS, SI with color-coded pills), **Diagnostic Scores** (category score gauges), and **Diagnostic Insights** with category tabs (Performance/Accessibility/Best Practices/SEO) as a **4-column grid**.
- `DiagnosticsPanel` — detailed audit items within the workspace. Header shows "Diagnose Performance Issues" with filter buttons (All/Failed/Warnings/Passed) on the right and a full-width search box below.
- `AuditMetadata` — run metadata footer
- `ComparisonDialog` — baseline upload and delta display

### Compare Page (`src/app/compare/page.tsx`)

The compare page provides a full side-by-side delta analysis between a baseline (uploaded JSON) and the current audit.

**State management** — All hooks (`useState`, `useMemo`) must be declared before any early returns (React Rules of Hooks). The page has early returns for loading/missing states.

**Filtering controls:**
- **Device toggle** (Mobile/Desktop) — filters all metrics, category scores, health delta, and summary stats by device
- **Page dropdown** — appears always; shows "All Pages (N)" option only when 2+ pages exist; otherwise shows just the page name. Filters deltas by selected page.
- **Sub-filter pills** (All / Regressions / Improvements) — styled as rounded pills, "All" is first and default

**Layout structure:**
- Row 1: `Metrics | Category Scores` tabs (left) + Page dropdown + Device toggle (right)
- Row 2: Info text (left) + Filter pills (right)
- Table: No Device column (redundant with toggle). Shows Page, Metric, Baseline → Current, Delta, Trend.

**Comparison delta logic** (`src/services/comparison.ts`):
- Compares 5 CWV metrics: LCP, INP, CLS, FCP, TTFB (not `performance_score` — that's in Category Scores)
- Uses 10% threshold OR minimum absolute threshold (whichever is larger) to avoid false positives on near-zero values: CLS=0.01, INP=10ms, LCP/FCP/TTFB=50ms
- When `deltaValue === 0`, direction is always `unchanged` (fixes the zero-baseline bug)

**Comparison PDF** (`handleDownloadComparisonPDF`):
- Two separate sections: Mobile Results (page 1) and Desktop Results (page 2)
- Each section has: device header with health %, summary stats (centered in boxes), all metrics table, category scores table
- Tables have borders, centered short columns, left-aligned long text columns
- jsPDF does not support emoji — use plain text for labels

### Theming (`globals.css` + `layout.tsx`)

The app supports **dark and light themes**. Dark is the default (set via `className="dark"` on `<html>` in `layout.tsx`).

- **Theme toggle**: Lives in the **Settings page** (`src/app/settings/page.tsx`) under the "Appearance" tab. Users select Light or Dark theme via visual preview cards. The toggle sets/removes the `dark` class on `document.documentElement` and persists the choice to `localStorage` (`ai-performance-audit-theme`). No external theme library.
- **CSS variables**: Defined in `globals.css` under `:root` (light) and `.dark` (dark). All color tokens (`--background`, `--card`, `--border`, `--foreground`, `--primary`, `--muted-foreground`, etc.) are consumed by Tailwind via `@theme inline`.
- **Dark palette**: `#141518` background, `#1C1D22` cards, `#2E2F36` borders, `#F0F0F2` text. Intentionally a **dark slate** (not pure OLED black) for better readability.
- **Light palette**: `#F7F6F3` warm canvas, `#FFFFFF` cards, `#DDDCD8` borders, `#111111` text.
- **Usage rule**: Use theme-aware Tailwind classes (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`) instead of hardcoded `bg-white`, `bg-slate-50`, `text-slate-900`, etc. Hardcoded slate colors will not adapt to theme changes.
- **Sticky bars**: Use `bg-card/80 backdrop-blur-xl border-border` for frosted glass effect on navbar, audit header, and bottom action bars.
- **Primary button text**: Always use `text-primary-foreground` with `bg-primary`, never `text-white`. This ensures correct contrast in both themes.

### CLS Value Rule

PageSpeed returns CLS as a float (e.g. `0.12`). **Never divide by 100.** Use the value directly from `loadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile`. Values > 1 are divided by 100 as a normalization guard, but the API does not return values > 1 in practice.

### Export (`src/services/export.ts`)

`generateReportPackage()` assembles a `ReportPackage` from `AuditState`. `downloadPackage()` produces a ZIP containing `report.json` + `report.pdf`. jsPDF uses mm-based coordinate positioning. The PDF includes **PageSpeed Metrics tables** (FCP, TBT, Speed Index, LCP, CLS) with color-coded cells for both mobile and desktop, replacing the former CWV Assessment tables. Per-page detailed reports also include a PageSpeed Metrics row.

### Static Export Constraint

`next.config.ts` sets `output: 'export'` with `trailingSlash: true` — this is a fully static build. No server-side API routes, no Node.js runtime. All API calls (PageSpeed) happen client-side. `distDir: 'dist'` (not `.next`). `trailingSlash` means all routes end with `/` which affects `<Link>` href values and static file output.

### Type System (`src/types/index.ts`)

Canonical types mirror the schemas in `gemini.md`. Key types:
- `AuditRun`, `AuditPage`, `MetricResult` — core data model
- `PageType`: `'homepage' | 'category' | 'pdp' | 'plp' | 'search' | 'custom'`
- `MetricName`: `'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB' | 'performance_score'`
- `DiagnosticStatus`: `'pass' | 'fail' | 'warning' | 'manual' | 'not-applicable' | 'informative'`
- `CategoryName`: `'performance' | 'accessibility' | 'best-practices' | 'seo'`
- `AuditState` — the top-level object persisted to storage (contains run, pages, results, diagnostics)

### Behavioral Rules (from `gemini.md`)

These are project-level invariants that must never be violated:

- **PageSpeed First**: Always attempt PSI API before any fallback. Never skip straight to Lighthouse CLI.
- **Transparency**: Always show `sourceUsed` and `fallbackReason` in UI and exports. Users must know where data came from.
- **No Database**: All persistence is client-side (IndexedDB + localStorage). No Postgres, no backend APIs.
- **Baseline-Before-Change**: Capture current state before making updates to audit logic or thresholds.
- **Anti-Hallucination**: Never invent metric values — every number must trace to a PageSpeed API response or Lighthouse lab data. All diagnostic guidance comes from the static map in `recommendations.ts`, keyed by Lighthouse audit IDs.
- **Source Tracking**: `MetricResult.sourceUsed` and `fallbackTriggered` must always be set correctly. If a metric came from origin-level CrUX instead of URL-level, that must be visible in the UI and exports.

### Metric Thresholds (quick reference)

| Metric | Good | Needs Improvement | Poor | Unit |
|--------|------|-------------------|------|------|
| LCP | ≤ 2500 | ≤ 4000 | > 4000 | ms |
| INP | ≤ 200 | ≤ 500 | > 500 | ms |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 | unitless |
| FCP | ≤ 1800 | ≤ 3000 | > 3000 | ms |
| TTFB | ≤ 800 | ≤ 1800 | > 1800 | ms |

Canonical thresholds are defined in `src/lib/constants.ts` (`THRESHOLDS` object) and documented in `architecture/threshold-sop.md`.

**TTFB Display Rule**: TTFB is always displayed in seconds (e.g., `0.5 s`, `1.2 s`) via `formatMetricValue()` in `src/lib/utils.ts`, regardless of the raw ms value. LCP and FCP switch to seconds only when ≥ 1000ms.

### Overall Health Score

`calculateOverallHealth()` in `src/lib/utils.ts` uses a **weighted formula**: good=100, needs-improvement=50, poor=0, averaged across all metrics. This is the single canonical calculation — used by the results page (`SummaryCards`), PDF export, and dashboard (which recalculates from IndexedDB on load). The dashboard page (`src/app/page.tsx`) fetches full audit data from IndexedDB to recalculate health, ensuring consistency with the results page even for older cached audits.

### Common Modification Tasks

**Adding a new metric:**
1. Add to `THRESHOLDS` in `src/lib/constants.ts`
2. Update `MetricName` type in `src/types/index.ts`
3. Add extraction logic in `src/services/audit.ts` (both CrUX and Lighthouse sections)
4. Update UI components displaying metrics
5. Update PDF generation in `src/services/export.ts`

**Adding a new page type:**
1. Add to `PAGE_TYPES` array in `src/lib/constants.ts`
2. Update `PageType` type in `src/types/index.ts`

### Testing

No test suite exists. Manual validation only:
1. `npm run dev` from `my-app/`
2. Create audit with test URLs (e.g., `https://www.google.com`)
3. Verify progress tracking shows mobile + desktop status
4. Check results display all metrics (LCP, INP, CLS, FCP, TTFB)
5. Verify source column shows "PageSpeed" or "Lighthouse"
6. Export PDF + JSON, then upload JSON to comparison page

**Comparison flow testing:**
1. Run audit A → export JSON
2. Run audit B → on Results page, click "Compare" → upload audit A's JSON
3. Verify "Comparing to: X" badge appears with theme-aware styling
4. Click badge → should navigate to `/compare/`
5. On Compare page: toggle Mobile/Desktop, verify metrics filter correctly
6. If multi-page audit: verify page dropdown appears and filters data
7. Check filter pills (All/Regressions/Improvements) work correctly
8. Export comparison PDF → verify both Mobile and Desktop sections, centered stats, bordered tables
9. On Results page: verify inline health delta on SummaryCards and per-metric deltas on MetricsMatrix

Expected console output during audit:
```
[PageSpeed API] Data sources - CrUX: true, Origin CrUX: false, Lighthouse: true
[ExtractMetrics] Total metrics extracted: 6 ["LCP", "INP", "CLS", "FCP", "TTFB", "performance_score"]
```

### Key Architectural Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D001 | No-database (IndexedDB + localStorage + portable JSON) | Portable, no backend infra needed |
| D002 | PageSpeed-First data fetching | One API call provides both CrUX field data and Lighthouse lab data |
| D003 | IndexedDB for large audits | localStorage 5MB quota exceeded with 6+ page audits |
| D004 | 3-Layer B.L.A.S.T. architecture | Clear separation: SOPs → Orchestration → Services |

Full details in `decisions.md`.

### About Page (`src/app/about/page.tsx`)

Static page displaying the developer profile. Layout: editorial split hero (photo left, info right) + two-column content grid (About/Experience/Education left, Skills/Contact right). All data is hardcoded in component constants (`EXPERIENCE`, `SKILLS`, `CONTACTS`, `STATS`). Uses Next.js `Image` component for the profile photo (`public/yogesh-mohite.jpg`). Navbar includes "About" link between "New Audit" and Settings.

### Settings Page (`src/app/settings/page.tsx`)

Three tabs: **Thresholds** (metric threshold customization), **General** (API key, default environment), **Appearance** (dark/light theme selection with visual preview cards). Theme changes apply immediately via `document.documentElement.classList` and persist to `localStorage`.

### `my-app` vs `my-app-final`

**`my-app` is the sole source of truth.** `my-app-final` is an outdated partial snapshot from an early phase and can be ignored or deleted.

### Reference Documents

- `gemini.md` — project constitution (data schemas, behavioral rules)
- `architecture/` — SOPs for thresholds, fallback logic, comparison, export
- `Document/` — PRD, result page enhancement spec, B.L.A.S.T. protocol
- `Skills/ui-design-studio/` — UI design skill (Premium Minimalist mode). References in `references/` cover design modes, animation patterns, creative arsenal, and redesign checklist. Use this skill for any UI/UX improvements.
- `previews/` — standalone HTML preview mockups for all pages (dashboard, audit, progress, results, compare, settings). Uses `shared-styles.css` for the design system. These are for visual review only — not part of the app build.
