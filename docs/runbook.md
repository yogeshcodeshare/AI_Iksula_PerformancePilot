# Runbook

## Deploy
- Hosting: Vercel, project `sitevitals-ai`, root directory `my-app`. Production URL: https://sitevitals-ai.vercel.app
- Every merge to `main` deploys to production automatically. Every pull request gets a preview deployment (Vercel login required to view).
- The build is a static export (`next.config.ts`: `output: 'export'`, `distDir: 'dist'`). There is no server code.

## Configuration
| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_PAGESPEED_API_KEY` | Vercel project env vars, `my-app/.env.local` locally | Google PageSpeed Insights API key. Without it, Google allows ~1 request / 100 s and a very small daily quota. |

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
- There is no central failure log yet. Proposal: a small serverless endpoint plus a log table (see the project plan).
