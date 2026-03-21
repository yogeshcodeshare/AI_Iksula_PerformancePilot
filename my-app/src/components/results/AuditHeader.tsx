'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, Package, Upload } from 'lucide-react';
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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-slate-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{run.projectName}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider">
                {run.environment}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {run.auditLabel} · {formatDate(run.generatedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {baselineProjectName && (
            <div className="flex items-center gap-2 mr-4 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-md">
              <span className="text-xs font-semibold text-blue-700">Comparing to: {baselineProjectName}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 text-blue-400 hover:text-blue-600 hover:bg-transparent"
                onClick={onClearBaseline}
              >
                <Upload className="h-3 w-3 rotate-180" />
              </Button>
            </div>
          )}
          
          <Button variant="outline" size="sm" className="hidden sm:flex text-slate-700" onClick={onOpenComparison}>
            <Upload className="h-4 w-4 mr-2" />
            Compare
          </Button>
          
          <Button variant="outline" size="sm" className="hidden md:flex text-slate-700" onClick={onDownloadJSON}>
            <FileText className="h-4 w-4 mr-2" />
            JSON
          </Button>
          
          <Button variant="outline" size="sm" className="hidden md:flex text-slate-700" onClick={onDownloadPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF Report
          </Button>
          
          <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={onDownloadPackage}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>
    </header>
  );
}
