'use client';

/**
 * Recommendations mapping for known PageSpeed/Lighthouse diagnostic keys.
 * Used to enrich the automated results with human-readable guidance.
 */

export interface RecommendationInfo {
  recommendation: string;
  whyItMatters: string;
  suggestedOwner: 'frontend' | 'backend' | 'design' | 'devops' | 'content';
}

export const RECOMMENDATION_MAP: Record<string, RecommendationInfo> = {
  'unused-javascript': {
    recommendation: 'Use code-splitting and tree-shaking to remove unused JS.',
    whyItMatters: 'Large JS bundles block the main thread, delaying interactivity (INP).',
    suggestedOwner: 'frontend'
  },
  'unused-css-rules': {
    recommendation: 'Remove unused CSS and inline critical styles.',
    whyItMatters: 'Unused CSS increases blocking time and delays the first paint (FCP).',
    suggestedOwner: 'frontend'
  },
  'modern-image-formats': {
    recommendation: 'Serve images in WebP or AVIF formats.',
    whyItMatters: 'Modern formats are 30-50% smaller than JPEG/PNG without quality loss.',
    suggestedOwner: 'content'
  },
  'render-blocking-resources': {
    recommendation: 'Move non-critical JS/CSS to defer or async attributes.',
    whyItMatters: 'Eliminating render-blocking resources is the fastest way to improve LCP.',
    suggestedOwner: 'frontend'
  },
  'offscreen-images': {
    recommendation: 'Implement native lazy-loading for images below the fold.',
    whyItMatters: 'Lazy loading saves bandwidth and speeds up initial page load.',
    suggestedOwner: 'frontend'
  },
  'unminified-javascript': {
    recommendation: 'Minify JavaScript files to reduce payload size.',
    whyItMatters: 'Smaller files parse faster, reducing main thread workload.',
    suggestedOwner: 'devops'
  },
  'unminified-css': {
    recommendation: 'Minify CSS files to reduce network overhead.',
    whyItMatters: 'Every byte saved in critical CSS directly improves FCP.',
    suggestedOwner: 'devops'
  },
  'server-response-time': {
    recommendation: 'Optimize database queries and use Edge caching/CDNs.',
    whyItMatters: 'Server logic is the start of the waterfall; slow roots delay everything (TTFB).',
    suggestedOwner: 'backend'
  },
  'redirects': {
    recommendation: 'Avoid multiple redirects to reach the target URL.',
    whyItMatters: 'Each redirect adds network round-trips before the page can start loading.',
    suggestedOwner: 'backend'
  },
  'efficient-animated-content': {
    recommendation: 'Use MPEG4/WebM videos instead of heavy animated GIFs.',
    whyItMatters: 'GIFs are inefficient and heavy; video formats can be 80% smaller.',
    suggestedOwner: 'content'
  },
  'total-byte-weight': {
    recommendation: 'Reduce the total payload size (images, JS, CSS).',
    whyItMatters: 'Large payloads cause high network costs and slow load on mobile/3G.',
    suggestedOwner: 'content'
  },
  'uses-responsive-images': {
    recommendation: 'Use <picture> tags and srcset to serve sized images.',
    whyItMatters: 'Serving a 4000px image for a 400px mobile container is a major waste.',
    suggestedOwner: 'frontend'
  },
  'cumulative-layout-shift': {
    recommendation: 'Add width/height attributes to images and reserve space for ads.',
    whyItMatters: 'Layout shifts frustrate users and are a top priority for Google ranking.',
    suggestedOwner: 'frontend'
  },
  'font-display': {
    recommendation: 'Use "font-display: swap" to ensure text remains visible during load.',
    whyItMatters: 'Hidden text while fonts load creates a poor user experience.',
    suggestedOwner: 'frontend'
  },
  'legacy-javascript': {
    recommendation: 'Update build targets to avoid polyfills for modern browsers.',
    whyItMatters: 'Modern browsers shouldn\'t be penalized with heavy legacy polyfills.',
    suggestedOwner: 'devops'
  }
};

export function getRecommendation(key: string): RecommendationInfo | null {
  return RECOMMENDATION_MAP[key] || null;
}
