# Architecture and Product Decisions

This document records the key architectural and product decisions made for the AI Performance Audit Agent project.

## [D001] No-Database Architecture
- **Status**: Superseded in part by D005 (Nov 2026): the browser-only mode remains the default and the guest experience; an optional database is added for logged-in Iksula QA and central error logging.
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

## [D005] Optional Supabase Database, Invite-Only Login, Central Error Log
- **Status**: Accepted (Nov 2026). Phase A in progress.
- **Context**: Users reported that comparing runs is manual (exported JSON files) and that failing URLs leave no record the team can investigate. Reports live only in each tester's browser.
- **Decision**: Add Supabase (Postgres + Auth) as an **optional** backend:
  - If the `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` variables are not set, the app behaves exactly as before (D001 mode).
  - **Error log** (`audit_failures`): every user, guest or logged in, can insert validated rows; only logged-in Iksula users can read them.
  - **Login**: invite-only (public sign-up disabled), `@iksula.com` emails only, one account per person (no shared password).
  - **Saved runs** (`audit_runs`): only for logged-in QA, enabling compare-from-list and team history.
  - Access is enforced by Row Level Security on every table; the service-role key is never shipped to the browser.
- **Consequences**: A managed service to look after (project pause on the free tier, backups, user invites). Guest URLs are stored for 90 days: a privacy note is shown on the New Audit page. Static export and Vercel hosting are unchanged.
