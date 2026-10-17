/**
 * @format
 */

import { extractMessageUrls } from '../src/utils/link-preview';

const HTTPS = 'https://';
const HTTP = 'http://';
const link = (host: string) => HTTPS + host;

describe('extractMessageUrls', () => {
  it('extracts a single link', () => {
    expect(
      extractMessageUrls('Visit ' + link('example.com') + ' today'),
    ).toEqual([link('example.com')]);
  });

  it('keeps paths and query strings', () => {
    expect(
      extractMessageUrls(
        'See ' + link('example.com/path?q=1') + ' for details',
      ),
    ).toEqual([link('example.com/path?q=1')]);
  });

  it('strips a trailing period or comma', () => {
    expect(extractMessageUrls('Go to ' + link('example.com') + '.')).toEqual([
      link('example.com'),
    ]);
    expect(extractMessageUrls('See ' + link('example.com') + ', ok')).toEqual([
      link('example.com'),
    ]);
  });

  it('extracts a URL from an HTML anchor', () => {
    expect(
      extractMessageUrls(
        '<a href="' + link('example.com') + '">' + link('example.com') + '</a>',
      ),
    ).toEqual([link('example.com')]);
  });

  it('expands a bare domain to https', () => {
    expect(extractMessageUrls('go to example.com now')).toEqual([
      link('example.com'),
    ]);
  });

  it('dedupes repeated URLs', () => {
    expect(
      extractMessageUrls(link('example.com') + ' and ' + link('example.com')),
    ).toEqual([link('example.com')]);
  });

  it('splits adjacent links with no separator', () => {
    expect(
      extractMessageUrls(link('www.airbnb.com') + link('www.tripadvisor.com')),
    ).toEqual([link('www.airbnb.com'), link('www.tripadvisor.com')]);
  });

  it('splits markdown-glued links and dedupes each once', () => {
    expect(
      extractMessageUrls(
        link('youtube.com') +
          '](' +
          link('youtube.com') +
          ')[' +
          link('linkedin.com') +
          '](' +
          link('linkedin.com') +
          ')',
      ),
    ).toEqual([link('youtube.com'), link('linkedin.com')]);
  });

  it('deliberately splits an embedded protocol in the query string', () => {
    expect(extractMessageUrls(link('example.com?next=') + HTTP + 'x')).toEqual([
      link('example.com?next='),
      HTTP + 'x',
    ]);
  });
});
