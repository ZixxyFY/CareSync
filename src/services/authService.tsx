// src/services/authService.tsx
/**
 * @file authService.tsx
 * @description Authentication service layer for CareSync.
 *
 * SOLID Principle: Single Responsibility — this file ONLY handles external
 * auth-related network calls (login, signup, logout). The AuthContext calls
 * these functions; it never owns the logic of how authentication works.
 *
 * SOLID Principle: Dependency Inversion — consumers (AuthContext) depend on
 * the abstraction (function signature), not on the concrete HTTP implementation
 * inside these functions.
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id - Unique user identifier (e.g., "101")
 * @property {string} name - User's full display name
 * @property {string} email - User's registered email address
 * @property {string} role - The user's role within CareSync (e.g., "Caregiver", "Patient")
 * @property {string} token - JWT access token for authenticated API requests
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------

/**
 * Authenticates an existing user with email and password.
 *
 * In production, this would POST to `/auth/login` on your backend.
 * Currently simulates a 1-second network round-trip and returns mock data.
 *
 * @param {string} email - The user's registered email address.
 * @param {string} password - The user's plaintext password (sent over HTTPS).
 * @returns {Promise<UserProfile>} Resolves with the authenticated user's profile.
 * @throws {Error} If credentials are invalid or the network request fails.
 */
export const loginUserAPI = async (
  email: string,
  password: string
): Promise<UserProfile> => {
  // Simulate a realistic 1-second network round-trip
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock credential check (replace with: const res = await api.post('/auth/login', { email, password }))
  if (email && password.length >= 6) {
    return {
      id: '101',
      name: 'Neeraj Sahu',
      email,
      role: 'Caregiver',
      token: 'mock-jwt-token-caresync-xyz-2026',
    };
  }

  throw new Error('Invalid credentials. Password must be at least 6 characters.');
};

// ---------------------------------------------------------------------------
// SIGNUP
// ---------------------------------------------------------------------------

/**
 * Registers a new user with name, email, password, and role.
 *
 * In production, this would POST to `/auth/register` on your backend.
 * Currently simulates a 1.2-second network round-trip.
 *
 * @param {string} name - The new user's full name.
 * @param {string} email - The new user's email address.
 * @param {string} password - The chosen password (min 6 chars).
 * @param {string} role - The user's role ("Patient" | "Caregiver" | "Provider").
 * @returns {Promise<UserProfile>} Resolves with the newly created user's profile.
 * @throws {Error} If the email is already registered or registration fails.
 */
export const signupUserAPI = async (
  name: string,
  email: string,
  password: string,
  role: string
): Promise<UserProfile> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // Mock: in a real app, the backend would check for duplicate emails
  if (name && email && password.length >= 6) {
    return {
      id: Date.now().toString(),
      name,
      email,
      role,
      token: `mock-jwt-signup-${Date.now()}`,
    };
  }

  throw new Error('Registration failed. Please check your details and try again.');
};

// ---------------------------------------------------------------------------
// LOGOUT (token invalidation)
// ---------------------------------------------------------------------------

/**
 * Invalidates the user's session token on the server.
 * In production, this would POST to `/auth/logout` with the Bearer token.
 * The AuthContext clears the local user state after this call resolves.
 *
 * @returns {Promise<void>}
 */
export const logoutUserAPI = async (): Promise<void> => {
  // Simulate server-side token revocation (fire-and-forget is acceptable for logout)
  await new Promise((resolve) => setTimeout(resolve, 300));
  // In production: await api.post('/auth/logout');
};