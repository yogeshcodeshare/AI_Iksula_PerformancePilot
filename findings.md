# Findings - Research and Discoveries

## Source Files Analysis

### Converse Australia Performance Score.xlsx
- **Pattern**: Manual spreadsheet-based auditing
- **Pages audited**: Homepage, Category 1, Category 2, PDP (2 products), Search Result
- **Metrics tracked**: LCP, INP, CLS, FCP, TTFB
- **Devices**: Mobile and Desktop (separate columns)
- **Issues identified**:
  - CLS desktop consistently above target on Homepage/Categories
  - PDP has LCP issues on both mobile and desktop
  - INP values often above target (212ms, 438ms, 414ms)
- **Evidence**: PageSpeed Insights links + GTmetrix backup
- **Pain points**: Manual row entry, separate mobile/desktop collection, manual link pasting

### Website Performance Audit Template.docx
- **6-phase audit structure**:
  1. Foundation & Setup (GA4, GTM, baseline)
  2. Core Web Vitals & Speed (LCP, INP, CLS, FCP, TTFB)
  3. Technical SEO & Security (crawlability, sitemap, SSL)
  4. Front-End Code (images, lazy loading, minification)
  5. On-Page SEO (metadata, headers, structured data)
  6. UX & Conversion (navigation, CTAs, accessibility)
- **Tools referenced**: PageSpeed Insights, GTmetrix, WebPageTest, Screaming Frog, Ahrefs

## Technical Research

### PageSpeed Insights API
- **Endpoint**: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`
- **Required params**: url
- **Optional**: key, strategy (mobile/desktop), category (PERFORMANCE)
- **Response includes**: 
  - `loadingExperience` - URL-level CrUX field data
  - `originLoadingExperience` - Origin-level CrUX field data (fallback)
  - `lighthouseResult` - Lab data with audits and categories
- **Rate limits**: Free tier available with API key (~1 req/100s without key)

### Key Implementation Findings

1. **CLS Value Format**: PageSpeed API returns CLS as a normal floating point (e.g., `0.68`), NOT as an integer that needs division by 100.

2. **Origin-Level Fallback**: When `loadingExperience.metrics` is unavailable, `originLoadingExperience.metrics` provides origin-level CrUX data as a fallback.

3. **Category Parameter**: `category=PERFORMANCE` is required in the API URL to get full Lighthouse performance audits including LCP, CLS, FCP, TTFB.

4. **API Key Requirement**: Without an API key, the API is heavily rate-limited and may return incomplete data. A valid API key is essential for production use.

### Lighthouse in Serverless
- **Options**:
  1. Chrome AWS Lambda layer + lighthouse
  2. @sparticuz/chromium for Vercel compatibility
  3. External service (not preferred - adds dependency)
- **Current Status**: Client-side fallback only - full server-side Chrome not implemented

### PDF Generation Options
- **Selected**: jsPDF - Lightweight, manual layout, works in browser
- **Alternatives considered**:
  - puppeteer: Heavy but reliable (requires server)
  - @react-pdf/renderer: React-native, lighter weight
  - Playwright: Can generate PDF from HTML (requires server)

### Chart Libraries
- **Selected**: Recharts - React-friendly, good for simple charts
- **Alternatives considered**:
  - Chart.js: Feature-rich, react-chartjs-2 wrapper
  - Nivo: Beautiful but heavier

## Bugs Fixed

### 1. CLS Division Bug
- **Issue**: CLS was being divided by 100, resulting in incorrect values like 0.0068 instead of 0.68
- **Fix**: Removed the `/ 100` division - PageSpeed API returns CLS as a proper float

### 2. Missing Category Parameter
- **Issue**: API call was missing `category=PERFORMANCE`, resulting in incomplete Lighthouse data
- **Fix**: Added `&category=PERFORMANCE` to API URL

### 3. Missing API Key
- **Issue**: No API key caused rate limiting and incomplete responses
- **Fix**: Added API key to `.env.local` configuration

### 4. Button UI Styling
- **Issue**: Missing CSS theme variables caused buttons to appear unstyled
- **Fix**: Added complete shadcn/ui theme configuration in globals.css

## Anti-Hallucination Boundaries

### What We Know (Verified)
- PageSpeed Insights is primary source
- Lighthouse is fallback
- No Postgres requirement
- Report packages are portable (PDF + JSON)
- Comparison works via upload
- Stack: Next.js + TypeScript + Tailwind + shadcn/ui
- CLS values are direct floats from API
- Origin-level CrUX serves as fallback for URL-level data

### What Needs Verification During Build
- ✅ PageSpeed API response structure (verified)
- ✅ Lighthouse runtime in Vercel environment (verified - client-side only)
- ✅ PDF generation library capabilities (verified)
- ✅ Local storage limits for large audits (verified)

## Open Questions (Resolved)

1. ✅ PageSpeed API key handling - Stored in `.env.local` as `NEXT_PUBLIC_PAGESPEED_API_KEY`
2. ✅ Lighthouse runtime strategy - Client-side fallback with graceful degradation
3. ✅ PDF library final selection - jsPDF
4. ✅ Chart library final selection - Recharts
