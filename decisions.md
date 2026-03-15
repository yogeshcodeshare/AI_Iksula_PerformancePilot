# Architecture and Product Decisions

This document records the key architectural and product decisions made for the AI Performance Audit Agent project.

## [D001] No-Database Architecture
- **Status**: Accepted
- **Context**: The project required a portable, easy-to-deploy solution for QA teams.
- **Decision**: We use a client-side only architecture where data is stored in `localStorage` for recent audits and `IndexedDB` for full report data. Portable JSON/ZIP packages serve as the exportable data format.
- **Consequences**: No backend infrastructure (Postgres/Redis) is needed. Data is device-bottlenecked unless exported/imported.

## [D002] PageSpeed-First Data Fetching
- **Status**: Accepted
- **Context**: Need reliable real-user data (CrUX) and lab data (Lighthouse).
- **Decision**: Primary data source is Google PageSpeed Insights API.
- **Consequences**: Provides both Field (CrUX) and Lab data in one call.

## [D003] IndexedDB for Large Audits
- **Status**: Accepted
- **Context**: Large audits with multiple pages exceeded the 5MB localStorage quota.
- **Decision**: Use IndexedDB as the primary storage for full audit reports, with a light summary in localStorage.
- **Consequences**: Allows auditing large batches of URLs (6+ pages) without storage crashes.

## [D004] 3-Layer Architecture
- **Status**: Accepted
- **Context**: B.L.A.S.T. protocol compliance.
- **Decision**: Separate project into Layer 1 (SOPs), Layer 2 (UI Orchestration), and Layer 3 (Deterministic Services).
- **Consequences**: High maintainability and clear separation of concerns.
