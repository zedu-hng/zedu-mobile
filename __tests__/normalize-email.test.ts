import { normalizeEmail } from '@/utils/normalize-email';

describe('normalizeEmail', () => {
  it('lowercases capital letters', () => {
    expect(normalizeEmail('John.Doe@Example.COM')).toBe('john.doe@example.com');
  });

  it('trims leading and trailing spaces', () => {
    expect(normalizeEmail('  john@example.com  ')).toBe('john@example.com');
  });

  it('trims and lowercases together', () => {
    expect(normalizeEmail(' John@Example.com ')).toBe('john@example.com');
  });

  it('leaves an already clean email unchanged', () => {
    expect(normalizeEmail('john@example.com')).toBe('john@example.com');
  });
});
