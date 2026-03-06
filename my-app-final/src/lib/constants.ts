// Thresholds based on Core Web Vitals
export const THRESHOLDS = {
  LCP: {
    good: 2500,
    warn: 4000,
    unit: 'ms' as const,
    name: 'Largest Contentful Paint',
    description: 'Loading performance',
  },
  INP: {
    good: 200,
    warn: 500,
    unit: 'ms' as const,
    name: 'Interaction to Next Paint',
    description: 'Interactivity',
  },
  CLS: {
    good: 0.1,
    warn: 0.25,
    unit: '' as const,
    name: 'Cumulative Layout Shift',
    description: 'Visual stability',
  },
  FCP: {
    good: 1800,
    warn: 3000,
    unit: 'ms' as const,
    name: 'First Contentful Paint',
    description: 'First content appearance',
  },
  TTFB: {
    good: 800,
    warn: 1800,
    unit: 'ms' as const,
    name: 'Time to First Byte',
    description: 'Server response time',
  },
  performance_score: {
    good: 90,
    warn: 50,
    unit: '' as const,
    name: 'Performance Score',
    description: 'Overall performance score',
  },
} as const;

export const PAGE_TYPES = [
  { value: 'homepage', label: 'Homepage' },
  { value: 'category', label: 'Category Page' },
  { value: 'pdp', label: 'Product Detail Page (PDP)' },
  { value: 'plp', label: 'Product Listing Page (PLP)' },
  { value: 'search', label: 'Search Results' },
  { value: 'custom', label: 'Custom Page' },
] as const;

export const ENVIRONMENTS = [
  { value: 'production', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'development', label: 'Development' },
] as const;

export const APP_VERSION = '1.0.0';
export const SCHEMA_VERSION = '1.0.0';

export const STATUS_COLORS = {
  good: 'bg-green-500',
  'needs-improvement': 'bg-yellow-500',
  poor: 'bg-red-500',
} as const;

export const STATUS_LABELS = {
  good: 'Good',
  'needs-improvement': 'Needs Improvement',
  poor: 'Poor',
} as const;
