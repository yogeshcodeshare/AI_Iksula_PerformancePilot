# Change Log

This file documents the key changes occurring across the AI Performance Audit Agent project.

## [2026-03-31] - v2.0.0
### Added
- **About Page** (`/about`): Professional developer profile page with editorial split hero layout (photo + info), experience timeline with dates, skills categorized by domain (AI/GenAI, Testing, Platforms, DevOps, Programming), contact cards (LinkedIn, Email, Phone, GitHub), and education section.
- **Appearance Tab in Settings**: Theme selection moved from Navbar toggle to Settings page under a new "Appearance" tab with visual preview cards for Light and Dark themes. Persists to localStorage.
- **About Link in Navbar**: Added "About" navigation link between "New Audit" and Settings icon.

### Removed
- **Navbar Theme Toggle**: Dark mode slider button removed from navbar (moved to Settings > Appearance).
- **Navbar YM Avatar**: Removed the "YM" initials circle from all pages.
- **Dead CSS**: Removed `.theme-toggle-slider` CSS class from `globals.css` (no longer used after navbar cleanup).

### Fixed
- **Unused Props**: Removed unused `comparison` prop from `SummaryCards` component (only `baselineMetrics` needed).
- **Unused Imports**: Cleaned up `ArrowLeft`, `Download` from compare page imports.

## [2026-03-30] - v1.6.0
### Added
- **Comparison Inline Deltas on Results Page**: `SummaryCards` shows health delta badge (+X%/-X%) when baseline is loaded. `MetricsMatrix` shows per-metric delta indicators (green ↓ improved, red ↑ regressed) below each value.
- **Clickable Comparison Badge**: "Comparing to: X" badge in `AuditHeader` is now a link to `/compare/` with theme-aware styling (`bg-primary/10`). Includes clear (×) button.
- **Compare Page Device Toggle**: Mobile/Desktop toggle filters all metrics, category scores, summary stats, and health delta by selected device. Removes Device column from tables.
- **Compare Page Page Filter**: Dropdown to filter comparison by specific page. Shows page names directly for single-page audits; adds "All Pages (N)" option for multi-page audits.
- **Compare Page Filter Pills**: All/Regressions/Improvements pills with "All" as default and first position. Styled as rounded pills with color-coded active states.
- **Comparison PDF Per-Device Sections**: PDF now generates separate Mobile Results and Desktop Results sections (one per page), each with summary stats, all metrics table, and category scores table. Tables have borders, centered columns, and proper alignment.

### Fixed
- **Zero-Baseline Delta Bug**: CLS 0→0 no longer falsely marked as "regressed". Added minimum absolute thresholds per metric (`getMinThreshold()` in `comparison.ts`): CLS=0.01, INP=10ms, LCP/FCP/TTFB=50ms.
- **Comparison Badge Dark Mode**: Replaced hardcoded `bg-blue-50`/`text-blue-700` with theme-aware `bg-primary/10`/`text-primary`.
- **Comparison PDF Emoji**: Replaced broken emoji (📱🖥️) with plain text labels in PDF device headers.
- **React Hooks Order**: Moved all `useState`/`useMemo` hooks above early returns in `compare/page.tsx` to fix "Rendered more hooks than during the previous render" error.

### Changed
- **Comparison Metrics**: Removed `performance_score` from metric comparison (now only LCP, INP, CLS, FCP, TTFB). Performance score is covered in Category Scores tab.
- **Compare Page Tabs**: Inner sub-tabs default to "All" instead of "Regressions" so users see data immediately.
- **Comparison PDF Tables**: Added cell borders, horizontally/vertically centered short columns, left-aligned long text columns (Page, Category). Summary stat boxes centered.

## [2026-03-30] - v1.5.0
### Added
- **PageSpeed Metrics Section**: Replaced CWV Assessment in Diagnostic Workspace with a 5-column horizontal grid (LCP, FCP, TBT, CLS, SI) showing color-coded pill values sourced from Lighthouse diagnostics data.
- **PageSpeed Metrics in PDF Export**: New `drawPageSpeedMetricsTable()` replaces `drawCWVTable()` in both summary and per-page sections. Color-coded cells (green/amber/red) based on Lighthouse score ranges.
- **Dynamic Pipeline Label**: Progress page now shows actual concurrency (e.g., "Parallel (2 at a time)") via exported `getPageConcurrency()` instead of hardcoded "Sequential (1 at a time)".
- **Dashboard Health Recalculation**: Dashboard now recalculates health from IndexedDB on load to fix stale cached values from older audits.

