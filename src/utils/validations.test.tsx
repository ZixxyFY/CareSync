// src/utils/validations.test.tsx
/**
 * @file validations.test.tsx
 * @description Unit tests for the validations utility functions.
 *
 * Run with: npx jest src/utils/validations.test.tsx
 * Run with coverage: npx jest src/utils/validations.test.tsx --coverage
 *
 * All functions under test are PURE — no mocking is required.
 * Tests follow the AAA pattern: Arrange → Act → Assert.
 */

import {
  isValidEmail,
  isValidPassword,
  isValidName,
  isFutureOrTodayDate,
  isRequired,
} from './validations';

// ---------------------------------------------------------------------------
// isValidEmail
// ---------------------------------------------------------------------------

describe('isValidEmail', () => {
  it('returns true for a standard valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('returns true for an email with a subdomain', () => {
    expect(isValidEmail('admin@mail.caresync.health')).toBe(true);
  });

  it('returns false for an email missing the @ symbol', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('returns false for an email missing the domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('returns false for an email with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  it('returns false for a non-string value', () => {
    // @ts-expect-error — testing runtime robustness
    expect(isValidEmail(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidPassword
// ---------------------------------------------------------------------------

describe('isValidPassword', () => {
  it('returns true for a password with exactly 6 characters', () => {
    expect(isValidPassword('abc123')).toBe(true);
  });

  it('returns true for a password longer than 6 characters', () => {
    expect(isValidPassword('secureP@ssword!')).toBe(true);
  });

  it('returns false for a password with 5 characters', () => {
    expect(isValidPassword('abc12')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidPassword('')).toBe(false);
  });

  it('returns false for a null value', () => {
    // @ts-expect-error — runtime robustness
    expect(isValidPassword(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidName
// ---------------------------------------------------------------------------

describe('isValidName', () => {
  it('returns true for a full name with two words', () => {
    expect(isValidName('Neeraj Sahu')).toBe(true);
  });

  it('returns true for a name with a hyphen', () => {
    expect(isValidName('Mary-Jane Watson')).toBe(true);
  });

  it('returns true for a name with an apostrophe', () => {
    expect(isValidName("O'Brien")).toBe(true);
  });

  it('returns false for a single character', () => {
    expect(isValidName('A')).toBe(false);
  });

  it('returns false for a name containing numbers', () => {
    expect(isValidName('User123')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidName('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isFutureOrTodayDate
// ---------------------------------------------------------------------------

describe('isFutureOrTodayDate', () => {
  it('returns true for today', () => {
    expect(isFutureOrTodayDate(new Date())).toBe(true);
  });

  it('returns true for a date 7 days from now', () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    expect(isFutureOrTodayDate(future)).toBe(true);
  });

  it('returns false for a date 1 day in the past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isFutureOrTodayDate(yesterday)).toBe(false);
  });

  it('returns false for a well-known past date', () => {
    expect(isFutureOrTodayDate(new Date('2020-01-01'))).toBe(false);
  });

  it('returns false for an invalid Date object', () => {
    expect(isFutureOrTodayDate(new Date('not-a-date'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isRequired
// ---------------------------------------------------------------------------

describe('isRequired', () => {
  it('returns true for a non-empty string', () => {
    expect(isRequired('Physiotherapy Session')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isRequired('')).toBe(false);
  });

  it('returns false for a whitespace-only string', () => {
    expect(isRequired('   ')).toBe(false);
  });

  it('returns false for a tab-only string', () => {
    expect(isRequired('\t\t')).toBe(false);
  });

  it('returns false for a newline-only string', () => {
    expect(isRequired('\n')).toBe(false);
  });
});
