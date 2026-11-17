# Runbook

## Deploy
- Hosting: Vercel, project `sitevitals-ai`, root directory `my-app`. Production URL: https://sitevitals-ai.vercel.app
- Every merge to `main` deploys to production automatically. Every pull request gets a preview deployment (Vercel login required to view).
- The build is a static export (`next.config.ts`: `output: 'export'`, `distDir: 'dist'`). There is no server code.

## Configuration
| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_PAGESPEED_API_KEY` | Vercel project env vars, `my-app/.env.local` locally | Google PageSpeed Insights API key. Without it, Google allows ~1 request / 100 s and a very small daily quota. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel env vars (optional) | Turn on central error logging (and later login). Public values; access is enforced by Row Level Security. Setup: `supabase/README.md`. Never add the service-role key. |

The key is public in the browser bundle by design. Protect it in Google Cloud Console: **API restrictions** = PageSpeed Insights API only, **HTTP referrers** = `sitevitals-ai.vercel.app/*`, `*.vercel.app/*` (previews), `localhost:3000/*`.

## When audits fail: what each error means

| Label in UI | Code | Cause | What to do |
|---|---|---|---|
| Timeout | `timeout` | Google took longer than 120 s (150 s on retry). Common on heavy / bot-protected pages under load. | The app retries automatically once (second pass). If it still fails, retry later or test at pagespeed.web.dev. |
| API error | `api-error` | Google-side 5xx / soft throttle. | Automatic second pass; manual Retry waits 30/60/120 s. |
| Rate limit | `rate-limit` | Too many calls per minute. | App slows to sequential mode automatically. |
| Page not auditable | `psi-page-error` | Lighthouse could not render the page (bot protection, NO_FCP). Retried 3× in-line. | Check the page at pagespeed.web.dev. If it fails there too, the page is incompatible. |
| Site unreachable | `page-unreachable` | Wrong domain, connection refused, or a file (PDF) instead of a web page. | Fix the URL. Not retried. |
| Quota exhausted | `quota-exhausted` | Daily API quota used up. | Wait for the reset (midnight Pacific / UTC per Google) or raise the quota in Google Cloud. The audit stops early. |
| Key blocks site / Key denied | `referer-blocked` / `permission-denied` | API key restrictions or API not enabled. | Fix the key settings in Google Cloud Console. The audit stops at the pre-flight check. |

## Reporting a failure
On the progress page, **Report on GitHub** opens a pre-filled issue (run ID, URLs, devices, error codes, messages). Review it before submitting: the repository is public, so remove client URLs if they are confidential.

## Verify a deployment
```bash
cd my-app
E2E_BASE_URL=https://sitevitals-ai.vercel.app npx playwright test e2e/smoke.spec.ts
```

## Known limits
- Some pages are too slow for Google PageSpeed itself (e.g. ajio.com mobile in Nov 2026 tests). The app reports them clearly, but cannot force success.
- A 404 page or a login redirect is scored as whatever page loads (reported as success). Follow-up planned.
- Central failure log: live (Phase A). Guest logs are capped at 60/hour per browser and 600/hour in total; entries are deleted after 90 days.

## Team accounts (Phase B login)
Login is for the Iksula QA team only (`@iksula.com`). Guests use every audit feature without an account. There is no sign-up form.

**One-time Supabase settings (Authentication):**
- Sign In / Providers: "Allow new users to sign up" **OFF**, "Confirm email" **ON**, Email provider **enabled**.
- URL Configuration: Site URL `https://sitevitals-ai.vercel.app`. Redirect URLs: `https://sitevitals-ai.vercel.app/**`, `https://*-yogeshcodeshares-projects.vercel.app/**`, `http://localhost:3000/**`.

**Add a team member:** Supabase → Authentication → Users → **Add user → Send invitation** → enter their `@iksula.com` email. They receive an email, click the link, land on `/account/`, and set their own password (8+ characters). Non-Iksula emails are rejected by the database.

**Remove a team member:** Supabase → Authentication → Users → find the user → **Delete user**. They are signed out at their next token refresh (within an hour) and cannot sign in again.

**Forgotten password:** the user clicks "Forgot password?" on `/login/`, or uses "Email me a sign-in link".

**Note:** Supabase's built-in email service sends only a few emails per hour on the free plan. For the first batch of invites, send them a few minutes apart, or configure a custom SMTP sender (Authentication → Emails → SMTP Settings).

## Security checklist (Phase D, 17 Nov 2026)
Checked read-only against the live project (Supabase advisors + SQL), and in code.

| Check | Result |
|---|---|
| Row Level Security on every public table | Pass (`audit_failures`, `audit_runs`) |
| Guests can read failures or runs | No: RLS returns nothing; `anon` has no grant on `audit_runs`; SELECT on `audit_failures` revoked in migration 0005 |
| Only `@iksula.com` accounts | Pass: sign-up off, invite only, database trigger `enforce_iksula_email` |
| A QA member can change or delete another member's run | No: update/delete policies require `created_by = auth.uid()` |
| Who saved a run / who hit a failure | Set by database triggers, not by the browser |
| Guest error-log flooding | Per-browser 60/hour + global 600/hour cap (migration 0005) |
| Only the public anon key in the app / Vercel | Pass (no service-role key anywhere) |
| Old failures deleted | Pass: daily job removes entries older than 90 days |
| Supabase security advisors | 0 errors; 1 warning: leaked-password protection (Pro-plan feature, see below) |

**Open items (owner decision):** leaked-password protection (Authentication → Policies) requires the Pro plan; minimum password length is 8.

## Keep the database awake (Free plan)
Free Supabase projects pause after 7 days with no activity. `.github/workflows/supabase-keepalive.yml` calls the read-only `ping()` function every Monday and Thursday.
Setup: GitHub → repo → Settings → Secrets and variables → Actions → add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the same public values as in Vercel). Run it once from the Actions tab to check. On the Pro plan, delete the workflow.
If the project is paused anyway: Supabase dashboard → project → **Restore**. Guests are not affected while it is paused (audits still run; only logging, login and saved runs stop).

## Team rollout (pilot, then everyone)
1. **Pilot (2 QA members, ~3 days):** invite 2 people. Each one: accept the invite, set a password, run one audit on a real client page, open Dashboard → My audits, compare two runs, open Failures.
2. Collect feedback (what was confusing, any failed URLs) and fix blockers.
3. **Whole team:** invite the rest a few minutes apart (email limit), share the short guide below.
4. After one week: check Failures for repeated errors and Supabase usage (Database size, Auth users).

**Short guide for QA members**
- Log in: `https://sitevitals-ai.vercel.app/login/` with your Iksula email.
- Every audit you finish while logged in is saved automatically (Dashboard → My audits / Team audits).
- Compare: tick two runs → **Compare selected**. The older run is the baseline.
- Failures: every failed URL (yours, team's and guests') with the reason and what to do.
- You can delete only your own runs.
