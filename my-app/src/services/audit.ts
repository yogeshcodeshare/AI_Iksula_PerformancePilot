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
interface LoadingExperienceMetric {
  percentile?: number;
  distributions?: Array<{ proportion: number }>;
  category?: 'FAST' | 'AVERAGE' | 'SLOW';
}

interface PageSpeedResponse {
  id: string;
  // CrUX Field Data (real user metrics) - URL-level
  loadingExperience?: {
    id?: string;
    metrics?: {
      LARGEST_CONTENTFUL_PAINT_MS?: LoadingExperienceMetric;
      INTERACTION_TO_NEXT_PAINT?: LoadingExperienceMetric;
      CUMULATIVE_LAYOUT_SHIFT_SCORE?: LoadingExperienceMetric;
      FIRST_CONTENTFUL_PAINT_MS?: LoadingExperienceMetric;
      EXPERIMENTAL_TIME_TO_FIRST_BYTE?: LoadingExperienceMetric;
    };
    overall_category?: 'FAST' | 'AVERAGE' | 'SLOW';
  };
  // Origin-level CrUX data (fallback when URL-level is unavailable)
  originLoadingExperience?: {
    id?: string;
    metrics?: {
      LARGEST_CONTENTFUL_PAINT_MS?: LoadingExperienceMetric;
      INTERACTION_TO_NEXT_PAINT?: LoadingExperienceMetric;
      CUMULATIVE_LAYOUT_SHIFT_SCORE?: LoadingExperienceMetric;
      FIRST_CONTENTFUL_PAINT_MS?: LoadingExperienceMetric;
      EXPERIMENTAL_TIME_TO_FIRST_BYTE?: LoadingExperienceMetric;
    };
    overall_category?: 'FAST' | 'AVERAGE' | 'SLOW';
  };
  // Lighthouse Lab Data
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
    code?: number;
  };
}

export interface AuditProgress {
  total: number;
  completed: number;
  currentPage?: string;
  currentDevice?: Device;
}

export type ProgressCallback = (progress: AuditProgress) => void;

/**
 * Fetch PageSpeed Insights API data
 * 
 * IMPORTANT: This makes REAL API calls to Google PageSpeed Insights.
 * Without an API key, you are subject to strict rate limits (approx 1 query per 100 seconds).
 * 
 * To avoid rate limits, create a .env.local file with:
 * NEXT_PUBLIC_PAGESPEED_API_KEY=your_google_api_key_here
 * 
 * Get your API key at: https://developers.google.com/speed/docs/insights/v5/get-started
 */
async function fetchPageSpeed(url: string, device: Device): Promise<PageSpeedResponse> {
  const apiKey = process.env.NEXT_PUBLIC_PAGESPEED_API_KEY;
  const strategy = device === 'mobile' ? 'mobile' : 'desktop';

  // Build API URL - key is optional but recommended to avoid rate limits
  // category=PERFORMANCE is required to get full Lighthouse performance audits
  let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=PERFORMANCE`;

  if (apiKey) {
    apiUrl += `&key=${apiKey}`;
  }

  console.log(`[PageSpeed API] Calling: ${apiUrl.replace(/key=[^&]+/, 'key=***')}`);

  const response = await fetch(apiUrl);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`PageSpeed API error ${response.status}: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  console.log(`[PageSpeed API] Response received for ${url} (${device})`);

  // Debug: Log available data sources
  const hasCrux = !!data.loadingExperience?.metrics;
  const hasOriginCrux = !!data.originLoadingExperience?.metrics;
  const hasLighthouse = !!data.lighthouseResult?.audits;

  console.log(`[PageSpeed API] Data sources - CrUX: ${hasCrux}, Origin CrUX: ${hasOriginCrux}, Lighthouse: ${hasLighthouse}`);

  if (hasLighthouse) {
    const audits = data.lighthouseResult.audits;
    console.log(`[PageSpeed API] Available Lighthouse audits:`, Object.keys(audits).slice(0, 10));
  }

  return data;
}

// Lighthouse fallback - this is a placeholder for future server-side Lighthouse CLI implementation
// Currently, we rely on PageSpeed's lab data which is already Lighthouse data
async function runLighthouse(url: string, device: Device): Promise<PageSpeedResponse> {
  // In a production implementation with server-side capabilities, this would:
  // 1. Run Lighthouse CLI via Chrome DevTools Protocol
  // 2. Return the results in PageSpeedResponse format
  // 
  // For now, this throws an error which will be caught and handled gracefully
  // Note: This is an expected fallback, not an error condition
  throw new Error('Lighthouse CLI not available');
}

/**
 * Check if a response has usable data
 * First checks for CrUX field data (URL-level), then origin-level, then falls back to lab data
 */
