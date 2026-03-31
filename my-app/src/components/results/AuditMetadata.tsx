'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Info, Clock, Globe, ShieldCheck } from 'lucide-react';
import { AuditRun } from '@/types';
import { formatDate } from '@/lib/utils';

interface AuditMetadataProps {
  run: AuditRun;
}

export function AuditMetadata({ run }: AuditMetadataProps) {
  return (
    <Card className="rounded-xl shadow-sm border-border mt-12 bg-secondary border-dashed">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-muted rounded-lg text-muted-foreground">
            <Info className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Audit Specification & Metadata</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Project Identifier</p>
            <p className="text-sm font-black text-foreground">{run.projectName}</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{run.runId}</p>
          </div>
          
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Environment</p>
            <div className="flex items-center gap-2 mt-1">
              <Globe className="h-3.5 w-3.5 text-foreground" />
              <span className="text-sm font-black text-foreground uppercase tracking-tight">{run.environment}</span>
            </div>
            {run.deploymentTag && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{run.deploymentTag}</p>
            )}
          </div>
          
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Timestamp</p>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-3.5 w-3.5 text-foreground" />
              <span className="text-sm font-black text-foreground tracking-tight">{formatDate(run.generatedAt)}</span>
            </div>
          </div>
          
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Schema Version</p>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
              <span className="text-sm font-black text-foreground uppercase tracking-tight">v{run.schemaVersion}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border border-dashed">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Methodology & Source Priority</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card p-3 rounded-lg border border-border shadow-sm">
              <p className="text-[10px] font-black text-foreground uppercase tracking-tighter mb-1">1. PSI Field Data (CrUX)</p>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">Real-user experience metrics collected over the last 28 days for the specific URL.</p>
            </div>
            <div className="bg-card p-3 rounded-lg border border-border shadow-sm">
              <p className="text-[10px] font-black text-foreground uppercase tracking-tighter mb-1">2. PSI Origin Data</p>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">Domain-level field data used when the specific URL has insufficient traffic for CrUX.</p>
            </div>
            <div className="bg-card p-3 rounded-lg border border-border shadow-sm">
              <p className="text-[10px] font-black text-foreground uppercase tracking-tighter mb-1">3. Lighthouse Lab Data</p>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">Simulated lab environment metrics provided by PSI as a deterministic fallback.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
