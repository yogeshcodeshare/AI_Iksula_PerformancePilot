'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { THRESHOLDS } from '@/lib/constants';

interface Settings {
  thresholds: typeof THRESHOLDS;
  apiKey: string;
  defaultEnvironment: string;
}

const METRIC_CONFIG: Record<string, { icon: string; bgVar: string; textVar: string; description: string }> = {
  LCP: {
    icon: 'clock',
    bgVar: 'var(--amber-bg)',
    textVar: 'var(--amber-text)',
    description: 'Time until the largest content element is visible'
  },
  INP: {
    icon: 'cursor',
    bgVar: 'var(--blue-bg)',
    textVar: 'var(--blue-text)',
    description: 'Latency of user interactions'
  },
  CLS: {
    icon: 'layout',
    bgVar: 'var(--purple-bg)',
    textVar: 'var(--purple-text)',
    description: 'Visual stability score (unitless)'
  },
  FCP: {
    icon: 'paint',
    bgVar: 'var(--green-bg)',
    textVar: 'var(--green-text)',
    description: 'Time until first content is rendered'
  },
  TTFB: {
    icon: 'server',
    bgVar: 'var(--background)',
    textVar: 'var(--muted-foreground)',
    description: 'Server response time'
  }
};

function MetricIcon({ metric, color }: { metric: string; color: string }) {
  const svgProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.5 };
  switch (metric) {
    case 'LCP': return <svg {...svgProps}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case 'INP': return <svg {...svgProps}><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>;
    case 'CLS': return <svg {...svgProps}><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg>;
    case 'FCP': return <svg {...svgProps}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>;
    case 'TTFB': return <svg {...svgProps}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
    default: return null;
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    thresholds: THRESHOLDS,
    apiKey: '',
    defaultEnvironment: 'production'
  });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'thresholds' | 'general' | 'appearance'>('thresholds');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('ai-performance-audit-settings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    const html = document.documentElement;
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('ai-performance-audit-theme', newTheme);
  };

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
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <main className="max-w-[768px] mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <Link href="/">
            <button className="p-1.5 rounded-lg border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="m15 18-6-6 6-6"/></svg>
            </button>
          </Link>
          <div>
            <h1 className="text-[26px] font-bold text-foreground tracking-[-0.03em]">Settings</h1>
            <p className="text-muted-foreground text-[15px] mt-0.5">Customize thresholds and preferences</p>
          </div>
        </div>

        {/* Saved Banner */}
        {saved && (
          <div className="mt-4 p-3 rounded-xl border flex items-center gap-2" style={{ background: 'var(--green-bg)', borderColor: 'color-mix(in srgb, var(--green-text) 15%, transparent)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span className="text-sm font-medium" style={{ color: 'var(--green-text)' }}>Settings saved successfully!</span>
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex gap-1 bg-background p-[3px] rounded-[10px] border border-border/50 w-fit mt-6 mb-8">
          <button
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border-none ${
              activeTab === 'thresholds'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => setActiveTab('thresholds')}
          >
            Thresholds
          </button>
          <button
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border-none ${
              activeTab === 'general'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border-none ${
              activeTab === 'appearance'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
        </div>

        {activeTab === 'thresholds' && (
          <div className="flex flex-col gap-5">
            {Object.entries(settings.thresholds).map(([key, config]) => {
              if (key === 'performance_score') return null;
              const metricKey = key.toUpperCase();
              const metricCfg = METRIC_CONFIG[metricKey] || METRIC_CONFIG['TTFB'];

              return (
                <div key={key} className="double-bezel">
                  <div className="double-bezel-inner">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: metricCfg.bgVar, border: metricKey === 'TTFB' ? '1px solid var(--border)' : 'none' }}>
                        <MetricIcon metric={metricKey} color={metricCfg.textVar} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{metricKey} &mdash; {config.name}</h3>
                        <p className="text-muted-foreground text-xs mt-0.5">{metricCfg.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="flex items-center gap-1.5 text-muted-foreground text-[12px] font-semibold uppercase tracking-[0.05em] mb-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--green-text)' }} />
                          Good threshold {config.unit === 'ms' ? '(ms)' : ''}
                        </label>
                        <Input
                          type="number"
                          step={config.unit === 'ms' ? 100 : 0.01}
                          value={config.good}
                          onChange={(e) => updateThreshold(key as keyof typeof THRESHOLDS, 'good', e.target.value)}
                          className="font-mono bg-card border-border"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-muted-foreground text-[12px] font-semibold uppercase tracking-[0.05em] mb-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--amber-text)' }} />
                          Warning threshold {config.unit === 'ms' ? '(ms)' : ''}
                        </label>
                        <Input
                          type="number"
                          step={config.unit === 'ms' ? 100 : 0.01}
                          value={config.warn}
                          onChange={(e) => updateThreshold(key as keyof typeof THRESHOLDS, 'warn', e.target.value)}
                          className="font-mono bg-card border-border"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'general' && (
          <div className="double-bezel">
            <div className="double-bezel-inner space-y-6">
              <div>
                <label className="block text-muted-foreground text-xs font-semibold uppercase tracking-[0.06em] mb-2">PageSpeed Insights API Key (Optional)</label>
                <Input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your Google API key"
                  className="bg-card border-border"
                />
                <p className="text-xs text-muted-foreground mt-2">If not provided, requests are rate-limited to ~1 per 100 seconds.</p>
              </div>
              <div>
                <label className="block text-muted-foreground text-xs font-semibold uppercase tracking-[0.06em] mb-2">Default Environment</label>
                <select
                  className="w-full h-10 px-3 text-sm bg-card border border-border rounded-lg text-foreground outline-none cursor-pointer font-[inherit] appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23787774' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  value={settings.defaultEnvironment}
                  onChange={(e) => setSettings(prev => ({ ...prev, defaultEnvironment: e.target.value }))}
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="double-bezel">
            <div className="double-bezel-inner space-y-6">
              <div>
                <label className="block text-muted-foreground text-xs font-semibold uppercase tracking-[0.06em] mb-4">Theme</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="w-full h-20 rounded-lg mb-3 border border-border overflow-hidden" style={{ background: '#F7F6F3' }}>
                      <div className="h-3 w-full" style={{ background: '#FFFFFF', borderBottom: '1px solid #DDDCD8' }} />
                      <div className="p-2 space-y-1.5">
                        <div className="h-1.5 w-3/4 rounded" style={{ background: '#DDDCD8' }} />
                        <div className="h-1.5 w-1/2 rounded" style={{ background: '#DDDCD8' }} />
                        <div className="flex gap-1">
                          <div className="h-3 w-6 rounded" style={{ background: '#EDF3EC' }} />
                          <div className="h-3 w-6 rounded" style={{ background: '#FBF3DB' }} />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">Light</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Warm canvas, clean contrast</p>
                    {theme === 'light' && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--green-bg)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="w-full h-20 rounded-lg mb-3 border border-border overflow-hidden" style={{ background: '#141518' }}>
                      <div className="h-3 w-full" style={{ background: '#1C1D22', borderBottom: '1px solid #2E2F36' }} />
                      <div className="p-2 space-y-1.5">
                        <div className="h-1.5 w-3/4 rounded" style={{ background: '#2E2F36' }} />
                        <div className="h-1.5 w-1/2 rounded" style={{ background: '#2E2F36' }} />
                        <div className="flex gap-1">
                          <div className="h-3 w-6 rounded" style={{ background: 'rgba(45,90,48,0.2)' }} />
                          <div className="h-3 w-6 rounded" style={{ background: 'rgba(245,158,11,0.16)' }} />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">Dark</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Dark slate, easy on the eyes</p>
                    {theme === 'dark' && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--green-bg)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 pb-10">
          <button
            className="px-4 py-2 text-[13px] font-medium border border-border rounded-[10px] bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            onClick={handleReset}
          >
            Reset Defaults
          </button>
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-[10px] hover:opacity-85 active:scale-[0.98] transition-all cursor-pointer border-none"
            onClick={handleSave}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Save Settings
          </button>
        </div>
      </main>
    </div>
  );
}
