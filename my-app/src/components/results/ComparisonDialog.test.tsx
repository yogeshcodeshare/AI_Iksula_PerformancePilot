import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComparisonDialog } from './ComparisonDialog';
import { getBaselineReportAsync } from '@/services/storage';
import { makeReport } from '../../../test/fixtures/reports';

const upload = (content: string, name = 'report.json') => {
  const input = screen.getByLabelText('Upload baseline JSON report') as HTMLInputElement;
  const file = new File([content], name, { type: 'application/json' });
  fireEvent.change(input, { target: { files: [file] } });
};

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });

describe('ComparisonDialog', () => {
  it('saves the baseline BEFORE telling the page it is loaded (race fix)', async () => {
    const onLoaded = vi.fn(async () => {
      // At the moment the page is told, the baseline must already be readable
      expect((await getBaselineReportAsync())?.auditRun.runId).toBe('BASE-1');
    });
    const onOpenChange = vi.fn();
    render(<ComparisonDialog open onOpenChange={onOpenChange} onBaselineLoaded={onLoaded} />);

    upload(JSON.stringify(makeReport('BASE-1', [{ url: 'https://web.dev/' }])));

    await waitFor(() => expect(onLoaded).toHaveBeenCalledTimes(1));
    await onLoaded.mock.results[0].value; // run the in-callback assertion
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a clear error for a file that is not a PerformancePilot report', async () => {
    const onLoaded = vi.fn();
    render(<ComparisonDialog open onOpenChange={vi.fn()} onBaselineLoaded={onLoaded} />);
    upload(JSON.stringify({ hello: 'world' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/not a PerformancePilot report/i);
    expect(onLoaded).not.toHaveBeenCalled();
  });

  it('shows an error for a report with no pages', async () => {
    render(<ComparisonDialog open onOpenChange={vi.fn()} onBaselineLoaded={vi.fn()} />);
    upload(JSON.stringify(makeReport('EMPTY', [])));
    expect(await screen.findByRole('alert')).toHaveTextContent(/nothing to compare/i);
  });

  it('shows an error for broken JSON', async () => {
    render(<ComparisonDialog open onOpenChange={vi.fn()} onBaselineLoaded={vi.fn()} />);
    upload('{ not json');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
