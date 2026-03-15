# AI Performance Audit Agent

> A production-ready web application for QA teams to run standardized website performance audits using Google PageSpeed Insights with Lighthouse fallback.

## Project Overview

This project automates the manual, spreadsheet-driven workflow that QA teams use to audit website performance. Instead of manually running PageSpeed Insights for each page and copying results into spreadsheets, this tool:

- Accepts a batch of URLs with page types
- Runs PageSpeed Insights API for each page (mobile + desktop)
- Falls back to origin-level CrUX data when URL-level is unavailable
- Falls back to Lighthouse data when PageSpeed returns incomplete results
- Generates standardized PDF reports + JSON data packages
- Supports comparison between audit runs via file upload

### Key Design Decisions

- **No Database**: Uses portable report packages (JSON + PDF + metadata ZIP) instead of Postgres
- **PageSpeed First**: Primary data source with automatic origin-level and Lighthouse fallback
- **Transparency**: All sources and fallbacks clearly labeled in UI and exports
- **Vercel-Ready**: Static export for easy serverless deployment

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 + React 19.2.3 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (New York style) |
| Charts | Recharts 3.7.0 |
| PDF Generation | jsPDF 4.2.0 |
| ZIP Export | JSZip 3.10.1 |
| Icons | Lucide React 0.577.0 |

## Project Structure

```
/
├── gemini.md                    # Project constitution (data schemas, behavioral rules)
├── task_plan.md                 # Scope, phases, and checklist
├── findings.md                  # Research notes and edge cases
├── progress.md                  # Build progress log
├── decisions.md                 # Architecture and product decisions with rationale
├── change_log.md                # Technical and user-visible changes across updates
├── PROJECT_SUMMARY.md           # Project summary and overview
├── AGENTS.md                    # This file - Agent guidelines
├── architecture/                # Layer 1: SOP documentation
│   ├── threshold-sop.md         # Core Web Vitals threshold definitions
│   ├── fallback-sop.md          # PageSpeed → Lighthouse fallback logic
│   ├── comparison-sop.md        # Report comparison algorithm
│   └── export-sop.md            # PDF/JSON export specifications
├── my-app/                      # Next.js application
│   ├── src/
│   │   ├── app/                 # Next.js app router pages
│   │   │   ├── page.tsx         # Dashboard (entry point)
│   │   │   ├── layout.tsx       # Root layout with providers
│   │   │   ├── audit/           # New audit flow (setup + progress)
│   │   │   ├── results/         # Results display
│   │   │   ├── compare/         # Comparison mode
│   │   │   └── settings/        # Configuration
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   └── layout/          # Layout components (Navbar)
│   │   ├── lib/                 # Utilities and constants
│   │   │   ├── utils.ts         # Helper functions
│   │   │   └── constants.ts     # Thresholds and config
│   │   ├── services/            # Business logic
│   │   │   ├── audit.ts         # PageSpeed/Lighthouse integration
│   │   │   ├── storage.ts       # localStorage persistence
│   │   │   ├── export.ts        # PDF/JSON generation
│   │   │   └── comparison.ts    # Delta calculation
│   │   └── types/               # TypeScript type definitions
│   ├── .env.local               # API key configuration
│   ├── public/                  # Static assets
│   ├── next.config.ts           # Next.js configuration
│   ├── tsconfig.json            # TypeScript configuration
│   ├── components.json          # shadcn/ui configuration
│   └── package.json             # Dependencies
└── Document/                    # Reference documents
    ├── AI_Performance_Audit_Agent_PRD_v2.md
    ├── AI_Performance_Audit_Agent_Result_Page_Enhancement_Spec.md
    ├── B.L.A.S.T.md
    └── Anti_Hallucination_Master_Web_AI_Project_v2.md
```

## Build and Development Commands

```bash
# Navigate to the app directory
cd my-app

# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production (static export to dist/)
npm run build

# Run ESLint
npm run lint
```

## Environment Variables

Create `.env.local` file in `my-app/` directory:

```bash
# Required for reliable data access
NEXT_PUBLIC_PAGESPEED_API_KEY=your_google_api_key_here
```

**Important**: Without an API key, PageSpeed API is limited to approximately 1 request per 100 seconds. Get your free API key at: https://developers.google.com/speed/docs/insights/v5/get-started

An API key is already configured in the current `.env.local` file.

## Data Schemas (Canonical)

All data schemas are defined in `gemini.md` and mirrored in `src/types/index.ts`:

