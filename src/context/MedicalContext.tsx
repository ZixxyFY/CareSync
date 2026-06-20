// src/context/MedicalContext.tsx
/**
 * @file MedicalContext.tsx
 * @description Global state management for medical records and OCR prescriptions.
 *
 * SOLID Principle: Single Responsibility — manages ONLY the medical record lifecycle.
 * SOLID Principle: Open/Closed — new record types (lab results, imaging) can be added
 * via new action types without modifying existing handlers.
 *
 * Data Flow: OCRScanner UI → useMedical() → MedicalContext → medicalService → Supabase
 */

import React, { createContext, useReducer, useContext, useCallback } from 'react';
import { parsePrescritionImageAPI, OCRParseResult, ParsedMedication } from '../services/ocrService';
import {
  MedicalRecordDB,
  CreateMedicalRecordDTO,
  fetchMedicalRecordsAPI,
  saveMedicalRecordAPI,
  deleteMedicalRecordAPI,
} from '../services/medicalService';
import { useAuth } from './AuthContext';

// ---------------------------------------------------------------------------
// TYPE DEFINITIONS
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} MedicalRecord
 * Represents a saved, user-confirmed medical record (mirrors DB schema).
 */
export interface MedicalRecord {
  id: string;
  imageUri?: string;
  medications: ParsedMedication[];
  patientName?: string;
  prescribedBy?: string;
  prescribedDate?: string;
  confidence?: number;
  savedAt: string;
}

interface MedicalState {
  records: MedicalRecord[];
  /** Current OCR parse result — populated while the user is verifying */
  pendingOCRResult: OCRParseResult | null;
  /** URI of the image currently being processed */
  scannedImageUri: string | null;
  isProcessing: boolean;
  isLoadingRecords: boolean;
  isSaving: boolean;
  error: string | null;
}

type MedicalAction =
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_SCANNED_IMAGE'; payload: string }
  | { type: 'SET_OCR_RESULT'; payload: OCRParseResult }
  | { type: 'CLEAR_PENDING' }
  | { type: 'SET_LOADING_RECORDS'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_RECORDS'; payload: MedicalRecord[] }
  | { type: 'ADD_RECORD'; payload: MedicalRecord }
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
  isLoadingRecords: false,
  isSaving: false,
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
    case 'SET_LOADING_RECORDS':
      return { ...state, isLoadingRecords: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SET_RECORDS':
      return { ...state, records: action.payload, isLoadingRecords: false };
    case 'ADD_RECORD':
      return {
        ...state,
        records: [action.payload, ...state.records],
        pendingOCRResult: null,
        scannedImageUri: null,
        isSaving: false,
      };
    case 'DELETE_RECORD':
      return {
        ...state,
        records: state.records.filter((r) => r.id !== action.payload),
      };
    case 'SET_ERROR':
      return { ...state, isProcessing: false, isSaving: false, error: action.payload };
    default:
      return state;
  }
};

// ---------------------------------------------------------------------------
// CONTEXT
// ---------------------------------------------------------------------------

interface MedicalContextValue {
  state: MedicalState;
  loadRecords: () => Promise<void>;
  scanPrescription: (imageUri: string, imageBase64?: string) => Promise<void>;
  saveVerifiedRecord: (
    imageUri: string,
    medications: ParsedMedication[],
    meta: { patientName?: string; prescribedBy?: string; prescribedDate?: string; confidence?: number }
  ) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  clearPending: () => void;
}

const MedicalContext = createContext<MedicalContextValue | null>(null);

// ---------------------------------------------------------------------------
// HELPER: map DB record → local MedicalRecord shape
// ---------------------------------------------------------------------------
const dbToLocal = (db: MedicalRecordDB): MedicalRecord => ({
  id: db.id,
  imageUri: db.image_uri,
  medications: db.medications,
  patientName: db.patient_name,
  prescribedBy: db.prescribed_by,
  prescribedDate: db.prescribed_date,
  confidence: db.confidence,
  savedAt: db.saved_at,
});

// ---------------------------------------------------------------------------
// PROVIDER
// ---------------------------------------------------------------------------

export const MedicalProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(medicalReducer, initialState);
  const { user } = useAuth();

  /**
   * Loads all saved medical records from Supabase for the current user.
   */
  const loadRecords = useCallback(async (): Promise<void> => {
    if (!user) return;
    dispatch({ type: 'SET_LOADING_RECORDS', payload: true });
    try {
      const data = await fetchMedicalRecordsAPI(user.id);
      dispatch({ type: 'SET_RECORDS', payload: data.map(dbToLocal) });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load medical records.' });
    }
  }, [user]);

  /**
   * Initiates the OCR pipeline:
   * 1. Stores the image URI in state for display
   * 2. Sets isProcessing = true (triggers loading UI)
   * 3. Calls the ocrService (2-second mock AI delay)
   * 4. Stores the parse result for user verification
   *
   * @param {string} imageUri - Local URI from expo-image-picker
   */
  const scanPrescription = useCallback(async (imageUri: string, imageBase64?: string): Promise<void> => {
    dispatch({ type: 'SET_SCANNED_IMAGE', payload: imageUri });
    dispatch({ type: 'SET_PROCESSING', payload: true });
    try {
      const result = await parsePrescritionImageAPI(imageUri, imageBase64);
      dispatch({ type: 'SET_OCR_RESULT', payload: result });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: 'AI parsing failed. Please try again.' });
      throw error;
    }
  }, []);

  /**
   * Saves the user-verified medication data to Supabase as a permanent record.
   * Called after the user reviews and confirms the OCR output.
   */
  const saveVerifiedRecord = useCallback(
    async (
      imageUri: string,
      medications: ParsedMedication[],
      meta: { patientName?: string; prescribedBy?: string; prescribedDate?: string; confidence?: number }
    ): Promise<void> => {
      if (!user) throw new Error('You must be logged in to save records.');
      dispatch({ type: 'SET_SAVING', payload: true });
      try {
        const payload: CreateMedicalRecordDTO = {
          image_uri: imageUri,
          medications,
          patient_name: meta.patientName,
          prescribed_by: meta.prescribedBy,
          prescribed_date: meta.prescribedDate,
          confidence: meta.confidence,
        };
        const saved = await saveMedicalRecordAPI(payload, user.id);
        dispatch({ type: 'ADD_RECORD', payload: dbToLocal(saved) });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: 'Could not save record.' });
        throw error;
      }
    },
    [user]
  );

  /**
   * Removes a saved medical record from Supabase and local state.
   */
  const deleteRecord = useCallback(async (id: string): Promise<void> => {
    // Optimistic UI update
    dispatch({ type: 'DELETE_RECORD', payload: id });
    try {
      await deleteMedicalRecordAPI(id);
    } catch (error) {
      console.error('Failed to delete record from DB', error);
    }
  }, [user]);

  /**
   * Clears the pending OCR result and resets the scanner to its initial state.
   */
  const clearPending = useCallback((): void => {
    dispatch({ type: 'CLEAR_PENDING' });
  }, []);

  return (
    <MedicalContext.Provider
      value={{ state, loadRecords, scanPrescription, saveVerifiedRecord, deleteRecord, clearPending }}
    >
      {children}
    </MedicalContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// CUSTOM HOOK
// ---------------------------------------------------------------------------

export const useMedical = (): MedicalContextValue => {
  const context = useContext(MedicalContext);
  if (!context) {
    throw new Error('useMedical must be used within a <MedicalProvider>. Check your component tree.');
  }
  return context;
};

export default MedicalContext;
