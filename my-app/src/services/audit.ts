// Audit service - PageSpeed first, Lighthouse fallback
import {
  AuditRun,
  AuditPage,
  MetricResult,
  Device,
  MetricName,
  Status,
  Source,
  PageFormData,
  AuditFormData,
  CategoryScore,
  CategoryName,
  DiagnosticItem,
  DiagnosticStatus,
  DiagnosticGroup,
  CWVAssessment
} from '@/types';
import { generateId, classifyMetric } from '@/lib/utils';
import { THRESHOLDS, SCHEMA_VERSION } from '@/lib/constants';

// PageSpeed Insights API response types
interface LoadingExperienceMetric {
  percentile?: number;
  distributions?: Array<{ proportion: number }>;
  category?: 'FAST' | 'AVERAGE' | 'SLOW';
}

interface PageSpeedAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  scoreDisplayMode: 'binary' | 'numeric' | 'manual' | 'not-applicable' | 'informative';
  displayValue?: string;
  details?: {
    type?: string;
    headings?: Array<{ label: string; key: string; valueType?: string }>;
    items?: Array<Record<string, unknown>>;
    overallSavingsMs?: number;
    overallSavingsBytes?: number;
  };
  numericValue?: number;
  numericUnit?: string;
  warnings?: string[];
}

interface PageSpeedCategory {
  score: number;
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
    audits: Record<string, PageSpeedAudit>;
    categories?: {
      performance?: PageSpeedCategory;
      accessibility?: PageSpeedCategory;
      'best-practices'?: PageSpeedCategory;
      seo?: PageSpeedCategory;
    };
    configSettings?: {
      locale?: string;
    };
    environment?: {
      networkUserAgent?: string;
    };
  };
  error?: {
    message: string;
    code?: number;
  };
}

// Audit group mappings from PageSpeed/Lighthouse
const PERFORMANCE_GROUPS: Record<string, DiagnosticGroup> = {
  'unused-javascript': 'insights',
  'unused-css-rules': 'insights',
  'modern-image-formats': 'insights',
  'efficiently-encode-images': 'insights',
  'render-blocking-resources': 'insights',
  'unminified-javascript': 'insights',
  'unminified-css': 'insights',
  'uses-optimized-images': 'insights',
  'uses-text-compression': 'insights',
  'uses-responsive-images': 'insights',
  'server-response-time': 'diagnostics',
  'redirects': 'diagnostics',
  'uses-http2': 'diagnostics',
  'uses-long-cache-ttl': 'diagnostics',
  'total-byte-weight': 'diagnostics',
  'dom-size': 'diagnostics',
  'bootup-time': 'diagnostics',
  'mainthread-work-breakdown': 'diagnostics',
  'third-party-summary': 'diagnostics',
  'user-timings': 'diagnostics',
};

const ACCESSIBILITY_GROUPS: Record<string, DiagnosticGroup> = {
  'aria-allowed-attr': 'aria',
  'aria-command-name': 'aria',
  'aria-hidden-body': 'aria',
  'aria-hidden-focus': 'aria',
  'aria-input-field-name': 'aria',
  'aria-meter-name': 'aria',
  'aria-progressbar-name': 'aria',
  'aria-required-attr': 'aria',
  'aria-required-children': 'aria',
  'aria-required-parent': 'aria',
  'aria-roles': 'aria',
  'aria-toggle-field-name': 'aria',
  'aria-tooltip-name': 'aria',
  'aria-treeitem-name': 'aria',
  'aria-valid-attr-value': 'aria',
  'aria-valid-attr': 'aria',
  'button-name': 'names-labels',
  'document-title': 'names-labels',
  'form-field-multiple-labels': 'names-labels',
  'frame-title': 'names-labels',
  'image-alt': 'names-labels',
  'input-image-alt': 'names-labels',
  'label': 'names-labels',
  'link-name': 'names-labels',
  'object-alt': 'names-labels',
  'accesskeys': 'navigation',
  'bypass': 'navigation',
  'heading-order': 'navigation',
  'html-has-lang': 'navigation',
  'html-lang-valid': 'navigation',
  'html-xml-lang-mismatch': 'navigation',
  'link-in-text-block': 'navigation',
  'list': 'navigation',
  'listitem': 'navigation',
  'meta-refresh': 'navigation',
  'skip-link': 'navigation',
  'tabindex': 'navigation',
  'audio-caption': 'audio-video',
  'video-caption': 'audio-video',
  'video-description': 'audio-video',
  'logical-tab-order': 'manual-checks',
  'focusable-controls': 'manual-checks',
  'interactive-element-affordance': 'manual-checks',
  'managed-focus': 'manual-checks',
  'focus-traps': 'manual-checks',
  'custom-controls-labels': 'manual-checks',
  'custom-controls-roles': 'manual-checks',
  'visual-order-follows-dom': 'manual-checks',
  'offscreen-content-hidden': 'manual-checks',
  'use-landmarks': 'manual-checks',
};