```typescript
interface AuditRun {
  runId: string;              // UUID v4
  projectName: string;
  auditLabel: string;
  environment: string;
  deploymentTag?: string;     // optional
  generatedAt: string;        // ISO 8601
  schemaVersion: string;      // "1.0.0"
}

interface AuditPage {
  pageId: string;
  runId: string;
  pageLabel: string;
  pageType: 'homepage' | 'category' | 'pdp' | 'plp' | 'search' | 'custom';
  url: string;
  sortOrder: number;
}

interface MetricResult {
  pageId: string;
  device: 'mobile' | 'desktop';
  metricName: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB' | 'performance_score';
  value: number;
  unit: 'ms' | '';
  thresholdGood: number;
  thresholdWarn: number;
  status: 'good' | 'needs-improvement' | 'poor';
  sourceAttempted: 'pagespeed' | 'lighthouse';
  sourceUsed: 'pagespeed' | 'lighthouse';
  fallbackTriggered: boolean;
  fallbackReason?: string;
  reportUrl?: string;
  capturedAt: string;
}
```

## Core Web Vitals Thresholds

| Metric | Good | Needs Improvement | Poor | Unit |
|--------|------|-------------------|------|------|
| LCP | ≤2.5s | ≤4.0s | >4.0s | ms |
| INP | ≤200ms | ≤500ms | >500ms | ms |
| CLS | ≤0.1 | ≤0.25 | >0.25 | - |
| FCP | ≤1.8s | ≤3.0s | >3.0s | ms |
| TTFB | ≤0.8s | ≤1.8s | >1.8s | ms |

Thresholds are defined in `src/lib/constants.ts`.

## B.L.A.S.T. Principles

This project follows the **B.L.A.S.T. Protocol** for all development:
- **Blueprint**: Define requirements and success metrics in `task_plan.md` first.
- **Link**: Test connections to Google APIs and local storage before logic build.
- **Architect**: Separate reasoning (SOPs) from UI (Next.js) and Tools (Services).
- **Stylize**: Polish the UI using shadcn/ui and ensure WCAG accessibility.
- **Trigger**: Capture benchmarks (before/after) and validate all changes.

## Mandatory Validation Gates

A task is not considered "Done" until it passes these gates:
1. **Product**: Mapped to requirements in PRD.
2. **Engineering**: Type safe, error-handled, deterministic.
3. **Quality**: Responsive (Mobile/Desktop), Performance-checked.
4. **Evidence**: Validation logs or before/after screenshots provided.

## Code Organization Principles

### 3-Layer Architecture (per B.L.A.S.T. protocol)

1. **Layer 1 (architecture/)**: SOPs and logic contracts in Markdown
   - Update SOPs before changing code behavior
   - Defines "how" things should work

2. **Layer 2 (Navigation)**: Orchestration in page components
   - Route data between services
   - Handle user interactions

3. **Layer 3 (src/services/)**: Deterministic business logic
   - `audit.ts` - API calls and metric extraction
   - `storage.ts` - localStorage operations
   - `export.ts` - PDF/JSON generation
   - `comparison.ts` - Delta calculations

### Naming Conventions

- **Files**: kebab-case for pages, PascalCase for components
- **Types**: PascalCase, interfaces preferred over type aliases
- **Functions**: camelCase, async functions prefixed appropriately
- **Constants**: UPPER_SNAKE_CASE for true constants
- **CSS**: Tailwind utility classes, no custom CSS files

### State Management

- Current audit: `sessionStorage` (temporary during flow)
- Recent audits: `localStorage` (persistent, max 10 items)
- Settings: `localStorage`
- No global state library (React hooks only)

## Critical Implementation Details

### 1. CLS Value Handling
**IMPORTANT**: PageSpeed API returns CLS as a normal floating point (e.g., `0.68`). 
- **Do NOT divide by 100** - this was a previous bug
- Use the value directly from `data.loadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile`
- Handle both raw values (>1, divide by 100) and direct floats (≤1, use as-is)

### 2. Data Source Priority
The audit service tries data sources in this order:
1. **URL-level CrUX** (`loadingExperience.metrics`) - Real user data for specific URL
2. **Origin-level CrUX** (`originLoadingExperience.metrics`) - Real user data for entire domain
3. **Lighthouse Lab Data** (`lighthouseResult.audits`) - Simulated lab data

