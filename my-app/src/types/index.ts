// Canonical Data Schemas - as defined in gemini.md

export interface AuditRun {
  runId: string;
  projectName: string;
  auditLabel: string;
  environment: string;
  deploymentTag?: string;
  generatedAt: string;
  schemaVersion: string;
}

export interface AuditPage {
  pageId: string;
  runId: string;
  pageLabel: string;
  pageType: PageType;
  url: string;
  sortOrder: number;
}

export type PageType = 
  | 'homepage' 
  | 'category' 
  | 'pdp' 
  | 'plp' 
  | 'search' 
  | 'custom';

export type Device = 'mobile' | 'desktop';
export type MetricName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB' | 'performance_score';
export type Status = 'good' | 'needs-improvement' | 'poor';
export type Source = 'pagespeed' | 'lighthouse';

// Diagnostic item status - normalized across PSI and Lighthouse
export type DiagnosticStatus = 
  | 'pass' 
  | 'fail' 
  | 'warning' 
  | 'manual' 
  | 'not-applicable' 
  | 'informative';

// Category names for diagnostics
export type CategoryName = 'performance' | 'accessibility' | 'best-practices' | 'seo';

// Group names within each category
export type PerformanceGroup = 'insights' | 'diagnostics' | 'passed';
export type AccessibilityGroup = 
  | 'aria' 
  | 'best-practices' 
  | 'navigation' 
  | 'audio-video' 
  | 'names-labels' 
  | 'manual-checks' 
  | 'passed' 
  | 'not-applicable';
export type BestPracticesGroup = 'general' | 'trust-safety' | 'passed' | 'not-applicable';
export type SeoGroup = 'crawling-indexing' | 'manual-checks' | 'passed';

export type DiagnosticGroup = PerformanceGroup | AccessibilityGroup | BestPracticesGroup | SeoGroup;

export interface MetricResult {
  pageId: string;
  device: Device;
  metricName: MetricName;
  value: number;
  unit: 's' | 'ms' | '';
  thresholdGood: number;
  thresholdWarn: number;
  status: Status;
  sourceAttempted: Source;
  sourceUsed: Source;
  fallbackTriggered: boolean;
  fallbackReason?: string;
  reportUrl?: string;
  capturedAt: string;
}

// Category score for a specific page/device (e.g., Performance: 85, Accessibility: 92)
export interface CategoryScore {
  pageId: string;
  device: Device;
  category: CategoryName;
  score: number; // 0-100
  source: Source;
  capturedAt: string;
}

// Individual diagnostic audit item
export interface DiagnosticItem {
  id: string; // unique ID for this diagnostic item instance
  pageId: string;
  device: Device;
  category: CategoryName;
  group: DiagnosticGroup;
  auditKey: string; // original audit ID from PSI/Lighthouse (e.g., "unused-javascript")
  title: string;
  description: string;
  status: DiagnosticStatus;
  scoreDisplayMode: 'binary' | 'numeric' | 'manual' | 'not-applicable' | 'informative';
  score?: number; // numeric score if applicable
  displayValue?: string; // human-readable value (e.g., "1.5 s", "450 KB")
  details?: string; // extended details/snippet
  recommendation?: string; // suggested fix
  whyItMatters?: string; // explanation of importance
  numericValue?: number; // raw numeric value
  numericUnit?: string; // unit for numeric value
  savings?: number; // potential savings in ms or bytes
  savingsUnit?: 'ms' | 'bytes';
  warnings?: string[]; // any warnings
  sources?: Array<{
    type: string;
    url?: string;
    label?: string;
    value?: number | string;
  }>;
  source: Source;
  capturedAt: string;
}

// Core Web Vitals Assessment for a specific page/device
export interface CWVAssessment {
  pageId: string;
  device: Device;
  passed: boolean; // true if LCP, INP, CLS are all 'good'
  status: 'passed' | 'failed' | 'not-available';
  lcp?: {
    value: number;
    displayValue: string;
    status: Status;
  };
  inp?: {
    value: number;
    displayValue: string;
    status: Status;
  };
  cls?: {
    value: number;
    displayValue: string;
    status: Status;
  };
  fcp?: {
    value: number;
    displayValue: string;
    status: Status;
  };
  ttfb?: {
    value: number;
    displayValue: string;
    status: Status;
  };
  interpretation: string; // human-readable interpretation
  source: Source;
  fallbackTriggered: boolean;
  fallbackReason?: string;
  capturedAt: string;
}

export interface Evidence {
  pageId: string;
  device: Device;
  screenshotUrl?: string;
  rawReferenceId?: string;
  notes?: string;
}

export interface ComparisonDelta {
  baselineRunId: string;
  currentRunId: string;
  pageKey: string;
  metricName: MetricName;
  device: Device;
  baselineValue: number;
  currentValue: number;
  deltaValue: number;
  deltaDirection: 'improved' | 'regressed' | 'unchanged';
}

// Category score delta for comparison
export interface CategoryScoreDelta {
  pageKey: string;
  category: CategoryName;
  device: Device;
  baselineScore: number;
  currentScore: number;
  delta: number;
  deltaDirection: 'improved' | 'regressed' | 'unchanged';
}

export interface ReportPackageMetadata {
  schemaVersion: string;
  appVersion: string;
  generatedAt: string;
  thresholdProfile: string;
  sourcePolicy: string;
}

export interface ReportPackage {
  metadata: ReportPackageMetadata;
  auditRun: AuditRun;
  pages: AuditPage[];
  metrics: MetricResult[];
  categoryScores: CategoryScore[]; // NEW: Category scores per page/device
  diagnostics: DiagnosticItem[]; // NEW: Detailed diagnostic items
  cwvAssessments: CWVAssessment[]; // NEW: CWV assessments per page/device
  evidence: Evidence[];
}

export interface AuditState {
  run: AuditRun | null;
  pages: AuditPage[];
  metrics: MetricResult[];
  categoryScores: CategoryScore[]; // NEW
  diagnostics: DiagnosticItem[]; // NEW
  cwvAssessments: CWVAssessment[]; // NEW
  status: 'idle' | 'running' | 'completed' | 'failed' | 'partial';
  progress: {
    total: number;
    completed: number;
    currentPage?: string;
  };
}

export interface PageFormData {
  pageLabel: string;
  pageType: PageType;
  url: string;
}

export interface AuditFormData {
  projectName: string;
  auditLabel: string;
  environment: string;
  deploymentTag?: string;
  pages: PageFormData[];
}

export interface ComparisonResult {
  deltas: ComparisonDelta[];
  categoryScoreDeltas: CategoryScoreDelta[]; // NEW
  missingPages: string[];
  newPages: string[];
  baselineRun: AuditRun;
  currentRun: AuditRun;
}

// Filter options for diagnostic items
export interface DiagnosticFilter {
  category?: CategoryName;
  status?: DiagnosticStatus[];
  group?: DiagnosticGroup;
  searchQuery?: string;
}
