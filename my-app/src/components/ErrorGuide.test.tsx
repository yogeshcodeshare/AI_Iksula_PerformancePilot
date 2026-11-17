import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorGuide } from './ErrorGuide';
import { ERROR_GUIDE, codesInRun, guideFor } from '@/lib/errorGuide';
import { RETRYABLE_ERROR_CODES } from '@/services/audit';

describe('error guide', () => {
  it('covers every error code the audit engine can produce, with meaning and action', () => {
    const codes = ['timeout', 'rate-limit', 'api-error', 'network', 'no-data', 'referer-blocked', 'permission-denied',
      'quota-exhausted', 'preflight-failed', 'page-unreachable', 'psi-page-error'];
    for (const c of codes) {
      expect(guideFor(c)?.meaning, c).toBeTruthy();
      expect(guideFor(c)?.action, c).toBeTruthy();
    }
  });

  it('"retry helps" matches what the engine actually retries', () => {
    for (const [code, g] of Object.entries(ERROR_GUIDE)) {
      expect(g.retryHelps, code).toBe(RETRYABLE_ERROR_CODES.has(code));
    }
  });

  it('lists each error type once, ignoring unknown and empty codes', () => {
    expect(codesInRun(['timeout', undefined, 'timeout', 'page-unreachable', 'bogus'])).toEqual(['timeout', 'page-unreachable']);
  });

  it('renders only the error types present in the run, with an anchor per type', () => {
    render(<ErrorGuide codes={['page-unreachable', 'timeout', 'timeout']} />);
    expect(screen.getByText('What these errors mean (2)')).toBeInTheDocument();
    expect(screen.getByText(/could not open this URL/)).toBeInTheDocument();
    expect(screen.queryByText(/testing limit/)).toBeNull();
    expect(document.getElementById('error-page-unreachable')).not.toBeNull();
  });

  it('renders nothing when there are no failures', () => {
    const { container } = render(<ErrorGuide codes={[undefined, undefined]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
