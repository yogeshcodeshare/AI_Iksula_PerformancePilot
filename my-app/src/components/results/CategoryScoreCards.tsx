'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CategoryScore, Device, Source } from '@/types';
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryScoreCardsProps {
  scores: CategoryScore[];
  device: Device;
  onCategoryClick?: (category: string) => void;
  activeCategory?: string;
  baselineScores?: CategoryScore[];
}

const categoryConfig = {
  performance: {
    label: 'Performance',
    icon: Zap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    ringColor: 'ring-blue-500',
    gaugeGradient: ['#3B82F6', '#2563EB'],
    glowColor: '#3B82F6'
  },
  accessibility: {
    label: 'Accessibility',
    icon: ShieldCheck,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    ringColor: 'ring-emerald-500',
    gaugeGradient: ['#10B981', '#059669'],
    glowColor: '#10B981'
  },
  'best-practices': {
    label: 'Best Practices',
    icon: CheckCircle2,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    ringColor: 'ring-indigo-500',
    gaugeGradient: ['#6366F1', '#4F46E5'],
    glowColor: '#6366F1'
  },
  seo: {
    label: 'SEO',
    icon: Search,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    ringColor: 'ring-amber-500',
    gaugeGradient: ['#F59E0B', '#D97706'],
    glowColor: '#F59E0B'
  }
};

function ScoreGauge({ score, gradientId, gradient, glowColor }: {
  score: number;
  gradientId: string;
  gradient: string[];
  glowColor: string;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (score / 100) * circumference;

  const scoreColor = score >= 90
    ? 'var(--color-chart-2)'
    : score >= 50
      ? glowColor
      : 'var(--color-destructive)';

  const gradColors = score >= 90
    ? ['#10B981', '#059669']
    : score < 50
      ? ['#EF4444', '#DC2626']
      : gradient;

  return (
    <svg viewBox="0 0 100 100" className="w-[100px] h-[100px] mx-auto">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradColors[0]} />
          <stop offset="100%" stopColor={gradColors[1]} />
        </linearGradient>
      </defs>
      {/* Track */}
      <circle
        cx="50" cy="50" r={radius}
        fill="none"
        strokeWidth="4"
        className="stroke-border"
      />
      {/* Glow */}
      <circle
        cx="50" cy="50" r={radius}
        fill="none"
        strokeWidth="8"
        stroke={score >= 90 ? '#10B981' : score < 50 ? '#EF4444' : glowColor}
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${circumference}`}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', opacity: 0.2, filter: 'blur(4px)' }}
      />
      {/* Arc */}
      <circle
        cx="50" cy="50" r={radius}
        fill="none"
        strokeWidth="5"
        stroke={`url(#${gradientId})`}
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${circumference}`}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      {/* Score */}
      <text
        x="50" y="47"
        textAnchor="middle"
        style={{ fontSize: '28px', fontWeight: 800, fill: scoreColor, fontFamily: 'var(--font-geist-mono), monospace', fontVariantNumeric: 'tabular-nums' }}
      >
        {score}
      </text>
      <text
        x="50" y="60"
        textAnchor="middle"
        className="fill-muted-foreground"
        style={{ fontSize: '9px', fontWeight: 500 }}
      >
        of 100
      </text>
    </svg>
  );
}

export function CategoryScoreCards({
  scores,
  device,
  onCategoryClick,
  activeCategory,
  baselineScores
}: CategoryScoreCardsProps) {
  const categories: Array<keyof typeof categoryConfig> = ['performance', 'accessibility', 'best-practices', 'seo'];

  const getScoreForCategory = (category: string): CategoryScore | undefined => {
    return scores.find(s => s.category === category && s.device === device);
  };

  const getBaselineScore = (category: string): number | undefined => {
    const baseline = baselineScores?.find(s => s.category === category && s.device === device);
    return baseline?.score;
  };

  const getDeltaIndicator = (current: number, baseline?: number) => {
    if (baseline === undefined) return null;
    const delta = current - baseline;

    if (Math.abs(delta) < 5) {
      return (
        <span className="flex items-center text-xs text-muted-foreground">
          <Minus className="h-3 w-3 mr-0.5" />
          {Math.abs(delta)}
        </span>
      );
    }

    if (delta > 0) {
      return (
        <span className="flex items-center text-xs text-green-600">
          <ArrowUpRight className="h-3 w-3 mr-0.5" />
          {delta}
        </span>
      );
    }

    return (
      <span className="flex items-center text-xs text-red-600">
        <ArrowDownRight className="h-3 w-3 mr-0.5" />
        {Math.abs(delta)}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map(category => {
        const score = getScoreForCategory(category);
        const config = categoryConfig[category];
        const Icon = config.icon;
        const baseline = getBaselineScore(category);
        const isActive = activeCategory === category;

        if (!score) {
          return (
            <Card
              key={category}
              className="rounded-xl border-border shadow-sm opacity-60"
            >
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-black text-muted-foreground/40 mb-1">-</div>
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Icon className="w-3.5 h-3.5" /> {config.label}
                </div>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card
            key={category}
            onClick={() => onCategoryClick?.(category)}
            className={cn(
              "rounded-xl border-border shadow-sm transition-all cursor-pointer overflow-hidden relative",
              isActive && `ring-2 ${config.ringColor} ring-offset-2 ring-offset-background`,
              !isActive && "hover:shadow-md hover:-translate-y-0.5"
            )}
          >
            <CardContent className="p-6 text-center">
              {/* Delta in top right */}
              {baseline !== undefined && (
                <div className="absolute top-3 right-3">
                  {getDeltaIndicator(score.score, baseline)}
                </div>
              )}

              {/* Circular gauge */}
              <ScoreGauge
                score={score.score}
                gradientId={`gauge-${category}`}
                gradient={config.gaugeGradient}
                glowColor={config.glowColor}
              />

              {/* Label */}
              <div className="text-sm font-semibold text-foreground mt-3">
                {config.label}
              </div>

              {/* Source badge */}
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] uppercase tracking-wider px-2 py-0.5 mt-2",
                  score.source === 'pagespeed'
                    ? "border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-950"
                    : "border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:bg-amber-950"
                )}
              >
                {score.source === 'pagespeed' ? 'PSI' : 'LH'}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