const BEST_PRACTICES_GROUPS: Record<string, DiagnosticGroup> = {
  'appcache-manifest': 'general',
  'charset': 'general',
  'doctype': 'general',
  'errors-in-console': 'general',
  'geolocation-on-start': 'general',
  'image-aspect-ratio': 'general',
  'image-size-responsive': 'general',
  'js-libraries': 'general',
  'no-document-write': 'general',
  'notification-on-start': 'general',
  'page-has-title-tag': 'general',
  'password-inputs-can-be-pasted-into': 'general',
  'uses-http2': 'general',
  'uses-passive-event-listeners': 'general',
  'deprecations': 'general',
  'third-party-cookies': 'trust-safety',
  'csp-xss': 'trust-safety',
  'paste-preventing-inputs': 'trust-safety',
};

const SEO_GROUPS: Record<string, DiagnosticGroup> = {
  'document-title': 'crawling-indexing',
  'meta-description': 'crawling-indexing',
  'http-status-code': 'crawling-indexing',
  'link-text': 'crawling-indexing',
  'crawlable-anchors': 'crawling-indexing',
  'is-crawlable': 'crawling-indexing',
  'robots-txt': 'crawling-indexing',
  'google-fonts': 'crawling-indexing',
  'viewport': 'crawling-indexing',
  'hreflang': 'crawling-indexing',
  'canonical': 'crawling-indexing',
  'structured-data': 'crawling-indexing',
  'tap-targets': 'manual-checks',
  'font-size': 'manual-checks',
};

export interface AuditProgress {
  total: number;
  completed: number;
  currentPage?: string;
  currentDevice?: Device;
}

export type ProgressCallback = (progress: AuditProgress) => void;

/**
 * Fetch PageSpeed Insights API data
 */
