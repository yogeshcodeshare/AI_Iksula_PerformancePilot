# AI Performance Audit Agent

A production-ready web application for QA teams to run standardized website performance audits using Google PageSpeed Insights with Lighthouse fallback.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC.svg)

## 🌟 Features

- **🔍 PageSpeed-First Audit**: Uses Google PageSpeed Insights as primary data source
- **📊 Multi-Level Fallback**: URL-level CrUX → Origin-level CrUX → Lighthouse Lab Data
- **📱 Multi-Page Support**: Audit multiple pages in a single run
- **🖥️ Mobile & Desktop**: Tests both device types for every page
- **📄 Standardized Reports**: Generates consistent, professional PDF reports
- **📈 Comparison Mode**: Compare current audit against previous reports
- **📦 Export Options**: JSON, PDF, and bundled package exports
- **🗄️ No Database Required**: Uses portable report packages for storage

## 🏗️ Architecture Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUDIT WORKFLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│   Dashboard  │────▶│  New Audit Setup │────▶│    Audit Progress        │
│   (Home)     │     │  - Project Info  │     │   - Mobile Testing       │
│              │     │  - URL Input     │     │   - Desktop Testing      │
└──────────────┘     │  - Bulk Import   │     │   - Real-time Status     │
                     └──────────────────┘     └────────────┬─────────────┘
                                                            │
                                                            ▼
┌──────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│   Compare    │◀────│  Results & Export│◀────│   PageSpeed Insights API │
│   Reports    │     │  - Summary Cards │     │                          │
│              │     │  - Charts        │     │   Data Source Priority:  │
└──────────────┘     │  - PDF/JSON/ZIP  │     │   1. URL-level CrUX      │
                     └──────────────────┘     │   2. Origin-level CrUX   │
                                              │   3. Lighthouse Lab      │
                                              └──────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW DETAIL                                      │
└─────────────────────────────────────────────────────────────────────────────┘

User Input (URLs) 
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│           Google PageSpeed Insights API                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Request: url + strategy + category=PERFORMANCE │    │
│  │  Response:                                      │    │
│  │    ├── loadingExperience (URL-level CrUX)      │    │
│  │    ├── originLoadingExperience (Origin CrUX)   │    │
│  │    └── lighthouseResult (Lab Data)             │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              Metric Extraction Service                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Priority Order:                                │    │
│  │  1. Try URL-level CrUX metrics                  │    │
│  │  2. Fallback to Origin-level CrUX               │    │
│  │  3. Fallback to Lighthouse audits               │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                 Results Processing                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │  - Normalize metrics (LCP, INP, CLS, FCP, TTFB) │    │
│  │  - Apply thresholds (Good/Needs Improvement/Poor)│   │
│  │  - Track source and fallback reasons            │    │
│  │  - Calculate health scores                      │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                   Export Generation                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │  📄 PDF Report    - Professional formatted doc  │    │
│  │  📊 JSON Data     - Machine-readable metrics    │    │
│  │  📦 ZIP Package   - PDF + JSON + Metadata       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Google PageSpeed Insights API Key (free)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-app
```

2. Install dependencies:
```bash
npm install
```

3. **Configure environment variables (IMPORTANT):**

The app makes REAL API calls to Google PageSpeed Insights. An API key is required for reliable data access.

```bash
# The .env.local file is already configured with an API key
# To use your own key, edit .env.local:
NEXT_PUBLIC_PAGESPEED_API_KEY=your_google_api_key_here
```

**Get your free API key:** https://developers.google.com/speed/docs/insights/v5/get-started

> ⚠️ **Rate Limit Warning:** Without an API key, the API allows only ~1 request per 100 seconds. For testing multiple pages, an API key is essential.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### Creating a New Audit

1. Click **"Create New Audit"** on the dashboard
2. Enter project details:
   - Project Name (e.g., "Converse Australia")
   - Audit Label (e.g., "Pre-Release Audit")
   - Environment (Production, Staging, etc.)
3. Add pages to audit:
   - Enter page label and URL
   - Select page type (Homepage, Category, PDP, etc.)
   - Use **"Bulk Add"** to paste multiple URLs at once
4. Click **"Start Audit"** and wait for completion

### Viewing Results

- View summary statistics and charts
- See detailed metrics by page and device
- Check source used (PageSpeed CrUX, Origin CrUX, or Lighthouse)
- Review any fallback reasons
- Toggle between Mobile 📱 and Desktop 🖥️ tabs

### Exporting Reports

- **JSON**: Machine-readable format for future comparison
- **PDF**: Human-readable professional report
- **Package**: ZIP file containing JSON, PDF, and metadata

### Comparing Runs

1. Run a new audit
2. From the dashboard, upload a previous report JSON
3. View the comparison showing:
   - ✅ Improvements (metrics that got better)
   - ❌ Regressions (metrics that got worse)
   - 📄 New or missing pages
   - 📊 Detailed delta tables

## 📊 Audit Metrics

The following Core Web Vitals are measured:

| Metric | Description | Good | Needs Improvement | Poor |
|--------|-------------|------|-------------------|------|
| **LCP** | Largest Contentful Paint | ≤2.5s | ≤4.0s | >4.0s |
| **INP** | Interaction to Next Paint | ≤200ms | ≤500ms | >500ms |
| **CLS** | Cumulative Layout Shift | ≤0.1 | ≤0.25 | >0.25 |
| **FCP** | First Contentful Paint | ≤1.8s | ≤3.0s | >3.0s |
| **TTFB** | Time to First Byte | ≤0.8s | ≤1.8s | >1.8s |

## 🏛️ Architecture

This project follows the **B.L.A.S.T.** protocol:

| Phase | Description |
|-------|-------------|
| **B**lueprint | Defined schemas in `gemini.md` |
| **L**ink | API integration and verification layer |
| **A**rchitect | 3-layer architecture (SOPs, Navigation, Tools) |
| **S**tylize | UI/UX with Tailwind + shadcn |
| **T**rigger | Vercel-friendly deployment |

### Data Source Priority

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCE HIERARCHY                     │
└─────────────────────────────────────────────────────────────┘

Priority 1: URL-level CrUX (Real User Data)
├── Source: data.loadingExperience.metrics
├── LCP, INP, CLS, FCP, TTFB
└── Best: Actual user experience for specific URL

         ↓ (if unavailable)

Priority 2: Origin-level CrUX (Real User Data)
├── Source: data.originLoadingExperience.metrics
├── LCP, INP, CLS, FCP, TTFB
└── Good: Actual user experience for entire domain

         ↓ (if unavailable)

Priority 3: Lighthouse Lab Data (Simulated)
├── Source: data.lighthouseResult.audits
├── LCP, CLS, FCP, TTFB, Performance Score
└── Fallback: Lab simulation with controlled conditions
```

