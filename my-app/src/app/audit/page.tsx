'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageFormData, PageType } from '@/types';
import { PAGE_TYPES, ENVIRONMENTS } from '@/lib/constants';
import { Plus, Trash2, ArrowLeft, Play, AlertCircle, Upload } from 'lucide-react';
import Link from 'next/link';

export default function NewAudit() {
  const router = useRouter();
  const [projectName, setProjectName] = useState('');
  const [auditLabel, setAuditLabel] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [deploymentTag, setDeploymentTag] = useState('');
  const [pages, setPages] = useState<PageFormData[]>([
    { pageLabel: 'Homepage', pageType: 'homepage', url: '' }
  ]);
  const [bulkUrls, setBulkUrls] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const addPage = () => {
    setPages([...pages, { pageLabel: '', pageType: 'custom', url: '' }]);
  };

  const removePage = (index: number) => {
    setPages(pages.filter((_, i) => i !== index));
  };

  const updatePage = (index: number, field: keyof PageFormData, value: string) => {
    const newPages = [...pages];
    newPages[index] = { ...newPages[index], [field]: value };
    setPages(newPages);
  };

  const handleBulkAdd = () => {
    const urls = bulkUrls.split('\n').filter(url => url.trim());
    const newPages = urls.map(url => ({
      pageLabel: '',
      pageType: 'custom' as PageType,
      url: url.trim()
    }));
    setPages([...pages, ...newPages]);
    setBulkUrls('');
    setShowBulkAdd(false);
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!projectName.trim()) {
      newErrors.push('Project name is required');
    }
    if (!auditLabel.trim()) {
      newErrors.push('Audit label is required');
    }
    if (pages.length === 0) {
      newErrors.push('At least one page is required');
    }

    pages.forEach((page, i) => {
      if (!page.url.trim()) {
        newErrors.push(`Page ${i + 1}: URL is required`);
      } else if (!/^https?:\/\/.+/.test(page.url)) {
        newErrors.push(`Page ${i + 1}: URL must start with http:// or https://`);
      }
      if (!page.pageLabel.trim()) {
        newErrors.push(`Page ${i + 1}: Label is required`);
      }
    });

    // Check for duplicate URLs
    const urls = pages.map(p => p.url.trim());
    const duplicates = urls.filter((item, index) => urls.indexOf(item) !== index);
    if (duplicates.length > 0) {
      newErrors.push(`Duplicate URLs found: ${duplicates.join(', ')}`);
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleStartAudit = () => {
    if (!validate()) return;

    // Store form data in session storage for the progress page
    const formData = {
      projectName,
      auditLabel,
      environment,
      deploymentTag,
      pages
    };

    sessionStorage.setItem('audit-form-data', JSON.stringify(formData));
    router.push('/audit/progress');
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] pb-24">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 relative">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Audit Configuration</h1>
              <p className="text-slate-500 mt-2">Define your project parameters and target URLs for performance auditing.</p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Project Status: Active Configuration
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <Card className="mb-8 border-red-200 bg-red-50 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900">Please fix the following errors:</h3>
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Details */}
        <Card className="mb-8 rounded-xl shadow-sm border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Project Details</h2>
            </div>
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Metadata</span>
          </div>
          <CardContent className="pt-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-slate-700 font-medium">Project / Site Name <span className="text-red-500">*</span></Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., E-commerce Core"
                  className="bg-slate-50 border-slate-200 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auditLabel" className="text-slate-700 font-medium">Audit Label <span className="text-red-500">*</span></Label>
                <Input
                  id="auditLabel"
                  value={auditLabel}
                  onChange={(e) => setAuditLabel(e.target.value)}
                  placeholder="e.g., Q3 Performance Baseline"
                  className="bg-slate-50 border-slate-200 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="environment" className="text-slate-700 font-medium">Environment <span className="text-red-500">*</span></Label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENVIRONMENTS.map((env) => (
                      <SelectItem key={env.value} value={env.value}>
                        {env.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deploymentTag" className="text-slate-700 font-medium">Deployment Tag (Optional)</Label>
                <Input
                  id="deploymentTag"
                  value={deploymentTag}
                  onChange={(e) => setDeploymentTag(e.target.value)}
                  placeholder="e.g., v2.1.0-release"
                  className="bg-slate-50 border-slate-200 h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pages */}
        <Card className="mb-12 rounded-xl shadow-sm border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Pages to Audit</h2>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="text-slate-600 bg-white border-slate-200 h-9"
                onClick={() => setShowBulkAdd(!showBulkAdd)}
              >
                <Upload className="h-3.5 w-3.5 mr-2" />
                Bulk Add
              </Button>
              <Button size="sm" onClick={addPage} className="bg-slate-900 hover:bg-slate-800 text-white h-9">
                <Plus className="h-3.5 w-3.5 mr-2" />
                Add Page
              </Button>
            </div>
          </div>
          <CardContent className="pt-6 bg-white">
            {showBulkAdd && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <Label className="mb-2 block">Paste URLs (one per line)</Label>
                <Textarea
                  value={bulkUrls}
                  onChange={(e) => setBulkUrls(e.target.value)}
                  placeholder="https://example.com&#10;https://example.com/page1"
                  rows={4}
                  className="mb-3"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleBulkAdd}>Add URLs</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowBulkAdd(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {pages.map((page, index) => (
                <div
                  key={index}
                  className="flex gap-4 items-start p-4 bg-white border border-slate-200 rounded-xl shadow-sm transition-all"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-semibold text-sm mt-7">
                    {index + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-xs font-semibold text-slate-700 tracking-wide">Page Label</Label>
                      <Input
                        value={page.pageLabel}
                        onChange={(e) => updatePage(index, 'pageLabel', e.target.value)}
                        placeholder="e.g., Store Front"
                        className="h-10 border-slate-200"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-xs font-semibold text-slate-700 tracking-wide">Page Type</Label>
                      <Select
                        value={page.pageType}
                        onValueChange={(value) => updatePage(index, 'pageType', value)}
                      >
                        <SelectTrigger className="h-10 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-6 space-y-2">
                      <Label className="text-xs font-semibold text-slate-700 tracking-wide">URL</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        </div>
                        <Input
                          value={page.url}
                          onChange={(e) => updatePage(index, 'url', e.target.value)}
                          placeholder="https://..."
                          className="h-10 pl-9 border-slate-200 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-[34px] text-slate-400 hover:text-red-500 hover:bg-red-50 h-10 w-10 shrink-0"
                    onClick={() => removePage(index)}
                    disabled={pages.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#eff6ff] rounded-xl border border-blue-100 flex gap-3">
              <div className="mt-0.5 text-blue-500">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="text-sm text-blue-800">
                <strong className="font-semibold block mb-0.5 mt-[2px]">Configuration Note</strong>
                <span className="opacity-90">Each page will be audited for both Mobile and Desktop viewports. PerformancePilot attempts to use PageSpeed Insights API first for real-user data, falling back to Lighthouse for synthetic analysis if PSI is inaccessible.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="hidden sm:inline font-medium">
              {pages.length} page{pages.length !== 1 ? 's' : ''} configured &mdash; {pages.length * 2} audits queued (mobile + desktop)
            </span>
          </div>

          <div className="flex gap-4">
            <Link href="/">
              <Button variant="ghost" className="font-medium text-slate-600 pointer-events-auto h-12 px-6">Cancel</Button>
            </Link>
            <Button
              onClick={handleStartAudit}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium h-12 px-8 shadow-sm rounded-md"
            >
              <Play className="h-4 w-4 mr-2" fill="currentColor" />
              Start Performance Audit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
