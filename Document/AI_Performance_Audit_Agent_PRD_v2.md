# AI Performance Audit Agent

> Client-ready PRD, standardized audit template design, page-wise wireframes, and full delivery plan

> **Note:** Revision note<br>This revision incorporates the latest scope updates: Google PageSpeed Insights must be the primary data source, Lighthouse is the fallback when PageSpeed does not return usable data, Postgres is removed from scope, comparisons must work through uploaded previous reports, and every audit must output one standardized multi-page website performance audit report.


| Prepared for | QA teams performing recurring website performance audits |
| --- | --- |
| Primary users | Manual testers, automation testers, QA leads, release verification teams |
| Deployment target | Vercel-friendly, free/open-source oriented web application |
| Core outputs | Standardized audit PDF, canonical JSON report package, and comparison PDF |


## 1. Executive summary

Your current workflow is spreadsheet-driven: a tester manually runs Google PageSpeed for key pages such as Homepage, Category pages, PDP, PLP, and Search Result pages, records mobile and desktop values for LCP, INP, CLS, FCP, and TTFB, pastes screenshot evidence, and saves report links. The same work is then repeated after deployment or optimization, which makes comparison slow and error-prone.

The proposed product is a QA-friendly AI Performance Audit Agent that accepts a batch of URLs, runs a standardized performance audit, normalizes the results into a single website-level report, and exports stakeholder-ready PDF outputs. The system must prefer Google PageSpeed Insights as the primary source of truth for the report; when PageSpeed does not return usable results, it must automatically fall back to Lighthouse and label the evidence source clearly.

The revised design intentionally avoids Postgres or any mandatory server database. Instead, each audit produces a portable report package. A QA user can upload a previous report package later to generate a comparison report, making the workflow easy to share and reuse without long-term backend storage.

## 2. Current-state understanding from the uploaded workbook

The uploaded workbook confirms the structure and pain points of the current manual process.

| Observed workbook pattern | What it means | Design response in the new product |
| --- | --- | --- |
| Repeated page blocks | Each page is represented across multiple metric rows instead of one normalized record. | Normalize every page into a single canonical object with mobile and desktop metric groups. |
| Manual screenshot and link paste | Evidence collection is repetitive and easy to miss. | Auto-store source, timestamp, report URL, status, and evidence manifest inside the exported package. |
| Mobile and desktop captured separately | Comparison is harder because values sit across repeated rows. | Render one standardized page matrix that always shows both devices together. |
| Post-deploy re-audit is common | Trend comparison is a core use case, not a nice-to-have. | Generate a reusable JSON report package and support uploaded previous-report comparison. |


Sample page types found in the workbook: Homepage, Category 1, Category 2, PDP, Search Result, Converse -au-Ecomm, Category, Search result.

Sample metrics found in the workbook: LCP (Loading), INP (Interactivity), CLS (Stability), FCP, TTFB.

> **Note:** Example issues visible in the sample workbook<br> • Homepage: CLS desktop above target<br> • Category 1: CLS desktop above target<br> • Category 2: CLS desktop above target<br> • PDP: LCP mobile above target, LCP desktop above target, CLS mobile above target, CLS desktop above target<br> • PDP: LCP mobile above target, LCP desktop above target, CLS mobile above target, CLS desktop above target


## 3. Confirmed scope updates for this revision
1. Google PageSpeed Insights must be included in the report as the primary audit source.
2. If Google PageSpeed does not provide a usable result for a page/device, the system must automatically run Lighthouse as backup and clearly mark the fallback in the UI and exported report.
3. Do not use Postgres. The product must not depend on a relational database for baseline history or comparison.
4. To compare runs, the user will upload a previous report generated earlier. The app will use that uploaded report package for comparison.
5. Create one standardized performance audit template that combines all audited pages of a website into a single report every time, regardless of how many pages are audited.

## 4. Product vision and target users

Vision: give QA teams a repeatable, low-friction way to audit any website, capture consistent evidence, and send a professional single-report output without spreadsheet cleanup.

