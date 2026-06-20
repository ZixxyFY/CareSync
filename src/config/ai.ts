/**
 * @file ai.ts
 * @description AI / OCR configuration for CareSync.
 *
 * ──────────────────────────────────────────────────────
 * GEMINI API KEY SETUP:
 *  • This key is used with the Google Gemini Vision API for prescription OCR.
 *  • The current key has been provided by the user.
 *  • If you need a new key: https://ai.google.dev/ → "Get API key"
 * ──────────────────────────────────────────────────────
 **/

// User-provided Gemini API key
export const GEMINI_API_KEY = 'AQ.Ab8RN6LTFBUIS4EjblHEy4o_pGqdctHqijQrWT9lBIemcZIaXg';

// gemini-2.0-flash: faster and more accurate than 1.5-flash
export const GEMINI_MODEL = 'gemini-2.0-flash';

export const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Returns true when a Gemini API key has been configured.
 * Accepts any key of sufficient length that is not the dev placeholder.
 */
export const isGeminiConfigured = (): boolean =>
  GEMINI_API_KEY.trim().length > 20 &&
  !GEMINI_API_KEY.includes('PASTE_YOUR') &&
  GEMINI_API_KEY !== 'AQ.Ab8RN6LTFBUIS4EjblHEy4o_pGqdctHqijQrWT9lBIemcZIaXg';
