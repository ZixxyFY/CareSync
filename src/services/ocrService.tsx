// src/services/ocrService.tsx
/**
 * @file ocrService.tsx
 * @description OCR service for CareSync — uses Google Gemini Vision API to extract
 * structured medication data from real prescription images.
 *
 * SOLID Principle: Open/Closed — swap the AI provider by changing callGeminiVision()
 * without touching any calling code. The interface contract (OCRParseResult) stays the same.
 *
 * To enable real OCR, set your Gemini API key in src/config/ai.ts.
 * Free tier: https://ai.google.dev/ — 15 requests/min, 1M tokens/day.
 */

import { GEMINI_VISION_URL, isGeminiConfigured } from '../config/ai';

// ---------------------------------------------------------------------------
// TYPE DEFINITIONS
// ---------------------------------------------------------------------------

export interface ParsedMedication {
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

export interface OCRParseResult {
  medications: ParsedMedication[];
  patientName?: string;
  prescribedBy?: string;
  prescribedDate?: string;
  confidence: number;
  rawText: string;
}

// ---------------------------------------------------------------------------
// GEMINI PROMPT — instructs the model to return clean structured JSON
// Optimized for Indian prescription formats (English + Hindi drug names)
// ---------------------------------------------------------------------------

const EXTRACTION_PROMPT = `You are an expert medical prescription parser trained on Indian and international prescriptions.
Carefully analyze this prescription image and extract ALL readable information.

Return ONLY a valid JSON object — no markdown fences, no explanations, no extra text, just raw JSON:
{
  "medications": [
    {
      "medication": "Complete drug name with strength, e.g. Metformin 500mg or Paracetamol 650mg",
      "dosage": "Dose per administration, e.g. 1 tablet, 500mg, 5ml",
      "frequency": "How often to take it, e.g. Twice daily after meals, BD, TDS, OD",
      "duration": "Course length if specified, e.g. 5 days, 30 days, 1 month",
      "instructions": "Special instructions, e.g. Take with food, Avoid alcohol, Before sleep"
    }
  ],
  "patientName": "Full patient name if readable (first and last name)",
  "prescribedBy": "Doctor name and qualifications if readable, e.g. Dr. Sharma MBBS MD",
  "prescribedDate": "Prescription date in readable format, e.g. 15 Jun 2025",
  "confidence": 0.95,
  "rawText": "Every single word you can read from the image concatenated as a single readable string"
}

Extraction rules:
- Extract EVERY medication listed, even if only partially visible or in abbreviation
- Common Indian abbreviations: BD=twice daily, TDS=thrice daily, OD=once daily, HS=at bedtime, SOS=as needed
- If a field is unclear or missing, OMIT that field entirely (do NOT write null or "N/A")
- Set confidence: 1.0=perfectly clear prescription, 0.7=some blur, 0.4=hard to read, 0.1=not a prescription
- If not a prescription image at all, return empty medications array with confidence 0.1
- Capture all text verbatim in rawText including illegible parts transcribed phonetically
- Do not hallucinate medications — only extract what is visibly written`;

// ---------------------------------------------------------------------------
// GEMINI VISION CALL
// ---------------------------------------------------------------------------

const callGeminiVision = async (
  base64Image: string,
  mimeType: 'image/jpeg' | 'image/png'
): Promise<OCRParseResult> => {
  const response = await fetch(GEMINI_VISION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: EXTRACTION_PROMPT },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.05,      // Very low temperature = deterministic, factual output
        maxOutputTokens: 2048,  // Enough for detailed prescriptions
        response_mime_type: 'application/json',
      },
    }),
  });

  // Surface authentication and quota errors clearly
  if (response.status === 400) {
    const errBody = await response.text();
    throw new Error(`API Error 400 — Bad request. Check your API key format.\n\nDetails: ${errBody.slice(0, 300)}`);
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      'API Key authentication failed (Error ' + response.status + ').\n\n' +
      'Your key may be:\n' +
      '• Expired or revoked\n' +
      '• Missing Gemini API access\n\n' +
      'Get a new key at: https://ai.google.dev/'
    );
  }
  if (response.status === 429) {
    throw new Error('API rate limit exceeded. You have used all free-tier requests. Try again in a minute.');
  }
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error (${response.status}):\n${errBody.slice(0, 300)}`);
  }

  const json = await response.json();
  const rawText: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    const blockReason = json?.promptFeedback?.blockReason;
    if (blockReason) {
      throw new Error(`Gemini blocked the request: ${blockReason}. Try a clearer image.`);
    }
    throw new Error('Gemini returned an empty response. Check your API key quota at ai.google.dev/');
  }

  let parsed: OCRParseResult;
  try {
    // Strip any accidental markdown fences before parsing
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Could not parse AI response as JSON.\n\nRaw response: ${rawText.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed.medications)) {
    throw new Error('Unexpected response structure from Gemini — medications field is missing or invalid.');
  }

  // Ensure required numeric field with a sensible default
  if (typeof parsed.confidence !== 'number') {
    parsed.confidence = 0.7;
  }
  // Clamp confidence to [0, 1]
  parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));

  return parsed;
};

// ---------------------------------------------------------------------------
// MAIN OCR FUNCTION
// ---------------------------------------------------------------------------

/**
 * Parses a prescription image using Google Gemini Vision API.
 *
 * @param imageUri   - The local file URI of the selected/captured image
 * @param imageBase64 - Base64-encoded image data (from expo-image-picker with base64: true)
 *
 * If no Gemini API key is configured in src/config/ai.ts, logs a warning and
 * returns a clearly-labelled mock result so the UI still works during development.
 */
export const parsePrescritionImageAPI = async (
  imageUri: string,
  imageBase64?: string
): Promise<OCRParseResult> => {
  if (!imageUri) {
    throw new Error('A valid image URI is required for OCR processing.');
  }

  // ── REAL OCR PATH ──────────────────────────────────────────────────────
  if (isGeminiConfigured() && imageBase64) {
    const lowerUri = imageUri.toLowerCase();
    const mimeType: 'image/jpeg' | 'image/png' = lowerUri.endsWith('.png')
      ? 'image/png'
      : 'image/jpeg';

    return await callGeminiVision(imageBase64, mimeType);
  }

  // ── MISSING BASE64 (edge case) ─────────────────────────────────────────
  if (isGeminiConfigured() && !imageBase64) {
    console.warn('[CareSync OCR] Gemini configured but no base64 data received from image picker.');
  }

  // ── FALLBACK / DEV MODE ───────────────────────────────────────────────
  if (!isGeminiConfigured()) {
    console.warn(
      '[CareSync OCR] Gemini API key not configured.\n' +
      'Add your key to src/config/ai.ts to enable real prescription scanning.\n' +
      'Get a free key at: https://ai.google.dev/'
    );
  }

  // Simulate processing delay so the loading UI is visible
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Return a clearly-labelled placeholder so the user knows it's mock data
  return {
    medications: [
      {
        medication: '[DEMO] Configure Gemini API Key',
        dosage: 'See src/config/ai.ts',
        frequency: 'Once — to enable real OCR',
        instructions: 'Visit ai.google.dev for a free key',
      },
    ],
    patientName: 'Demo Mode',
    prescribedBy: 'CareSync System',
    prescribedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    confidence: 0.0,
    rawText: '[DEMO MODE — Real OCR disabled. Add your Gemini API key to src/config/ai.ts]',
  };
};