| User type | Primary need | Skill level | What success looks like |
| --- | --- | --- | --- |
| Manual tester | Run quick recurring audits and share PDF evidence | Low to medium | One audit in one flow with no spreadsheet formatting |
| Automation tester / SDET | Reuse a structured audit engine and deterministic results | Medium to high | Clear report package, fallback logic, and CI-friendly schema |
| QA lead | Compare before vs after deployment | Medium | Fast upload-based comparison without backend history setup |
| Client / stakeholder | Read a clean summary and action list | Low | Single polished PDF covering all pages and key regressions |


## 5. Product goals and non-goals

Goals
- Reduce manual audit preparation and reporting effort by at least 60 percent for a typical 5 to 15 page audit batch.
- Standardize every audit into one multi-page website performance report that QA can send directly.
- Support comparison without a backend database by using uploaded previous report packages.
- Show source transparency: PageSpeed primary, Lighthouse fallback, with explicit fallback reason.
- Keep the workflow understandable to non-specialist QA users.

Non-goals for v1
- No mandatory Postgres or server-side long-term report storage.
- No enterprise crawler replacement or full SEO platform.
- No automated code fixing on the audited website.
- No assumption that legacy manual PDFs can always be parsed perfectly for comparison.

## 6. Improved future-state audit process

| Step | Action | System behavior | Output |
| --- | --- | --- | --- |
| 1 | Create audit | User enters website name, audit label, environment, optional deployment/build tag, and adds URL rows with page labels. | Audit request draft |
| 2 | Run PageSpeed first | System requests mobile and desktop PageSpeed results for each URL. | Primary metric payloads |
| 3 | Fallback when needed | If PageSpeed fails, times out, returns partial data, or lacks required metrics, system runs Lighthouse backup. | Completed page result with source tag and fallback reason |
| 4 | Normalize results | System maps values into one canonical schema with thresholds, status, source, evidence links, and timestamps. | Normalized website audit dataset |
| 5 | Generate single report | System combines all audited pages into one standardized report template. | Website Performance Audit PDF + JSON package |
| 6 | Compare with prior report | User uploads a previous report package; system reads the canonical JSON and computes deltas. | Comparison dataset |
| 7 | Export comparison | System produces a separate comparison PDF with regressions, improvements, and missing-page notes. | Comparison PDF |


## 7. Standardized performance audit template

The application must always generate the same report structure so any QA can audit any website and still produce a consistent deliverable. The template is website-level, not page-level; all audited pages are included inside one report.

| Section | Mandatory content | Audience value | Always included? |
| --- | --- | --- | --- |
| Cover page | Project/site name, audit label, environment, audit date, auditor, source policy, run summary | Immediate context for client and QA lead | Yes |
| Methodology | PageSpeed-first rule, Lighthouse fallback rule, thresholds, devices, timestamp policy, evidence policy | Trust and repeatability | Yes |
| Audit scope | List of all page labels and URLs audited in this run | Confirms coverage | Yes |
| Executive summary | Overall health, total pages, counts by Good / Needs Improvement / Poor, highest-risk pages, key actions | Fast stakeholder read | Yes |
| Cross-page results matrix | All pages in one table, both devices, LCP/INP/CLS/FCP/TTFB, source, status | Standardized site-wide view | Yes |
| Per-page detail | Metric detail, evidence/report links, fallback notes, recommendations, screenshots/links if available | Developer and QA detail | Yes |
| Comparison section | Delta tables and charts vs uploaded previous report, regressions, improvements, missing/new pages | Release validation | Only when previous report uploaded |
| Appendix | Raw references, report package identifiers, schema version, glossary | Audit traceability | Yes |


## 8. Canonical report package design (replaces database dependency)

Because Postgres is removed, the exported report package becomes the system of record for future comparison. Each completed audit must produce a portable package that can be downloaded, stored locally, shared in chat/email, and uploaded later.