function isComplete(response: PageSpeedResponse): boolean {
  // Check for URL-level CrUX field data first
  const cruxMetrics = response.loadingExperience?.metrics;
  if (cruxMetrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile !== undefined) {
    console.log(`[isComplete] Found URL-level CrUX data`);
    return true;
  }

  // Check for origin-level CrUX field data as fallback
  const originMetrics = response.originLoadingExperience?.metrics;
  if (originMetrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile !== undefined) {
    console.log(`[isComplete] Found origin-level CrUX data`);
    return true;
  }

  // Fall back to lab data - check if lighthouse audits exist
  const audits = response.lighthouseResult?.audits;
  if (!audits) {
    console.log(`[isComplete] No lighthouse audits found`);
    return false;
  }

  // Check for at least LCP in lab data
  const hasLCP = audits['largest-contentful-paint']?.numericValue !== undefined;
  console.log(`[isComplete] Lighthouse LCP available: ${hasLCP}`);

  return hasLCP;
}

/**
 * Extract metrics from API response
 * Priority: URL-level CrUX > Origin-level CrUX > Lighthouse Lab Data
 */
function extractMetrics(
  response: PageSpeedResponse,
  pageId: string,
  device: Device,
  sourceUsed: 'pagespeed' | 'lighthouse',
  fallbackTriggered: boolean,
  fallbackReason?: string
): MetricResult[] {
  const metrics: MetricResult[] = [];
  const capturedAt = new Date().toISOString();

  // Try URL-level CrUX Field Data first (real user metrics for specific URL)
  const cruxMetrics = response.loadingExperience?.metrics;
  const hasCruxData = cruxMetrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile !== undefined;

  // Try Origin-level CrUX Field Data as fallback (real user metrics for entire origin)
  const originMetrics = response.originLoadingExperience?.metrics;
  const hasOriginData = originMetrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile !== undefined;

  // Determine which data source to use
  const useUrlLevelCrux = hasCruxData;
  const useOriginLevelCrux = !hasCruxData && hasOriginData;
  const cruxSource = useUrlLevelCrux ? cruxMetrics : (useOriginLevelCrux ? originMetrics : null);

  if (cruxSource) {
    const dataSourceLabel = useUrlLevelCrux ? 'URL-level CrUX Field Data' : 'Origin-level CrUX Field Data';
    console.log(`[ExtractMetrics] Using ${dataSourceLabel} for ${pageId}`);

    // LCP from CrUX
    const lcpCrux = cruxSource.LARGEST_CONTENTFUL_PAINT_MS;
    if (lcpCrux?.percentile !== undefined) {
      metrics.push({
        pageId,
        device,
        metricName: 'LCP',
        value: Math.round(lcpCrux.percentile),
        unit: 'ms',
        thresholdGood: THRESHOLDS.LCP.good,
        thresholdWarn: THRESHOLDS.LCP.warn,
        status: classifyMetric(lcpCrux.percentile, 'LCP'),
        sourceAttempted: 'pagespeed',
        sourceUsed: 'pagespeed',
        fallbackTriggered: useOriginLevelCrux, // Mark as fallback if using origin-level
        fallbackReason: useOriginLevelCrux
          ? 'URL-level CrUX unavailable, using origin-level data'
          : 'Using CrUX Field Data (real users)',
        reportUrl: response.id,
        capturedAt
      });
    }

    // INP from CrUX
    const inpCrux = cruxSource.INTERACTION_TO_NEXT_PAINT;
    if (inpCrux?.percentile !== undefined) {
      metrics.push({
        pageId,
        device,
        metricName: 'INP',
        value: Math.round(inpCrux.percentile),
        unit: 'ms',
        thresholdGood: THRESHOLDS.INP.good,
        thresholdWarn: THRESHOLDS.INP.warn,
        status: classifyMetric(inpCrux.percentile, 'INP'),
        sourceAttempted: 'pagespeed',
        sourceUsed: 'pagespeed',
        fallbackTriggered: useOriginLevelCrux,
        fallbackReason: useOriginLevelCrux
          ? 'URL-level CrUX unavailable, using origin-level data'
          : 'Using CrUX Field Data (real users)',
        reportUrl: response.id,
        capturedAt
      });
    }

    // CLS from CrUX
    const clsCrux = cruxSource.CUMULATIVE_LAYOUT_SHIFT_SCORE;
    if (clsCrux?.percentile !== undefined) {
      // PageSpeed API returns CLS as a normal floating point (e.g., 0.68)
      // NO division needed - the percentile value is already the correct CLS score
      const clsValue = clsCrux.percentile;
      metrics.push({
        pageId,
        device,
        metricName: 'CLS',
        value: clsValue,
        unit: '',
        thresholdGood: THRESHOLDS.CLS.good,
        thresholdWarn: THRESHOLDS.CLS.warn,
        status: classifyMetric(clsValue, 'CLS'),
        sourceAttempted: 'pagespeed',
        sourceUsed: 'pagespeed',
        fallbackTriggered: useOriginLevelCrux,
        fallbackReason: useOriginLevelCrux
          ? 'URL-level CrUX unavailable, using origin-level data'
          : 'Using CrUX Field Data (real users)',
        reportUrl: response.id,
        capturedAt
      });
    }

    // FCP from CrUX
    const fcpCrux = cruxSource.FIRST_CONTENTFUL_PAINT_MS;
    if (fcpCrux?.percentile !== undefined) {
      metrics.push({
        pageId,
        device,
        metricName: 'FCP',
        value: Math.round(fcpCrux.percentile),
        unit: 'ms',
        thresholdGood: THRESHOLDS.FCP.good,
        thresholdWarn: THRESHOLDS.FCP.warn,
        status: classifyMetric(fcpCrux.percentile, 'FCP'),
        sourceAttempted: 'pagespeed',
        sourceUsed: 'pagespeed',
        fallbackTriggered: useOriginLevelCrux,
        fallbackReason: useOriginLevelCrux
          ? 'URL-level CrUX unavailable, using origin-level data'
          : 'Using CrUX Field Data (real users)',
        reportUrl: response.id,
        capturedAt
      });
    }

    // TTFB from CrUX (experimental)
    const ttfbCrux = cruxSource.EXPERIMENTAL_TIME_TO_FIRST_BYTE;
    if (ttfbCrux?.percentile !== undefined) {
      metrics.push({
        pageId,
        device,
        metricName: 'TTFB',
        value: Math.round(ttfbCrux.percentile),
        unit: 'ms',
        thresholdGood: THRESHOLDS.TTFB.good,
        thresholdWarn: THRESHOLDS.TTFB.warn,
        status: classifyMetric(ttfbCrux.percentile, 'TTFB'),
        sourceAttempted: 'pagespeed',
        sourceUsed: 'pagespeed',
        fallbackTriggered: useOriginLevelCrux,
        fallbackReason: useOriginLevelCrux
          ? 'URL-level CrUX unavailable, using origin-level data'
          : 'Using CrUX Field Data (real users)',
        reportUrl: response.id,
        capturedAt
      });
    }

    // Add performance score from lighthouse if available
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
        status: classifyMetric(100 - scoreValue, 'performance_score'),
        sourceAttempted: 'pagespeed',
        sourceUsed: 'pagespeed',
        fallbackTriggered: useOriginLevelCrux,
        fallbackReason: useOriginLevelCrux
          ? 'URL-level CrUX unavailable, using origin-level data'
          : 'Using CrUX Field Data (real users)',
        reportUrl: response.id,
        capturedAt
      });
    }

    return metrics;
  }

  // Fallback to Lighthouse Lab Data
  console.log(`[ExtractMetrics] Using Lighthouse Lab Data for ${pageId}`);
  const audits = response.lighthouseResult?.audits;
  if (!audits) {
    console.log(`[ExtractMetrics] No lighthouse audits available`);
    return metrics;
  }

  console.log(`[ExtractMetrics] Available audits:`, Object.keys(audits).filter(k =>
    ['largest-contentful-paint', 'cumulative-layout-shift', 'first-contentful-paint',
      'server-response-time', 'interaction-to-next-paint', 'total-blocking-time'].includes(k)
  ));

  // LCP from Lab Data
  const lcp = audits['largest-contentful-paint']?.numericValue;
  console.log(`[ExtractMetrics] LCP value: ${lcp}`);
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
      fallbackTriggered: true,
      fallbackReason: fallbackReason || 'No CrUX data available, using Lab Data',
      reportUrl: response.id,
      capturedAt
    });
  }

  // INP from Lab Data (using TBT as approximation)
  const inpLab = audits['interaction-to-next-paint']?.numericValue;
  if (inpLab !== undefined) {
    metrics.push({
      pageId,
      device,
      metricName: 'INP',
      value: Math.round(inpLab),
      unit: 'ms',
      thresholdGood: THRESHOLDS.INP.good,
      thresholdWarn: THRESHOLDS.INP.warn,
      status: classifyMetric(inpLab, 'INP'),
      sourceAttempted: 'pagespeed',
      sourceUsed,
      fallbackTriggered: true,
      fallbackReason: fallbackReason || 'No CrUX data available, using Lab Data',
      reportUrl: response.id,
      capturedAt
    });
  } else {
    // Fallback to TBT if INP not available
    const tbt = audits['total-blocking-time']?.numericValue;
    if (tbt !== undefined) {
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
        fallbackTriggered: true,
        fallbackReason: fallbackReason || 'No CrUX INP data, estimated from TBT',
        reportUrl: response.id,
        capturedAt
      });
    }
  }

  // CLS from Lab Data
  const cls = audits['cumulative-layout-shift']?.numericValue;
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
      fallbackTriggered: true,
      fallbackReason: fallbackReason || 'No CrUX data available, using Lab Data',
      reportUrl: response.id,
      capturedAt
    });
  }

  // FCP from Lab Data
  const fcp = audits['first-contentful-paint']?.numericValue;
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
      fallbackTriggered: true,
      fallbackReason: fallbackReason || 'No CrUX data available, using Lab Data',
      reportUrl: response.id,
      capturedAt
    });
  }

  // TTFB from Lab Data
  const ttfb = audits['server-response-time']?.numericValue;
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
      fallbackTriggered: true,
      fallbackReason: fallbackReason || 'No CrUX data available, using Lab Data',
      reportUrl: response.id,
      capturedAt
    });
  }

  // Performance Score from Lab Data
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
      status: classifyMetric(100 - scoreValue, 'performance_score'),
      sourceAttempted: 'pagespeed',
      sourceUsed,
      fallbackTriggered: true,
      fallbackReason: fallbackReason || 'No CrUX data available, using Lab Data',
      reportUrl: response.id,
      capturedAt
    });
  }

  console.log(`[ExtractMetrics] Total metrics extracted: ${metrics.length}`, metrics.map(m => m.metricName));
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

    // Check if we have any usable data (CrUX or Lab)
    if (isComplete(psResult)) {
      const hasUrlLevelCrux = psResult.loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile !== undefined;
      const hasOriginLevelCrux = psResult.originLoadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile !== undefined;
      const hasCrux = hasUrlLevelCrux || hasOriginLevelCrux;

      return extractMetrics(
        psResult,
        pageId,
        device,
        'pagespeed',
        !hasUrlLevelCrux && hasOriginLevelCrux, // fallbackTriggered only if using origin-level
        hasCrux ? undefined : 'No CrUX field data available for this URL'
      );
    }

    // If PageSpeed returned data but no metrics, try to extract lab data anyway
    // (extractMetrics will handle empty responses gracefully)
    console.log(`[AuditPageDevice] No CrUX data for ${url}, attempting lab data extraction`);
    const labMetrics = extractMetrics(
      psResult,
      pageId,
      device,
      'pagespeed',
      true,
      'No CrUX data available, using Lighthouse Lab Data from PageSpeed'
    );

    if (labMetrics.length > 0) {
      return labMetrics;
    }

    // Last resort: try standalone Lighthouse (will likely fail in client-side only env)
    throw new Error('No usable data from PageSpeed');
  } catch (error) {
    // Only log unexpected errors, not the "No usable data" case which is expected
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    if (errorMsg !== 'No usable data from PageSpeed') {
      console.log(`[AuditPageDevice] PageSpeed incomplete for ${url} (${device}), attempting fallback`);
    }

    // Try Lighthouse CLI fallback (server-side only)
    try {
      const lhResult = await runLighthouse(url, device);
      return extractMetrics(lhResult, pageId, device, 'lighthouse', true, 'PageSpeed API failed');
    } catch (lhError) {
      // Lighthouse CLI not available - this is expected in client-side only environment
      // Return empty metrics with error info instead of crashing
      const lhErrorMsg = lhError instanceof Error ? lhError.message : 'Unknown error';
      console.log(`[AuditPageDevice] Lighthouse fallback not available: ${lhErrorMsg}`);

      // Return a single failed metric to indicate the page was audited but failed
      return [{
        pageId,
        device,
        metricName: 'LCP',
        value: 0,
        unit: 'ms',
        thresholdGood: THRESHOLDS.LCP.good,
        thresholdWarn: THRESHOLDS.LCP.warn,
        status: 'poor',
        sourceAttempted: 'pagespeed',
        sourceUsed: 'pagespeed',
        fallbackTriggered: true,
        fallbackReason: `No CrUX data, Lighthouse CLI not available (client-side only)`,
        reportUrl: url,
        capturedAt: new Date().toISOString()
      }];
    }
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
    onProgress?.({
      total,
      completed,
      currentPage: page.pageLabel,
      currentDevice: 'mobile'
    });

    // Fetch both devices in parallel to cut the 2-3 min execution time in half
    const [mobileMetrics, desktopMetrics] = await Promise.all([
      auditPageDevice(page.url, 'mobile', page.pageId).then(res => {
        completed++;
        onProgress?.({
          total,
          completed,
          currentPage: page.pageLabel,
          currentDevice: 'desktop'
        });
        return res;
      }),
      auditPageDevice(page.url, 'desktop', page.pageId).then(res => {
        completed++;
        return res;
      })
    ]);

    metrics.push(...mobileMetrics);
    metrics.push(...desktopMetrics);

    onProgress?.({
      total,
      completed,
      currentPage: page.pageLabel
    });
  }

  return { run, pages, metrics };
}
