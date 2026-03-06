# Task Plan - AI Performance Audit Agent

## Phase 0: Discovery and Schema Lock (COMPLETE)
- [x] Read and analyze all source files
- [x] Understand B.L.A.S.T. protocol requirements
- [x] Define canonical data schemas in gemini.md
- [x] Initialize project memory files

**Status**: Schema locked, ready for implementation

## Phase 1: Blueprint - UI Foundation
- [ ] Set up Next.js project with TypeScript
- [ ] Configure Tailwind CSS and shadcn/ui
- [ ] Create type definitions from schema
- [ ] Build Dashboard/Home screen
- [ ] Build New Audit Setup screen
  - Project/site name input
  - Audit label input
  - Environment selector
  - URL intake with bulk paste
  - Page type selector
  - Duplicate validation
- [ ] Implement local storage for draft audits

**Acceptance Gate**: User can define a full audit batch

## Phase 2: Link - Audit Engine
- [ ] Research PageSpeed Insights API
- [ ] Research Lighthouse CLI in serverless environment
- [ ] Build PageSpeed integration service
- [ ] Build Lighthouse fallback service
- [ ] Implement fallback logic with reason tracking
- [ ] Build Audit Progress screen
  - Queue management
  - Per-page status
  - Fallback indicators
  - Retry logic

**Acceptance Gate**: A full run returns normalized results with source labels

## Phase 3: Architect - Results and Reports
- [ ] Build Results Overview screen
  - Summary cards
  - Charts (metric distribution, worst pages)
  - Cross-page matrix
- [ ] Build Page Detail screen
- [ ] Implement PDF generation
- [ ] Implement JSON export
- [ ] Implement package export (PDF + JSON + metadata)
- [ ] Build Report Center screen

**Acceptance Gate**: Single report can be downloaded and reviewed

## Phase 4: Stylize - Comparison Mode
- [ ] Build Compare Runs screen
- [ ] Implement previous report upload
- [ ] Build schema validation
- [ ] Implement delta calculation
- [ ] Generate comparison PDF

**Acceptance Gate**: Baseline vs current works without database

## Phase 5: Trigger - Hardening and QA
- [ ] Write unit tests for:
  - Normalization logic
  - Threshold mapping
  - Fallback logic
  - Comparison logic
- [ ] Error state handling
- [ ] Anti-hallucination verification
- [ ] Create README.md
- [ ] Create deployment instructions
- [ ] Generate sample outputs

**Acceptance Gate**: Stable v1 release candidate

## Current Phase: Phase 1
