# AI Performance Audit Agent

> A production-ready web application for QA teams to run standardized website performance audits using Google PageSpeed Insights with Lighthouse fallback.

![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)
![Protocol](https://img.shields.io/badge/B.L.A.S.T.-Protocol-emerald.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black.svg)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)

## 🌟 Overview

This project automates the manual, spreadsheet-driven workflow that QA teams use to audit website performance. Instead of manually running PageSpeed Insights for each page and copying results into spreadsheets, this tool:

- **🔍 PageSpeed-First Audit**: Uses Google PageSpeed Insights as primary data source.
- **📊 Multi-Level Fallback**: URL-level CrUX → Origin-level CrUX → Lighthouse Lab Data.
- **📱 Multi-Page Support**: Audit batches of URLs (up to 6+ pages supported via IndexedDB).
- **🖥️ Mobile & Desktop**: Comparative testing for both device types.
- **📄 Standardized Reports**: Professional PDF reports and portable JSON data packages.
- **📈 Comparison Mode**: Delta analysis between audit runs with clear improvement/regression indicators.

## 🏗️ Architecture & B.L.A.S.T. Protocol

This project follows the **B.L.A.S.T.** (Blueprint, Link, Architect, Stylize, Trigger) system for reliable development:

- **Layer 1 (Architecture)**: Standard Operating Procedures (SOPs) in `architecture/`.
- **Layer 2 (Navigation)**: Next.js App Router for orchestration.
- **Layer 3 (Tools/Services)**: Deterministic business logic in `my-app/src/services/`.

## 📂 Project Structure

```text
/
├── gemini.md                    # Project Constitution (Data Schemas, Behavioral Rules)
├── task_plan.md                 # Scope, Phases, and Checklist
├── progress.md                  # Build Progress Log
├── decisions.md                 # Architecture and Product Decisions
├── change_log.md                # Technical and User-Visible Change History
├── architecture/                # Layer 1: SOP Documentation
│   ├── threshold-sop.md         # Core Web Vitals definitions
│   ├── fallback-sop.md          # PSI to Lighthouse fallback logic
│   └── comparison-sop.md        # Delta calculation specs
├── my-app/                      # Next.js Application Source
│   ├── src/
│   │   ├── app/                 # Pages (Dashboard, Audit, Results)
│   │   ├── components/          # UI Components (shadcn/ui)
│   │   ├── services/            # Logic (Audit, Storage, Export)
│   │   └── types/               # Canonical Type Definitions
│   └── package.json             # Dependencies
└── Document/                    # Reference Docs (PRD, Spec, etc.)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Google PageSpeed Insights API Key (FREE)

### Installation & Setup

1. **Clone & Install**:
   ```bash
   git clone <repository-url>
   cd Project8-AI_Performance_Audit_Agent/my-app
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env.local` file in the `my-app/` directory:
   ```bash
   NEXT_PUBLIC_PAGESPEED_API_KEY=your_key_here
   ```

3. **Development Mode**:
   ```bash
   npm run dev
   ```
   Access at: [http://localhost:3000](http://localhost:3000)

## ⚙️ Core Web Vitals Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤2.5s | ≤4.0s | >4.0s |
| **INP** (Interaction to Next Paint) | ≤200ms | ≤500ms | >500ms |
| **CLS** (Cumulative Layout Shift) | ≤0.1 | ≤0.25 | >0.25 |
| **FCP** (First Contentful Paint) | ≤1.8s | ≤3.0s | >3.0s |
| **TTFB** (Time to First Byte) | ≤0.8s | ≤1.8s | >1.8s |

## 🛡️ Anti-Hallucination & Reliability Rules

- **Source Priority**: URL-CrUX → Origin-CrUX → Lab Data.
- **Source Transparency**: All metrics display their exact source (PSI vs LH).
- **Data Integrity**: CLS values are used directly from API percentile data without risky division.
- **Storage Safety**: Uses **IndexedDB** for full report data to bypass the 5MB localStorage limit.

## 📄 License
MIT License. Optimized for the automation-first QA professional.
