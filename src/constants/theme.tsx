// src/constants/theme.tsx
/**
 * @file theme.tsx
 * @description Centralized design token system for the CareSync application.
 * Follows the "Design Token" pattern — all visual values are sourced here,
 * ensuring consistent, maintainable theming across every screen and component.
 *
 * SOLID Principle: Open/Closed — screens and components consume these tokens.
 * Changing a color here updates the entire app without touching component logic.
 */

// ---------------------------------------------------------------------------
// COLOR PALETTE — Medical Blue Theme
// ---------------------------------------------------------------------------

export const COLORS = {
  /** Primary action color: trustworthy medical blue */
  primary: '#0EA5E9',
  /** Lighter variant for highlights and badges */
  secondary: '#38BDF8',
  /** Accent for success states and completed items */
  success: '#10B981',
  /** Accent for warning/pending states */
  warning: '#F59E0B',
  /** Accent for destructive/error actions */
  error: '#EF4444',
  /** App-wide background — subtle off-white */
  background: '#F0F7FF',
  /** Card and surface background */
  surface: '#FFFFFF',
  /** Primary text color */
  text: '#0F172A',
  /** Secondary/hint text color */
  textLight: '#64748B',
  /** Divider and border color */
  border: '#E2E8F0',
  /** Dark gradient start for hero sections */
  gradientStart: '#0C4A6E',
  /** Dark gradient end for hero sections */
  gradientEnd: '#0EA5E9',
  /** Overlay for modals and drawers */
  overlay: 'rgba(15, 23, 42, 0.55)',
};

// ---------------------------------------------------------------------------
// TYPOGRAPHY SCALE
// ---------------------------------------------------------------------------

export const FONTS = {
  /** Display / hero titles */
  display: 32,
  /** Large section headers */
  h1: 28,
  /** Screen titles */
  h2: 22,
  /** Card headings */
  h3: 18,
  /** Body text */
  body: 16,
  /** Small labels and captions */
  caption: 13,
  /** Micro labels / badge text */
  micro: 11,
};

// ---------------------------------------------------------------------------
// SPACING & SIZING
// ---------------------------------------------------------------------------

export const SIZES = {
  /** Standard horizontal/vertical screen padding */
  padding: 20,
  /** Standard card padding */
  cardPadding: 16,
  /** Small gap between elements */
  gap: 8,
  /** Standard border radius for cards and inputs */
  borderRadius: 12,
  /** Pill-shaped border radius */
  pill: 999,
  /** Icon button / avatar small size */
  iconButton: 40,
};

// ---------------------------------------------------------------------------
// ELEVATION / SHADOW PRESETS
// ---------------------------------------------------------------------------

export const SHADOWS = {
  card: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  button: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};