| File | Purpose | Required |
| --- | --- | --- |
| report.pdf | Human-readable single standardized website audit report | Yes |
| report.json | Canonical machine-readable audit payload for future comparison | Yes |
| metadata.json | Schema version, generated-at timestamp, app version, threshold profile, source policy | Yes |
| comparison-input-readme.txt | Explains that future comparison works best with this package | Recommended |


Legacy uploads such as manually created spreadsheets or PDFs may be accepted as a best-effort input, but exact comparison is guaranteed only for standardized report packages generated by this tool.

## 9. Functional requirements

### 9.1 Audit setup and URL intake
- User can create a new audit with project/site name, audit label, environment, optional deployment/build tag, optional notes, and multiple URL rows.
- Each row supports page label, page type, URL, optional priority/order, and custom tags.
- System supports standard labels such as Homepage, Category 1, Category 2, PDP, PLP, Search Result, plus custom labels.
- Bulk paste must be supported for many URLs.

### 9.2 Audit execution source policy
- System runs Google PageSpeed Insights first for both mobile and desktop.
- Report must store PageSpeed report URL when available.
- If PageSpeed returns no result, partial result, timeout, quota failure, invalid payload, or missing required metrics, system triggers Lighthouse fallback.
- The result record must store sourceUsed, sourceAttempted, fallbackTriggered, and fallbackReason.

### 9.3 Results and visualization
- User sees summary cards, cross-page tables, and charts for worst pages, metric distribution, and device split.
- Every metric row shows threshold, actual value, status, and source.
- Tables and charts must be filterable by page, device, metric, and status.

### 9.4 Standardized report generation
- One audit run must output one standardized website report covering all pages audited.
- PDF must be suitable for direct client sharing with no manual cleanup.
- JSON export must match the documented schema exactly.

### 9.5 Comparison workflow without database
- User uploads a previous standardized report package to compare against the current run.
- System validates schema version and matching scope where possible.
- Comparison shows absolute delta, direction of change, missing/new pages, and highest regressions.
- Comparison PDF is downloadable separately.

## 10. Non-functional requirements

| Area | Requirement | Notes |
| --- | --- | --- |
| Determinism | Same input should produce the same normalized schema and threshold mapping. | Important for QA trust |
| Transparency | Every narrative claim in UI or PDF must map to actual metric data. | Aligns with anti-hallucination rules |
| Resilience | Partial failures must not erase successful page results. | Fallback logic is mandatory |
| Usability | Non-specialist QA must be able to create a report in one guided flow. | Minimal setup |
| Deployability | Solution must be Vercel-friendly and open-source oriented. | Verify any live vendor limits during implementation |


## 11. Recommended architecture

Recommended implementation approach
- Frontend: Next.js + TypeScript
- UI: Tailwind CSS + shadcn/ui
- Charts: lightweight React charting library
- Current-run state: client state plus optional browser local storage or IndexedDB for draft convenience
- No Postgres or mandatory external database
- Audit orchestration: server routes and deterministic service layer
- Export: PDF generator plus canonical JSON package builder

> **Note:** Architecture principle<br>Use file/package portability rather than backend history. The app should treat the generated report package as the official comparison input for future runs.


## 12. Canonical data schema requirements

| Entity | Required fields | Notes |
| --- | --- | --- |
| AuditRun | runId, projectName, auditLabel, environment, deploymentTag, generatedAt, schemaVersion | Top-level metadata |
| AuditPage | pageId, pageLabel, pageType, url, sortOrder | Supports repeated page types such as multiple PDPs |
| MetricResult | device, metricName, value, unit, thresholdGood, thresholdWarn, status, sourceUsed, sourceAttempted, fallbackTriggered, fallbackReason, capturedAt | Core normalized metric record |
| Evidence | reportUrl, screenshotUrl, rawReferenceId | Screenshot may be optional |
| ComparisonDelta | baselineRunId, currentRunId, pageId/pageKey, metricName, device, baselineValue, currentValue, deltaValue, deltaDirection | Generated when comparison is requested |


