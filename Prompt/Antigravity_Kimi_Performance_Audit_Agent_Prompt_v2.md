# Prompt for Antigravity + Kimi

You are building a production-ready **AI Performance Audit Agent** for QA teams.

## 1) Mission
Build a deterministic, QA-friendly web application that lets a tester paste website URLs, run standardized performance audits, view results in tables and charts, compare the current audit against an uploaded previous report, and export polished PDF reports.

This product replaces the manual spreadsheet workflow shown in the uploaded workbook.

## 2) Source material you must treat as ground truth
Use the following uploaded files as primary source input:
- `Converse Australia Performance score.xlsx`
- `Website performace Audit template.docx`
- `lighthouse-performance.SKILL.md`
- `B.L.A.S.T.md`
- `ch_01_anti_hallucination (2).md`

Do not ignore these files.

## 3) Non-negotiable operating mode
Follow the **B.L.A.S.T.** protocol and strict anti-hallucination rules.

### B.L.A.S.T. requirements
1. Initialize project memory before coding:
   - `task_plan.md`
   - `findings.md`
   - `progress.md`
   - `gemini.md`
2. `gemini.md` is the project constitution and must contain:
   - canonical data schemas
   - behavioral rules
   - architecture invariants
3. Do not write scripts in `tools/` until:
   - the payload/data schema is defined in `gemini.md`
   - the blueprint is approved in `task_plan.md`
4. Use the 3-layer architecture:
   - `architecture/` = SOPs and logic contracts
   - navigation layer = orchestration and reasoning
   - `tools/` = deterministic atomic scripts only
5. Use `.tmp/` for intermediate artifacts.
6. When a tool fails: analyze -> patch -> test -> update architecture docs.

### Anti-hallucination requirements
You must operate under strict verification rules:
- Do not invent APIs, features, UI behavior, error codes, or fallback behavior.
- Do not assume unspecified behavior.
- If information is missing, say: **"Insufficient information to determine."**
- Every assertion must be traceable to provided files or official library/package documentation consulted during build.
- If something is inferred, label it: **"Inference (low confidence)"**.
- Output must be deterministic and repeatable.
- Use this structure in internal analysis when helpful:
  - Verified Facts
  - Missing / Unknown Information
  - Generated Output
  - Self-Validation Check

## 4) Critical product decisions already fixed
These are already decided. Do not reopen them as broad discovery questions:
1. **Google PageSpeed Insights is the primary audit source.**
2. **If Google PageSpeed does not return a usable result, use Lighthouse as backup.**
3. **Do not use Postgres.**
4. **Comparison must work by asking the user to upload a previous report.**
5. **Every audit must generate one standardized website performance audit report that combines all audited pages into one report.**
6. The application should be **free/open-source oriented** and suitable for **Vercel-friendly deployment**.

You may ask only truly unresolved implementation questions. Do not ask questions that are already answered above.

## 5) Required product outcome
Build a web app for QA users with these capabilities:
1. Paste multiple URLs for a website audit.
2. Support standard labels such as Homepage, Category 1, Category 2, PDP, PLP, Search Result, plus fully custom labels.
3. Run audits for **mobile and desktop**.
4. Capture at minimum:
   - LCP
   - INP
   - CLS
   - FCP
   - TTFB
   - performance score if available
   - source used
   - fallback reason when applicable
   - audit/report link when available
   - timestamp
5. Show results in:
   - tabular format
   - graphical format
6. Export:
   - standardized audit report to PDF
   - canonical machine-readable report JSON
   - optional packaged bundle containing PDF + JSON + metadata
7. Compare:
   - current run vs uploaded previous report
   - generate a downloadable comparison PDF
8. Keep the UI simple enough for QA users who are not performance specialists.

## 6) Primary source policy: PageSpeed first, Lighthouse backup
Implement this exactly.

### Rule
For every URL and device:
1. Attempt **Google PageSpeed Insights** first.
2. If PageSpeed returns a complete usable result, use it in the report.
3. If PageSpeed fails or is incomplete, run **Lighthouse fallback**.

