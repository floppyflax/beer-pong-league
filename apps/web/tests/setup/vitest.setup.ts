import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';
// Import from submodules, NOT the '@elofight/shared' barrel. The barrel
// eagerly re-exports every service (authService, premiumService, …), which
// would load them during setup — before any test-file vi.mock runs — leaving
// those service mocks bound too late. Pulling only the runtime entrypoints
// keeps services unloaded until each test imports them (post-mock).
import { initShared } from '@elofight/shared/runtime/init';
import { storageFromLocalStorage } from '@elofight/shared/runtime/storage';

// Node 22+ ships an experimental global `localStorage` that is unusable
// without the `--localstorage-file` flag, so happy-dom skips installing its
// own implementation when it sees one already on the global. The net result
// in this environment is `window.localStorage === undefined`, which breaks
// both direct `localStorage.*` access in app code and the shared runtime's
// storage adapter (`storageFromLocalStorage`). Install a real in-memory
// implementation so tests behave like a browser. Defined as a configurable +
// writable data property so individual tests can still `vi.stubGlobal` it.
function createMemoryStorage(): Storage {
  let store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store = new Map();
    },
    getItem(key: string) {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  } as Storage;
}

Object.defineProperty(globalThis, 'localStorage', {
  value: createMemoryStorage(),
  writable: true,
  configurable: true,
});

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
    storage: storageFromLocalStorage(window.localStorage),
    detectSessionInUrl: false,
  });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
