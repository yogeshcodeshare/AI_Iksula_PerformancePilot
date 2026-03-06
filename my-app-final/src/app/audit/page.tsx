'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageFormData, PageType } from '@/types';
import { PAGE_TYPES, ENVIRONMENTS } from '@/lib/constants';
import { Plus, Trash2, ArrowLeft, Play, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">New Audit</h1>
                <p className="text-sm text-slate-500">Configure your performance audit</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {errors.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Basic information about this audit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project / Site Name *</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Converse Australia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auditLabel">Audit Label *</Label>
                <Input
                  id="auditLabel"
                  value={auditLabel}
                  onChange={(e) => setAuditLabel(e.target.value)}
                  placeholder="e.g., Pre-Release Audit"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="environment">Environment *</Label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger>
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
                <Label htmlFor="deploymentTag">Deployment Tag (Optional)</Label>
                <Input
                  id="deploymentTag"
                  value={deploymentTag}
                  onChange={(e) => setDeploymentTag(e.target.value)}
                  placeholder="e.g., v2.1.0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pages */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pages to Audit</CardTitle>
                <CardDescription>Add all pages you want to test</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkAdd(!showBulkAdd)}
                >
                  Bulk Add
                </Button>
                <Button variant="outline" size="sm" onClick={addPage}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Page
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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

            <ScrollArea className="h-96">
              <div className="space-y-4">
                {pages.map((page, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-start p-4 bg-slate-50 rounded-lg"
                  >
                    <Badge variant="outline" className="mt-2">
                      {index + 1}
                    </Badge>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Page Label *</Label>
                        <Input
                          value={page.pageLabel}
                          onChange={(e) => updatePage(index, 'pageLabel', e.target.value)}
                          placeholder="e.g., Homepage"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Page Type</Label>
                        <Select
                          value={page.pageType}
                          onValueChange={(value) => updatePage(index, 'pageType', value)}
                        >
                          <SelectTrigger>
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
                      <div>
                        <Label className="text-xs">URL *</Label>
                        <Input
                          value={page.url}
                          onChange={(e) => updatePage(index, 'url', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-2"
                      onClick={() => removePage(index)}
                      disabled={pages.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Each page will be tested on both mobile and desktop.
                The audit uses PageSpeed Insights first, with Lighthouse as fallback.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleStartAudit} size="lg">
            <Play className="h-4 w-4 mr-2" />
            Start Audit
          </Button>
        </div>
      </main>
    </div>
  );
}
