/**
 * KV storage abstraction — apps inject the platform impl at boot.
 *
 * Web: `localStorage` (sync). Mobile: `expo-secure-store` or
 * `AsyncStorage` (async). The interface is async-compatible — every
 * service awaits even when the underlying impl is sync, so callers
 * don't branch on platform.
 */

export interface KVStorage {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

let _storage: KVStorage | null = null;

export function initStorage(impl: KVStorage): void {
  _storage = impl;
}

export function getStorage(): KVStorage {
  if (!_storage) {
    throw new Error(
      'shared storage not initialized — call initShared() at app boot before importing services',
    );
  }
  return _storage;
}

export function hasStorage(): boolean {
  return _storage !== null;
}

/**
 * Adapter so `localStorage` can be passed as-is. The DOM type is
 * sync-only; we wrap it to satisfy KVStorage's promise-friendly
 * signatures while remaining synchronous.
 */
export function storageFromLocalStorage(ls: Storage): KVStorage {
  return {
    getItem: (key) => ls.getItem(key),
    setItem: (key, value) => {
      ls.setItem(key, value);
    },
    removeItem: (key) => {
      ls.removeItem(key);
    },
  };
}

/** Test-only — reset internal state between unit tests. */
export function _resetStorageForTests(): void {
  _storage = null;
}