## 13. Page-wise wireframe and content plan

| Screen | Purpose | Primary components | Key actions | Notes |
| --- | --- | --- | --- | --- |
| 1. Dashboard / Home | Entry screen | Recent audits, quick stats, create new audit button, upload previous report button | Start new audit, open existing local package, begin comparison | No database history required; recent items can come from local browser storage |
| 2. New Audit Setup | Collect audit inputs | Project fields, URL table, bulk paste, page-type selector, validation messages | Add/edit URLs, start audit | Must support many pages |
| 3. Audit Progress | Show run status | Queued/running/completed states by URL and device, fallback indicators | Retry failed item if supported | Show whether fallback was triggered |
| 4. Results Overview | Website-level summary | Summary cards, charts, cross-page matrix, export buttons | Download PDF/package, open page detail | Single standardized report view |
| 5. Page Detail | Deep dive on one page | Metric detail by device, source used, evidence links, recommendations | Review specific issues | Good for dev handoff |
| 6. Compare Runs | Upload-based comparison | Current run selector, previous report upload, delta charts/tables, missing/new page notices | Generate comparison PDF | No DB lookup required |
| 7. Report Center | Export management | Current run package files, schema version, download actions | Download PDF/JSON/package | Makes re-upload workflow clear |
| 8. Settings | Control thresholds and branding | Threshold profile, report branding, defaults, disclaimer text | Save local preferences | Settings may live in browser storage |


## 14. Full project plan

| Phase | Objective | Main deliverables | Acceptance gate | Target order |
| --- | --- | --- | --- | --- |
| Phase 0 | Discovery and schema lock | B.L.A.S.T memory files, gemini.md schema, clarified source policy, standardized template spec | No coding before schema exists | 1 |
| Phase 1 | UI foundation | Dashboard, setup form, local draft storage, validation | User can define a full audit batch | 2 |
| Phase 2 | Audit engine | PageSpeed integration, fallback rules, Lighthouse backup path, normalization | A full run returns normalized results with source labels | 3 |
| Phase 3 | Results and standardized report | Overview screen, cross-page matrix, per-page detail, PDF + JSON package export | Single report can be downloaded and reviewed | 4 |
| Phase 4 | Comparison mode | Previous report upload, schema validation, delta engine, comparison PDF | Baseline vs current works without database | 5 |
| Phase 5 | Hardening and QA | Test coverage, error states, anti-hallucination checks, docs | Stable v1 release candidate | 6 |


## 15. Acceptance criteria
- When the user enters multiple URLs and starts an audit, the system produces one website-level standardized result set and export package.
- When PageSpeed returns valid results, those results appear in the UI and PDF with PageSpeed as the source.
- When PageSpeed does not provide usable results, Lighthouse fallback is triggered and clearly labeled.
- When the user uploads a previous standardized report package, the system produces a comparison view and downloadable comparison PDF.
- No Postgres or mandatory relational database is required for core operation.
- Any QA user can run the same audit flow on a different site and still receive the same standardized report layout.

## 16. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| PageSpeed quota / throttling / transient failure | Missing primary-source data | Trigger Lighthouse fallback and log fallback reason |
| Legacy manual reports lack machine-readable structure | Imperfect comparisons | Guarantee accurate comparison for standardized JSON packages; mark best-effort legacy parsing |
| Large URL batches increase runtime | Longer audit sessions | Show per-page progress and allow partial completion visibility |
| Serverless runtime constraints for Lighthouse | Execution instability | Keep fallback architecture modular and verify runtime strategy during implementation |


## 17. Final recommendation

Proceed with a v1 product that is centered on a standardized, portable report package. Make Google PageSpeed Insights the first-choice evidence source, use Lighthouse as the controlled backup path, and remove database complexity from the initial release. This keeps the product practical for QA teams, easier to deploy on Vercel, and aligned with your real-world repeated audit workflow.
