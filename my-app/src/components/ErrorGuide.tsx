'use client';

import { ERROR_GUIDE, codesInRun } from '@/lib/errorGuide';

/**
 * "What these errors mean" box on the progress page. Lists only the error types
 * present in this run, each with a one-line meaning and what to do.
 */
export function ErrorGuide({ codes }: { codes: Array<string | undefined> }) {
  const present = codesInRun(codes);
  if (present.length === 0) return null;
  return (
    <details open className="mt-6 rounded-2xl border border-border bg-card" aria-label="What these errors mean">
      <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-foreground">
        What these errors mean ({present.length})
      </summary>
      <ul className="px-5 pb-5 space-y-3 list-none m-0">
        {present.map(code => {
          const g = ERROR_GUIDE[code];
          return (
            <li key={code} id={`error-${code}`} className="text-sm">
              <span className="inline-block font-mono text-[11px] uppercase tracking-wider px-1.5 py-0.5 rounded mr-2"
                style={{ background: 'var(--red-bg)', color: 'var(--red-text)' }}>{g.label}</span>
              <span className="text-foreground">{g.meaning}</span>
              <div className="text-muted-foreground mt-1 ml-1">
                <strong className="font-medium">What to do:</strong> {g.action}
                {!g.retryHelps && <span className="ml-1">(Retry is skipped for this error.)</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
