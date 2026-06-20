/**
 * @file transportService.tsx
 * @description Supabase database operations for Transport (Ride) Bookings.
 *
 * Table: public.transport_bookings
 * RLS: disabled for development
 *
 * SQL to create the table (run in Supabase SQL editor):
 *
 *   create table public.transport_bookings (
 *     id uuid default gen_random_uuid() primary key,
 *     user_id uuid references auth.users on delete cascade not null,
 *     ride_type text not null default 'Standard',
 *     pickup_address text not null,
 *     destination_address text not null,
 *     patient_name text,
 *     notes text,
 *     status text not null default 'Scheduled',
 *     scheduled_at timestamptz default now(),
 *     created_at timestamptz default now()
 *   );
 *   alter table public.transport_bookings disable row level security;
 */
import { supabase } from '../config/supabase';

// ---------------------------------------------------------------------------
// TYPE DEFINITIONS
// ---------------------------------------------------------------------------

export interface TransportBooking {
  id: string;
  user_id: string;
  ride_type: 'Standard' | 'Wheelchair' | 'Ambulance';
  pickup_address: string;
  destination_address: string;
  patient_name?: string;
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  scheduled_at: string;
  created_at: string;
}

export interface CreateTransportBookingDTO {
  ride_type: 'Standard' | 'Wheelchair' | 'Ambulance';
  pickup_address: string;
  destination_address: string;
  patient_name?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// FETCH ALL BOOKINGS FOR USER
// ---------------------------------------------------------------------------
export const fetchTransportBookingsAPI = async (
  userId: string
): Promise<TransportBooking[]> => {
  const { data, error } = await supabase
    .from('transport_bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch transport bookings: ${error.message}`);
  return (data ?? []) as TransportBooking[];
};

// ---------------------------------------------------------------------------
// CREATE A NEW BOOKING
// ---------------------------------------------------------------------------
export const createTransportBookingAPI = async (
  bookingData: CreateTransportBookingDTO,
  userId: string
): Promise<TransportBooking> => {
  const payload = {
    ...bookingData,
    user_id: userId,
    status: 'Scheduled',
  };

  const { data, error } = await supabase
    .from('transport_bookings')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(`Could not create transport booking: ${error.message}`);
  return data as TransportBooking;
};

// ---------------------------------------------------------------------------
// CANCEL A BOOKING
// ---------------------------------------------------------------------------
export const cancelTransportBookingAPI = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('transport_bookings')
    .update({ status: 'Cancelled' })
    .eq('id', id);

  if (error) throw new Error(`Could not cancel booking: ${error.message}`);
};
