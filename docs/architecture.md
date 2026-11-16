# Architecture

PerformancePilot is a **client-side** Next.js 16 app exported as static files and hosted on Vercel. All audit orchestration runs in the user's browser. The only external dependency is the Google PageSpeed Insights (PSI) v5 API.

```
Browser (static Next.js app)
 ├─ app/            pages: Dashboard, New Audit, Progress, Results, Compare, Settings, About
 ├─ components/     results widgets, shadcn/ui primitives
 ├─ hooks/          useAuditState, useResultsFilters, useDiagnosticWorkspace
 ├─ services/       audit.ts      PSI client, error classes, retries, second pass, extraction
 │                  comparison.ts normalizeUrl, matchPages, deltas
 │                  export.ts     PDF / JSON / ZIP
 │                  storage.ts    IndexedDB + localStorage
 └─ lib/            thresholds, formatting, Bulk Add helpers, GitHub issue URL
        │ HTTPS (API key)
        ▼
 Google PageSpeed Insights v5 (CrUX field data + Lighthouse lab data)
```

## Audit pipeline
1. Validate the form (normalized-URL duplicate check). Data goes to sessionStorage.
2. Pre-flight PSI call (no cache). Stop on key, quota or referrer errors.
3. Pages in parallel batches (2–5 depending on page count). Each page runs mobile, then desktop.
4. Each call: 120 s timeout. `psi-page-error` retried in-line 30/60/120 s.
5. **Second pass**: transient failures retried once, sequentially, after 30 s, with a 150 s timeout.
6. Normalize metrics (URL CrUX → origin CrUX → lab), category scores, diagnostics, CWV assessment.
7. `await saveAuditStateAsync()` (IndexedDB) before "View Results" activates.

## Compare
Upload JSON → `importReportPackage()` validates → **await** baseline save → `/compare/?current=<runId>` → `matchPages()` (normalized URL, then label + type) → deltas with a noise threshold. See [`architecture/comparison-sop.md`](../architecture/comparison-sop.md).

## Key decisions
| Decision | Why | Trade-off |
|---|---|---|
| PSI as the only data source | Same numbers clients see in Google tools; includes real-user data | Subject to Google quota and latency |
| No server / database | Zero ops, no data retention, portable JSON | No central history or failure log (proposal pending) |
| IndexedDB for run state | Large diagnostics payloads exceed localStorage | Writes must be awaited |
| Sequential retries after cooldown | Parallel immediate retries re-triggered Google throttling | Recovery takes longer (30–120 s) |
| GitHub issue via pre-filled URL | Works without a server or secret | Not automatic; the user submits |

## Planned extension: database, login, error logging (D005)
Phased plan: Project Detailed Plan v1.3, section 8. Rules: [`architecture/database-sop.md`](../architecture/database-sop.md).

| Phase | Status | What |
|---|---|---|
| A. Foundation + error logging | **Code ready, waiting for the Supabase project** | `audit_failures` table + Row Level Security (`supabase/migrations`), optional client (`lib/supabase.ts`), `services/errorLog.ts` hooked into the progress page, privacy notice |
| B. Invite-only login | Planned | Sign-up off, `@iksula.com` only, login/logout UI |
| C. Saved runs + compare from list | Planned | `audit_runs`, team history, Failures page |
| D. Hardening + rollout | Planned | E2E with mocked Supabase, security review, onboarding |

When `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset, all of this is off and the app is unchanged.