### Consider PageSpeed "not usable" when any of the following occurs
- request error
- timeout
- invalid payload
- quota/rate-limit failure
- missing required metrics
- empty report
- device-specific failure

### Mandatory data fields
For each metric record store:
- `sourceAttempted`
- `sourceUsed`
- `fallbackTriggered`
- `fallbackReason`
- `reportUrl`
- `capturedAt`

### UI/report behavior
- Always show whether the result came from PageSpeed or Lighthouse.
- If fallback was triggered, show the reason in both UI and PDF.
- Never hide partial failures.

## 7) No Postgres / no mandatory backend database
Do not design this around Postgres.

### Required comparison model
- Current run may exist in memory and/or browser local storage for convenience.
- For historical comparison, the app must ask the user to upload a previous report generated earlier.
- The uploaded previous report is the basis for comparison.

### Required export package
Every completed audit must generate a portable package:
- `report.pdf`
- `report.json`
- `metadata.json`

Comparison must work accurately with `report.json` from the same tool.
If the user uploads a legacy PDF or spreadsheet not generated by this tool, comparison may be best-effort only and must be labeled clearly.

## 8) Standardized performance audit template
This is mandatory.

### Principle
No matter how many pages are audited, the agent must combine all page results into **one standardized website performance audit report** using the same structure every time.

### Required report sections
1. Cover page
2. Audit metadata
3. Methodology
4. Audit scope (all page labels + URLs)
5. Executive summary
6. Cross-page results matrix
7. Per-page detail sections
8. Comparison section (only when previous report uploaded)
9. Appendix / evidence references

### Cross-page matrix requirements
The report must include one consolidated table covering all audited pages with:
- page label
- page type
- URL
- mobile metrics
- desktop metrics
- thresholds
- status
- source used
- report links/evidence when available

### Standardization rule
The report layout must not change based on website type. It may scale to more pages, but the section structure must remain the same.

## 9) What the uploaded workbook proves about the current pain
The workbook demonstrates:
- manual row-wise metric entry
- separate mobile and desktop collection
- manual screenshot pasting
- manual report-link copying
- repeated auditing after deployment
- a strong need for standardized comparison

Design the product to replace that flow cleanly.

## 10) In-scope features for v1
- dashboard / home
- new audit setup
- URL intake with bulk paste
- audit execution
- PageSpeed-first engine
- Lighthouse fallback engine
- result normalization
- results dashboard
- page detail drilldown
- comparison by uploaded previous report
- PDF export
- JSON export
- package export
- local settings for thresholds/branding

## 11) Out of scope for v1 unless trivial and fully supported
- Postgres
- enterprise crawler replacement
- real user monitoring
- automatic remediation on the target website
- dependence on paid enterprise services

## 12) Recommended implementation architecture
Use a practical Vercel-friendly architecture.

### Preferred stack
- Frontend: **Next.js + TypeScript**
- UI: **Tailwind CSS + shadcn/ui**
- Charts: lightweight React chart library
- Audit orchestration: deterministic server routes/services
- Current-run draft persistence: browser local storage or IndexedDB
- Export generation: reliable PDF + JSON package builder

### Important note
Do not assume serverless Chrome/Lighthouse execution details. Verify the runtime approach from official docs during build and record findings in `findings.md` and `architecture/`.

## 13) Required screens
Build these screens:
1. Dashboard / Home
2. New Audit Setup
3. Audit Progress
4. Results Overview
5. Page Detail
6. Compare Runs
7. Report Center
8. Settings

## 14) Required UX behavior

### Dashboard / Home
- show recent local audits if available
- show quick stats
- create new audit
- upload previous report for comparison

### New Audit Setup
- project/site name
- audit label
- environment
- deployment/build tag optional
- add URL rows
- bulk paste support
- page type selector
- duplicate URL validation

### Audit Progress
- queued / running / completed / partial / failed states
- per-page status visibility
- fallback indicators
- retry failed page when feasible

### Results Overview
- summary cards
- charts
- highest-risk pages
- consolidated cross-page table
- source labels
- download PDF / JSON / package buttons

