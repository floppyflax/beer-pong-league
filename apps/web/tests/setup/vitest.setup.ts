import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';
import { initShared, storageFromLocalStorage } from '@elofight/shared';

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