### 3. API URL Format
```typescript
const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=PERFORMANCE&key=${apiKey}`;
```
- `category=PERFORMANCE` is **required** to get full Lighthouse performance audits
- Without this parameter, LCP, CLS, FCP, TTFB will not be available
- Multiple categories can be requested: `&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO`

### 4. Metric Display Format
Values > 1000ms are converted to seconds with 1 decimal place:
- `1705 ms` → `1.7 s`
- This matches the Google PageSpeed Web UI format

## Testing Instructions

### Manual Testing Workflow
1. Start dev server: `npm run dev`
2. Create new audit with test URLs (e.g., https://www.google.com)
3. Verify progress tracking shows mobile + desktop status
4. Check results display all metrics (LCP, INP, CLS, FCP, TTFB)
5. Verify source column shows "PageSpeed" or "Lighthouse"
6. Export PDF + JSON
7. Upload JSON to compare with new audit

### Expected Console Output
```
[PageSpeed API] Data sources - CrUX: true, Origin CrUX: false, Lighthouse: true
[ExtractMetrics] Total metrics extracted: 6 ["LCP", "INP", "CLS", "FCP", "TTFB", "performance_score"]
```

## Security Considerations

1. **API Key Exposure**: PageSpeed API key is client-side exposed via `NEXT_PUBLIC_` prefix. This is acceptable for the demo but should be moved to server-side API routes for production.

2. **No Authentication**: The app has no user authentication. All data is stored locally in the browser.

3. **XSS Prevention**: React's JSX escaping handles most XSS. Avoid dangerouslySetInnerHTML.

4. **CORS**: PageSpeed API calls are made client-side to Google's servers (CORS enabled).

## Common Tasks

### Adding a New Metric

1. Add to `THRESHOLDS` in `src/lib/constants.ts`
2. Update `MetricName` type in `src/types/index.ts`
3. Add extraction logic in `src/services/audit.ts` (both CrUX and Lighthouse sections)
4. Update UI components displaying metrics
5. Update PDF generation in `src/services/export.ts`

### Adding a New Page Type

1. Add to `PAGE_TYPES` array in `src/lib/constants.ts`
2. Update `PageType` type in `src/types/index.ts`

### Modifying the PDF Report

Edit `generatePDF()` function in `src/services/export.ts`. jsPDF uses coordinate-based positioning (x, y in mm).

### Adding a New UI Component

Use shadcn CLI:
```bash
npx shadcn add <component-name>
```

## Known Limitations

1. **API Key Required**: For reliable data, a PageSpeed API key is required. Without it, rate limits apply.
2. **Lighthouse Fallback**: Currently simulated (no serverless Chrome)
3. **Local Storage Limits**: Large audits may hit browser storage limits
4. **Static Export**: Client-side routing has some limitations in static export mode

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel --prod
```

### Static Hosting

```bash
npm run build
# Upload dist/ folder to any static host
```

## Architecture Decisions

### Why No Database?
The PRD explicitly removed Postgres to keep the app simple and portable. Report packages (ZIP files containing JSON + PDF) serve as the portable database.

### Why PageSpeed First?
PageSpeed Insights provides both CrUX field data (real user metrics) and Lighthouse lab data. It's the industry standard and free to use.

### Why Local Storage?
For a client-side only app, localStorage provides persistence without backend complexity. The tradeoff is data is device-specific.

### Why Origin-Level Fallback?
When a specific URL doesn't have enough CrUX data, the origin-level data (entire domain) provides a reasonable fallback while still being real user data.

## Self-Repair Loop

When a technical failure occurs:
1. Inspect the terminal error or console log.
2. Identify the root cause.
3. Patch the smallest correct layer (SOP, Orchestration, or Tool).
4. Retest and document the fix in `progress.md`.

## Anti-Hallucination Rules

Per `Document/Anti_Hallucination_Master_Web_AI_Project_v2.md`:
- Only use data from actual API responses
- All thresholds explicitly defined in code
- Fallback reasons must be stored and displayed
- No invented recommendations
- Source tracking for every metric
- CLS values used directly without transformation

## Resources

- **PRD**: `Document/AI_Performance_Audit_Agent_PRD_v2.md`
- **Result Page Enhancement Spec**: `Document/AI_Performance_Audit_Agent_Result_Page_Enhancement_Spec.md`
- **Project Constitution**: `gemini.md`
- **B.L.A.S.T. Protocol**: `Document/B.L.A.S.T.md`
- **PageSpeed API Docs**: https://developers.google.com/speed/docs/insights/v5/get-started