### Page Detail
- metric-by-device detail
- source used
- fallback reason if any
- evidence links
- recommendations

### Compare Runs
- current run selection
- previous report upload
- schema validation result
- delta tables/charts
- regressions and improvements
- comparison PDF download

### Report Center
- current run package files
- schema version
- download actions
- explain re-upload workflow for future comparison

### Settings
- thresholds
- branding
- default environment
- disclaimers

## 15) Required canonical schema
Define this in `gemini.md` before coding.

### Top-level entities
- `AuditRun`
- `AuditPage`
- `MetricResult`
- `Evidence`
- `ComparisonDelta`
- `ReportPackageMetadata`

### Minimum fields

#### AuditRun
- `runId`
- `projectName`
- `auditLabel`
- `environment`
- `deploymentTag`
- `generatedAt`
- `schemaVersion`

#### AuditPage
- `pageId`
- `runId`
- `pageLabel`
- `pageType`
- `url`
- `sortOrder`

#### MetricResult
- `pageId`
- `device`
- `metricName`
- `value`
- `unit`
- `thresholdGood`
- `thresholdWarn`
- `status`
- `sourceAttempted`
- `sourceUsed`
- `fallbackTriggered`
- `fallbackReason`
- `reportUrl`
- `capturedAt`

#### Evidence
- `pageId`
- `screenshotUrl`
- `rawReferenceId`
- `notes`

#### ComparisonDelta
- `baselineRunId`
- `currentRunId`
- `pageKey`
- `metricName`
- `device`
- `baselineValue`
- `currentValue`
- `deltaValue`
- `deltaDirection`

#### ReportPackageMetadata
- `schemaVersion`
- `appVersion`
- `generatedAt`
- `thresholdProfile`
- `sourcePolicy`

## 16) Required logic contracts
Implement these deterministic rules and document them in `architecture/`.

### Threshold logic
- map every metric to Good / Needs Improvement / Poor
- keep thresholds centralized
- keep device handling explicit

### Fallback logic
- PageSpeed first
- Lighthouse only when PageSpeed is unusable
- store and expose fallback reason

### Comparison logic
- compare current run to uploaded prior report
- detect missing pages
- detect new pages
- compute absolute deltas
- classify regression / improvement / unchanged

### Narrative generation logic
- Any summary text must be based only on actual metrics
- No invented recommendations
- Recommendations must map to metric patterns and available evidence
- If evidence is insufficient, say so

## 17) PDF/report requirements
The audit PDF and comparison PDF must be professional, readable, and standardized.

### Audit PDF must include
- cover page
- methodology
- scope
- executive summary
- charts
- consolidated page matrix
- page details
- appendix

### Comparison PDF must include
- baseline metadata
- current metadata
- delta summary
- regressions
- improvements
- missing/new page notes
- comparison tables/charts

## 18) Engineering quality requirements
- TypeScript strict mode
- strong schema validation
- modular services
- deterministic error handling
- unit tests for normalization, threshold mapping, fallback logic, and comparison logic
- clear user-facing error states
- no silent failures

## 19) Deliverables you must generate
1. Working codebase
2. `README.md`
3. `task_plan.md`
4. `findings.md`
5. `progress.md`
6. `gemini.md`
7. `architecture/` SOP files
8. setup instructions
9. sample report package output
10. sample comparison package output
11. tests
12. deployment instructions for Vercel-friendly setup

## 20) Build behavior expectations
- Do not stop at a mock UI.
- Build the actual workflow end to end.
- Prefer deterministic implementation over AI-heavy narration.
- Keep all assumptions explicit.
- When blocked by missing information, state exactly what is missing.
- Do not ask broad repeated questions that the provided files already answer.

## 21) Final output format expected from you
Return your work in this order:
1. Verified facts from the uploaded files
2. Missing / unknown information
3. Proposed architecture and schema
4. File/folder plan
5. Implementation plan by phase
6. Actual code and configuration
7. Test strategy
8. Known limitations
9. Self-validation check

Build the project fully, not just a concept note.
