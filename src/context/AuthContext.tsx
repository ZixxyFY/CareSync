// src/context/AuthContext.tsx
/**
 * @file AuthContext.tsx
 * @description Global authentication state management for CareSync.
 *
 * SOLID Principle: Single Responsibility — this context manages ONLY the
 * authentication lifecycle (login, signup, logout). It does NOT manage
 * appointments, medical records, or UI state.
 *
 * SOLID Principle: Dependency Inversion — the context depends on the
 * authService abstraction, not on axios or any HTTP library directly.
 *
 * Data Flow: UI Component → useAuth() hook → AuthContext → authService → (mock) API
 */

import React, { createContext, useState, useContext, useCallback } from 'react';
import { loginUserAPI, signupUserAPI, logoutUserAPI, UserProfile } from '../services/authService';

// ---------------------------------------------------------------------------
// TYPE DEFINITIONS
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} AuthContextValue
 * Defines the shape of the value provided by AuthContext.
 *
 * @property {UserProfile | null} user - The currently authenticated user, or null.
 * @property {boolean} isLoading - True while an auth request is in-flight.
 * @property {Function} login - Authenticates a user with email + password.
 * @property {Function} signup - Registers a new user.
 * @property {Function} logout - Signs out the current user and clears state.
 */
interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// CONTEXT CREATION
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// PROVIDER COMPONENT
// ---------------------------------------------------------------------------

/**
 * AuthProvider wraps the application root to supply authentication state
 * globally. Any descendant can access auth via the `useAuth()` hook.
 *
 * @param {{ children: React.ReactNode }} props
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Authenticates an existing user. Calls the authService and updates
   * the global user state on success, which triggers the root navigator
   * to switch from UnauthorizedNav → AuthorizedNav automatically.
   *
   * @param {string} email
   * @param {string} password
   * @throws {Error} Rethrows service errors so the UI can display them in an Alert.
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const userData = await loginUserAPI(email, password);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Registers a new user account. On success, updates global state to
   * automatically switch to the authorized navigation flow.
   *
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @param {string} role
   * @throws {Error} Rethrows service errors for UI handling.
   */
  const signup = useCallback(
    async (name: string, email: string, password: string, role: string): Promise<void> => {
      setIsLoading(true);
      try {
        const userData = await signupUserAPI(name, email, password, role);
        setUser(userData);
      } catch (error: any) {
        throw new Error(error.message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Signs out the current user. Calls the service to invalidate the token
   * server-side, then clears local state, returning the app to UnauthorizedNav.
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await logoutUserAPI();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const contextValue: AuthContextValue = {
    user,
    isLoading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// CUSTOM HOOK
// ---------------------------------------------------------------------------

/**
 * Custom hook to consume the AuthContext.
 * Throws a descriptive error if used outside of an AuthProvider, helping
 * developers catch misconfigured component trees during development.
 *
 * @returns {AuthContextValue}
 * @throws {Error} If called outside an AuthProvider.
 *
 * @example
 * const { user, login, logout } = useAuth();
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>. Check your component tree.');
  }
  return context;
};

export default AuthContext;