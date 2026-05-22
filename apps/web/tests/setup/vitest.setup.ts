import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';
import { initShared, storageFromLocalStorage } from '@elofight/shared';

// Node 22+ ships an experimental native globalThis.localStorage that returns
// undefined without --localstorage-file, shadowing happy-dom's polyfill. Both
// the shared runtime (getStorage) and direct localStorage callers then crash.
// Install a deterministic in-memory Storage so tests don't depend on the Node
// version or the runner's web-storage support.
class MemoryStorage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

function ensureLocalStorage(): void {
  const current = (globalThis as { localStorage?: Storage }).localStorage;
  if (current && typeof current.getItem === 'function') return;
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}

ensureLocalStorage();

// Boot the shared runtime once for the whole suite — services imported
// by tests (LocalUserService, AuthService, repositories…) call
// getStorage()/getEnv() at module init and throw without this.
beforeAll(() => {
  initShared({
    supabaseUrl: '',
    supabasePublicKey: '',
    isDev: false,
    stripe: null,
    urls: {
      authCallback: 'http://localhost/auth/callback',
      paymentSuccess: 'http://localhost/payment-success',
      paymentCancel: 'http://localhost/payment-cancel',
    },
    storage: storageFromLocalStorage(localStorage),
    detectSessionInUrl: false,
  });
});

// Cleanup after each test — DOM + a fresh storage so tests stay isolated.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
