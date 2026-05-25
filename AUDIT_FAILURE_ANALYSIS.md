# Audit Failure Root Cause Analysis & Improvement Plan

**Date:** 2026-05-25 (re-investigated)
**Reported by:** Yogesh
**Symptom:** `sitevitals-ai.vercel.app/audit/progress/` (converse.com.au audit) — every page showing **Timeout / Failed**; ~14/17 requests `(canceled)` at exactly 1.5 min in DevTools, plus mixed 400/429/500 errors.

> **NOTE:** This document supersedes the original analysis. The original session jumped to "Vercel env var is missing" — that was WRONG. The env var was already set. Re-investigation produced a different (and more interesting) root cause.

---

## 1. CORRECTED ROOT CAUSE

The screenshot is the **end state of three interacting problems**, not a single missing env var:

| # | Mechanism | Evidence |
|---|---|---|
| **A** | **PSI takes 80-90s on heavy bot-protected sites.** converse.com.au sits behind Imperva Incapsula; Lighthouse's run inside PSI completes in ~83 s. The code's `PAGESPEED_TIMEOUT_MS = 90_000` left ~7 s of headroom — under any jitter or parallel-call contention, calls aborted at exactly the 90 s mark. | Direct `curl` to PSI for `https://www.converse.com.au/` with the production key returned **HTTP 200 in 83.5 s** with a 1.7 MB Lighthouse payload. The "1.5 min cancelled" rows in the screenshot are the `AbortController` firing milliseconds before PSI was going to return. |
| **B** | **PSI undocumented soft-throttle returns HTTP 500, not 429.** Per GoogleChrome/lighthouse #16853 and community sources, sustained calls produce 500 "Lighthouse returned error" — _and the correct recovery is a 60-180 s wait_, NOT the 2 s / 4 s / 8 s backoff this code uses. | Web research — see citations below. The 500s in the screenshot were the API saying "back off"; the code retried after 2 s, got 500 again, retried after 4 s, etc., never letting the throttle clear. |
| **C** | **The UI was illegible.** Both StatusCell ("Failed") and the row badge ("Failed" / "Rate Limited") flattened every error code into a single red label. No banner. No per-row code chip. So when problem A or B happened, there was no signal in the UI to distinguish them from a missing API key, a config error, a quota cap, or a referrer block. | Code review of `progress/page.tsx`: `StatusCell` only renders the status name; `RowStatusBadge` only differentiates `rate-limit` vs everything else. |

**Verdict on the "missing env var" hypothesis from the prior doc: RULED OUT.** I downloaded all 15 JS chunks from `https://sitevitals-ai.vercel.app/audit/`, grepped them for `AIza[A-Za-z0-9_-]{30,40}`, and found the production bundle contains `AIzaSyBuLq...Ml1o` — which matches the local `.env.local` key fingerprint. The key tested against PSI returned **HTTP 200** with and without a `Referer: sitevitals-ai.vercel.app` header.

---

## 2. HYPOTHESIS-BY-HYPOTHESIS VERDICT

| Hyp | Statement | Verdict | Evidence |
|---|---|---|---|
| **H1** | Stale or un-inlined API key in deployed bundle | **RULED OUT** | Production bundle chunk `486b55da528113b7.js` contains `AIza…Ml1o` (matches local). `process.env.NEXT_PUBLIC_PAGESPEED_API_KEY` is a static reference — Next.js inlines it at build time. Verified by `grep -roE 'AIza[0-9A-Za-z_-]{30,40}'` over `dist/` (local) and downloaded Vercel chunks (prod). |
| **H2** | Google API key referrer restrictions block the Vercel domain | **RULED OUT for current key**, but **CODE GAP CONFIRMED** | Tests A (no Referer), B (Referer: sitevitals-ai.vercel.app), C (Origin + Referer) all returned HTTP 200. So no referrer restriction is active on the present key. **But** `classifyHttpError` did NOT distinguish HTTP 403 / `API_KEY_HTTP_REFERRER_BLOCKED` — every non-429 was lumped into `api-error`. **Now fixed.** Surfaced in UI as `referer-blocked` with link to Cloud Console. |
| **H3** | Quota exhaustion on real key | **RULED OUT for current key** | The 429 we saw in the prior session came from an unauthenticated call (default project `583797351490`). The actual key works (HTTP 200). Daily quota is 25,000 queries. **The key is still publicly exposed** (NEXT_PUBLIC inlines into the bundle — anyone can scrape it), so this remains a security/cost concern listed in §5 wider improvements. |
| **H4** | HTTP 500 is undocumented throttling, not just transient errors | **CONFIRMED** | Web research: GoogleChrome/lighthouse#16853, bjb.dev "secret rate limit", Google Groups thread "How to reduce the error rate" all confirm 500 = soft-throttle requiring 60-180 s cooldown. Code was retrying after 2 s — making it worse. **Now fixed:** `CONSECUTIVE_FAILURE_LIMIT = 3` plus default `60s` cooldown abort the audit before the 500-storm becomes a 10-minute wait. |
| **H5** | Timeout too tight; Retry-After ignored | **CONFIRMED** | converse.com.au takes 83 s, timeout was 90 s → ~7 s margin. `grep -i retry-after src/services/audit.ts` returned 0 matches → header never read. **Now fixed:** timeout bumped to 120 s (retry 150 s); `parseRetryAfter()` reads the header and clamps to a 180 s ceiling. |
| **H6** | Failure mode illegible | **CONFIRMED** | No banner. No per-row error code. **Now fixed:** `ErrorCodeChip` under each failed cell + `dominantFailure` banner above the hero that surfaces hard config errors immediately and other codes when >= 50% of tasks share them. |

