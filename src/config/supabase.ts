/**
 * @file supabase.ts
 * @description Centralized Supabase initialization.
 */
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your actual Supabase URL and Anon Key
const supabaseUrl = 'https://gwgkpmilrbkdpugyvkvi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3Z2twbWlscmJrZHB1Z3l2a3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NzU0NjcsImV4cCI6MjA5NzQ1MTQ2N30.5Fec6fqicxLa_w1PWhSVBepW7TPtjwbNiWkXgyyoCCI';

// Safe wrapper around AsyncStorage to prevent silent hangs
const safeAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const p = AsyncStorage.getItem(key);
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
      return await Promise.race([p, timeout]);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const p = AsyncStorage.setItem(key, value);
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2000));
      await Promise.race([p, timeout]);
    } catch {
      // ignore
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const p = AsyncStorage.removeItem(key);
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2000));
      await Promise.race([p, timeout]);
    } catch {
      // ignore
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeAsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});