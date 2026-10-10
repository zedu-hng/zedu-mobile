/**
 * @format
 */

import { isValidEmail, validateSignup } from '@/utils/validation';

describe('isValidEmail', () => {
  it.each(['user@example.com', 'first.last@sub.domain.org'])(
    'accepts %s',
    email => {
      expect(isValidEmail(email)).toBe(true);
    },
  );

  it.each(['', 'abc', 'abc@', 'abc@domain', '@domain.com', 'a b@c.com'])(
    'rejects "%s"',
    email => {
      expect(isValidEmail(email)).toBe(false);
    },
  );

  it('rejects missing values', () => {
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});

describe('validateSignup email check', () => {
  const base = { accountType: 'Individual', password: 'secret123' };

  it('still rejects an invalid email with the same message', () => {
    expect(validateSignup({ ...base, email: 'abc' })).toBe(
      'Please enter a valid email address',
    );
  });

  it('still accepts a valid email', () => {
    expect(validateSignup({ ...base, email: 'user@example.com' })).toBeNull();
  });
});