## 📁 File Structure

```
my-app/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── page.tsx           # Dashboard
│   │   ├── audit/             # New audit flow
│   │   │   ├── page.tsx       # Audit setup
│   │   │   └── progress/      # Audit progress
│   │   ├── results/           # Results display
│   │   ├── compare/           # Comparison mode
│   │   └── settings/          # Configuration
│   ├── components/ui/         # shadcn/ui components
│   ├── lib/                   # Utilities and constants
│   │   ├── utils.ts          # Helper functions
│   │   └── constants.ts      # Thresholds and config
│   ├── services/              # Business logic
│   │   ├── audit.ts          # PageSpeed/Lighthouse integration
│   │   ├── storage.ts        # localStorage persistence
│   │   ├── export.ts         # PDF/JSON generation
│   │   └── comparison.ts     # Delta calculation
│   └── types/                 # TypeScript type definitions
├── architecture/              # SOP documentation
│   ├── threshold-sop.md
│   ├── fallback-sop.md
│   ├── comparison-sop.md
│   └── export-sop.md
├── gemini.md                 # Project constitution
└── README.md                 # This file
```

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) + [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **PDF Export**: [jsPDF](https://parall.ax/products/jspdf)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🧪 Testing

### Manual Testing Checklist

1. ✅ Create new audit with valid URLs
2. ✅ Verify mobile and desktop testing completes
3. ✅ Check all metrics display (LCP, INP, CLS, FCP, TTFB)
4. ✅ Verify source tracking (PageSpeed/Lighthouse)
5. ✅ Export PDF report
6. ✅ Export JSON data
7. ✅ Upload JSON for comparison
8. ✅ Verify delta calculations

### Expected Console Output

When running an audit, the browser console should show:
```
[PageSpeed API] Data sources - CrUX: true, Origin CrUX: false, Lighthouse: true
[ExtractMetrics] Total metrics extracted: 6 ["LCP", "INP", "CLS", "FCP", "TTFB", "performance_score"]
```

## 🚢 Deployment

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

## ⚠️ Known Limitations

1. **Lighthouse CLI**: Server-side Chrome not implemented - fallback uses PageSpeed lab data only
2. **Local Storage**: Large audits may hit browser storage limits
3. **API Key**: Currently client-side exposed (should be server-side for production)
4. **Comparison**: Only works with JSON reports from this tool

## 🔮 Future Enhancements

- [ ] Server-side API routes to hide API key
- [ ] Real Lighthouse execution with Chrome in container
- [ ] Screenshot capture for evidence
- [ ] Trend analysis over time
- [ ] Team collaboration features
- [ ] Authentication and user management

## 📄 License

MIT License - feel free to use and modify for your needs.

## 🤝 Contributing

This project was built following the B.L.A.S.T. protocol and anti-hallucination guidelines. When contributing:

1. Update SOPs in `architecture/` before changing logic
2. Follow TypeScript strict mode
3. Add source tracking for any new data
4. Test with real PageSpeed API responses

## 📚 Resources

- [PageSpeed Insights API Docs](https://developers.google.com/speed/docs/insights/v5/get-started)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)

---

**Built with ❤️ for QA teams who care about web performance.**
