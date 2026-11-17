# SOP: Optional Database (Supabase), Login and Error Logging

Decision: [D005](../decisions.md). Plan: Project Detailed Plan v1.3, section 8.

## Principles
1. **Optional.** If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, every database feature is off and the app behaves exactly as the browser-only version. No error is shown.
2. **Never blocks an audit.** Database calls are best-effort: failures are swallowed (console warning only). An audit must never fail or slow down because logging failed.
3. **Least privilege.** Only the public (anon) key is in the browser. Every table has Row Level Security. The service-role key is used only in the Supabase dashboard / SQL editor, never in the app or repo.
4. **Schema as code.** All tables, policies and functions live in `supabase/migrations/*.sql`, applied in order. Never edit the database by hand without a matching migration.

## Error logging (`audit_failures`) — Phase A
**When:** after a run completes (including after the automatic second pass) and after each manual retry, for every page+device failure that remains.

**What is sent (per failure):**
| Field | Limit | Notes |
|---|---|---|
| `run_id` | uuid | client-generated audit run id |
| `url` | ≤ 2048 chars, must start with http(s):// | the audited URL |
| `device` | `mobile` \| `desktop` | |
| `error_code` | one of the `AuditErrorCode` values | unknown codes rejected by a CHECK constraint |
| `message` | ≤ 1000 chars (truncated client-side) | Google's message / our explanation |
| `phase` | `run` \| `retry` | |
| `app_version` | ≤ 32 chars | |
| `guest_session` | ≤ 64 chars | random id kept in localStorage for guests |
| `user_id` / `user_email` | set by the database from the login token | never trusted from the client |

**Never sent:** names, IP addresses, API keys, page content.

**Abuse protection:** CHECK constraints (lengths, formats, known codes); a trigger rejecting more than 60 rows per guest session per hour; client sends at most 50 rows per run.

**Retention:** rows older than 90 days are deleted daily (`pg_cron`).

**Privacy notice:** the New Audit page states that failed audits (URL and error only) are logged to help improve the tool.

## Access rules (Row Level Security)
| Table | anon (guest) | authenticated Iksula user |
|---|---|---|
| `audit_failures` | INSERT only (no SELECT/UPDATE/DELETE) | INSERT, SELECT |
| `audit_runs` (Phase C) | none | SELECT all; INSERT/DELETE own |

"Iksula user" = authenticated and `auth.jwt() ->> 'email'` ends with `@iksula.com`.

## Login (Phase B)
**Who:** Iksula QA team only. Guests keep full audit functionality without logging in.

**How accounts are created:** public sign-up is OFF in Supabase Auth (Sign In / Providers). An admin invites each person from the Supabase dashboard (Authentication -> Users -> Add user -> Send invitation). There is no sign-up form in the app.

**How people sign in (app page /login/):**
1. Email + password (the password they chose from the invite link), or
2. "Email me a sign-in link" (magic link). Uses signInWithOtp with shouldCreateUser: false, so it never creates accounts.
3. "Forgot password" sends a reset email.

**Invite / reset links** land on /account/ (Supabase reads the token from the URL), where the user sets or changes their password.

**Domain rule (defence in depth):** a trigger on auth.users rejects any insert or email change to an address not ending in @iksula.com (migration ..._auth_iksula_only.sql). Read access to team data also requires an @iksula.com email (is_iksula_user()).

**UI:** the navbar shows "Log in" (when Supabase is configured and nobody is signed in) or the user's email with a Sign out option. When Supabase is not configured, no login UI is shown at all.

**Session:** stored in the browser (localStorage key pp-auth) by supabase-js and refreshed automatically. Signing out clears it.

**Supabase URL settings (Authentication -> URL Configuration):** Site URL = https://sitevitals-ai.vercel.app ; Redirect URLs = https://sitevitals-ai.vercel.app/** , https://*-yogeshcodeshares-projects.vercel.app/** , http://localhost:3000/**

**Adding / removing a user:** see docs/runbook.md "Team accounts".

## Saved runs (Phase C)
**Table `audit_runs`**: one row per audit run saved by a logged-in Iksula user. The primary key is the app's `runId`, so saving the same run twice updates it rather than duplicating it.

**When saved:** automatically after a run (and after a retry) when the user is logged in with an @iksula.com account. Guests are never saved. Users can also move older runs from "This browser" with **Save to my account**.

**What is stored:** a *trimmed* report package (`report` jsonb):
- all pages, metrics, category scores and CWV assessments (full),
- diagnostics: only `fail` and `warning` items, at most 15 per page and device, without the long `details` text.

This keeps rows around 50–200 KB (thousands of runs fit the 500 MB free plan). The full report remains available through the PDF/JSON export at audit time. A CHECK constraint rejects reports over 2 MB.

**Summary columns** (for fast lists): project, label, environment, deployment tag, page count, metric count, overall health, created_by, created_by_email, created_at.

**Access (RLS):**
| Action | Who |
|---|---|
| SELECT | any logged-in @iksula.com user (team visibility) |
| INSERT / UPDATE | only the owner (`created_by = auth.uid()`), and only @iksula.com users |
| DELETE | only the owner |
| Guests (anon) | nothing |

`created_by` and `created_by_email` are always set by a trigger from the login token, never trusted from the client.

**Dashboard (logged in):** tabs **My audits**, **Team audits** and **This browser**; filters by project, date and search text; tick any two runs → **Compare selected** opens `/compare/?baseline=<id>&current=<id>`, loading both runs from the database.

**Failures page (`/failures/`):** logged-in Iksula users only. It reads `audit_failures` (newest first, with filters) and shows a summary by error code.
