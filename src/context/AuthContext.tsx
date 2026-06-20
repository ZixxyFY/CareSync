import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { fetchUserProfileAPI, UserProfile } from '../services/authService';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const withTimeout = <T,>(promise: Promise<T>, operationName: string, timeoutMs = 15000): Promise<T> => {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Network request timed out during: ${operationName}. Please check your internet connection or firewall settings.`));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutHandle));
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true only during initial session check

  // ─── SUPABASE SESSION LISTENER ─────────────────────────────────────
  useEffect(() => {
    // 1. Check if there's an existing session when app opens
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchUserProfileAPI(session.user.id);
          if (profile) setUser(profile);
        }
      } catch (e) {
        console.warn('[AuthContext] Initial session check failed:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialSession();

    // 2. Listen for future auth events (token refresh, sign-out from another tab, etc.)
    //    NOTE: We intentionally do NOT handle SIGNED_IN here for login/signup —
    //    those flows set user directly to avoid the race condition where
    //    onAuthStateChange fires before the profile row is inserted.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Re-fetch profile on token refresh silently (user already set)
        const profile = await fetchUserProfileAPI(session.user.id);
        if (profile) setUser(profile);
        return;
      }

      // INITIAL_SESSION is handled by checkInitialSession above — skip duplicate
      // SIGNED_IN during login is handled directly in the login() action below
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── LOGIN ─────────────────────────────────────────────────────────
  /**
   * Directly calls Supabase signInWithPassword, then fetches the profile.
   * Does NOT rely on onAuthStateChange to avoid race conditions.
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    console.log('[AuthContext] Starting login for email:', email);
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      'Sign In'
    );
    console.log('[AuthContext] signInWithPassword returned. Error:', error?.message);
    if (error || !data.user) throw new Error(error?.message || 'Authentication failed.');

    console.log('[AuthContext] Fetching user profile for id:', data.user.id);
    const profile = await withTimeout(
      fetchUserProfileAPI(data.user.id),
      'Fetch Profile (Database)'
    );
    console.log('[AuthContext] fetchUserProfileAPI returned:', profile);
    if (!profile) {
      // Profile row missing — create a minimal one so the user can still get in
      const fallback: UserProfile = {
        id: data.user.id,
        name: data.user.email?.split('@')[0] ?? 'User',
        email: data.user.email ?? email,
        role: 'Patient',
      };
      setUser(fallback);
      return;
    }
    setUser(profile);
  }, []);

  // ─── SIGNUP ────────────────────────────────────────────────────────
  /**
   * Creates the Supabase auth user AND inserts the profile row in one atomic sequence,
   * then sets user directly — avoiding both the race condition (onAuthStateChange firing
   * before the upsert completes) and email-confirmation limbo.
   */
  const signup = useCallback(async (
    name: string,
    email: string,
    password: string,
    role: string
  ): Promise<void> => {
    console.log('[AuthContext] Starting signup for email:', email);
    // Step 1: Create auth account
    const { data, error: authError } = await withTimeout(
      supabase.auth.signUp({ email, password }),
      'Sign Up'
    );
    
    console.log('[AuthContext] signUp returned. Error:', authError?.message, 'Data:', data);

    if (authError) throw new Error(authError.message);
    if (!data.user) throw new Error('Sign up succeeded but no user was returned. Please try again.');

    const uid = data.user.id;
    const newProfile: UserProfile = { id: uid, name, email, role };

    console.log('[AuthContext] Upserting profile into users table:', newProfile);
    // Step 2: Insert profile row
    const { error: dbError } = await withTimeout(
      supabase.from('users').upsert([newProfile]),
      'Create Profile (Database)'
    );
    
    console.log('[AuthContext] upsert returned. Error:', dbError?.message);
    if (dbError) {
      // Clean up the auth account to avoid orphaned records
      await supabase.auth.signOut();
      throw new Error(
        `Account created but profile setup failed: ${dbError.message}\n\n` +
        'Hint: Check that the "users" table exists in Supabase and RLS policies allow inserts.'
      );
    }

    // Step 3: Set user directly — do NOT wait for onAuthStateChange
    setUser(newProfile);
  }, []);

  // ─── LOGOUT ────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an <AuthProvider>.');
  return context;
};

export default AuthContext;