async function fetchPageSpeed(url: string, device: Device): Promise<PageSpeedResponse> {
  const apiKey = process.env.NEXT_PUBLIC_PAGESPEED_API_KEY;
  const strategy = device === 'mobile' ? 'mobile' : 'desktop';

  // Build API URL - include all categories to get full diagnostic data
  // category=PERFORMANCE is required, add others for full diagnostics
  let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO`;

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

  return data;
}

// Lighthouse fallback - placeholder for future server-side implementation
async function runLighthouse(url: string, device: Device): Promise<PageSpeedResponse> {
  throw new Error('Lighthouse CLI not available');
}

/**
 * Check if a response has usable data
 */
function isComplete(response: PageSpeedResponse): boolean {
  // Check URL-level CrUX field data first
  const cruxMetrics = response.loadingExperience?.metrics;
  if (cruxMetrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile !== undefined) {
    return true;
  }

  // Check origin-level CrUX field data as secondary
  const originMetrics = response.originLoadingExperience?.metrics;
  if (originMetrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile !== undefined) {
    return true;
  }

  // Check Lighthouse lab data from the PageSpeed response
  const audits = response.lighthouseResult?.audits;
  if (!audits) return false;

  // Consider it complete if we have at least LCP and FCP from lab data
  const hasLCP = audits['largest-contentful-paint']?.numericValue !== undefined;
  const hasFCP = audits['first-contentful-paint']?.numericValue !== undefined;
  return hasLCP || hasFCP;
}

/**
 * Extract metrics from API response
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

  const cruxMetrics = response.loadingExperience?.metrics;
  const hasCruxData = cruxMetrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile !== undefined;

  const originMetrics = response.originLoadingExperience?.metrics;
  const hasOriginData = originMetrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile !== undefined;

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
        fallbackTriggered: useOriginLevelCrux,
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
    // Note: PageSpeed CrUX returns CLS percentile as a value already in 0-1 range
    // e.g., 0.05 means CLS of 0.05 (not needing division by 1000 like time metrics)
    const clsCrux = cruxSource.CUMULATIVE_LAYOUT_SHIFT_SCORE;
    if (clsCrux?.percentile !== undefined) {
      // CrUX CLS percentile is already in 0-x range (e.g., 5 = 0.05 CLS, needs /100)
      // But some API versions return it as 0.05 directly. We handle both:
      const rawCls = clsCrux.percentile;
      // CLS percentiles >= 1 are almost certainly scaled by 100 (e.g., 5 means 0.05)
      const clsValue = rawCls >= 1 ? rawCls / 100 : rawCls;
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

    // TTFB from CrUX
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

    // Performance score from lighthouse if available
    const score = response.lighthouseResult?.categories?.performance?.score;
    if (score !== undefined) {
      const scoreValue = Math.round(score * 100);
      // Performance score: higher is better. We use inverted thresholds:
      // good >= 90, needs-improvement >= 50, poor < 50
      // classifyMetric uses "<= good" → so we need to use a direct comparison
      const perfStatus: import('@/types').Status = scoreValue >= THRESHOLDS.performance_score.good
        ? 'good'
        : scoreValue >= THRESHOLDS.performance_score.warn
          ? 'needs-improvement'
          : 'poor';
      metrics.push({
        pageId,
        device,
        metricName: 'performance_score',
        value: scoreValue,
        unit: '',
        thresholdGood: THRESHOLDS.performance_score.good,
        thresholdWarn: THRESHOLDS.performance_score.warn,
        status: perfStatus,
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

  // LCP from Lab Data
  const lcp = audits['largest-contentful-paint']?.numericValue;
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

  // INP from Lab Data
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
    // Performance score: higher is better. Direct threshold comparison (not inverted)
    const perfStatus: import('@/types').Status = scoreValue >= THRESHOLDS.performance_score.good
      ? 'good'
      : scoreValue >= THRESHOLDS.performance_score.warn
        ? 'needs-improvement'
        : 'poor';
    metrics.push({
      pageId,
      device,
      metricName: 'performance_score',
      value: scoreValue,
      unit: '',
      thresholdGood: THRESHOLDS.performance_score.good,
      thresholdWarn: THRESHOLDS.performance_score.warn,
      status: perfStatus,
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

/**
 * Extract category scores from PageSpeed response
 */
function extractCategoryScores(
  response: PageSpeedResponse,
  pageId: string,
  device: Device,
  source: Source
): CategoryScore[] {
  const scores: CategoryScore[] = [];
  const capturedAt = new Date().toISOString();
  const categories = response.lighthouseResult?.categories;

  if (!categories) return scores;

  const categoryMap: { [key: string]: CategoryName } = {
    'performance': 'performance',
    'accessibility': 'accessibility',
    'best-practices': 'best-practices',
    'seo': 'seo'
  };

  Object.entries(categories).forEach(([key, category]) => {
    const categoryName = categoryMap[key];
    if (categoryName && category.score !== undefined) {
      scores.push({
        pageId,
        device,
        category: categoryName,
        score: Math.round(category.score * 100),
        source,
        capturedAt
      });
    }
  });

  return scores;
}

/**
 * Convert Lighthouse score to diagnostic status
 */
function scoreToStatus(
  score: number | null,
  scoreDisplayMode: string
): DiagnosticStatus {
  if (scoreDisplayMode === 'manual') return 'manual';
  if (scoreDisplayMode === 'not-applicable') return 'not-applicable';
  if (scoreDisplayMode === 'informative') return 'informative';
  if (score === null) return 'informative';

  // Lighthouse scoring: 0.9-1.0 = pass, 0.5-0.9 = warning, <0.5 = fail
  if (score >= 0.9) return 'pass';
  if (score >= 0.5) return 'warning';
  return 'fail';
}

/**
 * Get diagnostic group based on audit key and category
 */
function getDiagnosticGroup(auditKey: string, category: CategoryName): DiagnosticGroup {
  // Google PSI often uses '-insight' suffix for audits intended for the Insights section
  if (auditKey.endsWith('-insight')) {
    return 'insights';
  }

  switch (category) {
    case 'performance':
      // Check for common opportunity audits that should be insights
      if (['render-blocking-resources', 'unused-javascript', 'unused-css-rules', 'modern-image-formats', 'unminified-javascript', 'unminified-css'].includes(auditKey)) {
        return 'insights';
      }
      return PERFORMANCE_GROUPS[auditKey] || 'diagnostics';
    case 'accessibility':
      return ACCESSIBILITY_GROUPS[auditKey] || 'best-practices';
    case 'best-practices':
      return BEST_PRACTICES_GROUPS[auditKey] || 'general';
    case 'seo':
      return SEO_GROUPS[auditKey] || 'crawling-indexing';
    default:
      return 'passed';
  }
}

/**
 * Extract diagnostic items from PageSpeed response
 * Uses the Lighthouse category→auditRefs to correctly assign audits to categories.
 */
function extractDiagnostics(
  response: PageSpeedResponse,
  pageId: string,
  device: Device,
  source: Source
): DiagnosticItem[] {
  const diagnostics: DiagnosticItem[] = [];
  const capturedAt = new Date().toISOString();
  const audits = response.lighthouseResult?.audits;
  const categories = response.lighthouseResult?.categories;

  if (!audits) return diagnostics;

  // Use Lighthouse's own category→auditRef mapping when available (most accurate)
  // This prevents audits from appearing under wrong categories
  const categoryAudits: { [key in CategoryName]?: string[] } = {
    'performance': [],
    'accessibility': [],
    'best-practices': [],
    'seo': []
  };

  // TypeScript: extend PageSpeedCategory to include auditRefs
  type LighthouseCategory = {
    score: number;
    auditRefs?: Array<{ id: string; weight?: number; group?: string }>;
  };
  const lighthouseCategories = categories as unknown as Record<string, LighthouseCategory> | undefined;

  if (lighthouseCategories) {
    const categoryKeyMap: Record<string, CategoryName> = {
      'performance': 'performance',
      'accessibility': 'accessibility',
      'best-practices': 'best-practices',
      'seo': 'seo'
    };

    Object.entries(lighthouseCategories).forEach(([catKey, catData]) => {
      const catName = categoryKeyMap[catKey];
      if (!catName) return;

      if (catData.auditRefs && Array.isArray(catData.auditRefs)) {
        // Use official auditRefs from the Lighthouse result
        categoryAudits[catName] = catData.auditRefs
          .filter(ref => audits[ref.id]) // only include audits that exist
          .map(ref => ref.id);
      }
    });
  }

  // Fallback: if no category auditRefs available, use static key lists
  const hasCategories = Object.values(categoryAudits).some(arr => arr && arr.length > 0);
  if (!hasCategories) {
    // Performance-specific keys only (NOT all audits with scores)
    categoryAudits['performance'] = Object.keys(audits).filter(key =>
      [
        'first-contentful-paint', 'largest-contentful-paint', 'interactive',
        'speed-index', 'total-blocking-time', 'cumulative-layout-shift',
        'first-meaningful-paint', 'render-blocking-resources', 'unused-javascript',
        'unused-css-rules', 'modern-image-formats', 'efficiently-encode-images',
        'uses-optimized-images', 'uses-text-compression', 'uses-responsive-images',
        'unminified-javascript', 'unminified-css', 'server-response-time', 'redirects',
        'uses-http2', 'uses-long-cache-ttl', 'total-byte-weight', 'dom-size',
        'bootup-time', 'mainthread-work-breakdown', 'third-party-summary',
        'third-party-facades', 'user-timings', 'critical-request-chains',
        'resource-summary', 'largest-contentful-paint-element', 'layout-shift-elements',
        'long-tasks', 'screenshot-thumbnails', 'final-screenshot',
        'network-requests', 'network-rtt', 'network-server-latency', 'main-thread-tasks',
        'diagnostics', 'metrics', 'performance-budget', 'timing-budget'
      ].includes(key)
    );
    categoryAudits['accessibility'] = Object.keys(audits).filter(key =>
      key.includes('aria') || key.includes('label') ||
      ['button-name', 'document-title', 'frame-title', 'image-alt', 'input-image-alt',
        'link-name', 'object-alt', 'accesskeys', 'bypass', 'heading-order',
        'html-has-lang', 'html-lang-valid', 'list', 'listitem', 'audio-caption',
        'video-caption', 'video-description', 'logical-tab-order', 'focusable-controls',
        'interactive-element-affordance', 'managed-focus', 'focus-traps',
        'custom-controls-labels', 'custom-controls-roles', 'visual-order-follows-dom',
        'offscreen-content-hidden', 'use-landmarks', 'tabindex', 'skip-link',
        'meta-refresh', 'html-xml-lang-mismatch', 'link-in-text-block',
        'color-contrast', 'definition-list', 'dlitem', 'duplicate-id-active',
        'duplicate-id-aria', 'form-field-multiple-labels', 'identical-links-same-purpose',
        'image-redundant-alt', 'input-button-name', 'select-name', 'td-headers-attr',
        'th-has-data-cells'].includes(key)
    );
    categoryAudits['best-practices'] = Object.keys(audits).filter(key =>
      ['appcache-manifest', 'charset', 'doctype', 'errors-in-console',
        'geolocation-on-start', 'image-aspect-ratio', 'image-size-responsive',
        'js-libraries', 'no-document-write', 'notification-on-start',
        'page-has-title-tag', 'password-inputs-can-be-pasted-into',
        'uses-http2', 'uses-passive-event-listeners', 'deprecations',
        'third-party-cookies', 'csp-xss', 'paste-preventing-inputs',
        'inspector-issues', 'valid-source-maps', 'no-unload-listeners'].includes(key)
    );
    categoryAudits['seo'] = Object.keys(audits).filter(key =>
      ['document-title', 'meta-description', 'http-status-code', 'link-text',
        'crawlable-anchors', 'is-crawlable', 'robots-txt', 'google-fonts',
        'viewport', 'hreflang', 'canonical', 'structured-data',
        'tap-targets', 'font-size'].includes(key)
    );
  }


  Object.entries(categoryAudits).forEach(([category, auditKeys]) => {
    const catName = category as CategoryName;

    auditKeys?.forEach(auditKey => {
      const audit = audits[auditKey];
      if (!audit) return;

      const status = scoreToStatus(audit.score, audit.scoreDisplayMode);
      let group = getDiagnosticGroup(auditKey, catName);

      // Override group to 'passed' if the audit passed, matching PSI structure
      if (status === 'pass') {
        group = 'passed';
      }

      // Determine savings if available
      let savings: number | undefined;
      let savingsUnit: 'ms' | 'bytes' | undefined;

      if (audit.details?.overallSavingsMs) {
        savings = audit.details.overallSavingsMs;
        savingsUnit = 'ms';
      } else if (audit.details?.overallSavingsBytes) {
        savings = audit.details.overallSavingsBytes;
        savingsUnit = 'bytes';
      }

      diagnostics.push({
        id: generateId(),
        pageId,
        device,
        category: catName,
        group,
        auditKey,
        title: audit.title,
        description: audit.description,
        status,
        scoreDisplayMode: audit.scoreDisplayMode,
        score: audit.score !== null ? Math.round(audit.score * 100) : undefined,
        displayValue: audit.displayValue,
        details: audit.details ? JSON.stringify(audit.details) : undefined,
        recommendation: undefined, // Will be enriched later if needed
        whyItMatters: undefined, // Will be enriched later if needed
        numericValue: audit.numericValue,
        numericUnit: audit.numericUnit,
        savings,
        savingsUnit,
        warnings: audit.warnings,
        sources: Array.isArray(audit.details?.items) ? audit.details.items.map((item: Record<string, unknown>) => {
          const node = item.node as Record<string, string> | undefined;
          const url = item.url as string | undefined;
          return {
            type: String(node?.nodeLabel || node?.type || url || 'other'),
            url: url,
            label: node?.selector || (item.label as string) || undefined,
            value: (item.totalBytes as number | string | undefined) ||
              (item.wastedBytes as number | string | undefined) ||
              (item.wastedMs as number | string | undefined)
          };
        }) : undefined,
        source,
        capturedAt
      });
    });
  });

  return diagnostics;
}

/**
 * Generate CWV Assessment for a page/device
 */
function generateCWVAssessment(
  metrics: MetricResult[],
  pageId: string,
  device: Device,
  source: Source,
  fallbackTriggered: boolean,
  fallbackReason?: string
): CWVAssessment {
  const capturedAt = new Date().toISOString();

  const lcpMetric = metrics.find(m => m.metricName === 'LCP');
  const inpMetric = metrics.find(m => m.metricName === 'INP');
  const clsMetric = metrics.find(m => m.metricName === 'CLS');
  const fcpMetric = metrics.find(m => m.metricName === 'FCP');
  const ttfbMetric = metrics.find(m => m.metricName === 'TTFB');

  // Check if we have the three Core Web Vitals
  const hasLCP = lcpMetric !== undefined;
  const hasINP = inpMetric !== undefined;
  const hasCLS = clsMetric !== undefined;

  // Determine if passed (all three CWV must be 'good')
  const lcpGood = lcpMetric?.status === 'good';
  const inpGood = inpMetric?.status === 'good';
  const clsGood = clsMetric?.status === 'good';

  const passed = hasLCP && hasINP && hasCLS && lcpGood && inpGood && clsGood;

  let status: CWVAssessment['status'] = passed ? 'passed' : 'failed';
  if (!hasLCP && !hasINP && !hasCLS) {
    status = 'not-available';
  }

  // Generate interpretation
  let interpretation = '';
  if (status === 'passed') {
    interpretation = `This page passes Core Web Vitals assessment on ${device}. All three metrics (LCP, INP, CLS) are in the "good" range.`;
  } else if (status === 'not-available') {
    interpretation = `Core Web Vitals data is not available for this page on ${device}. This may be due to insufficient real-user data.`;
  } else {
    const issues: string[] = [];
    if (hasLCP && !lcpGood) issues.push(`LCP is ${lcpMetric.status}`);
    if (hasINP && !inpGood) issues.push(`INP is ${inpMetric.status}`);
    if (hasCLS && !clsGood) issues.push(`CLS is ${clsMetric.status}`);
    interpretation = `This page fails Core Web Vitals assessment on ${device} because ${issues.join(', ')}.`;
  }

  return {
    pageId,
    device,
    passed,
    status,
    lcp: lcpMetric ? {
      value: lcpMetric.value,
      displayValue: formatMetricValue(lcpMetric.value, 'LCP'),
      status: lcpMetric.status
    } : undefined,
    inp: inpMetric ? {
      value: inpMetric.value,
      displayValue: formatMetricValue(inpMetric.value, 'INP'),
      status: inpMetric.status
    } : undefined,
    cls: clsMetric ? {
      value: clsMetric.value,
      displayValue: formatMetricValue(clsMetric.value, 'CLS'),
      status: clsMetric.status
    } : undefined,
    fcp: fcpMetric ? {
      value: fcpMetric.value,
      displayValue: formatMetricValue(fcpMetric.value, 'FCP'),
      status: fcpMetric.status
    } : undefined,
    ttfb: ttfbMetric ? {
      value: ttfbMetric.value,
      displayValue: formatMetricValue(ttfbMetric.value, 'TTFB'),
      status: ttfbMetric.status
    } : undefined,
    interpretation,
    source,
    fallbackTriggered,
    fallbackReason,
    capturedAt
  };
}

// Helper function for formatting metric values
function formatMetricValue(value: number, metricName: MetricName): string {
  const threshold = THRESHOLDS[metricName];
  if (!threshold) return String(value);

  if (threshold.unit === 'ms') {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)} s`;
    }
    return `${Math.round(value)} ms`;
  }

  if (metricName === 'CLS') {
    return value.toFixed(3);
  }

  return String(Math.round(value));
}

