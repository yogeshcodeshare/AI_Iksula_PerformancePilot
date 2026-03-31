'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageFormData, PageType } from '@/types';
import { PAGE_TYPES, ENVIRONMENTS } from '@/lib/constants';
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
    <div className="bg-background min-h-[calc(100vh-4rem)] pb-24">
      <main className="max-w-[896px] mx-auto px-6 py-10">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground no-underline mb-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="m15 18-6-6 6-6"/></svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-[30px] font-bold text-foreground tracking-[-0.03em]">New Audit Configuration</h1>
          <p className="text-muted-foreground mt-1.5 text-base">Define your project parameters and target URLs for performance auditing.</p>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-7 p-4 rounded-xl border flex gap-3" style={{ background: 'var(--red-bg)', borderColor: 'color-mix(in srgb, var(--red-text) 15%, transparent)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red-text)" strokeWidth={1.5} className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <h3 className="font-medium text-sm" style={{ color: 'var(--red-text)' }}>Please fix the following errors:</h3>
              <ul className="mt-1 text-sm space-y-0.5" style={{ color: 'var(--red-text)' }}>
                {errors.map((error, i) => <li key={i}>{error}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* Project Details — Double Bezel */}
        <div className="double-bezel mb-7">
          <div className="double-bezel-inner">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-muted-foreground"><path d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M7 7h10"/></svg>
              </div>
              <h2 className="text-[17px] font-bold text-foreground">Project Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-muted-foreground text-[13px] font-semibold uppercase tracking-[0.06em] mb-2">
                  Project Name <span style={{ color: 'var(--red-text)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., E-commerce Core"
                  className="w-full h-10 px-3 text-sm bg-card border border-border rounded-lg text-foreground outline-none font-[inherit] placeholder:text-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--foreground)_10%,transparent)] transition-all"
                />
              </div>
              <div>
                <label className="block text-muted-foreground text-[13px] font-semibold uppercase tracking-[0.06em] mb-2">
                  Audit Label <span style={{ color: 'var(--red-text)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={auditLabel}
                  onChange={(e) => setAuditLabel(e.target.value)}
                  placeholder="e.g., Q3 Performance Baseline"
                  className="w-full h-10 px-3 text-sm bg-card border border-border rounded-lg text-foreground outline-none font-[inherit] placeholder:text-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--foreground)_10%,transparent)] transition-all"
                />
              </div>
              <div>
                <label className="block text-muted-foreground text-[13px] font-semibold uppercase tracking-[0.06em] mb-2">
                  Environment <span style={{ color: 'var(--red-text)' }}>*</span>
                </label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger className="h-10 bg-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENVIRONMENTS.map((env) => (
                      <SelectItem key={env.value} value={env.value}>{env.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-muted-foreground text-[13px] font-semibold uppercase tracking-[0.06em] mb-2">Deployment Tag</label>
                <input
                  type="text"
                  value={deploymentTag}
                  onChange={(e) => setDeploymentTag(e.target.value)}
                  placeholder="e.g., v2.1.0-release"
                  className="w-full h-10 px-3 text-sm bg-card border border-border rounded-lg text-foreground outline-none font-[inherit] placeholder:text-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--foreground)_10%,transparent)] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pages to Audit — Double Bezel */}
        <div className="double-bezel mb-7">
          <div className="double-bezel-inner">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-muted-foreground"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </div>
                <h2 className="text-[17px] font-bold text-foreground">Pages to Audit</h2>
              </div>
              <div className="flex gap-2">
                <button
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-lg bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  onClick={() => setShowBulkAdd(!showBulkAdd)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Bulk Add
                </button>
                <button
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-85 transition-all cursor-pointer border-none"
                  onClick={addPage}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Page
                </button>
              </div>
            </div>

            {showBulkAdd && (
              <div className="mb-6 p-4 bg-background rounded-xl border border-border/50">
                <label className="block text-sm font-medium text-foreground mb-2">Paste URLs (one per line)</label>
                <Textarea
                  value={bulkUrls}
                  onChange={(e) => setBulkUrls(e.target.value)}
                  placeholder={"https://example.com\nhttps://example.com/page1"}
                  rows={4}
                  className="mb-3 bg-card"
                />
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg cursor-pointer border-none" onClick={handleBulkAdd}>Add URLs</button>
                  <button className="px-3 py-1.5 text-xs font-medium text-muted-foreground cursor-pointer border-none bg-transparent hover:text-foreground" onClick={() => setShowBulkAdd(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {pages.map((page, index) => (
                <div key={index} className="bg-background border border-border/50 rounded-[14px] p-5 transition-all hover:shadow-[var(--shadow-sm)] hover:border-border">
                  <div className="flex gap-4 items-start">
                    <div className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground mt-5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5">Page Label</label>
                          <input
                            type="text"
                            value={page.pageLabel}
                            onChange={(e) => updatePage(index, 'pageLabel', e.target.value)}
                            placeholder="e.g., Homepage"
                            className="w-full h-10 px-3 text-sm bg-card border border-border rounded-lg text-foreground outline-none font-[inherit] placeholder:text-muted-foreground focus:border-foreground transition-all"
                          />
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5">Page Type</label>
                            <Select value={page.pageType} onValueChange={(value) => updatePage(index, 'pageType', value)}>
                              <SelectTrigger className="h-10 bg-card border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PAGE_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <button
                            className="self-end mb-0.5 p-2 rounded-lg border-none bg-transparent cursor-pointer transition-colors text-muted-foreground/40 hover:text-[var(--red-text)] hover:bg-[var(--red-bg)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground/40"
                            onClick={() => removePage(index)}
                            disabled={pages.length === 1}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5">URL</label>
                        <div className="relative">
                          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--ring)' }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                          <input
                            type="url"
                            value={page.url}
                            onChange={(e) => updatePage(index, 'url', e.target.value)}
                            placeholder="https://example.com"
                            className="w-full h-10 pl-[34px] pr-3 text-[13px] font-mono bg-card border border-border rounded-lg text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Note */}
            <div className="mt-6 p-4 rounded-xl flex gap-3 border" style={{ background: 'var(--blue-bg)', borderColor: 'color-mix(in srgb, var(--blue-text) 15%, transparent)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue-text)" strokeWidth={1.5} className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--blue-text)' }}>
                Each page will be audited for both <strong>Mobile</strong> and <strong>Desktop</strong> viewports. PageSpeed Insights provides real-user field data when available, with Lighthouse lab data as fallback.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t border-border" style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}>
        <div className="max-w-[896px] mx-auto px-6 flex items-center justify-between h-16">
          <span className="text-muted-foreground text-sm">
            <strong className="text-foreground font-medium">{pages.length} page{pages.length !== 1 ? 's' : ''}</strong> configured &mdash; {pages.length * 2} audits queued (mobile + desktop)
          </span>
          <div className="flex gap-3">
            <Link href="/">
              <button className="px-4 py-2 text-[13px] font-medium border border-border rounded-[10px] bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">Cancel</button>
            </Link>
            <button
              onClick={handleStartAudit}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-[10px] hover:opacity-85 active:scale-[0.98] transition-all cursor-pointer border-none"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start Performance Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
