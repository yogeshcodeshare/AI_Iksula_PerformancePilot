# Change Log

This file documents the key changes occurring across the AI Performance Audit Agent project.

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
