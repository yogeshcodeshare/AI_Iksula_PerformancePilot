'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, XCircle } from 'lucide-react';
import { ReportPackage } from '@/types';
import { saveBaselineReport } from '@/services/storage';

interface ComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBaselineLoaded: (report: ReportPackage) => void;
}

export function ComparisonDialog({ open, onOpenChange, onBaselineLoaded }: ComparisonDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        // Validate schema
        if (!parsed.auditRun || !parsed.pages || !parsed.metrics) {
          setError('Invalid report format. Missing required fields.');
          return;
        }

        // Ensure new fields exist for backward compatibility
        if (!parsed.categoryScores) parsed.categoryScores = [];
        if (!parsed.diagnostics) parsed.diagnostics = [];
        if (!parsed.cwvAssessments) parsed.cwvAssessments = [];

        saveBaselineReport(parsed);
        onBaselineLoaded(parsed);
        onOpenChange(false);
      } catch (err) {
        setError('Failed to parse JSON file. Please ensure it is a valid audit report.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compare Audits</DialogTitle>
          <DialogDescription>
            Upload a previously exported JSON report to compare with the current results.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-slate-400" />
                <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-slate-400">JSON Audit Report</p>
              </div>
              <Input 
                type="file" 
                className="hidden" 
                accept=".json"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
              <XCircle className="h-4 w-4" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
