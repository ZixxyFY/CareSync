// src/context/TransportContext.tsx
/**
 * @file TransportContext.tsx
 * @description Global state management for Transport (Ride) bookings.
 *
 * SOLID Principle: Single Responsibility — manages ONLY transport booking state.
 * SOLID Principle: Open/Closed — new actions (RESCHEDULE, COMPLETE) can be added
 * without touching existing handlers or screens.
 *
 * Data Flow: ScheduleRide UI → useTransport() → TransportContext → transportService → Supabase
 */

import React, { createContext, useReducer, useContext, useCallback } from 'react';
import {
  TransportBooking,
  CreateTransportBookingDTO,
  fetchTransportBookingsAPI,
  createTransportBookingAPI,
  cancelTransportBookingAPI,
} from '../services/transportService';
import { useAuth } from './AuthContext';

// ---------------------------------------------------------------------------
// STATE SHAPE & ACTION TYPES
// ---------------------------------------------------------------------------

interface TransportState {
  bookings: TransportBooking[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

type TransportAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_BOOKINGS'; payload: TransportBooking[] }
  | { type: 'ADD_BOOKING'; payload: TransportBooking }
  | { type: 'CANCEL_BOOKING'; payload: string }
  | { type: 'SET_ERROR'; payload: string };

const initialState: TransportState = {
  bookings: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
};

// ---------------------------------------------------------------------------
// REDUCER
// ---------------------------------------------------------------------------

const transportReducer = (
  state: TransportState,
  action: TransportAction
): TransportState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'SET_BOOKINGS':
      return { ...state, bookings: action.payload, isLoading: false };
    case 'ADD_BOOKING':
      return {
        ...state,
        bookings: [action.payload, ...state.bookings],
        isSubmitting: false,
      };
    case 'CANCEL_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.payload ? { ...b, status: 'Cancelled' as const } : b
        ),
      };
    case 'SET_ERROR':
      return { ...state, isLoading: false, isSubmitting: false, error: action.payload };
    default:
      return state;
  }
};

// ---------------------------------------------------------------------------
// CONTEXT TYPE
// ---------------------------------------------------------------------------

interface TransportContextValue {
  state: TransportState;
  loadBookings: () => Promise<void>;
  addBooking: (data: CreateTransportBookingDTO) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
}

const TransportContext = createContext<TransportContextValue | null>(null);

// ---------------------------------------------------------------------------
// PROVIDER
// ---------------------------------------------------------------------------

export const TransportProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(transportReducer, initialState);
  const { user } = useAuth();

  /**
   * Fetches all transport bookings from Supabase for the logged-in user.
   */
  const loadBookings = useCallback(async (): Promise<void> => {
    if (!user) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await fetchTransportBookingsAPI(user.id);
      dispatch({ type: 'SET_BOOKINGS', payload: data });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load bookings.' });
    }
  }, [user]);

  /**
   * Creates a new transport booking and optimistically adds it to local state.
   */
  const addBooking = useCallback(async (data: CreateTransportBookingDTO): Promise<void> => {
    if (!user) throw new Error('You must be logged in to book a ride.');
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      const newBooking = await createTransportBookingAPI(data, user.id);
      dispatch({ type: 'ADD_BOOKING', payload: newBooking });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: 'Could not create booking.' });
      throw error;
    }
  }, [user]);

  /**
   * Cancels a transport booking both locally and in Supabase.
   */
  const cancelBooking = useCallback(async (id: string): Promise<void> => {
    // Optimistic UI update
    dispatch({ type: 'CANCEL_BOOKING', payload: id });
    try {
      await cancelTransportBookingAPI(id);
    } catch (error) {
      console.error('Failed to cancel booking in DB', error);
    }
  }, [user]);

  return (
    <TransportContext.Provider value={{ state, loadBookings, addBooking, cancelBooking }}>
      {children}
    </TransportContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// CUSTOM HOOK
// ---------------------------------------------------------------------------

export const useTransport = (): TransportContextValue => {
  const context = useContext(TransportContext);
  if (!context) {
    throw new Error('useTransport must be used within a <TransportProvider>.');
  }
  return context;
};

export default TransportContext;
