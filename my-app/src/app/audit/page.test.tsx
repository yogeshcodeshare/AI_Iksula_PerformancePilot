import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

import NewAudit from './page';

const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

function fillProject() {
  type(screen.getByPlaceholderText('e.g., E-commerce Core'), 'Demo');
  type(screen.getByPlaceholderText('e.g., Q3 Performance Baseline'), 'Run 1');
}

function bulkAdd(text: string) {
  fireEvent.click(screen.getByRole('button', { name: /Bulk Add/i }));
  type(screen.getByPlaceholderText(/example\.com\/page1/), text);
  fireEvent.click(screen.getByRole('button', { name: 'Add URLs' }));
}

const start = () => fireEvent.click(screen.getByRole('button', { name: /Start Performance Audit/i }));

beforeEach(() => { push.mockClear(); sessionStorage.clear(); });

describe('New Audit form', () => {
  it('Bulk Add fills labels so the audit starts without "Label is required" errors', () => {
    render(<NewAudit />);
    fillProject();
    bulkAdd('https://www.converse.com.au/\nhttps://www.amazon.in/');

    expect(screen.getAllByPlaceholderText('e.g., Homepage').map(i => (i as HTMLInputElement).value))
      .toEqual(['converse.com.au', 'amazon.in']); // empty placeholder row replaced

    start();
    expect(screen.queryByText(/Label is required/)).toBeNull();
    expect(push).toHaveBeenCalledWith('/audit/progress');
    const saved = JSON.parse(sessionStorage.getItem('audit-form-data')!);
    expect(saved.pages).toHaveLength(2);
  });

  it('treats https://site.com and https://site.com/ as duplicates', () => {
    render(<NewAudit />);
    fillProject();
    bulkAdd('https://web.dev\nhttps://web.dev/');
    start();
    expect(screen.getByText(/Duplicate URLs found/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('requires project name, audit label and a valid URL', () => {
    render(<NewAudit />);
    start();
    expect(screen.getByText('Project name is required')).toBeInTheDocument();
    expect(screen.getByText('Audit label is required')).toBeInTheDocument();
    expect(screen.getByText(/Page 1: URL is required/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
