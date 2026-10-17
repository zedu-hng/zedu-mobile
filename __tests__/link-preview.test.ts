/**
 * @format
 */

import { extractMessageUrls } from '../src/utils/link-preview';

describe('extractMessageUrls', () => {
  it('extracts a single link', () => {
    expect(extractMessageUrls('Visit https://example.com today')).toEqual([
      'https://example.com',
    ]);
  });

  it('keeps paths and query strings', () => {
    expect(
      extractMessageUrls('See https://example.com/path?q=1 for details'),
    ).toEqual(['https://example.com/path?q=1']);
  });

  it('strips a trailing period or comma', () => {
    expect(extractMessageUrls('Go to https://example.com.')).toEqual([
      'https://example.com',
    ]);
    expect(extractMessageUrls('See https://example.com, ok')).toEqual([
      'https://example.com',
    ]);
  });

  it('extracts a URL from an HTML anchor', () => {
    expect(
      extractMessageUrls(
        '<a href="https://example.com">https://example.com</a>',
      ),
    ).toEqual(['https://example.com']);
  });

  it('expands a bare domain to https', () => {
    expect(extractMessageUrls('go to example.com now')).toEqual([
      'https://example.com',
    ]);
  });

  it('dedupes repeated URLs', () => {
    expect(
      extractMessageUrls('https://example.com and https://example.com'),
    ).toEqual(['https://example.com']);
  });

  it('splits adjacent links with no separator', () => {
    expect(
      extractMessageUrls('https://www.airbnb.comhttps://www.tripadvisor.com'),
    ).toEqual(['https://www.airbnb.com', 'https://www.tripadvisor.com']);
  });

  it('splits markdown-glued links and dedupes each once', () => {
    expect(
      extractMessageUrls(
        'https://youtube.com](https://youtube.com)[https://linkedin.com](https://linkedin.com)',
      ),
    ).toEqual(['https://youtube.com', 'https://linkedin.com']);
  });

  it('deliberately splits an embedded protocol in the query string', () => {
    expect(extractMessageUrls('https://example.com?next=http://x')).toEqual([
      'https://example.com?next=',
      'http://x',
    ]);
  });
});