async function auditPageDevice(
  url: string,
  device: Device,
  pageId: string
): Promise<{
  metrics: MetricResult[];
  categoryScores: CategoryScore[];
  diagnostics: DiagnosticItem[];
  cwvAssessment: CWVAssessment | null;
}> {
  try {
    // Try PageSpeed first
    const psResult = await fetchPageSpeed(url, device);

    if (isComplete(psResult)) {
      const hasUrlLevelCrux = psResult.loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile !== undefined;
      const hasOriginLevelCrux = psResult.originLoadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile !== undefined;
      const hasCrux = hasUrlLevelCrux || hasOriginLevelCrux;

      const metrics = extractMetrics(
        psResult,
        pageId,
        device,
        'pagespeed',
        !hasUrlLevelCrux && hasOriginLevelCrux,
        hasCrux ? undefined : 'No CrUX field data available for this URL'
      );

      const categoryScores = extractCategoryScores(psResult, pageId, device, 'pagespeed');
      const diagnostics = extractDiagnostics(psResult, pageId, device, 'pagespeed');

      const cwvAssessment = generateCWVAssessment(
        metrics,
        pageId,
        device,
        'pagespeed',
        !hasUrlLevelCrux && hasOriginLevelCrux,
        hasCrux ? undefined : 'No CrUX field data available for this URL'
      );

      return {
        metrics,
        categoryScores,
        diagnostics,
        cwvAssessment
      };
    }

    // Try to extract lab data anyway
    console.log(`[AuditPageDevice] No CrUX data for ${url}, attempting lab data extraction`);
    const metrics = extractMetrics(
      psResult,
      pageId,
      device,
      'pagespeed',
      true,
      'No CrUX data available, using Lighthouse Lab Data from PageSpeed'
    );

    if (metrics.length > 0) {
      const categoryScores = extractCategoryScores(psResult, pageId, device, 'pagespeed');
      const diagnostics = extractDiagnostics(psResult, pageId, device, 'pagespeed');
      const cwvAssessment = generateCWVAssessment(
        metrics,
        pageId,
        device,
        'pagespeed',
        true,
        'No CrUX data available, using Lighthouse Lab Data from PageSpeed'
      );

      return {
        metrics,
        categoryScores,
        diagnostics,
        cwvAssessment
      };
    }

    throw new Error('No usable data from PageSpeed');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    if (errorMsg !== 'No usable data from PageSpeed') {
      console.log(`[AuditPageDevice] PageSpeed incomplete for ${url} (${device}), attempting fallback`);
    }

    // Try Lighthouse CLI fallback
    try {
      const lhResult = await runLighthouse(url, device);
      const metrics = extractMetrics(lhResult, pageId, device, 'lighthouse', true, 'PageSpeed API failed');
      const categoryScores = extractCategoryScores(lhResult, pageId, device, 'lighthouse');
      const diagnostics = extractDiagnostics(lhResult, pageId, device, 'lighthouse');
      const cwvAssessment = generateCWVAssessment(
        metrics,
        pageId,
        device,
        'lighthouse',
        true,
        'PageSpeed API failed'
      );

      return {
        metrics,
        categoryScores,
        diagnostics,
        cwvAssessment
      };
    } catch (lhError) {
      const lhErrorMsg = lhError instanceof Error ? lhError.message : 'Unknown error';
      console.log(`[AuditPageDevice] Lighthouse fallback not available: ${lhErrorMsg}`);

      // Capture the original pagespeed error if we have it
      const originalErrorMsg = error instanceof Error ? error.message : 'Unknown PageSpeed error';

      // Return empty results with error indicators
      const capturedAt = new Date().toISOString();
      return {
        metrics: [{
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
          fallbackReason: `API Error: ${originalErrorMsg} (Lighthouse fallback also failed)`,
          reportUrl: url,
          capturedAt
        }],
        categoryScores: [],
        diagnostics: [],
        cwvAssessment: {
          pageId,
          device,
          passed: false,
          status: 'not-available',
          interpretation: `Data could not be retrieved. API Error: ${originalErrorMsg}`,
          source: 'pagespeed',
          fallbackTriggered: true,
          fallbackReason: `API Error: ${originalErrorMsg}`,
          capturedAt
        }
      };
    }
  }
}

