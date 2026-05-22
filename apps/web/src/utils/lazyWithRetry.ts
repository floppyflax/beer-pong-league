import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const RELOAD_TS_KEY = "bpl:stale-chunk-reload-ts";
const RELOAD_THROTTLE_MS = 10_000;

/**
 * A dynamic-import / chunk-load failure. After a deploy, old hashed chunks
 * 404 and the Vercel SPA rewrite serves index.html (text/html), so the
 * browser refuses the module. Messages differ across engines, hence the
 * broad matching.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "ChunkLoadError") return true;
  const message = error.message.toLowerCase();
  return (
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("error loading dynamically imported module") ||
    message.includes("importing a module script failed") ||
    // MIME mismatch: the 404'd chunk is served the SPA index.html (text/html)
    message.includes("expected a javascript")
  );
}

/**
 * Force a one-time full reload to recover from a stale-deploy chunk error,
 * throttled via sessionStorage so a genuinely unrecoverable failure (e.g.
 * offline) can't loop. Returns true if a reload was triggered.
 */
export function reloadForStaleChunk(): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_TS_KEY) ?? 0);
    if (Date.now() - last < RELOAD_THROTTLE_MS) return false;
    window.sessionStorage.setItem(RELOAD_TS_KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable — proceed with the reload anyway.
  }
  window.location.reload();
  return true;
}

/**
 * Drop-in replacement for React.lazy that survives stale-deploy chunk errors.
 * On a chunk-load failure it retries the import once (covers a transient
 * network blip); if that also fails the bundle has almost certainly changed
 * under an open tab, so it forces a reload to pull the fresh index.html and
 * its new chunk hashes. The `Record<string, never>` bound accepts any
 * propless route component (plain or `React.FC`) without resorting to `any`.
 */
export function lazyWithRetry<T extends ComponentType<Record<string, never>>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      if (!isChunkLoadError(error)) throw error;
      try {
        return await factory();
      } catch (retryError) {
        if (!isChunkLoadError(retryError)) throw retryError;
        if (reloadForStaleChunk()) {
          // Keep the Suspense fallback visible during reload instead of
          // flashing the error boundary.
          return new Promise<{ default: T }>(() => {});
        }
        throw retryError;
      }
    }
  });
}
