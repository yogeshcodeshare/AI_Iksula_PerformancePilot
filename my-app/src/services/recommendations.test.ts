import { describe, it, expect } from 'vitest';
import { getRecommendation, RECOMMENDATION_MAP } from './recommendations';

describe('recommendations', () => {
  it('returns guidance for a known Lighthouse audit', () => {
    const r = getRecommendation('unused-javascript');
    expect(r?.suggestedOwner).toBe('frontend');
    expect(r?.recommendation).toMatch(/code-splitting/i);
  });

  it('returns null for an unknown audit (never invents advice)', () => {
    expect(getRecommendation('made-up-audit-id')).toBeNull();
  });

  it('every entry has text and a valid owner', () => {
    const owners = new Set(['frontend', 'backend', 'design', 'devops', 'content']);
    for (const [key, info] of Object.entries(RECOMMENDATION_MAP)) {
      expect(info.recommendation, key).toBeTruthy();
      expect(info.whyItMatters, key).toBeTruthy();
      expect(owners.has(info.suggestedOwner), key).toBe(true);
    }
  });
});
