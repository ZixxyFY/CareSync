// src/context/BookingContext.tsx
/**
 * @file BookingContext.tsx
 * @description Appointment booking state management for CareSync.
 *
 * SOLID Principle: Single Responsibility — manages ONLY appointment state.
 * Does not handle user auth, OCR records, or UI rendering.
 *
 * SOLID Principle: Open/Closed — new actions (e.g., RESCHEDULE, BULK_CANCEL)
 * can be added to the reducer switch and dispatched without modifying existing
 * action handlers or consumer components.
 *
 * Uses `useReducer` for predictable, testable state transitions.
 * Data Flow: UI → useBooking() → BookingContext → bookingService → (mock) API
 */

import React, { createContext, useReducer, useContext, useCallback } from 'react';
import {
  fetchAppointmentsAPI,
  createAppointmentAPI,
  Appointment,
  CreateAppointmentDTO,
} from '../services/bookingService';

// ---------------------------------------------------------------------------
// STATE SHAPE & ACTION TYPES
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} BookingState
 * @property {Appointment[]} appointments - All loaded appointments for the user.
 * @property {boolean} isLoading - True while fetching or creating appointments.
 * @property {string | null} error - Error message if the last operation failed.
 */
interface BookingState {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
}

type BookingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_APPOINTMENTS'; payload: Appointment[] }
  | { type: 'ADD_APPOINTMENT'; payload: Appointment }
  | { type: 'UPDATE_STATUS'; payload: { id: string; status: Appointment['status'] } }
  | { type: 'DELETE_APPOINTMENT'; payload: string }
  | { type: 'SET_ERROR'; payload: string };

// ---------------------------------------------------------------------------
// INITIAL STATE
// ---------------------------------------------------------------------------

const initialState: BookingState = {
  appointments: [],
  isLoading: false,
  error: null,
};

// ---------------------------------------------------------------------------
// REDUCER
// ---------------------------------------------------------------------------

/**
 * Pure reducer function for appointment state.
 * Each case is a pure transformation — no side effects, no async calls.
 *
 * @param {BookingState} state - Current state
 * @param {BookingAction} action - The dispatched action
 * @returns {BookingState} New state
 */
const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };

    case 'SET_APPOINTMENTS':
      return { ...state, appointments: action.payload, isLoading: false };

    case 'ADD_APPOINTMENT':
      // Prepend so the newest appointment appears at the top of the list
      return {
        ...state,
        appointments: [action.payload, ...state.appointments],
        isLoading: false,
      };

    case 'UPDATE_STATUS':
      return {
        ...state,
        appointments: state.appointments.map((appt) =>
          appt.id === action.payload.id
            ? { ...appt, status: action.payload.status }
            : appt
        ),
      };

    case 'DELETE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.filter((appt) => appt.id !== action.payload),
      };

    case 'SET_ERROR':
      return { ...state, isLoading: false, error: action.payload };

    default:
      return state;
  }
};

// ---------------------------------------------------------------------------
// CONTEXT TYPE
// ---------------------------------------------------------------------------

interface BookingContextValue {
  state: BookingState;
  loadAppointments: () => Promise<void>;
  addAppointment: (data: CreateAppointmentDTO) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  deleteAppointment: (id: string) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

// ---------------------------------------------------------------------------
// PROVIDER
// ---------------------------------------------------------------------------

/**
 * BookingProvider supplies appointment state and operations to the component tree.
 * Wrap it around the portion of the app that requires scheduling features.
 */
export const BookingProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  /**
   * Fetches all appointments from the server and populates the local state.
   * Should be called on the AppointmentList screen's initial mount.
   */
  const loadAppointments = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await fetchAppointmentsAPI();
      dispatch({ type: 'SET_APPOINTMENTS', payload: data });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load appointments. Please try again.' });
    }
  }, []);

  /**
   * Creates a new appointment via the service and optimistically updates local state.
   *
   * @param {CreateAppointmentDTO} data - The appointment details to create.
   */
  const addAppointment = useCallback(async (data: CreateAppointmentDTO): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const newAppt = await createAppointmentAPI(data);
      dispatch({ type: 'ADD_APPOINTMENT', payload: newAppt });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: 'Could not create appointment.' });
      throw error; // Re-throw so the UI can show an inline alert
    }
  }, []);

  /**
   * Updates the status of an existing appointment (e.g., mark as 'Completed').
   * This is a synchronous local state update (optimistic update pattern).
   *
   * @param {string} id - The appointment ID to update.
   * @param {Appointment['status']} status - The new status.
   */
  const updateAppointmentStatus = useCallback(
    (id: string, status: Appointment['status']): void => {
      dispatch({ type: 'UPDATE_STATUS', payload: { id, status } });
    },
    []
  );

  /**
   * Removes an appointment from local state.
   * In a real app, this would first call the API to delete server-side.
   *
   * @param {string} id - The appointment ID to delete.
   */
  const deleteAppointment = useCallback((id: string): void => {
    dispatch({ type: 'DELETE_APPOINTMENT', payload: id });
  }, []);

  const contextValue: BookingContextValue = {
    state,
    loadAppointments,
    addAppointment,
    updateAppointmentStatus,
    deleteAppointment,
  };

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// CUSTOM HOOK
// ---------------------------------------------------------------------------

/**
 * Custom hook to access the BookingContext.
 * Throws a descriptive error if used outside of a BookingProvider.
 *
 * @returns {BookingContextValue}
 * @throws {Error} If called outside a BookingProvider.
 */
export const useBooking = (): BookingContextValue => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error(
      'useBooking must be used within a <BookingProvider>. Check your component tree.'
    );
  }
  return context;
};

export default BookingContext;