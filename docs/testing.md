# Testing

PerformancePilot has three test layers. All run offline: the Google PageSpeed API is replaced by fixtures, so results are fast and repeatable.

| Layer | Tool | Where | What it covers |
|---|---|---|---|
| Unit | Vitest | `my-app/src/**/*.test.ts` | CWV thresholds and formatting, PSI metric/category/diagnostic extraction, error classification, retry and second-pass policy, comparison and URL matching, storage (fake IndexedDB), issue-report URL |
| Component | Vitest + React Testing Library | `my-app/src/**/*.test.tsx` | Compare upload dialog (save-before-callback, error messages), New Audit form (Bulk Add labels, duplicate URLs, required fields) |
| End-to-end | Playwright (+ axe-core) | `my-app/e2e/*.spec.ts` | Full journeys in Chromium against the real app, with PSI mocked via `page.route` |

## Commands (from `my-app/`)

```bash
npm test                 # unit + component
npm run test:coverage    # with coverage (coverage/index.html)
npm run test:e2e         # E2E; starts `npm run dev` automatically
npx playwright show-report
E2E_BASE_URL=https://sitevitals-ai.vercel.app npx playwright test e2e/smoke.spec.ts   # smoke a deployment
```

## End-to-end scenarios

| Spec | Scenario |
|---|---|
| `smoke.spec.ts` | Dashboard loads |
| `audit-flow.spec.ts` | Configure (Bulk Add) → run (mobile + desktop) → results → JSON export; dashboard lists the run |
| `compare.spec.ts` | Baseline `https://cmp.test` vs current `https://cmp.test/` is matched and shows IMPROVED; non-report file is rejected |
| `failures.spec.ts` | Unreachable URL shows "Site unreachable", is not retried, and "Report on GitHub" contains the URL; empty form is blocked |
| `settings-a11y.spec.ts` | Threshold settings persist across reload; axe scan of `/`, `/audit/`, `/settings/`, `/about/` (gate: no critical violations) |

## Fixtures

- `test/fixtures/psi.ts`: PSI responses with URL-level CrUX, origin-level CrUX or lab-only data (modelled on a real web.dev run).
- `test/fixtures/psi-429-quota.json`: Google's real "Queries per day" quota error body.
- `test/fixtures/reports.ts`: schema-complete report packages for comparison tests.

## Known-bug tests

A bug is first captured as `it.fails(...)` (the suite stays green while the bug exists). When the fix lands, Vitest reports it as unexpectedly passing, and the test becomes a normal `it(...)`. Example: Compare URL matching (`comparison.test.ts`, "B.2").

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every pull request:
type check → lint (report only, pre-existing issues) → unit tests with coverage → production build → E2E. Playwright and coverage reports are uploaded as build artifacts.
