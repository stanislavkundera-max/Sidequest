import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as
  | { supabaseUrl?: string; supabaseAnonKey?: string }
  | undefined;

/** Prefer first non-empty value. `??` alone is wrong here: `extra` may be `''`, which blocks `process.env` fallbacks. */
function firstNonEmpty(...candidates: (string | undefined)[]): string {
  for (const c of candidates) {
    const t = typeof c === 'string' ? c.trim() : '';
    if (t.length > 0) return t;
  }
  return '';
}

const supabaseUrl = firstNonEmpty(
  extra?.supabaseUrl,
  process.env.EXPO_PUBLIC_SUPABASE_URL
);
const supabaseAnonKey = firstNonEmpty(
  extra?.supabaseAnonKey,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Expo Web static/SSR runs in Node where `window` is undefined. AsyncStorage
 * touches `window` and crashes Metro's prerender — use in-memory storage there only.
 * In the browser and on native, AsyncStorage persists the session as usual.
 */
function createAuthStorage() {
  if (typeof window === 'undefined') {
    const memory = new Map<string, string>();
    return {
      getItem: async (key: string) => memory.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: async (key: string) => {
        memory.delete(key);
      },
    };
  }
  return AsyncStorage;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createAuthStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/** Shown when URL/key are missing or empty (same copy as sign-in). */
export const SUPABASE_CONFIGURE_HELP =
  'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (see .env.example), then restart Expo.';
