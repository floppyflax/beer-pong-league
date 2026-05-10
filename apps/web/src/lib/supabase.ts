/**
 * Web shim — exposes the shared Supabase client via the legacy
 * `import { supabase } from '../lib/supabase'` API.
 *
 * The actual client is created in `@elofight/shared/lib/supabase` and
 * resolved lazily once `initShared()` runs in `main.tsx`. We capture
 * the value via `onSharedInit` so existing call sites keep using
 * `if (!supabase)` truthy checks unchanged.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getSupabase,
  isSupabaseAvailable as sharedIsSupabaseAvailable,
  onSharedInit,
} from '@elofight/shared';
import type { Database } from '../types/supabase';

export let supabase: SupabaseClient<Database> | null = null;

onSharedInit(() => {
  supabase = getSupabase();
  if (!supabase) {
    console.warn(
      'Supabase not configured. App will work in offline mode (localStorage only). ' +
        'To enable Supabase sync, create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLIC_KEY',
    );
  }
});

export const isSupabaseAvailable = sharedIsSupabaseAvailable;
