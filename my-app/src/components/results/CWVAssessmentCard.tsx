'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CWVAssessment, Device, Source } from '@/types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Activity,
  Smartphone,
  Monitor,
  Info
} from 'lucide-react';
import { formatMetricValue, cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CWVAssessmentCardProps {
  assessment: CWVAssessment | null;
  pageLabel: string;
  device: Device;
  source: Source;
  fallbackTriggered: boolean;
  fallbackReason?: string;
}

export function CWVAssessmentCard({
  assessment,
  pageLabel,
  device,
  source,
  fallbackTriggered,
  fallbackReason
}: CWVAssessmentCardProps) {
  if (!assessment) {
    return (
      <Card className="rounded-xl shadow-sm border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-slate-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>No assessment data available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (assessment.status) {
      case 'passed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-slate-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (assessment.status) {
      case 'passed':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Passed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
            <XCircle className="w-3.5 h-3.5 mr-1" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Not Available
          </Badge>
        );
    }
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'needs-improvement':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'poor':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const DeviceIcon = device === 'mobile' ? Smartphone : Monitor;

  return (
    <Card className="rounded-xl shadow-sm border-slate-200 overflow-hidden">
      <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Core Web Vitals Assessment
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {pageLabel} · <DeviceIcon className="h-3 w-3 inline mr-0.5" /> {device === 'mobile' ? 'Mobile' : 'Desktop'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={fallbackTriggered ? "destructive" : "outline"}
                    className={cn(
                      "text-[10px] uppercase tracking-wider",
                      !fallbackTriggered && "border-blue-200 text-blue-700 bg-blue-50"
                    )}
                  >
                    {source === 'pagespeed' ? 'PageSpeed' : 'Lighthouse'}
                    {fallbackTriggered && ' FB'}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    {fallbackTriggered 
                      ? fallbackReason || 'Fallback was used for this assessment'
                      : 'Data from PageSpeed Insights API'
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Assessment Summary */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <p className="text-sm text-slate-700 leading-relaxed">
                {assessment.interpretation}
              </p>
              {fallbackTriggered && fallbackReason && (
                <p className="text-xs text-amber-600 mt-2 flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  {fallbackReason}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Metric Grid */}
        <div className="grid grid-cols-5 divide-x divide-slate-100">
          {/* LCP */}
          <MetricItem
            label="LCP"
            fullLabel="Largest Contentful Paint"
            value={assessment.lcp}
            metricName="LCP"
            getStatusColor={getMetricStatusColor}
          />
          
          {/* INP */}
          <MetricItem
            label="INP"
            fullLabel="Interaction to Next Paint"
            value={assessment.inp}
            metricName="INP"
            getStatusColor={getMetricStatusColor}
          />
          
          {/* CLS */}
          <MetricItem
            label="CLS"
            fullLabel="Cumulative Layout Shift"
            value={assessment.cls}
            metricName="CLS"
            getStatusColor={getMetricStatusColor}
          />
          
          {/* FCP */}
          <MetricItem
            label="FCP"
            fullLabel="First Contentful Paint"
            value={assessment.fcp}
            metricName="FCP"
            getStatusColor={getMetricStatusColor}
          />
          
          {/* TTFB */}
          <MetricItem
            label="TTFB"
            fullLabel="Time to First Byte"
            value={assessment.ttfb}
            metricName="TTFB"
            getStatusColor={getMetricStatusColor}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricItemProps {
  label: string;
  fullLabel: string;
  value?: { value: number; displayValue: string; status: string };
  metricName: string;
  getStatusColor: (status: string) => string;
}

function MetricItem({ label, fullLabel, value, metricName, getStatusColor }: MetricItemProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="p-4 text-center hover:bg-slate-50 transition-colors cursor-help">
            <p className="text-xs font-bold text-slate-400 mb-1">{label}</p>
            {value ? (
              <div className={cn(
                "inline-flex items-center px-2 py-1 rounded-full border text-sm font-bold",
                getStatusColor(value.status)
              )}>
                {value.displayValue}
              </div>
            ) : (
              <span className="text-sm text-slate-300">N/A</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="font-semibold">{fullLabel}</p>
          {value && (
            <p className="text-xs text-slate-500 capitalize mt-1">
              Status: {value.status.replace(/-/g, ' ')}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