### Fixed
- **TTFB Always in Seconds**: `formatMetricValue()` now always displays TTFB in seconds (e.g., "0.5 s") instead of conditionally showing milliseconds when < 1000ms.
- **Health Score Mismatch**: Dashboard and results page now use the same weighted formula (`calculateOverallHealth()`: good=100, needs-improvement=50, poor=0). Previously dashboard used a binary good/total formula.

### Changed
- **`getPageConcurrency()`**: Now exported from `audit.ts` for use by progress page UI.
- **`storage.ts`**: Uses `calculateOverallHealth()` from `utils.ts` instead of inline binary calculation.
- **PDF Report**: Removed CWV Assessment tables and CWV status from per-page device headers. Added PageSpeed Metrics tables with Lighthouse lab data.

## [2026-03-29] - v1.4.0
### Added
- **Dark/Light Theme System**: Full dual-theme support with CSS custom properties in `globals.css`. Dark slate palette (`#141518` background) as default, warm light palette (`#F7F6F3` canvas). Theme toggle in Navbar.
- **Premium Minimalist UI Redesign**: Overhauled all pages (Home, Audit, Progress, Compare, Settings, Results) with frosted glass effects, refined spacing, and consistent design language.
- **SVG Circular Score Gauges**: `CategoryScoreCards` now renders animated SVG arc gauges with gradient fills and glow layers, replacing plain numeric displays.
- **Diagnostic Workspace Enhancements**: 4-column category tab grid, filter buttons (All/Failed/Warnings/Passed), full-width search in `DiagnosticsPanel`.
- **Improved PDF Export**: Enhanced `export.ts` with better mm-based coordinate positioning and richer report layout.

### Changed
- **Navbar**: Redesigned with frosted glass sticky header (`bg-card/80 backdrop-blur-xl`), theme toggle, and refined navigation.
- **Audit Engine Optimization**: Improved dynamic concurrency logic, adaptive throttle-back on HTTP 429, and 90s timeout for heavy pages.
- **Storage Layer**: Strengthened `saveAuditStateAsync()` flow with proper `savedRunId` gating in progress page.
- **All Components**: Migrated from hardcoded Tailwind colors to theme-aware tokens (`bg-background`, `text-foreground`, `border-border`, etc.).
- **Results Page**: Decomposed into smaller components (AuditHeader, SummaryCards, CategoryScoreCards, CWVAssessmentCard, ExecutiveSummaryCard, MetricsMatrix, DiagnosticWorkspace, etc.).

### Removed
- `findings.md` and `task_plan.md` — consolidated into CLAUDE.md and progress documentation.

## [2026-03-15] - v1.3.0
### Added
- **IndexedDB Multi-Page Support**: Replaced `localStorage` with `IndexedDB` for full report data to support larger audits (6+ pages) without quota crashes.
- **BLAST Protocol Integration**: Updated project memory files (`gemini.md`, `AGENTS.md`) and added `decisions.md` and `change_log.md` to follow the latest B.L.A.S.T. master system prompt.
- **Passed Audits Section**: Diagnostics page now includes a specialized "Passed Audits" group.

### Fixed
- **CLS Value Discrepancy**: Corrected scaling (raw vs float) for Desktop Cumulative Layout Shift values.
- **Metric Units Visibility**: Standardized time-based metrics (LCP, FCP, TTFB) to display in seconds (s) to match PageSpeed Insights.
- **Diagnostic Grouping**: Renamed 'Opportunities' to 'Insights' to align with modern Google PSI nomenclature.

### Security
- Added try/catch safeguards around session storage handling to prevent browser-level crashes.

## [2026-03-12] - v1.2.0
### Added
- Local development server stabilization and basic audit flow.

## [2026-03-03] - v1.1.0
### Added
- Initial project structure based on Next.js 15+ and React 19.
- Basic PageSpeed Insights API integration service.
- PDF generation and JSON export system.
