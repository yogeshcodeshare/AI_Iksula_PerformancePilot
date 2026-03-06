'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { THRESHOLDS } from '@/lib/constants';

interface Settings {
  thresholds: typeof THRESHOLDS;
  apiKey: string;
  defaultEnvironment: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    thresholds: THRESHOLDS,
    apiKey: '',
    defaultEnvironment: 'production'
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const stored = localStorage.getItem('ai-performance-audit-settings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('ai-performance-audit-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      thresholds: THRESHOLDS,
      apiKey: '',
      defaultEnvironment: 'production'
    });
  };

  const updateThreshold = (metric: keyof typeof THRESHOLDS, type: 'good' | 'warn', value: string) => {
    setSettings(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [metric]: {
          ...prev.thresholds[metric],
          [type]: parseFloat(value)
        }
      }
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-sm text-slate-500">Configure thresholds and defaults</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {saved && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            Settings saved successfully!
          </div>
        )}

        <Tabs defaultValue="thresholds">
          <TabsList className="mb-6">
            <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <TabsContent value="thresholds">
            <Card>
              <CardHeader>
                <CardTitle>Core Web Vitals Thresholds</CardTitle>
                <CardDescription>
                  Customize the thresholds used to classify metrics as Good, Needs Improvement, or Poor.
                  Values are based on Google's Core Web Vitals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(settings.thresholds).map(([key, config]) => {
                    if (key === 'performance_score') return null;
                    
                    return (
                      <div key={key} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-slate-900">{config.name} ({key})</h3>
                            <p className="text-sm text-slate-500">{config.description}</p>
                          </div>
                          <span className="text-sm text-slate-400">Unit: {config.unit || 'none'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-green-600 text-sm">Good Threshold (≤)</Label>
                            <Input
                              type="number"
                              step={config.unit === 'ms' ? 100 : 0.01}
                              value={config.good}
                              onChange={(e) => updateThreshold(key as keyof typeof THRESHOLDS, 'good', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-yellow-600 text-sm">Warning Threshold (≤)</Label>
                            <Input
                              type="number"
                              step={config.unit === 'ms' ? 100 : 0.01}
                              value={config.warn}
                              onChange={(e) => updateThreshold(key as keyof typeof THRESHOLDS, 'warn', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure API keys and default values</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="apiKey">PageSpeed Insights API Key (Optional)</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter your Google API key"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    If not provided, simulated data will be used for demo purposes.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="defaultEnv">Default Environment</Label>
                  <select
                    id="defaultEnv"
                    className="w-full mt-1 p-2 border rounded-md"
                    value={settings.defaultEnvironment}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultEnvironment: e.target.value }))}
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </main>
    </div>
  );
}
