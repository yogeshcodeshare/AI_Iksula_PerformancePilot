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
  evidence: Evidence[];
}

export interface AuditState {
  run: AuditRun | null;
  pages: AuditPage[];
  metrics: MetricResult[];
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
  missingPages: string[];
  newPages: string[];
  baselineRun: AuditRun;
  currentRun: AuditRun;
}
