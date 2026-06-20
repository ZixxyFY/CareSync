/**
 * @file bookingService.tsx
 * @description Supabase database operations for Appointments.
 */
import { supabase } from '../config/supabase';

export interface Appointment {
  id: string;
  title: string;
  date: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  provider?: string;
  location?: string;
  notes?: string;
}

export interface CreateAppointmentDTO {
  title: string;
  date: string;
  provider?: string;
  location?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// FETCH ALL APPOINTMENTS
// ---------------------------------------------------------------------------
export const fetchAppointmentsAPI = async (userId: string): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, title, date, status, provider, location, notes')
    .eq('user_id', userId)
    .order('date', { ascending: true }); // Automatically sorts by soonest!

  if (error) throw new Error(`Failed to fetch appointments: ${error.message}`);
  return data as Appointment[];
};

// ---------------------------------------------------------------------------
// CREATE A NEW APPOINTMENT
// ---------------------------------------------------------------------------
export const createAppointmentAPI = async (
  appointmentData: CreateAppointmentDTO,
  userId: string
): Promise<Appointment> => {
  const newAppointment = {
    ...appointmentData,
    user_id: userId,
    status: 'Upcoming',
  };

  const { data, error } = await supabase
    .from('appointments')
    .insert([newAppointment])
    .select() // Tells Supabase to return the newly created row (with its generated ID)
    .single();

  if (error) throw new Error(`Could not create appointment: ${error.message}`);
  return data as Appointment;
};

// ---------------------------------------------------------------------------
// UPDATE APPOINTMENT STATUS
// ---------------------------------------------------------------------------
export const updateAppointmentStatusAPI = async (
  id: string,
  status: Appointment['status']
): Promise<void> => {
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(`Update failed: ${error.message}`);
};

// ---------------------------------------------------------------------------
// DELETE AN APPOINTMENT
// ---------------------------------------------------------------------------
export const deleteAppointmentAPI = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Deletion failed: ${error.message}`);
};