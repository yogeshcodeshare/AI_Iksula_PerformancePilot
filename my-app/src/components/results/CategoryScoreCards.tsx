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
    ringColor: 'ring-blue-500'
  },
  accessibility: {
    label: 'Accessibility',
    icon: ShieldCheck,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    ringColor: 'ring-emerald-500'
  },
  'best-practices': {
    label: 'Best Practices',
    icon: CheckCircle2,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    ringColor: 'ring-indigo-500'
  },
  seo: {
    label: 'SEO',
    icon: Search,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    ringColor: 'ring-amber-500'
  }
};

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

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getDeltaIndicator = (current: number, baseline?: number) => {
    if (baseline === undefined) return null;
    const delta = current - baseline;
    
    if (Math.abs(delta) < 5) {
      return (
        <span className="flex items-center text-xs text-slate-400">
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
              className="rounded-xl border-slate-200 shadow-sm opacity-60"
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-black text-slate-300 mb-1">-</div>
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
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
              "rounded-xl border-slate-200 shadow-sm transition-all cursor-pointer",
              isActive && `ring-2 ${config.ringColor} ring-offset-2`,
              !isActive && "hover:bg-slate-50 hover:shadow-md"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center",
                  config.bgColor,
                  config.borderColor,
                  "border"
                )}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>
                {baseline !== undefined && getDeltaIndicator(score.score, baseline)}
              </div>
              
              <div className={cn(
                "text-3xl font-black mb-1",
                getScoreColor(score.score)
              )}>
                {score.score}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {config.label}
                </span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[9px] uppercase tracking-wider px-1 py-0",
                    score.source === 'pagespeed' 
                      ? "border-blue-200 text-blue-700 bg-blue-50"
                      : "border-amber-200 text-amber-700 bg-amber-50"
                  )}
                >
                  {score.source === 'pagespeed' ? 'PSI' : 'LH'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
