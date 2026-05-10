/**
 * Single entry point for app bootstrap.
 *
 * Each app (web / mobile) calls this exactly once at startup, before
 * any service in `@elofight/shared/services/*` is imported.
 */

import { initEnv, type RuntimeEnv } from './env';
import { initStorage, type KVStorage } from './storage';
import {
  configureSupabaseClient,
  type AuthStorageAdapter,
} from '../lib/supabase';
import { _initBaseRepositoryClient } from '../services/repositories/_base';

const _afterInitListeners: Array<() => void> = [];

/**
 * Register a callback that runs at the end of `initShared()`. Used by
 * compatibility shims (e.g. the web `lib/supabase.ts` re-export) that
 * need to capture the resolved client lazily.
 *
 * Listeners registered after `initShared()` has already run fire
 * immediately.
 */
let _initialized = false;
export function onSharedInit(fn: () => void): void {
  if (_initialized) {
    fn();
  } else {
    _afterInitListeners.push(fn);
  }
}

export interface InitSharedOptions extends RuntimeEnv {
  /** Storage used by services for app-level persistence (LocalUser, premium fallback, ...). */
  storage: KVStorage;
  /** Storage used by Supabase Auth itself for sessions. Defaults to `storage`. */
  authStorage?: AuthStorageAdapter;
  /** True only on the web — Supabase reads magic-link tokens from URL. */
  detectSessionInUrl?: boolean;
}

export function initShared(options: InitSharedOptions): void {
  const {
    storage,
    authStorage,
    detectSessionInUrl,
    ...env
  } = options;

  initEnv(env);
  initStorage(storage);
  configureSupabaseClient({
    authStorage: authStorage ?? storage,
    detectSessionInUrl: detectSessionInUrl ?? false,
  });
  _initBaseRepositoryClient();
  _initialized = true;
  while (_afterInitListeners.length > 0) {
    const fn = _afterInitListeners.shift();
    fn?.();
  }
}
