'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, Package, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { AuditRun } from '@/types';
import { formatDate } from '@/lib/utils';

interface AuditHeaderProps {
  run: AuditRun;
  onDownloadJSON: () => void;
  onDownloadPDF: () => void;
  onDownloadPackage: () => void;
  onOpenComparison: () => void;
  baselineProjectName?: string;
  onClearBaseline?: () => void;
}

export function AuditHeader({
  run,
  onDownloadJSON,
  onDownloadPDF,
  onDownloadPackage,
  onOpenComparison,
  baselineProjectName,
  onClearBaseline
}: AuditHeaderProps) {
  return (
    <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground tracking-tight">{run.projectName}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border uppercase tracking-wider">
                {run.environment}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {run.auditLabel} · {formatDate(run.generatedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {baselineProjectName && (
            <div className="flex items-center gap-1 mr-4 bg-primary/10 border border-primary/20 rounded-md">
              <Link href="/compare/" className="px-3 py-1.5 hover:bg-primary/15 rounded-l-md transition-colors">
                <span className="text-xs font-semibold text-primary">Comparing to: {baselineProjectName}</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary/60 hover:text-primary hover:bg-primary/15 rounded-r-md"
                onClick={onClearBaseline}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <Button variant="outline" size="sm" className="hidden sm:flex text-foreground" onClick={onOpenComparison}>
            <Upload className="h-4 w-4 mr-2" />
            Compare
          </Button>
          
          <Button variant="outline" size="sm" className="hidden md:flex text-foreground" onClick={onDownloadJSON}>
            <FileText className="h-4 w-4 mr-2" />
            JSON
          </Button>
          
          <Button variant="outline" size="sm" className="hidden md:flex text-foreground" onClick={onDownloadPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF Report
          </Button>
          
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onDownloadPackage}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>
    </header>
  );
}
