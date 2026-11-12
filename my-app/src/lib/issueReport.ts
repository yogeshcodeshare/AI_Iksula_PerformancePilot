import type { AuditPage, AuditRun } from '@/types';

export const ISSUE_REPO_URL = 'https://github.com/yogeshcodeshare/AI_Iksula_PerformancePilot';

export interface FailureRecord {
  pageId: string;
  pageLabel: string;
  device: string;
  errorCode: string;
  errorMessage: string;
}

/** Keep the prefilled URL well under browser / GitHub URL limits. */
const MAX_ROWS = 25;
const MAX_MSG = 160;

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();

/**
 * Build a prefilled "New issue" URL for audit failures. No token or server is
 * needed (the app is a static export): the user reviews the issue on GitHub
 * and decides whether to submit it. Nothing is sent automatically.
 */
export function buildFailureIssueUrl(
  run: Pick<AuditRun, 'runId' | 'projectName' | 'environment' | 'generatedAt'>,
  pages: Pick<AuditPage, 'pageId' | 'url'>[],
  failures: FailureRecord[],
  appVersion = '',
): string {
  const byCode = failures.reduce<Record<string, number>>((acc, f) => {
    acc[f.errorCode] = (acc[f.errorCode] ?? 0) + 1;
    return acc;
  }, {});
  const codes = Object.keys(byCode).sort();
  const title = `Audit failures: ${failures.length} page-device(s) [${codes.join(', ')}]`;

  const rows = failures.slice(0, MAX_ROWS).map(f => {
    const url = pages.find(p => p.pageId === f.pageId)?.url ?? '';
    const msg = f.errorMessage.length > MAX_MSG ? `${f.errorMessage.slice(0, MAX_MSG)}…` : f.errorMessage;
    return `| ${cell(url)} | ${f.device} | \`${f.errorCode}\` | ${cell(msg)} |`;
  });
  const more = failures.length > MAX_ROWS ? `\n_…and ${failures.length - MAX_ROWS} more._\n` : '';

  const body = [
    '## Audit failure report',
    '',
    `- **Run:** \`${run.runId}\``,
    `- **Project:** ${run.projectName} (${run.environment})`,
    `- **When:** ${run.generatedAt}`,
    appVersion ? `- **App version:** ${appVersion}` : '',
    `- **Summary:** ${codes.map(c => `${c} ×${byCode[c]}`).join(', ')}`,
    '',
    '| URL | Device | Error | Message |',
    '|---|---|---|---|',
    ...rows,
    more,
    '_Reported from the PerformancePilot progress page. Please review: this repository may be public._',
  ].filter(line => line !== '').join('\n');

  const params = new URLSearchParams({ title, body, labels: 'audit-failure' });
  return `${ISSUE_REPO_URL}/issues/new?${params.toString()}`;
}
