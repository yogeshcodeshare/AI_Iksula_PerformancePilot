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
import { Loader2, Upload, XCircle } from 'lucide-react';
import { ReportPackage } from '@/types';
import { importReportPackage, saveBaselineReportAsync } from '@/services/storage';

/** FileReader wrapped in a promise (same browser support as the original implementation). */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

interface ComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBaselineLoaded: (report: ReportPackage) => void;
}

export function ComparisonDialog({ open, onOpenChange, onBaselineLoaded }: ComparisonDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    // Reset so choosing the same file again still fires onChange
    input.value = '';
    if (!file) return;

    setError(null);

    let text: string;
    try {
      text = await readFileAsText(file);
    } catch {
      setError('Could not read the file. Please try again.');
      return;
    }

    const parsed = importReportPackage(text);
    if (!parsed) {
      setError('This is not a PerformancePilot report. Upload the JSON file exported from a Results page (JSON button).');
      return;
    }
    if (parsed.pages.length === 0 || parsed.metrics.length === 0) {
      setError('This report has no audited pages or metrics, so there is nothing to compare.');
      return;
    }

    setSaving(true);
    try {
      // Must be awaited: the Compare page reads the baseline from storage (see comparison-sop.md)
      await saveBaselineReportAsync(parsed);
    } catch {
      setError('The report could not be saved in this browser (storage may be full or blocked). Please try again.');
      return;
    } finally {
      setSaving(false);
    }

    onBaselineLoaded(parsed);
    onOpenChange(false);
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
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {saving
                  ? <Loader2 className="w-8 h-8 mb-3 text-muted-foreground animate-spin" />
                  : <Upload className="w-8 h-8 mb-3 text-muted-foreground" />}
                <p className="mb-2 text-sm text-muted-foreground">
                  {saving ? 'Saving baseline…' : <><span className="font-semibold">Click to upload</span> or drag and drop</>}
                </p>
                <p className="text-xs text-muted-foreground">JSON Audit Report</p>
              </div>
              <Input 
                type="file" 
                className="hidden" 
                accept=".json,application/json"
                aria-label="Upload baseline JSON report"
                disabled={saving}
                onChange={handleFileUpload}
              />
            </label>
          </div>
          
          {error && (
            <div role="alert" className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/30">
              <XCircle className="h-4 w-4" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
