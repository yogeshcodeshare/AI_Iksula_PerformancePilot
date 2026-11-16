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
- Public sign-up OFF in Supabase Auth. Users are invited by an admin from the Supabase dashboard; each sets their own password.
- A database trigger on `auth.users` rejects any email not ending in `@iksula.com` (defence in depth).
- Removing a user: Supabase dashboard → Authentication → Users → delete. Their saved runs remain (owned by the deleted id) unless deleted explicitly.
