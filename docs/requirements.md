# Requirements (summary)

Full product requirements: [`Document/AI_Performance_Audit_Agent_PRD_v2.md`](../Document/AI_Performance_Audit_Agent_PRD_v2.md).

## Problem
QA teams audit page speed by hand: run Google PageSpeed per page and device, copy LCP/INP/CLS/FCP/TTFB into spreadsheets, and repeat after every release to compare. This is slow, inconsistent and hard to compare.

## Goals
| ID | Goal | Measure |
|---|---|---|
| BO-1 | Faster multi-page audits | 5 pages × 2 devices + PDF in < 10 min |
| BO-2 | Consistent, trustworthy results | Every metric carries its source and Google CWV thresholds |
| BO-3 | Release-over-release comparison | Upload baseline JSON → delta report in one click |
| BO-4 | Client-ready output | Branded PDF report |
| BO-5 | Near-zero running cost | Static hosting, no paid backend |

## Functional requirements
| ID | Requirement | Status |
|---|---|---|
| FR-01 | Dashboard with totals and recent audits | Done |
| FR-02 | Audit setup: project, label, environment, deployment tag | Done |
| FR-03 | Add pages singly or by Bulk Add (auto label + page type) | Done (auto label Nov 2026) |
| FR-04 | Validate URLs and reject duplicates (incl. trailing-slash variants) | Done |
| FR-05 | Audit every page on mobile + desktop via PSI v5, 4 Lighthouse categories | Done |
| FR-06 | Pre-flight API-key / quota check (never cached) | Done |
| FR-07 | Live per-page, per-device progress | Done |
| FR-08 | Automatic second pass + manual retry with cooldown, skipping unrecoverable errors | Done (Nov 2026) |
| FR-09 | Fallback: URL CrUX → origin CrUX → Lighthouse lab, source labelled | Done |
| FR-10–12 | Results: health, CWV, matrix, diagnostics, recommendations | Done |
| FR-13 | Export PDF / JSON / ZIP | Done |
| FR-14 | Compare with uploaded baseline (normalized URL matching) | Done (fixed Nov 2026) |
| FR-15 | Configurable thresholds | Done |
| FR-16 | Report failures to GitHub (pre-filled issue) | Done (Nov 2026) |
| FR-17 | Central automatic failure log | Proposed |
| FR-18 | Lighthouse backup runner when PSI fails | Proposed |

## Non-functional
Reliability (one failing URL never stops a batch), privacy (data stays in the browser; exports are user-owned), accessibility (WCAG 2.1 AA target; automated axe scan in CI), maintainability (pages → hooks → pure services; SOPs before code changes), testability (unit, component and E2E suites in CI).
