# AI Performance Audit Agent - Result Page Enhancement Spec

**Subtitle:** Detailed specification for adding Core Web Vitals Assessment and Diagnose Performance Issues to the result page

**Prepared:** March 2026

## 1. Objective

This document defines the required enhancement for the **Audit Results** page of the AI Performance Audit Agent.

The current result page already shows:

- Overall Health
- Pages Audited
- Metrics Collected
- Fallbacks Used
- Status Distribution chart
- Page Health Scores chart
- Detailed Results table with LCP, INP, CLS, FCP, TTFB
- Audit metadata
- JSON / PDF / Package export actions

The new requirement is to add the same depth of diagnostic information that testers see inside **Google PageSpeed Insights**, while keeping the AI agent's result page useful for **multi-page website audits**.

The result page must now support:

1. **Core Web Vitals Assessment**
2. **Diagnose Performance Issues**
3. **Page-level diagnostics for each audited page**
4. **Mobile / Desktop view switching**
5. **PageSpeed-first data source with Lighthouse fallback**
6. **Inclusion of all diagnostic data in exported reports**

## 2. UX Strategy

### 2.1 Why a page dropdown is required

Google PageSpeed Insights shows diagnostics for **one page at a time**.  
Our AI agent audits **many pages in one run** and gives one combined result page.

Because diagnostic details such as:
- Insights
- Diagnostics
- Accessibility checks
- SEO checks
- Best-practice checks
- Passed audits
- Not applicable items

are page-specific, they **must not be mixed together into one global list**.

### 2.2 Recommended strategy

Keep the result page in **two layers**:

**Layer A - Overall Audit Summary**
- Combined overview for the full audit run
- Overall health
- Charts across all pages
- Summary tables
- Fallback counts
- Report actions

**Layer B - Page Diagnostics Explorer**
- A selected-page panel that shows detailed diagnostics for one page at a time
- Controls:
  - Page dropdown
  - Page type badge
  - Source badge (PageSpeed or Lighthouse fallback)
  - Device toggle: Mobile / Desktop
  - Status badge: Good / Needs Improvement / Poor / Error / Fallback

This gives the tester both:
- a website-level summary
- a page-level root-cause analysis view

## 3. Result Page Information Architecture

### 3.1 Proposed page order

1. Header
2. KPI cards
3. Overall charts
4. Combined metrics table
5. Core Web Vitals Assessment section
6. Diagnose Performance Issues section
7. Audit metadata
8. Export actions

### 3.2 Header actions

Header should keep:
- JSON export
- PDF export
- Package export

Recommended addition:
- **Compare with Previous Report** action if a previous report package has been uploaded

### 3.3 New controls near diagnostics

Add a control row before the new sections:

- **Page dropdown**
- **Device toggle** (Mobile / Desktop)
- **Data source badge**
- **Run comparison toggle** (when previous report exists)
- **Filter chips**: All, Only Failed, Only Opportunities, Only Warnings

## 4. New Section: Core Web Vitals Assessment

### 4.1 Purpose

This section gives a clear summary of whether the selected page passes or fails the Core Web Vitals assessment, similar to Google PageSpeed Insights.

### 4.2 Required fields

For the selected page and device, show:

- **Core Web Vitals Assessment**: Passed / Failed / Not Available
- **LCP**
- **INP**
- **CLS**
- **FCP**
- **TTFB**
- Metric status color:
  - Green = Good
  - Amber = Needs Improvement
  - Red = Poor
  - Gray = Not available
- **Data source**:
  - PageSpeed
  - Lighthouse fallback
- **Capture timestamp**
- **Reason for fallback**, if applicable

### 4.3 Recommended layout

Use a compact card block with:
- assessment badge at top
- 5 metric chips/cards below
- short interpretation note

Example interpretation:
- "This page fails Core Web Vitals because CLS is poor on mobile."
- "This page passes CWV on desktop but needs improvement on mobile INP."

## 5. New Section: Diagnose Performance Issues

### 5.1 Purpose

This section exposes the detailed diagnostic findings from PageSpeed or Lighthouse so the tester can understand **why** the page has a weak score and what to fix.

### 5.2 Top-level diagnostic groups

The result page must show these four groups for the selected page and selected device:

1. **Performance**
2. **Accessibility**
3. **Best Practices**
4. **SEO**

Each group must show:
- overall score
- status color
- expandable categories
- issue count
- passed audit count
- not applicable count where relevant

### 5.3 Group structure

#### A. Performance
Show:
- Score
- Insights
- Diagnostics
- Passed audits

#### B. Accessibility
Show:
- Score
- ARIA
- Best practices
- Navigation
- Audio and video
- Names and labels
- Additional items to manually check
- Passed audits
- Not applicable

#### C. Best Practices
Show:
- Score
- General
- Trust and Safety
- Passed audits
- Not applicable

#### D. SEO
Show:
- Score
- Crawling and Indexing
- Additional items to manually check
- Passed audits

### 5.4 Item-level structure for each issue row

For every diagnostic item capture and show:

- Audit title
- Category
- Status
- Score or pass/fail
- Short description
- Why it matters
- Numeric metric/value when available
- Display value from source
- Recommendation / next action
- Source reference ID or audit key
- Device
- Page label
- Page URL
- Source type: PageSpeed / Lighthouse fallback

### 5.5 Status mapping

Normalize source output to these statuses:
- Passed
- Warning
- Failed
- Manual Check
- Not Applicable
- Informational

## 6. UI Behavior Specification

### 6.1 Default state