---

## 3. CODE CHANGES SHIPPED

### `my-app/src/services/audit.ts`

| Change | Why |
|---|---|
| New `AuditErrorCode` union with 9 codes (added `referer-blocked`, `permission-denied`, `quota-exhausted`, `preflight-failed`) | Each implies a different remediation — generic "api-error" wasn't actionable. |
| `PAGESPEED_TIMEOUT_MS` 90 s → **120 s**, retry 120 s → **150 s** | converse.com.au actually took 83 s in our direct test — 90 s was wire-thin. |
| `parseRetryAfter(header)` helper | RFC 7231 parsing for seconds-or-date. Clamped to `MAX_RETRY_AFTER_MS = 180_000`. |
| `classifyHttpError(status, body)` — replaces inline logic in `fetchPageSpeed` | Distinguishes 403/referer vs 403/permission vs 429/quota vs 429/burst vs 5xx. |
| `fetchPageSpeed` reads `response.headers.get('retry-after')`, attaches `retryAfterMs` to thrown error | Honored downstream in `runAudit`. |
| `preflightCheck()` — exported. 10 s ping at google.com before user URLs | Catches `referer-blocked` / `permission-denied` / `quota-exhausted` BEFORE walking 30 pages at 120 s each. |
| In-memory PSI response cache (`psiCache` Map keyed by `url+strategy+hourBucket`) | Saves quota across re-runs of the same audit within an hour. |
| `CONSECUTIVE_FAILURE_LIMIT = 3` + `consecutiveFailures` counter in `runAudit` | After 3 consecutive `rate-limit`/`api-error`/`timeout` failures the audit aborts and marks remaining pages with "Audit aborted before this page: …" — instead of taking the next 10 minutes to fail the same way. |
| `runAudit` now honors `res.retryAfterMs` when entering throttle mode (default 60 s if no header) | Replaces the previous 3 s hardcoded cooldown — which was actively counterproductive per H4. |
| Hard error codes (`referer-blocked`, `quota-exhausted`, `permission-denied`) short-circuit the audit on the first occurrence | No point trying 16 more URLs if the API key is misconfigured. |

### `my-app/src/app/audit/progress/page.tsx`

| Change | Why |
|---|---|
| `ERROR_CODE_LABELS` — single source of truth for short label + description per error code | Keeps row chip and banner wording consistent. |
| `ErrorCodeChip` — small monospace red chip rendered below "Failed"/"Timeout" | Shows the *actual* reason (`TIMEOUT`, `RATE LIMIT`, `KEY BLOCKS SITE`, `QUOTA EXHAUSTED`, ...) per row. |
| `StatusCell` now accepts and renders `errorCode` | Wiring for the chip. |
| `dominantFailure` `useMemo` (declared **before** any early return per React rules-of-hooks — see CLAUDE.md) | Decides whether to show the top-of-page banner. Hard config errors trigger immediately; other codes only when ≥ 50 % of tasks share them. |
| Banner JSX inserted above the hero, styled with theme tokens (`--red-bg/--red-text` for hard errors, `--amber-bg/--amber-text` for soft) | The piece of UI that was missing in the screenshot — the user now sees *why* before they see the wall of red rows. |
| For `referer-blocked` the banner shows a direct link to Google Cloud Console → Credentials | One click to the page they need. |
| `runAuditProcess`'s top-level catch now prefixes the error message with the underlying code (e.g. `[Quota exhausted] …`) when the failure was a preflight | The error already explains the root cause — let it through. |

**Adherence to project rules (from CLAUDE.md / gemini.md):**

- ✅ **Anti-Hallucination:** no new "fake" metric values; all PSI data still traces to a response.
- ✅ **No backend / no database:** all changes are client-side; in-memory cache, no IndexedDB/localStorage growth.
- ✅ **`saveAuditStateAsync()` awaited** before results link activates — untouched.
- ✅ **Theme-aware Tailwind classes** — used `var(--red-bg)`, `var(--amber-text)`, `text-foreground`, etc.
- ✅ **`text-primary-foreground` with `bg-primary`** for buttons — untouched.
- ✅ **React Rules of Hooks:** `useMemo` declared before the `if (!formData)` early return (caught by lint, fixed before commit).

---

## 4. RESEARCH CITATIONS

