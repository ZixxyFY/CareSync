/**
 * @file authService.tsx
 * @description Supabase authentication and user profile business logic.
 */
import { supabase } from '../config/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ---------------------------------------------------------------------------
// HELPER: FETCH EXTENDED PROFILE FROM DATABASE TABLE
// ---------------------------------------------------------------------------
export const fetchUserProfileAPI = async (uid: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', uid)
    .maybeSingle();

  if (error || !data) {
    console.warn("Notice: Fetching user profile returned no data:", error?.message || "User not found in database.");
    return null;
  }

  return data as UserProfile;
};

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------
export const loginUserAPI = async (email: string, password: string): Promise<UserProfile> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) throw new Error(error?.message || "Authentication failed.");

  const profile = await fetchUserProfileAPI(data.user.id);
  if (!profile) throw new Error("User metadata record not found.");

  return profile;
};

// ---------------------------------------------------------------------------
// SIGNUP
// ---------------------------------------------------------------------------
export const signupUserAPI = async (
  name: string,
  email: string,
  password: string,
  role: string
): Promise<UserProfile> => {
  // 1. Register credentials inside Supabase Auth
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !data.user) throw new Error(authError?.message || "Sign up failed.");

  const uid = data.user.id;
  const newProfile: UserProfile = { id: uid, name, email, role };

  // 2. Insert custom record into our custom relational profile table
  const { error: dbError } = await supabase
    .from('users')
    .upsert([newProfile]);

  if (dbError) {
    throw new Error(`Auth succeeded but profile creation failed: ${dbError.message}`);
  }

  return newProfile;
};

// ---------------------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------------------
export const logoutUserAPI = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};