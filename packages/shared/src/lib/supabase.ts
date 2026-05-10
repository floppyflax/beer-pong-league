/**
 * Supabase client factory — lazy, memoized.
 *
 * Reads `RuntimeEnv` set by `initShared()`. Each app injects the
 * appropriate auth storage adapter (web = localStorage; mobile =
 * SecureStore/AsyncStorage) before the first call.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { getEnv, hasEnv } from '../runtime/env';

export interface AuthStorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

interface ClientOptions {
  authStorage?: AuthStorageAdapter;
  /** Web reads OAuth/magic-link tokens from URL. RN does not. */
  detectSessionInUrl?: boolean;
}

let _client: SupabaseClient<Database> | null = null;
let _options: ClientOptions = {};

/**
 * Configure how the supabase client is built. Call this from the app
 * bootstrap (after `initShared()`) to inject auth storage + flags.
 */
export function configureSupabaseClient(options: ClientOptions): void {
  _options = options;
  // Reset memoized client so the new options take effect.
  _client = null;
}

export function getSupabase(): SupabaseClient<Database> | null {
  if (_client) return _client;
  if (!hasEnv()) return null;

  const env = getEnv();
  if (!env.supabaseUrl || !env.supabasePublicKey) return null;

  _client = createClient<Database>(env.supabaseUrl, env.supabasePublicKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: _options.detectSessionInUrl ?? false,
      ...(_options.authStorage ? { storage: _options.authStorage } : {}),
    },
  });

  return _client;
}

export function isSupabaseAvailable(): boolean {
  return getSupabase() !== null;
}

/** Test-only — reset memoized client between unit tests. */
export function _resetSupabaseForTests(): void {
  _client = null;
  _options = {};
}
