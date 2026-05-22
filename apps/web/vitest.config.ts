import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    // Exclure les tests E2E (ils utilisent Playwright, pas Vitest)
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Align test resolution with vite.config.ts so unit tests exercise the
      // live shared source (not a stale/cached copy) — required for the
      // context-aware ELO K-factor (mig 033) to be picked up in tests.
      '@elofight/shared': path.resolve(__dirname, '../../packages/shared/src')
    }
  }
});
