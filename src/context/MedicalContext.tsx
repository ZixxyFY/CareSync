// src/context/MedicalContext.tsx
/**
 * @file MedicalContext.tsx
 * @description Global state management for medical records and OCR prescriptions.
 *
 * SOLID Principle: Single Responsibility — manages ONLY the medical record
 * lifecycle. Booking and auth concerns live in their own contexts.
 *
 * SOLID Principle: Open/Closed — new medical record types (lab results,
 * imaging reports) can be added via new action types without modifying
 * existing handlers.
 *
 * Data Flow: OCRScanner UI → useMedical() → MedicalContext → ocrService → AI API
 */

import React, { createContext, useReducer, useContext, useCallback } from 'react';
import { parsePrescritionImageAPI, OCRParseResult, ParsedMedication } from '../services/ocrService';

// ---------------------------------------------------------------------------
// TYPE DEFINITIONS
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} MedicalRecord
 * Represents a saved, user-confirmed medical record.
 *
 * @property {string} id - Unique record ID
 * @property {string} imageUri - The local URI of the original scanned image
 * @property {ParsedMedication[]} medications - Confirmed medication entries
 * @property {string} [patientName] - Patient name from the prescription
 * @property {string} [prescribedBy] - Doctor's name
 * @property {string} [prescribedDate] - Date on the prescription
 * @property {string} savedAt - ISO timestamp when this record was saved by the user
 */
export interface MedicalRecord {
  id: string;
  imageUri: string;
  medications: ParsedMedication[];
  patientName?: string;
  prescribedBy?: string;
  prescribedDate?: string;
  savedAt: string;
}

interface MedicalState {
  records: MedicalRecord[];
  /** Current OCR parse result — populated while the user is verifying */
  pendingOCRResult: OCRParseResult | null;
  /** URI of the image currently being processed */
  scannedImageUri: string | null;
  isProcessing: boolean;
  error: string | null;
}

type MedicalAction =
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_SCANNED_IMAGE'; payload: string }
  | { type: 'SET_OCR_RESULT'; payload: OCRParseResult }
  | { type: 'CLEAR_PENDING' }
  | { type: 'SAVE_RECORD'; payload: MedicalRecord }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'SET_ERROR'; payload: string };

// ---------------------------------------------------------------------------
// REDUCER
// ---------------------------------------------------------------------------

const initialState: MedicalState = {
  records: [],
  pendingOCRResult: null,
  scannedImageUri: null,
  isProcessing: false,
  error: null,
};

const medicalReducer = (state: MedicalState, action: MedicalAction): MedicalState => {
  switch (action.type) {
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload, error: null };
    case 'SET_SCANNED_IMAGE':
      return { ...state, scannedImageUri: action.payload };
    case 'SET_OCR_RESULT':
      return { ...state, pendingOCRResult: action.payload, isProcessing: false };
    case 'CLEAR_PENDING':
      return { ...state, pendingOCRResult: null, scannedImageUri: null, error: null };
    case 'SAVE_RECORD':
      return {
        ...state,
        records: [action.payload, ...state.records],
        pendingOCRResult: null,
        scannedImageUri: null,
      };
    case 'DELETE_RECORD':
      return {
        ...state,
        records: state.records.filter((r) => r.id !== action.payload),
      };
    case 'SET_ERROR':
      return { ...state, isProcessing: false, error: action.payload };
    default:
      return state;
  }
};

// ---------------------------------------------------------------------------
// CONTEXT
// ---------------------------------------------------------------------------

interface MedicalContextValue {
  state: MedicalState;
  scanPrescription: (imageUri: string) => Promise<void>;
  saveVerifiedRecord: (
    imageUri: string,
    medications: ParsedMedication[],
    meta: { patientName?: string; prescribedBy?: string; prescribedDate?: string }
  ) => void;
  deleteRecord: (id: string) => void;
  clearPending: () => void;
}

const MedicalContext = createContext<MedicalContextValue | null>(null);

// ---------------------------------------------------------------------------
// PROVIDER
// ---------------------------------------------------------------------------

/**
 * MedicalProvider supplies OCR scanning state and saved medical records
 * to descendant components.
 */
export const MedicalProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(medicalReducer, initialState);

  /**
   * Initiates the OCR pipeline:
   * 1. Stores the image URI in state for display
   * 2. Sets isProcessing = true (triggers loading UI)
   * 3. Calls the ocrService (2-second mock AI delay)
   * 4. Stores the parse result for user verification
   *
   * @param {string} imageUri - Local URI from expo-image-picker
   */
  const scanPrescription = useCallback(async (imageUri: string): Promise<void> => {
    dispatch({ type: 'SET_SCANNED_IMAGE', payload: imageUri });
    dispatch({ type: 'SET_PROCESSING', payload: true });
    try {
      const result = await parsePrescritionImageAPI(imageUri);
      dispatch({ type: 'SET_OCR_RESULT', payload: result });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: 'AI parsing failed. Please try again.' });
      throw error;
    }
  }, []);

  /**
   * Saves the user-verified medication data as a permanent MedicalRecord.
   * Called after the user reviews and confirms the OCR output.
   *
   * @param {string} imageUri - The source image URI
   * @param {ParsedMedication[]} medications - The user-confirmed medications
   * @param {object} meta - Optional prescription metadata
   */
  const saveVerifiedRecord = useCallback(
    (
      imageUri: string,
      medications: ParsedMedication[],
      meta: { patientName?: string; prescribedBy?: string; prescribedDate?: string }
    ): void => {
      const record: MedicalRecord = {
        id: `med-${Date.now()}`,
        imageUri,
        medications,
        ...meta,
        savedAt: new Date().toISOString(),
      };
      dispatch({ type: 'SAVE_RECORD', payload: record });
    },
    []
  );

  /**
   * Removes a saved medical record permanently.
   * @param {string} id - The record ID to delete
   */
  const deleteRecord = useCallback((id: string): void => {
    dispatch({ type: 'DELETE_RECORD', payload: id });
  }, []);

  /**
   * Clears the pending OCR result and resets the scanner to its initial state.
   * Used when the user cancels the verification flow.
   */
  const clearPending = useCallback((): void => {
    dispatch({ type: 'CLEAR_PENDING' });
  }, []);

  return (
    <MedicalContext.Provider
      value={{ state, scanPrescription, saveVerifiedRecord, deleteRecord, clearPending }}
    >
      {children}
    </MedicalContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// CUSTOM HOOK
// ---------------------------------------------------------------------------

/**
 * Custom hook to access the MedicalContext.
 * @throws {Error} If called outside a MedicalProvider.
 */
export const useMedical = (): MedicalContextValue => {
  const context = useContext(MedicalContext);
  if (!context) {
    throw new Error(
      'useMedical must be used within a <MedicalProvider>. Check your component tree.'
    );
  }
  return context;
};

export default MedicalContext;
