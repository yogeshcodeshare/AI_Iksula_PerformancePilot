import { describe, it, expect } from 'vitest';
import { labelFromUrl, pageTypeFromUrl, mergeBulkUrls } from './pageForm';

describe('labelFromUrl', () => {
  it.each([
    ['https://www.converse.com.au/', 'converse.com.au'],
    ['https://www.nike.com/in/', 'nike.com/in'],
    ['https://shop.test/men/shoes', 'shop.test/men/shoes'],
    ['not a url', 'not a url'],
  ])('%s -> %s', (url, label) => expect(labelFromUrl(url)).toBe(label));
});

describe('pageTypeFromUrl', () => {
  it('root URL is a homepage', () => expect(pageTypeFromUrl('https://www.amazon.in/')).toBe('homepage'));
  it('search URLs are search pages', () => {
    expect(pageTypeFromUrl('https://shop.test/search?q=shoes')).toBe('search');
    expect(pageTypeFromUrl('https://shop.test/?q=shoes')).toBe('search');
  });
  it('anything else is custom', () => expect(pageTypeFromUrl('https://shop.test/p/123')).toBe('custom'));
});

describe('mergeBulkUrls (Bulk Add)', () => {
  it('gives every pasted URL a label, so the form can start without manual edits', () => {
    const rows = mergeBulkUrls([], 'https://www.converse.com.au/\n\n  https://www.amazon.in/  \r\nhttps://www.nike.com/in/');
    expect(rows.map(r => r.pageLabel)).toEqual(['converse.com.au', 'amazon.in', 'nike.com/in']);
    expect(rows.every(r => r.pageLabel.trim() !== '')).toBe(true);
  });

  it('replaces the empty placeholder row instead of leaving it behind', () => {
    const rows = mergeBulkUrls([{ pageLabel: 'Homepage', pageType: 'homepage', url: '' }], 'https://web.dev/');
    expect(rows).toHaveLength(1);
    expect(rows[0].url).toBe('https://web.dev/');
  });

  it('keeps rows the user already filled in', () => {
    const rows = mergeBulkUrls([{ pageLabel: 'Mine', pageType: 'pdp', url: 'https://a.test/p' }], 'https://b.test/');
    expect(rows.map(r => r.pageLabel)).toEqual(['Mine', 'b.test']);
  });
});
