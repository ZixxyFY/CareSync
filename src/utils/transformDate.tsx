// src/utils/transformDate.tsx
/**
 * @file transformDate.tsx
 * @description Pure utility functions for Date formatting and transformation.
 *
 * SOLID Principle: Single Responsibility — this file only handles date display
 * logic. No component rendering, no state management, no side effects.
 *
 * All functions accept a `Date` object (not a raw string) to enforce
 * type-safety at the call site — callers must parse before formatting.
 */

// ---------------------------------------------------------------------------
// PRIMARY FORMAT: "10 Jun 2026"
// ---------------------------------------------------------------------------

/**
 * Formats a Date into a human-readable short format used in appointment cards.
 *
 * @param {Date} date - The Date object to format.
 * @returns {string} e.g. "10 Jun 2026"
 *
 * @example
 * formatDate(new Date('2026-06-10')); // "10 Jun 2026"
 */
export const formatDate = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ---------------------------------------------------------------------------
// RELATIVE FORMAT: "Today", "Tomorrow", or "Mon, 10 Jun"
// ---------------------------------------------------------------------------

/**
 * Returns a user-friendly relative label for a given date.
 * Shows "Today", "Tomorrow", or a short weekday + date string.
 *
 * @param {Date} date - The Date object to format.
 * @returns {string} e.g. "Today", "Tomorrow", or "Mon, 10 Jun"
 *
 * @example
 * formatRelativeDate(new Date()); // "Today"
 */
export const formatRelativeDate = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid Date';

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const stripTime = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  if (stripTime(date) === stripTime(today)) return 'Today';
  if (stripTime(date) === stripTime(tomorrow)) return 'Tomorrow';

  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
};

// ---------------------------------------------------------------------------
// ISO STRING TO DATE — safe parser
// ---------------------------------------------------------------------------

/**
 * Safely parses an ISO date string into a Date object.
 * Returns `null` on failure instead of throwing, to make error handling explicit.
 *
 * @param {string} isoString - An ISO 8601 date string (e.g., "2026-06-10T09:00:00Z").
 * @returns {Date | null} A valid Date object, or null if parsing fails.
 *
 * @example
 * parseISO('2026-06-10T09:00:00Z'); // Date object
 * parseISO('not-a-date');           // null
 */
export const parseISO = (isoString: string): Date | null => {
  if (!isoString) return null;
  const d = new Date(isoString);
  return isNaN(d.getTime()) ? null : d;
};

// ---------------------------------------------------------------------------
// FULL TIMESTAMP FORMAT: "Mon, 10 Jun 2026 • 09:00 AM"
// ---------------------------------------------------------------------------

/**
 * Formats a Date into a full timestamp string for detail views.
 *
 * @param {Date} date - The Date object to format.
 * @returns {string} e.g. "Mon, 10 Jun 2026 • 09:00 AM"
 *
 * @example
 * formatTimestamp(new Date('2026-06-10T09:00:00')); // "Mon, 10 Jun 2026 • 09:00 AM"
 */
export const formatTimestamp = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid Date';
  const datePart = date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart} • ${timePart}`;
};

// ---------------------------------------------------------------------------
// JEST UNIT TEST SETUP — Run with: npx jest src/utils/transformDate.test.tsx
// ---------------------------------------------------------------------------
/*
 * === TEST FILE: src/utils/transformDate.test.tsx ===
 *
 * import { formatDate, formatRelativeDate, parseISO } from './transformDate';
 *
 * describe('formatDate', () => {
 *   it('formats a known date correctly', () => {
 *     // Note: Use UTC constructor to avoid timezone offset issues in CI
 *     const date = new Date(2026, 5, 10); // June 10, 2026
 *     expect(formatDate(date)).toMatch(/10 Jun 2026/);
 *   });
 *   it('returns "Invalid Date" for an invalid date', () => {
 *     expect(formatDate(new Date('invalid'))).toBe('Invalid Date');
 *   });
 * });
 *
 * describe('formatRelativeDate', () => {
 *   it('returns "Today" for today\'s date', () => {
 *     expect(formatRelativeDate(new Date())).toBe('Today');
 *   });
 *   it('returns "Tomorrow" for the next day', () => {
 *     const tomorrow = new Date();
 *     tomorrow.setDate(tomorrow.getDate() + 1);
 *     expect(formatRelativeDate(tomorrow)).toBe('Tomorrow');
 *   });
 * });
 *
 * describe('parseISO', () => {
 *   it('returns a Date for a valid ISO string', () => {
 *     expect(parseISO('2026-06-10T09:00:00Z')).toBeInstanceOf(Date);
 *   });
 *   it('returns null for an invalid string', () => {
 *     expect(parseISO('not-a-date')).toBeNull();
 *   });
 *   it('returns null for an empty string', () => {
 *     expect(parseISO('')).toBeNull();
 *   });
 * });
 */