export interface FullAuditResult {
  run: AuditRun;
  pages: AuditPage[];
  metrics: MetricResult[];
  categoryScores: CategoryScore[];
  diagnostics: DiagnosticItem[];
  cwvAssessments: CWVAssessment[];
}

export async function runAudit(
  formData: AuditFormData,
  onProgress?: ProgressCallback
): Promise<FullAuditResult> {
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
  const categoryScores: CategoryScore[] = [];
  const diagnostics: DiagnosticItem[] = [];
  const cwvAssessments: CWVAssessment[] = [];

  const total = pages.length * 2;
  let completed = 0;

  for (const page of pages) {
    onProgress?.({
      total,
      completed,
      currentPage: page.pageLabel,
      currentDevice: 'mobile'
    });

    // Fetch both devices in parallel
    const [mobileResult, desktopResult] = await Promise.all([
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

    // Collect metrics
    metrics.push(...mobileResult.metrics, ...desktopResult.metrics);

    // Collect category scores
    categoryScores.push(...mobileResult.categoryScores, ...desktopResult.categoryScores);

    // Collect diagnostics
    diagnostics.push(...mobileResult.diagnostics, ...desktopResult.diagnostics);

    // Collect CWV assessments
    if (mobileResult.cwvAssessment) cwvAssessments.push(mobileResult.cwvAssessment);
    if (desktopResult.cwvAssessment) cwvAssessments.push(desktopResult.cwvAssessment);

    onProgress?.({
      total,
      completed,
      currentPage: page.pageLabel
    });
  }

  return { run, pages, metrics, categoryScores, diagnostics, cwvAssessments };
}
