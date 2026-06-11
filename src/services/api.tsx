// src/services/api.tsx
/**
 * @file api.tsx
 * @description Centralized Axios HTTP client for CareSync.
 *
 * SOLID Principle: Single Responsibility — this file is solely responsible for
 * configuring and exporting the shared HTTP client. All services use this
 * instance, ensuring interceptors, timeouts, and base URLs are applied once.
 *
 * The request interceptor can be extended to attach the JWT token from
 * AsyncStorage for authenticated endpoints without modifying any service file
 * (Open/Closed Principle).
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// ---------------------------------------------------------------------------
// BASE CLIENT CONFIGURATION
// ---------------------------------------------------------------------------

const api: AxiosInstance = axios.create({
  /**
   * Base URL for the CareSync backend.
   * Replace with your production server URL before deployment.
   * Using DummyJSON as a realistic placeholder for development.
   */
  baseURL: 'https://dummyjson.com',
  /** Network timeout in milliseconds (10 seconds) */
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---------------------------------------------------------------------------
// REQUEST INTERCEPTOR
// ---------------------------------------------------------------------------

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    /**
     * Attach the JWT token here when you integrate AsyncStorage.
     * Example:
     *   const token = await AsyncStorage.getItem('authToken');
     *   if (token) config.headers.Authorization = `Bearer ${token}`;
     */
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// RESPONSE INTERCEPTOR
// ---------------------------------------------------------------------------

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    /**
     * Global error normalization. In production, you'd check for 401 here
     * to trigger a token refresh or force logout via AuthContext.
     */
    const message =
      (error.response?.data as any)?.message ||
      error.message ||
      'An unexpected network error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default api;