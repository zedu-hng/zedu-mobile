/**
 * @format
 */

import { validateSignup } from '../src/utils/validation';

describe('validateSignup (organisation account)', () => {
  const validOrganisation = {
    accountType: 'Organization',
    orgName: 'Acme',
    email: 'user@example.com',
    password: 'secret1',
    country: 'Nigeria',
  };

  test('asks for an organisation name when it is missing', () => {
    expect(validateSignup({ ...validOrganisation, orgName: '  ' })).toBe(
      'Organisation name is required',
    );
  });

  test("asks for the organisation's country when it is missing", () => {
    expect(validateSignup({ ...validOrganisation, country: '' })).toBe(
      "Please select your organisation's country",
    );
  });

  test('accepts a complete organisation sign up', () => {
    expect(validateSignup(validOrganisation)).toBeNull();
  });
});
