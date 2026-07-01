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
// COLOR PALETTE — Premium Medical Blue Theme
// ---------------------------------------------------------------------------

export const COLORS = {
  primary: '#0EA5E9',
  primaryDark: '#0369A1',
  secondary: '#38BDF8',
  primaryTint: '#E0F2FE',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  background: '#F0F7FF',
  surface: '#FFFFFF',
  text: '#0F172A',
  textLight: '#64748B',
  border: '#E2E8F0',
  borderSoft: '#F1F5F9',
  gradientStart: '#0C4A6E',
  gradientMid: '#0369A1',
  gradientEnd: '#0EA5E9',
  overlay: 'rgba(15, 23, 42, 0.55)',
  glassWhite: 'rgba(255, 255, 255, 0.15)',

  glassDark: 'rgba(15, 23, 42, 0.08)',
};

// ---------------------------------------------------------------------------
// GRADIENT PRESETS (for use with View backgrounds and layering)
// ---------------------------------------------------------------------------

export const GRADIENT_COLORS = {
  hero: ['#0C4A6E', '#0369A1', '#0EA5E9'] as const,
  card: ['#0EA5E9', '#38BDF8'] as const,
  success: ['#059669', '#10B981'] as const,
  warm: ['#0369A1', '#0EA5E9', '#7DD3FC'] as const,
};

// ---------------------------------------------------------------------------
// TYPOGRAPHY SCALE
// ---------------------------------------------------------------------------

export const FONTS = {
  display: 32,
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  caption: 13,
  micro: 11,
};

// ---------------------------------------------------------------------------
// SPACING & SIZING
// ---------------------------------------------------------------------------

export const SIZES = {

  padding: 20,
  cardPadding: 16,
  gap: 8,
  borderRadius: 12,
  borderRadiusLg: 20,
  pill: 999,
  iconButton: 40,
};

// ---------------------------------------------------------------------------
// ELEVATION / SHADOW PRESETS
// ---------------------------------------------------------------------------

export const SHADOWS = {
  card: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardStrong: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  button: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  hero: {
    shadowColor: '#0C4A6E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
};