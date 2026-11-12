import { describe, it, expect } from 'vitest';
import { buildFailureIssueUrl, ISSUE_REPO_URL } from './issueReport';

const run = { runId: 'run-1', projectName: 'Demo', environment: 'production', generatedAt: '2026-11-12T10:00:00Z' };
const pages = [{ pageId: 'p1', url: 'https://shop.test/' }, { pageId: 'p2', url: 'https://shop.test/pdp' }];
const parse = (u: string) => new URL(u).searchParams;

describe('buildFailureIssueUrl', () => {
  it('opens the project repo "new issue" form with title, label and a failure table', () => {
    const url = buildFailureIssueUrl(run, pages, [
      { pageId: 'p1', pageLabel: 'Home', device: 'mobile', errorCode: 'timeout', errorMessage: 'PSI did not respond' },
      { pageId: 'p2', pageLabel: 'PDP', device: 'desktop', errorCode: 'psi-page-error', errorMessage: 'NO_FCP | blocked' },
    ]);
    expect(url.startsWith(`${ISSUE_REPO_URL}/issues/new?`)).toBe(true);
    const q = parse(url);
    expect(q.get('title')).toBe('Audit failures: 2 page-device(s) [psi-page-error, timeout]');
    expect(q.get('labels')).toBe('audit-failure');
    const body = q.get('body')!;
    expect(body).toContain('`run-1`');
    expect(body).toContain('| https://shop.test/ | mobile | `timeout` |');
    expect(body).toContain('NO_FCP \\| blocked'); // pipes escaped so the table stays intact
  });

  it('caps very large failure lists to keep the URL short', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ pageId: 'p1', pageLabel: 'Home', device: 'mobile', errorCode: 'timeout', errorMessage: 'x'.repeat(500) }));
    const url = buildFailureIssueUrl(run, pages, many);
    expect(parse(url).get('body')).toContain('and 35 more');
    expect(url.length).toBeLessThan(8000);
  });
});
