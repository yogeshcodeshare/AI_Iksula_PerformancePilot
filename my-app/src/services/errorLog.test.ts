import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { logFailures, toFailureRows, getGuestSession, MAX_ROWS_PER_CALL } from './errorLog';
import { __setSupabaseForTests } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

const ctx = {
  runId: '11111111-1111-4111-8111-111111111111',
  pages: [{ pageId: 'p1', url: 'https://shop.test/' }, { pageId: 'p2', url: 'https://no-such.test/' }],
  phase: 'run' as const,
};
const fail = (pageId: string, errorCode: string, errorMessage = 'boom', device = 'mobile') => ({ pageId, device, errorCode, errorMessage });

function fakeSupabase(result: { error: { message: string } | null } = { error: null }) {
  const insert = vi.fn().mockResolvedValue(result);
  const from = vi.fn(() => ({ insert }));
  __setSupabaseForTests({ from } as unknown as SupabaseClient);
  return { from, insert };
}

beforeEach(() => { localStorage.clear(); vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => { __setSupabaseForTests(undefined); vi.restoreAllMocks(); });

describe('toFailureRows', () => {
  it('maps failures to rows the database accepts', () => {
    const rows = toFailureRows([fail('p2', 'page-unreachable', 'net::ERR', 'desktop')], ctx, 'guest-123456');
    expect(rows).toEqual([{
      run_id: ctx.runId, url: 'https://no-such.test/', device: 'desktop', error_code: 'page-unreachable',
      message: 'net::ERR', phase: 'run', app_version: expect.any(String), guest_session: 'guest-123456',
    }]);
  });

  it('truncates long messages to 1000 chars and maps unknown codes to api-error', () => {
    const [row] = toFailureRows([fail('p1', 'weird-code', 'x'.repeat(5000))], ctx, 'guest-123456');
    expect(row.message).toHaveLength(1000);
    expect(row.error_code).toBe('api-error');
  });

  it('drops rows without a valid URL or device, and caps at 50 rows', () => {
    expect(toFailureRows([fail('missing', 'timeout'), fail('p1', 'timeout', 'm', 'tablet')], ctx, 'g-12345678')).toEqual([]);
    const many = Array.from({ length: 80 }, () => fail('p1', 'timeout'));
    expect(toFailureRows(many, ctx, 'g-12345678')).toHaveLength(MAX_ROWS_PER_CALL);
  });
});

describe('getGuestSession', () => {
  it('is stable for the same browser', () => {
    expect(getGuestSession()).toBe(getGuestSession());
  });
});

describe('logFailures', () => {
  it('is a no-op when Supabase is not configured (default)', async () => {
    __setSupabaseForTests(null);
    expect(await logFailures([fail('p1', 'timeout')], ctx)).toBe(0);
  });

  it('inserts rows into audit_failures', async () => {
    const { from, insert } = fakeSupabase();
    const n = await logFailures([fail('p1', 'timeout'), fail('p2', 'page-unreachable')], ctx);
    expect(n).toBe(2);
    expect(from).toHaveBeenCalledWith('audit_failures');
    expect(insert.mock.calls[0][0]).toHaveLength(2);
  });

  it('does nothing for an empty list', async () => {
    const { insert } = fakeSupabase();
    expect(await logFailures([], ctx)).toBe(0);
    expect(insert).not.toHaveBeenCalled();
  });

  it('never throws when the database rejects or the network fails', async () => {
    fakeSupabase({ error: { message: 'rate limit exceeded for this session' } });
    await expect(logFailures([fail('p1', 'timeout')], ctx)).resolves.toBe(0);

    __setSupabaseForTests({ from: () => { throw new Error('offline'); } } as unknown as SupabaseClient);
    await expect(logFailures([fail('p1', 'timeout')], ctx)).resolves.toBe(0);
  });
});
