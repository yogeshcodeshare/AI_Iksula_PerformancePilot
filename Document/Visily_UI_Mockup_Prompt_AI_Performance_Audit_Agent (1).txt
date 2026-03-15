# Visily Prompt - AI Performance Audit Agent UI Mockup

Design a clean, modern, dashboard-style **web application UI** for a product named **AI Performance Audit Agent**.

## Product goal
This tool helps QA testers and performance auditors run website audits using **Google PageSpeed Insights first** and **Lighthouse as fallback**. The app supports auditing many pages in one run, shows overall website health, page-level diagnostics, comparison with a previous report, and export to PDF / JSON / Package.

## Style direction
- clean SaaS product UI
- modern but simple
- highly usable for QA testers
- enterprise-ready
- minimal visual noise
- card-based layout
- clear hierarchy
- strong readability
- soft neutral background
- dark navy primary CTA
- blue accents for interactive UI
- green / amber / red semantic statuses
- rounded cards
- plenty of white space
- professional typography
- dashboard and report-friendly

## Target users
- QA engineers
- manual testers
- automation testers
- performance auditors
- delivery managers who need downloadable reports

## UX principles
- make the flow extremely easy even for non-technical testers
- show summary first, details second
- keep labels explicit
- avoid clutter
- support audits for many pages
- support mobile and desktop result viewing
- clearly show when Lighthouse fallback was used
- make export actions obvious
- make comparison against a previous report simple

## Create these screens

### 1. Home / Dashboard
Include:
- top app header with logo, product name, short subtitle, settings button
- KPI cards: Total Audits, Pages Audited, Completed
- "New Audit" card with short description and primary CTA
- "Compare Runs" card with upload area for previous report package
- "Recent Audits" list with status chip, audit label, page count, date/time, View action
- layout should feel clean and lightweight

### 2. New Audit / Audit Configuration
Include:
- page title: New Audit
- project details card
  - Project / Site Name
  - Audit Label
  - Environment
  - Deployment Tag optional
- pages to audit section
  - repeatable rows
  - page label
  - page type dropdown
  - URL field
  - delete action
  - add page button
  - bulk add button
- note banner:
  - each page tested on mobile and desktop
  - PageSpeed first, Lighthouse fallback
- footer actions:
  - Cancel
  - Start Audit primary button

### 3. Audit Progress
Include:
- progress bar at top
- overall status summary
- per-page status list
- each row shows page label, short URL, mobile status, desktop status
- success / running / failed states
- fallback badge if Lighthouse is used
- CTA button: View Results

### 4. Audit Results - Overall Summary
This is the most important screen.
Include:
- header with back button, audit name, audit type
- actions on right: JSON, PDF, Package, Compare
- KPI cards:
  - Overall Health
  - Pages Audited
  - Metrics Collected
  - Fallbacks Used
- two charts:
  - Status Distribution
  - Page Health Scores
- detailed metrics table across all pages
  - columns: Page, LCP, INP, CLS, FCP, TTFB, Source
- audit metadata card at bottom

### 5. Audit Results - Page Diagnostics Explorer
On the same results page, below the overall summary, add a rich diagnostic section with controls:
- Page dropdown
- Device toggle: Mobile / Desktop
- Source badge: PageSpeed or Lighthouse fallback
- status badge: Good / Needs Improvement / Poor / Error

Then add:

#### A. Core Web Vitals Assessment section
- pass / fail badge
- metric cards for LCP, INP, CLS, FCP, TTFB
- short interpretation note
- timestamp and source info

#### B. Diagnose Performance Issues section
Use four accordion cards or tabs:

1. Performance
   - score
   - Insights
   - Diagnostics
   - Passed audits

2. Accessibility
   - score
   - ARIA
   - Best practices
   - Navigation
   - Audio and video
   - Names and labels
   - Additional items to manually check
   - Passed audits
   - Not applicable

3. Best Practices
   - score
   - General
   - Trust and Safety
   - Passed audits
   - Not applicable

4. SEO
   - score
   - Crawling and Indexing
   - Additional items to manually check
   - Passed audits

For each issue list item, show:
- title
- severity/status chip
- short description
- recommendation
- metric/display value when available
- expandable detail row

### 6. Comparison View
Design a comparison panel or dedicated page.
Include:
- current run vs previous run summary
- upload previous report block
- page selector
- device toggle
- delta cards for LCP, INP, CLS, FCP, TTFB
- score deltas for Performance, Accessibility, Best Practices, SEO
- regressions list
- improvements list
- recommendation summary

### 7. Report Preview / Export Screen
Include:
- PDF preview panel
- section outline sidebar
- export buttons
- standardized report structure:
  - Executive Summary
  - Audit Setup
  - Page Inventory
  - Aggregated Results
  - Page-by-Page Detail
  - Comparison
  - Recommendations
  - Appendix

## Component guidance
- use cards, accordions, data tables, badges, toggles, tabs, and charts
- keep charts simple and readable
- make tables spacious and professional
- use clear empty states, error states, and loading states
- create an elegant page dropdown for many pages
- use semantic chips for source, fallback, status, and severity

## Accessibility guidance
- high contrast text
- clear labels
- keyboard-friendly controls
- obvious button states
- readable data tables
- avoid tiny text

## Output expectation
Create **high-fidelity mockups** for all main pages with a consistent design system. The UI should feel production-ready, easy for QA teams to use, and optimized for reviewing website performance results and exporting client-ready reports.