- [PSI API quota: 25,000/day, 400/100s per project](https://developers.google.com/speed/docs/insights/v5/get-started) — Google official docs (groups thread confirms current numbers as of 2026).
- [Pagespeed API V5 returns code 500 "Lighthouse returned error" — googlechrome/lighthouse#16853](https://github.com/googlechrome/lighthouse/issues/16853) — 500-as-soft-throttle, recovery 60-180 s.
- ["pagespeed insights API has a secret rate limit" — bjb.dev](https://bjb.dev/log/20221009-pagespeed-api/) — confirms 500-vs-429 throttling behavior and per-origin limits.
- [Google Groups: How to reduce the error rate when calling the PSI API](https://groups.google.com/g/pagespeed-insights-discuss/c/flwhHJELbws) — discusses the 5-10 concurrent calls / 450-call burst limit before 500 errors.
- [Firebase JS SDK #5657 — empty Referer breaks API key referrer restriction](https://github.com/firebase/firebase-js-sdk/issues/5657) — pattern relevant to H2: browser fetch can send empty Referer which referrer-restricted keys reject.
- [Next.js Environment Variables guide](https://nextjs.org/docs/pages/guides/environment-variables) — confirms `NEXT_PUBLIC_*` is **build-time** inlining, not runtime. Important caveat: a Vercel env-var change requires a rebuild for new value to land in the JS bundle.

---

## 5. REMAINING ACTION ITEMS FOR YOU (User)

1. **Confirm the new code on Vercel.** Push to main → Vercel auto-rebuilds → key is re-inlined → preflight runs at audit start. Hit `https://sitevitals-ai.vercel.app/audit/progress/` and watch the console: you should see `[Audit] Running preflight check against PageSpeed API...` followed by either no warning or a labelled error.
2. **Optional but recommended — verify Google Cloud Console settings on the key**:
   - **Credentials → click your key → Application restrictions.** Either set to **None** (testing), or add `https://sitevitals-ai.vercel.app/*` and `http://localhost:3000/*` to the HTTP-referrers list. The new `referer-blocked` UI now surfaces this clearly if you get it wrong.
   - **API restrictions.** Confirm **PageSpeed Insights API** is in the allowed list.
3. **Tech debt left for later** (NOT done in this PR — separate concerns):
   - Key still ships in the public JS bundle. To eliminate the scraping/cost risk, move PSI calls behind a Vercel Edge Function and remove `NEXT_PUBLIC_` prefix. Requires giving up `output: 'export'` static-only build mode.
   - No test suite. The two changes shipped (timeout bump, banner) are easy to regress. Add Vitest + ~10 unit tests around `parseRetryAfter`, `classifyHttpError`, `preflightCheck`, `dominantFailure`.
   - `runLighthouse()` is dead code that always throws — remove or implement.
   - `my-app-final/` is stale per CLAUDE.md — delete.
   - The `Re-investigation` revealed that the previous `AUDIT_FAILURE_ANALYSIS.md` was wrong about the env var. Worth adding a runbook step: "always grep the deployed bundle for the key before assuming an env var issue."

---

## 6. MANUAL TEST PLAN (because no test suite exists)

Run from `my-app/`:

```bash
npm run dev
```

Then in the browser:

| # | Scenario | How to set up | What you should see |
|---|---|---|---|
| 1 | Healthy audit (small site) | New Audit → `https://www.google.com` → run | Banner: **none**. All rows green. Preflight log in console. |
| 2 | Heavy site (the actual converse case) | New Audit → `https://www.converse.com.au/` | Banner: **none** (success expected with new 120 s timeout). Rows take ~80 s each. Cache makes a 2nd run instant. |
| 3 | Force referrer block | In GCP, temporarily restrict the key to `localhost:3000` only. Reload prod URL. | Banner: red, **"Key blocks site — Open Google Cloud Console → Credentials"** link. Audit aborts after preflight. |
| 4 | Force 5xx storm | (Can't easily simulate — but) audit 20+ heavy sites in one batch. | After 3 consecutive failures, banner appears, remaining rows marked "Audit aborted before this page". No more 10-minute waits. |
| 5 | Rate-limit cooldown | Run an audit that triggers a 429 (mass concurrent calls). | Console log: `[Audit] Rate limited → sequential mode, cooling down 60000ms (server hint: <ms> or none)`. Audit continues at concurrency 1. |
| 6 | Per-row chip | Any failing row | Red `TIMEOUT` / `RATE LIMIT` / `API ERROR` chip below the "Failed" text. Hover for full description. |

Steps already executed in this session:

- `git fetch && git pull origin main` → already up to date.
- `npm install` → clean.
- `npm run build` → **success**, all 9 routes prerendered.
- `npm run lint` on touched files → **0 new errors/warnings**.
- Direct PSI API tests against `google.com`, `converse.com.au`, with/without Referer, with/without API key → captured in §1 evidence.
- Production bundle download + grep → key correctly inlined.

---

## 7. FILES TOUCHED

- `my-app/src/services/audit.ts` — net +~190 lines: preflight, retry-after, in-memory cache, consecutive-failure abort, error classifier overhaul, timeout bump.
- `my-app/src/app/audit/progress/page.tsx` — net +~100 lines: `ErrorCodeChip`, `ERROR_CODE_LABELS`, `dominantFailure` memo, banner JSX, StatusCell errorCode plumbing.
- `AUDIT_FAILURE_ANALYSIS.md` (this file) — full rewrite.

No other files were modified.
