// src/services/bookingService.tsx
/**
 * @file bookingService.tsx
 * @description Booking/appointment service layer for CareSync.
 *
 * SOLID Principle: Single Responsibility — this file exclusively handles
 * appointment-related API operations. The BookingContext consumes these
 * functions without knowing how HTTP requests are made.
 *
 * SOLID Principle: Open/Closed — new appointment operations (e.g., reschedule,
 * bulk-cancel) can be added here without modifying the BookingContext or any
 * screen component.
 */

// ---------------------------------------------------------------------------
// TYPE DEFINITIONS
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Appointment
 * @property {string} id - Unique appointment identifier
 * @property {string} title - Description of the appointment (e.g., "Physiotherapy Session")
 * @property {string} date - ISO 8601 date string (e.g., "2026-06-10T09:00:00.000Z")
 * @property {'Upcoming' | 'Completed' | 'Cancelled'} status - Current appointment status
 * @property {string} [provider] - Optional: name of the doctor or care provider
 * @property {string} [location] - Optional: clinic or home address
 * @property {string} [notes] - Optional: caregiver notes for this appointment
 */
export interface Appointment {
  id: string;
  title: string;
  date: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  provider?: string;
  location?: string;
  notes?: string;
}

/**
 * @typedef {Object} CreateAppointmentDTO
 * @property {string} title - The appointment reason
 * @property {string} date - ISO date string of the scheduled date
 * @property {string} [provider] - Optional provider name
 * @property {string} [location] - Optional location string
 * @property {string} [notes] - Optional notes
 */
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

/**
 * Retrieves the full list of appointments for the authenticated user.
 * In production, calls `GET /appointments` with the user's auth token.
 * Currently returns a rich mock dataset.
 *
 * @returns {Promise<Appointment[]>} Array of the user's appointments, newest first.
 * @throws {Error} If the network request fails.
 */
export const fetchAppointmentsAPI = async (): Promise<Appointment[]> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const nextMonth = new Date(today);
  nextMonth.setDate(today.getDate() + 22);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 2);

  return [
    {
      id: 'appt-001',
      title: 'Physiotherapy Session',
      date: nextWeek.toISOString(),
      status: 'Upcoming',
      provider: 'Dr. Priya Sharma',
      location: 'Apollo Rehab Center, Block C',
      notes: 'Bring last X-ray report. Wear comfortable clothes.',
    },
    {
      id: 'appt-002',
      title: 'Cardiologist Follow-up',
      date: nextMonth.toISOString(),
      status: 'Upcoming',
      provider: 'Dr. Rajan Mehta',
      location: 'Fortis Heart Institute',
      notes: 'Fasting blood test required 12hrs before.',
    },
    {
      id: 'appt-003',
      title: 'Diabetology Consultation',
      date: yesterday.toISOString(),
      status: 'Completed',
      provider: 'Dr. Anita Gupta',
      location: 'Medanta, OPD Block',
    },
  ];
};

// ---------------------------------------------------------------------------
// CREATE A NEW APPOINTMENT
// ---------------------------------------------------------------------------

/**
 * Creates a new appointment record for the authenticated user.
 * In production, calls `POST /appointments` with the appointment data.
 * Simulates a 0.8s network call and returns the created record with a generated ID.
 *
 * @param {CreateAppointmentDTO} appointmentData - The appointment details to create.
 * @returns {Promise<Appointment>} The newly created appointment with a server-assigned ID.
 * @throws {Error} If creation fails (e.g., slot conflict, validation error).
 */
export const createAppointmentAPI = async (
  appointmentData: CreateAppointmentDTO
): Promise<Appointment> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  // In production: const res = await api.post('/appointments', appointmentData);
  return {
    id: `appt-${Date.now()}`,
    ...appointmentData,
    status: 'Upcoming',
  };
};

// ---------------------------------------------------------------------------
// UPDATE APPOINTMENT STATUS
// ---------------------------------------------------------------------------

/**
 * Updates the status of an existing appointment (e.g., mark as Completed).
 * In production, calls `PATCH /appointments/:id` with the new status.
 *
 * @param {string} id - The appointment's unique ID.
 * @param {Appointment['status']} status - The new status to apply.
 * @returns {Promise<void>}
 * @throws {Error} If the appointment is not found or the transition is invalid.
 */
export const updateAppointmentStatusAPI = async (
  id: string,
  status: Appointment['status']
): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  // In production: await api.patch(`/appointments/${id}`, { status });
};

// ---------------------------------------------------------------------------
// DELETE AN APPOINTMENT
// ---------------------------------------------------------------------------

/**
 * Permanently cancels and removes an appointment.
 * In production, calls `DELETE /appointments/:id`.
 *
 * @param {string} id - The appointment's unique ID to delete.
 * @returns {Promise<void>}
 * @throws {Error} If the appointment is not found.
 */
export const deleteAppointmentAPI = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  // In production: await api.delete(`/appointments/${id}`);
};