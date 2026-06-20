/**
 * @file medicalService.tsx
 * @description Supabase database operations for Medical Records (digitized prescriptions).
 *
 * Table: public.medical_records
 * RLS: disabled for development
 *
 * SQL to create the table (run in Supabase SQL editor):
 *
 *   create table public.medical_records (
 *     id uuid default gen_random_uuid() primary key,
 *     user_id uuid references auth.users on delete cascade not null,
 *     image_uri text,
 *     medications jsonb not null default '[]',
 *     patient_name text,
 *     prescribed_by text,
 *     prescribed_date text,
 *     confidence numeric,
 *     saved_at timestamptz default now()
 *   );
 *   alter table public.medical_records disable row level security;
 */
import { supabase } from '../config/supabase';
import { ParsedMedication } from './ocrService';

// ---------------------------------------------------------------------------
// TYPE DEFINITIONS
// ---------------------------------------------------------------------------

export interface MedicalRecordDB {
  id: string;
  user_id: string;
  image_uri?: string;
  medications: ParsedMedication[];
  patient_name?: string;
  prescribed_by?: string;
  prescribed_date?: string;
  confidence?: number;
  saved_at: string;
}

export interface CreateMedicalRecordDTO {
  image_uri?: string;
  medications: ParsedMedication[];
  patient_name?: string;
  prescribed_by?: string;
  prescribed_date?: string;
  confidence?: number;
}

// ---------------------------------------------------------------------------
// FETCH ALL RECORDS FOR USER
// ---------------------------------------------------------------------------
export const fetchMedicalRecordsAPI = async (
  userId: string
): Promise<MedicalRecordDB[]> => {
  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch medical records: ${error.message}`);
  return (data ?? []) as MedicalRecordDB[];
};

// ---------------------------------------------------------------------------
// SAVE A NEW RECORD
// ---------------------------------------------------------------------------
export const saveMedicalRecordAPI = async (
  recordData: CreateMedicalRecordDTO,
  userId: string
): Promise<MedicalRecordDB> => {
  const payload = {
    ...recordData,
    user_id: userId,
    medications: recordData.medications as any, // jsonb
  };

  const { data, error } = await supabase
    .from('medical_records')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(`Could not save medical record: ${error.message}`);
  return data as MedicalRecordDB;
};

// ---------------------------------------------------------------------------
// DELETE A RECORD
// ---------------------------------------------------------------------------
export const deleteMedicalRecordAPI = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('medical_records')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Could not delete medical record: ${error.message}`);
};
