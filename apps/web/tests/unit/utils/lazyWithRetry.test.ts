import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isChunkLoadError, reloadForStaleChunk } from '@/utils/lazyWithRetry';

const mockReload = vi.fn();

Object.defineProperty(window, 'location', {
  value: { ...window.location, reload: mockReload },
  writable: true,
});

describe('isChunkLoadError', () => {
  it('matches a failed dynamic import (Chromium message)', () => {
    expect(
      isChunkLoadError(
        new Error(
          'Failed to fetch dynamically imported module: https://app/assets/UserProfile-abc.js',
        ),
      ),
    ).toBe(true);
  });

  it('matches the MIME mismatch (404 served index.html as text/html)', () => {
    expect(
      isChunkLoadError(
        new Error(
          'Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html".',
        ),
      ),
    ).toBe(true);
  });

  it('matches the Safari/Firefox import wording', () => {
    expect(
      isChunkLoadError(new Error('error loading dynamically imported module')),
    ).toBe(true);
    expect(
      isChunkLoadError(new Error('Importing a module script failed.')),
    ).toBe(true);
  });

  it('matches by error name (webpack-style ChunkLoadError)', () => {
    const err = new Error('whatever');
    err.name = 'ChunkLoadError';
    expect(isChunkLoadError(err)).toBe(true);
  });

  it('ignores unrelated errors and non-Error values', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of null'))).toBe(false);
    expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});

describe('reloadForStaleChunk', () => {
  beforeEach(() => {
    mockReload.mockClear();
    window.sessionStorage.clear();
  });

  it('reloads once and records the attempt', () => {
    expect(reloadForStaleChunk()).toBe(true);
    expect(mockReload).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem('bpl:stale-chunk-reload-ts')).toBeTruthy();
  });

  it('throttles a second reload within the window', () => {
    reloadForStaleChunk();
    mockReload.mockClear();

    expect(reloadForStaleChunk()).toBe(false);
    expect(mockReload).not.toHaveBeenCalled();
  });

  it('reloads again once the throttle window has elapsed', () => {
    reloadForStaleChunk();
    // Backdate the recorded timestamp past the 10s throttle window.
    window.sessionStorage.setItem(
      'bpl:stale-chunk-reload-ts',
      String(Date.now() - 11_000),
    );
    mockReload.mockClear();

    expect(reloadForStaleChunk()).toBe(true);
    expect(mockReload).toHaveBeenCalledTimes(1);
  });
});
