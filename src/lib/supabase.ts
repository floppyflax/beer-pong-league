import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublicKey = import.meta.env.VITE_SUPABASE_PUBLIC_KEY;

// Create Supabase client only if environment variables are available
// This allows the app to work in offline mode (localStorage only)
export const supabase: SupabaseClient<Database> | null = 
  supabaseUrl && supabasePublicKey
    ? createClient<Database>(supabaseUrl, supabasePublicKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : null;

/** Project-context: Check Supabase availability before operations */
export const isSupabaseAvailable = (): boolean => !!supabase;

// Log warning if Supabase is not configured (but don't block the app)
if (!supabase) {
  console.warn(
    'Supabase not configured. App will work in offline mode (localStorage only). ' +
    'To enable Supabase sync, create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLIC_KEY'
  );
}


