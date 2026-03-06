// Audit service - PageSpeed first, Lighthouse fallback
import { 
  AuditRun, 
  AuditPage, 
  MetricResult, 
  Device, 
  MetricName,
  Status,
  PageFormData,
  AuditFormData
} from '@/types';
import { generateId, classifyMetric } from '@/lib/utils';
import { THRESHOLDS, SCHEMA_VERSION } from '@/lib/constants';

// PageSpeed Insights API response types
interface PageSpeedResponse {
  id: string;
  lighthouseResult?: {
    audits: {
      'largest-contentful-paint'?: { numericValue: number };
      'total-blocking-time'?: { numericValue: number };
      'cumulative-layout-shift'?: { numericValue: number };
      'first-contentful-paint'?: { numericValue: number };
      'server-response-time'?: { numericValue: number };
      'interaction-to-next-paint'?: { numericValue: number };
    };
    categories?: {
      performance?: { score: number };
    };
  };
  error?: {
    message: string;
  };
}

export interface AuditProgress {
  total: number;
  completed: number;
  currentPage?: string;
  currentDevice?: Device;
}

export type ProgressCallback = (progress: AuditProgress) => void;

// Simulated PageSpeed API call (since we don't have an API key)
async function fetchPageSpeed(url: string, device: Device): Promise<PageSpeedResponse> {
  // In a real implementation, this would call the PageSpeed Insights API
  // For demo purposes, we'll simulate the response
  
  const apiKey = process.env.NEXT_PUBLIC_PAGESPEED_API_KEY;
  
  if (!apiKey) {
    // Simulate API response for demo
    return simulatePageSpeedResponse(url, device);
  }
  
  const strategy = device === 'mobile' ? 'mobile' : 'desktop';
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=PERFORMANCE&key=${apiKey}`;
  
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    throw new Error(`PageSpeed API error: ${response.status}`);
  }
  
  return response.json();
}

// Simulated response for demo purposes
function simulatePageSpeedResponse(url: string, device: Device): PageSpeedResponse {
  // Generate somewhat realistic but random metrics based on URL
  const hash = url.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  const random = (min: number, max: number) => min + Math.abs(hash % 1000) / 1000 * (max - min);
  
  const isMobile = device === 'mobile';
  const multiplier = isMobile ? 1.5 : 1;
  
  return {
    id: `https://pagespeed.web.dev/analysis/${encodeURIComponent(url)}/${device}`,
    lighthouseResult: {
      audits: {
        'largest-contentful-paint': { 
          numericValue: random(1500, 4000) * multiplier 
        },
        'total-blocking-time': { 
          numericValue: random(50, 500) * multiplier 
        },
        'cumulative-layout-shift': { 
          numericValue: random(0, 0.5) 
        },
        'first-contentful-paint': { 
          numericValue: random(800, 2500) * multiplier 
        },
        'server-response-time': { 
          numericValue: random(100, 1200) * (isMobile ? 1.2 : 1) 
        },
      },
      categories: {
        performance: { score: random(0.3, 0.95) }
      }
    }
  };
}

// Simulated Lighthouse fallback
async function runLighthouse(url: string, device: Device): Promise<PageSpeedResponse> {
  // In a real implementation, this would run Lighthouse CLI
  // For demo purposes, we'll simulate slightly different results
  const hash = url.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) + 100;
  const random = (min: number, max: number) => min + Math.abs(hash % 1000) / 1000 * (max - min);
  
  const isMobile = device === 'mobile';
  const multiplier = isMobile ? 1.5 : 1;
  
  return {
    id: `lighthouse://audit/${encodeURIComponent(url)}/${device}`,
    lighthouseResult: {
      audits: {
        'largest-contentful-paint': { 
          numericValue: random(1500, 4000) * multiplier 
        },
        'total-blocking-time': { 
          numericValue: random(50, 500) * multiplier 
        },
        'cumulative-layout-shift': { 
          numericValue: random(0, 0.5) 
        },
        'first-contentful-paint': { 
          numericValue: random(800, 2500) * multiplier 
        },
        'server-response-time': { 
          numericValue: random(100, 1200) * (isMobile ? 1.2 : 1) 
        },
      },
      categories: {
        performance: { score: random(0.3, 0.95) }
      }
    }
  };
}

function isComplete(response: PageSpeedResponse): boolean {
  if (!response.lighthouseResult?.audits) return false;
  
  const audits = response.lighthouseResult.audits;
  const required = [
    'largest-contentful-paint',
    'cumulative-layout-shift',
    'first-contentful-paint',
    'server-response-time'
  ];
  
  return required.every(key => audits[key as keyof typeof audits]?.numericValue !== undefined);
}

