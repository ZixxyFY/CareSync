// src/services/ocrService.tsx
/**
 * @file ocrService.tsx
 * @description OCR (Optical Character Recognition) service for parsing prescription images.
 *
 * SOLID Principle: Single Responsibility — this file only handles the
 * AI/OCR parsing logic. The MedicalContext calls it; it never touches
 * UI state or navigation.
 *
 * SOLID Principle: Open/Closed — in production, you can swap the mock AI
 * function for a real API call (e.g., Google Cloud Vision, AWS Textract)
 * without modifying any calling code, as the interface contract stays the same.
 *
 * In production, the image URI would be uploaded to a cloud storage bucket,
 * and the URL would be sent to a Vision AI API for text extraction and NLP
 * parsing to extract structured medication data.
 */

// ---------------------------------------------------------------------------
// TYPE DEFINITIONS
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ParsedMedication
 * Represents a single medication entry extracted from a scanned prescription.
 *
 * @property {string} medication - The drug/medication name (e.g., "Metformin 500mg")
 * @property {string} dosage - The amount per dose (e.g., "500mg", "1 tablet")
 * @property {string} frequency - How often to take it (e.g., "Twice daily", "Every 8 hours")
 * @property {string} [duration] - Optional: how long the course lasts (e.g., "30 days")
 * @property {string} [instructions] - Optional: additional guidance (e.g., "Take with food")
 */
export interface ParsedMedication {
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

/**
 * @typedef {Object} OCRParseResult
 * The complete result object returned by the OCR parsing function.
 *
 * @property {ParsedMedication[]} medications - Array of parsed medication entries
 * @property {string} [patientName] - Optional: patient name found on the prescription
 * @property {string} [prescribedBy] - Optional: doctor's name
 * @property {string} [prescribedDate] - Optional: date of the prescription
 * @property {number} confidence - AI confidence score (0.0 – 1.0)
 * @property {string} rawText - The raw extracted text before parsing (for user verification)
 */
export interface OCRParseResult {
  medications: ParsedMedication[];
  patientName?: string;
  prescribedBy?: string;
  prescribedDate?: string;
  confidence: number;
  rawText: string;
}

// ---------------------------------------------------------------------------
// MOCK PRESCRIPTION DATASET
// ---------------------------------------------------------------------------

/**
 * A pool of realistic mock prescription parse results.
 * The mock function randomly selects from these to simulate different prescriptions.
 */
const MOCK_PRESCRIPTIONS: OCRParseResult[] = [
  {
    medications: [
      {
        medication: 'Metformin 500mg',
        dosage: '500mg',
        frequency: 'Twice daily (after meals)',
        duration: '90 days',
        instructions: 'Take with food to minimize stomach upset.',
      },
      {
        medication: 'Atorvastatin 20mg',
        dosage: '20mg',
        frequency: 'Once daily (at bedtime)',
        duration: '90 days',
        instructions: 'Avoid grapefruit juice.',
      },
    ],
    patientName: 'Neeraj Sahu',
    prescribedBy: 'Dr. Anita Gupta',
    prescribedDate: '06 Jun 2026',
    confidence: 0.94,
    rawText:
      'Rx\nPatient: Neeraj Sahu\nDr. Anita Gupta, MBBS, MD (Endocrinology)\n1. Tab Metformin 500mg - BD (After meals) x 90 days\n2. Tab Atorvastatin 20mg - OD (Bedtime) x 90 days\nDate: 06/06/2026',
  },
  {
    medications: [
      {
        medication: 'Amlodipine 5mg',
        dosage: '5mg',
        frequency: 'Once daily (morning)',
        duration: '60 days',
        instructions: 'Monitor blood pressure regularly.',
      },
      {
        medication: 'Aspirin 75mg',
        dosage: '75mg',
        frequency: 'Once daily (with breakfast)',
        duration: '60 days',
        instructions: 'Do not take on an empty stomach.',
      },
      {
        medication: 'Pantoprazole 40mg',
        dosage: '40mg',
        frequency: 'Once daily (30 min before breakfast)',
        duration: '30 days',
      },
    ],
    patientName: 'Neeraj Sahu',
    prescribedBy: 'Dr. Rajan Mehta',
    prescribedDate: '07 Jun 2026',
    confidence: 0.88,
    rawText:
      'Rx\nPatient: Neeraj Sahu\nDr. Rajan Mehta, DM (Cardiology)\n1. Tab Amlodipine 5mg - OD (Morning) x 60 days\n2. Tab Aspirin 75mg - OD (With breakfast) x 60 days\n3. Tab Pantoprazole 40mg - OD (Before breakfast) x 30 days\nDate: 07/06/2026',
  },
];

// ---------------------------------------------------------------------------
// MAIN OCR PARSE FUNCTION
// ---------------------------------------------------------------------------

/**
 * Simulates sending a prescription image to an AI OCR service for text extraction
 * and structured data parsing.
 *
 * In production, this function would:
 * 1. Upload the image to cloud storage (e.g., Firebase Storage)
 * 2. Send the image URL to a Vision AI endpoint
 * 3. Return parsed structured medication data
 *
 * The mock intentionally uses a 2-second delay to simulate real AI processing time,
 * allowing the UI to display a realistic loading state.
 *
 * @param {string} imageUri - The local URI of the selected/captured image from expo-image-picker.
 * @returns {Promise<OCRParseResult>} Structured medication data extracted from the prescription.
 * @throws {Error} If the image URI is invalid or the (mock) AI parsing fails.
 */
export const parsePrescritionImageAPI = async (
  imageUri: string
): Promise<OCRParseResult> => {
  if (!imageUri) {
    throw new Error('A valid image URI is required for OCR processing.');
  }

  // Simulate a 2-second AI processing delay (as specified in requirements)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Randomly select from our mock prescription dataset to simulate variability
  const randomIndex = Math.floor(Math.random() * MOCK_PRESCRIPTIONS.length);
  return MOCK_PRESCRIPTIONS[randomIndex];
};
