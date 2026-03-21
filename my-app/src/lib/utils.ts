import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MetricName, Status } from "@/types";
import { THRESHOLDS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function classifyMetric(value: number, metric: MetricName): Status {
  const threshold = THRESHOLDS[metric];
  if (!threshold) return 'needs-improvement';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.warn) return 'needs-improvement';
  return 'poor';
}

/**
 * Canonical formatMetricValue — used everywhere in UI and export.
 * LCP, FCP, TTFB: show in seconds if >= 1000ms, otherwise milliseconds.
 * INP: always milliseconds.
 * CLS: 2 decimal places (unitless).
 * performance_score: integer (no unit suffix).
 */
export function formatMetricValue(value: number, metric: MetricName | string): string {
  if (metric === 'LCP' || metric === 'FCP' || metric === 'TTFB') {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)} s`;
    }
    return `${Math.round(value)} ms`;
  }

  if (metric === 'INP') {
    return `${Math.round(value)} ms`;
  }

  if (metric === 'CLS') {
    return value.toFixed(2);
  }

  if (metric === 'performance_score') {
    return `${Math.round(value)}`;
  }

  return String(Math.round(value));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateOverallHealth(metrics: { status: Status }[]): number {
  if (metrics.length === 0) return 0;

  const scores = {
    good: 100,
    'needs-improvement': 50,
    poor: 0,
  };

  const total = metrics.reduce((sum, m) => sum + scores[m.status], 0);
  return Math.round(total / metrics.length);
}

/**
 * Full CSS class string for badge / pill backgrounds (includes bg-* and text-* together).
 * Use only in Badge components and status chips — NOT in table cell text spans.
 */
export function getStatusColor(status: Status): string {
  const colors = {
    good: 'text-green-700 bg-green-50 border-green-200',
    'needs-improvement': 'text-amber-700 bg-amber-50 border-amber-200',
    poor: 'text-red-700 bg-red-50 border-red-200',
  };
  return colors[status] ?? 'text-slate-600 bg-slate-50 border-slate-200';
}

/**
 * Text-only color class — safe to use inside table cells, inline spans.
 * Does NOT include background or border.
 */
export function getStatusTextColor(status: Status): string {
  const colors = {
    good: 'text-green-700 font-semibold',
    'needs-improvement': 'text-amber-700 font-semibold',
    poor: 'text-red-700 font-semibold',
  };
  return colors[status] ?? 'text-slate-500';
}

export function getStatusBadgeVariant(status: Status): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'good':
      return 'default';
    case 'needs-improvement':
      return 'secondary';
    case 'poor':
      return 'destructive';
    default:
      return 'default';
  }
}
