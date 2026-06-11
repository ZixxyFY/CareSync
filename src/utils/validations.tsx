// src/utils/validations.tsx
/**
 * @file validations.tsx
 * @description Pure utility functions for input validation.
 *
 * SOLID Principle: Single Responsibility — this module ONLY handles validation
 * logic. No UI, no side effects, no API calls. This makes it trivially testable
 * and shareable across any screen or service.
 *
 * All functions are pure: same input → same output, no mutation of external state.
 */

// ---------------------------------------------------------------------------
// EMAIL VALIDATION
// ---------------------------------------------------------------------------

/**
 * Validates a string as a properly formatted email address.
 *
 * @param {string} email - The email string to validate.
 * @returns {boolean} `true` if the email matches the RFC-compatible pattern.
 *
 * @example
 * isValidEmail('user@domain.com'); // true
 * isValidEmail('not-an-email');    // false
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// ---------------------------------------------------------------------------
// PASSWORD VALIDATION
// ---------------------------------------------------------------------------

/**
 * Validates that a password meets the minimum security requirements.
 * Requirement: at least 6 characters.
 *
 * @param {string} password - The password string to validate.
 * @returns {boolean} `true` if the password meets minimum length.
 *
 * @example
 * isValidPassword('secret');   // true  (6 chars)
 * isValidPassword('abc');      // false (too short)
 */
export const isValidPassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
};

// ---------------------------------------------------------------------------
// NAME VALIDATION
// ---------------------------------------------------------------------------

/**
 * Validates a user's full name (non-empty, min 2 characters, letters/spaces only).
 *
 * @param {string} name - The name string to validate.
 * @returns {boolean} `true` if the name is valid.
 *
 * @example
 * isValidName('Neeraj Sahu'); // true
 * isValidName('A');           // false (too short)
 * isValidName('12345');       // false (no numbers)
 */
export const isValidName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  const nameRegex = /^[a-zA-Z\s'-]{2,}$/;
  return nameRegex.test(name.trim());
};

// ---------------------------------------------------------------------------
// DATE VALIDATION
// ---------------------------------------------------------------------------

/**
 * Checks that a given Date object is not in the past (compared to today's date).
 * Uses date-only comparison (ignores hours/minutes) to allow same-day booking.
 *
 * @param {Date} date - The date to check.
 * @returns {boolean} `true` if the date is today or in the future.
 *
 * @example
 * isFutureOrTodayDate(new Date());                    // true
 * isFutureOrTodayDate(new Date('2020-01-01'));        // false
 */
export const isFutureOrTodayDate = (date: Date): boolean => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0);
  return inputDate >= today;
};

// ---------------------------------------------------------------------------
// FIELD REQUIRED VALIDATION
// ---------------------------------------------------------------------------

/**
 * Checks that a string field is non-empty after trimming whitespace.
 *
 * @param {string} value - The value to check.
 * @returns {boolean} `true` if the field has meaningful content.
 *
 * @example
 * isRequired('Physiotherapy');  // true
 * isRequired('   ');            // false
 */
export const isRequired = (value: string): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

// ---------------------------------------------------------------------------
// JEST UNIT TEST SETUP — Run with: npx jest src/utils/validations.test.tsx
// ---------------------------------------------------------------------------
/*
 * === TEST FILE: src/utils/validations.test.tsx ===
 *
 * import {
 *   isValidEmail,
 *   isValidPassword,
 *   isValidName,
 *   isFutureOrTodayDate,
 *   isRequired,
 * } from './validations';
 *
 * describe('isValidEmail', () => {
 *   it('returns true for a valid email', () => {
 *     expect(isValidEmail('user@example.com')).toBe(true);
 *   });
 *   it('returns false for an email without domain', () => {
 *     expect(isValidEmail('userexample.com')).toBe(false);
 *   });
 *   it('returns false for an empty string', () => {
 *     expect(isValidEmail('')).toBe(false);
 *   });
 * });
 *
 * describe('isValidPassword', () => {
 *   it('returns true for password with 6+ chars', () => {
 *     expect(isValidPassword('secure1')).toBe(true);
 *   });
 *   it('returns false for password with 5 chars', () => {
 *     expect(isValidPassword('abc12')).toBe(false);
 *   });
 * });
 *
 * describe('isValidName', () => {
 *   it('returns true for a full name', () => {
 *     expect(isValidName('Neeraj Sahu')).toBe(true);
 *   });
 *   it('returns false for a single character', () => {
 *     expect(isValidName('A')).toBe(false);
 *   });
 *   it('returns false for numeric characters', () => {
 *     expect(isValidName('User123')).toBe(false);
 *   });
 * });
 *
 * describe('isFutureOrTodayDate', () => {
 *   it('returns true for today', () => {
 *     expect(isFutureOrTodayDate(new Date())).toBe(true);
 *   });
 *   it('returns true for a future date', () => {
 *     const future = new Date();
 *     future.setDate(future.getDate() + 7);
 *     expect(isFutureOrTodayDate(future)).toBe(true);
 *   });
 *   it('returns false for a past date', () => {
 *     expect(isFutureOrTodayDate(new Date('2020-01-01'))).toBe(false);
 *   });
 * });
 *
 * describe('isRequired', () => {
 *   it('returns true for a non-empty string', () => {
 *     expect(isRequired('hello')).toBe(true);
 *   });
 *   it('returns false for a whitespace-only string', () => {
 *     expect(isRequired('   ')).toBe(false);
 *   });
 * });
 */