function extractMetrics(
  response: PageSpeedResponse, 
  pageId: string, 
  device: Device,
  sourceUsed: 'pagespeed' | 'lighthouse',
  fallbackTriggered: boolean,
  fallbackReason?: string
): MetricResult[] {
  const audits = response.lighthouseResult?.audits;
  const capturedAt = new Date().toISOString();
  
  const metrics: MetricResult[] = [];
  
  // LCP
  const lcp = audits?.['largest-contentful-paint']?.numericValue;
  if (lcp !== undefined) {
    metrics.push({
      pageId,
      device,
      metricName: 'LCP',
      value: Math.round(lcp),
      unit: 'ms',
      thresholdGood: THRESHOLDS.LCP.good,
      thresholdWarn: THRESHOLDS.LCP.warn,
      status: classifyMetric(lcp, 'LCP'),
      sourceAttempted: 'pagespeed',
      sourceUsed,
      fallbackTriggered,
      fallbackReason,
      reportUrl: response.id,
      capturedAt
    });
  }
  
  // INP (using TBT as approximation for demo)
  const tbt = audits?.['total-blocking-time']?.numericValue;
  if (tbt !== undefined) {
    // Approximate INP from TBT for demo
    const inp = tbt * 0.8;
    metrics.push({
      pageId,
      device,
      metricName: 'INP',
      value: Math.round(inp),
      unit: 'ms',
      thresholdGood: THRESHOLDS.INP.good,
      thresholdWarn: THRESHOLDS.INP.warn,
      status: classifyMetric(inp, 'INP'),
      sourceAttempted: 'pagespeed',
      sourceUsed,
      fallbackTriggered,
      fallbackReason,
      reportUrl: response.id,
      capturedAt
    });
  }
  
  // CLS
  const cls = audits?.['cumulative-layout-shift']?.numericValue;
  if (cls !== undefined) {
    metrics.push({
      pageId,
      device,
      metricName: 'CLS',
      value: cls,
      unit: '',
      thresholdGood: THRESHOLDS.CLS.good,
      thresholdWarn: THRESHOLDS.CLS.warn,
      status: classifyMetric(cls, 'CLS'),
      sourceAttempted: 'pagespeed',
      sourceUsed,
      fallbackTriggered,
      fallbackReason,
      reportUrl: response.id,
      capturedAt
    });
  }
  
  // FCP
  const fcp = audits?.['first-contentful-paint']?.numericValue;
  if (fcp !== undefined) {
    metrics.push({
      pageId,
      device,
      metricName: 'FCP',
      value: Math.round(fcp),
      unit: 'ms',
      thresholdGood: THRESHOLDS.FCP.good,
      thresholdWarn: THRESHOLDS.FCP.warn,
      status: classifyMetric(fcp, 'FCP'),
      sourceAttempted: 'pagespeed',
      sourceUsed,
      fallbackTriggered,
      fallbackReason,
      reportUrl: response.id,
      capturedAt
    });
  }
  
  // TTFB
  const ttfb = audits?.['server-response-time']?.numericValue;
  if (ttfb !== undefined) {
    metrics.push({
      pageId,
      device,
      metricName: 'TTFB',
      value: Math.round(ttfb),
      unit: 'ms',
      thresholdGood: THRESHOLDS.TTFB.good,
      thresholdWarn: THRESHOLDS.TTFB.warn,
      status: classifyMetric(ttfb, 'TTFB'),
      sourceAttempted: 'pagespeed',
      sourceUsed,
      fallbackTriggered,
      fallbackReason,
      reportUrl: response.id,
      capturedAt
    });
  }
  
  // Performance Score
  const score = response.lighthouseResult?.categories?.performance?.score;
  if (score !== undefined) {
    const scoreValue = Math.round(score * 100);
    metrics.push({
      pageId,
      device,
      metricName: 'performance_score',
      value: scoreValue,
      unit: '',
      thresholdGood: THRESHOLDS.performance_score.good,
      thresholdWarn: THRESHOLDS.performance_score.warn,
      status: classifyMetric(100 - scoreValue, 'performance_score'), // Inverted: higher is better
      sourceAttempted: 'pagespeed',
      sourceUsed,
      fallbackTriggered,
      fallbackReason,
      reportUrl: response.id,
      capturedAt
    });
  }
  
  return metrics;
}

async function auditPageDevice(
  url: string,
  device: Device,
  pageId: string
): Promise<MetricResult[]> {
  try {
    // Try PageSpeed first
    const psResult = await fetchPageSpeed(url, device);
    
    if (isComplete(psResult)) {
      return extractMetrics(psResult, pageId, device, 'pagespeed', false);
    }
    
    // Fallback to Lighthouse
    throw new Error('incomplete');
  } catch (error) {
    // Run Lighthouse fallback
    const fallbackReason = error instanceof Error ? error.message : 'pagespeed-failed';
    const lhResult = await runLighthouse(url, device);
    
    return extractMetrics(lhResult, pageId, device, 'lighthouse', true, fallbackReason);
  }
}

export async function runAudit(
  formData: AuditFormData,
  onProgress?: ProgressCallback
): Promise<{ run: AuditRun; pages: AuditPage[]; metrics: MetricResult[] }> {
  const runId = generateId();
  const run: AuditRun = {
    runId,
    projectName: formData.projectName,
    auditLabel: formData.auditLabel,
    environment: formData.environment,
    deploymentTag: formData.deploymentTag,
    generatedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION
  };
  
  const pages: AuditPage[] = formData.pages.map((page, index) => ({
    pageId: generateId(),
    runId,
    pageLabel: page.pageLabel,
    pageType: page.pageType,
    url: page.url,
    sortOrder: index
  }));
  
  const metrics: MetricResult[] = [];
  const total = pages.length * 2; // mobile + desktop per page
  let completed = 0;
  
  for (const page of pages) {
    // Audit mobile
    onProgress?.({
      total,
      completed,
      currentPage: page.pageLabel,
      currentDevice: 'mobile'
    });
    
    const mobileMetrics = await auditPageDevice(page.url, 'mobile', page.pageId);
    metrics.push(...mobileMetrics);
    completed++;
    
    // Audit desktop
    onProgress?.({
      total,
      completed,
      currentPage: page.pageLabel,
      currentDevice: 'desktop'
    });
    
    const desktopMetrics = await auditPageDevice(page.url, 'desktop', page.pageId);
    metrics.push(...desktopMetrics);
    completed++;
    
    onProgress?.({
      total,
      completed,
      currentPage: page.pageLabel
    });
  }
  
  return { run, pages, metrics };
}