When the result page opens:
- show overall summary first
- set the page dropdown to the first audited page
- default device = Mobile
- open the Core Web Vitals section in expanded state
- keep Diagnose Performance Issues collapsed by group but visible

### 6.2 Page dropdown behavior

Dropdown values should include:
- page label
- page type
- short URL preview

Example:
- Homepage - Homepage - `https://domain.com/`
- Category 1 - Category - `https://domain.com/sale`
- PDP - Product Detail - `https://domain.com/product/...`

On page change:
- all diagnostics refresh to the chosen page
- CWV assessment updates
- score cards update for the selected page section
- comparison deltas update if previous report exists

### 6.3 Device toggle behavior

The diagnostic section must support:
- Mobile
- Desktop

Device toggle changes:
- CWV values
- assessment pass/fail
- all diagnostic group scores
- all issue lists
- comparison deltas

### 6.4 Fallback behavior

If PageSpeed does not return valid data:
- use Lighthouse fallback
- show visible badge: `Fallback Used`
- show reason:
  - API timeout
  - no usable PageSpeed response
  - partial metric response
  - blocked page
  - rate limit / quota issue

If both sources fail:
- show page status = Error
- retain the page row in the audit
- include failure details in report export

## 7. Website-Level vs Page-Level Strategy

### 7.1 What remains aggregated

These elements should stay aggregated across all pages:
- Overall Health
- Pages Audited
- Metrics Collected
- Fallbacks Used
- Status Distribution
- Page Health Scores
- Combined metrics table
- Overall report summary

### 7.2 What must stay page-specific

These elements must stay page-specific:
- Core Web Vitals Assessment
- Diagnose Performance Issues
- Accessibility breakdown
- Best Practices breakdown
- SEO breakdown
- Performance insights and diagnostics
- Passed audits lists
- Manual checks
- Not applicable items

### 7.3 Optional enhancement

Add a **Compare Pages** mode later:
- selected metric across all pages
- selected diagnostic category across all pages
- identify worst pages by issue type

## 8. Report Export Requirements

### 8.1 PDF export must include

The downloadable PDF report must include:

1. Cover page
2. Audit summary
3. Audit scope and list of pages
4. Overall charts
5. Combined metrics table
6. Website-level observations
7. For each page:
   - page label
   - page type
   - URL
   - device section: mobile and desktop
   - source type used
   - Core Web Vitals Assessment
   - metric table
   - Performance score and issue categories
   - Accessibility score and issue categories
   - Best Practices score and issue categories
   - SEO score and issue categories
   - passed audits summary
   - manual check items
   - not applicable items where relevant
   - recommendations / fix priorities
8. Comparison section when previous report is uploaded
9. Appendix with raw source references if required

### 8.2 Standardized report template

The report format should be standardized so every QA can use the same structure for any website and any number of pages.

Recommended report order:
- Executive Summary
- Audit Setup
- Page Inventory
- Aggregated Results
- Page-by-Page Detail
- Comparison to Previous Report
- Recommendations
- Appendix

### 8.3 Package export

Package export should ideally contain:
- `report.pdf`
- `report.json`
- screenshots if captured
- machine-readable diagnostics
- metadata file

## 9. Recommended Data Model Additions

### 9.1 Page summary object

```json
{
  "pageLabel": "Homepage",
  "pageType": "Homepage",
  "url": "https://example.com/",
  "device": "mobile",
  "source": "pagespeed",
  "fallbackUsed": false,
  "cwvAssessment": "failed",
  "metrics": {
    "lcp": {"value": 2300, "displayValue": "2.3 s", "status": "needs_improvement"},
    "inp": {"value": 131, "displayValue": "131 ms", "status": "good"},
    "cls": {"value": 0.64, "displayValue": "0.64", "status": "poor"},
    "fcp": {"value": 4500, "displayValue": "4.5 s", "status": "poor"},
    "ttfb": {"value": 768, "displayValue": "768 ms", "status": "needs_improvement"}
  },
  "scores": {
    "performance": 18,
    "accessibility": 76,
    "bestPractices": 46,
    "seo": 85
  }
}
```

### 9.2 Diagnostic item object

```json
{
  "group": "Accessibility",
  "category": "Names and labels",
  "auditKey": "button-name",
  "title": "Buttons do not have an accessible name",
  "status": "failed",
  "scoreDisplayMode": "binary",
  "displayValue": "3 elements found",
  "description": "Interactive elements require accessible names.",
  "whyItMatters": "Users of assistive technology may not understand the control.",
  "recommendation": "Add visible or aria-based labels to buttons.",
  "pageLabel": "PDP",
  "url": "https://example.com/product/123",
  "device": "mobile",
  "source": "pagespeed"
}
```

## 10. Acceptance Criteria

### Functional
- The result page shows Core Web Vitals Assessment for the selected page.
- The result page shows diagnostic groups for Performance, Accessibility, Best Practices, and SEO.
- The result page can switch diagnostics by page using a dropdown.
- The result page can switch diagnostics by device using Mobile / Desktop tabs.
- Scores and issue lists are visible for each group.
- Passed audits and manual-check items are included where applicable.
- PageSpeed is used first; Lighthouse fallback is clearly marked.
- PDF export includes all new sections.

### UX
- Overall summary is not cluttered by page-level details.
- Diagnostics are easy to scan with accordion groups and counters.
- A tester can identify the worst issues for one page in under 30 seconds.
- A user can understand whether data came from PageSpeed or fallback.

### Data / Quality
- Each issue row keeps page, device, and source traceability.
- Missing source values are handled gracefully.
- Partial failures do not block report generation.