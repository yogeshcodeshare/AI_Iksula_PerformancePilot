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

export function formatMetricValue(value: number, metric: MetricName): string {
  const threshold = THRESHOLDS[metric];
  if (!threshold) return String(value);
  
  if (threshold.unit === 'ms') {
    if (value >= 1000) {
      // Use 1 decimal place for values > 1000 to match Google PageSpeed Web UI
      // e.g., "1.7 s" instead of "1.70 s" or "1705 ms"
      return `${(value / 1000).toFixed(1)} s`;
    }
    return `${Math.round(value)} ms`;
  }
  
  if (metric === 'CLS') {
    return value.toFixed(3);
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

export function getStatusColor(status: Status): string {
  const colors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    'needs-improvement': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    poor: 'text-red-600 bg-red-50 border-red-200',
  };
  return colors[status];
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
