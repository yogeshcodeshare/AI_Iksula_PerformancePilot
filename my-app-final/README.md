# AI Performance Audit Agent

A production-ready web application for QA teams to run standardized website performance audits using Google PageSpeed Insights with Lighthouse fallback.

## Features

- **PageSpeed-First Audit**: Uses Google PageSpeed Insights as primary data source
- **Lighthouse Fallback**: Automatically falls back to Lighthouse when PageSpeed fails
- **Multi-Page Support**: Audit multiple pages in a single run
- **Mobile & Desktop**: Tests both device types for every page
- **Standardized Reports**: Generates consistent, professional PDF reports
- **Comparison Mode**: Compare current audit against previous reports
- **Export Options**: JSON, PDF, and bundled package exports
- **No Database Required**: Uses portable report packages for storage

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **PDF Export**: jsPDF
- **State**: Local Storage / Session Storage

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

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

3. Configure environment variables (optional):
```bash
# Create .env.local
NEXT_PUBLIC_PAGESPEED_API_KEY=your_api_key_here
```

> Note: If no API key is provided, the app will use simulated data for demonstration.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

The static export will be generated in the `dist` folder.

### Deploying to Vercel

```bash
npm i -g vercel
vercel --prod
```

## Usage

### Creating a New Audit

1. Click "Create New Audit" on the dashboard
2. Enter project details (name, label, environment)
3. Add pages to audit:
   - Enter page label and URL
   - Select page type (Homepage, Category, PDP, etc.)
   - Use "Bulk Add" to paste multiple URLs at once
4. Click "Start Audit" and wait for completion

### Viewing Results

- View summary statistics and charts
- See detailed metrics by page and device
- Check source used (PageSpeed or Lighthouse)
- Review any fallback reasons

### Exporting Reports

- **JSON**: Machine-readable format for future comparison
- **PDF**: Human-readable professional report
- **Package**: ZIP file containing JSON, PDF, and metadata

### Comparing Runs

1. Run a new audit
2. From the dashboard, upload a previous report JSON
3. View the comparison showing:
   - Improvements
   - Regressions
   - New or missing pages
   - Detailed delta tables

## Audit Metrics

The following Core Web Vitals are measured:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | ≤2.5s | ≤4.0s | >4.0s |
| INP (Interaction to Next Paint) | ≤200ms | ≤500ms | >500ms |
| CLS (Cumulative Layout Shift) | ≤0.1 | ≤0.25 | >0.25 |
| FCP (First Contentful Paint) | ≤1.8s | ≤3.0s | >3.0s |
| TTFB (Time to First Byte) | ≤0.8s | ≤1.8s | >1.8s |

## Architecture

This project follows the B.L.A.S.T. protocol:

- **B**lueprint: Defined schemas in `gemini.md`
- **L**ink: API verification layer
- **A**rchitect: 3-layer architecture (SOPs, Navigation, Tools)
- **S**tylize: UI/UX with Tailwind + shadcn
- **T**rigger: Vercel-friendly deployment

## File Structure

```
my-app/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/ui/    # shadcn/ui components
│   ├── lib/              # Utilities and constants
│   ├── services/         # Business logic services
│   └── types/            # TypeScript type definitions
├── architecture/         # SOP documentation
├── gemini.md            # Project constitution
└── README.md
```

## License

MIT
