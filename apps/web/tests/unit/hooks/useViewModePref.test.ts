import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useViewModePref } from "../../../src/hooks/useViewModePref";

const STORAGE_KEY = "bpl_league_activity_view_mode";

/**
 * In-memory localStorage mock — happy-dom + Node 22 ont un comportement
 * instable autour de `window.localStorage` selon les versions. On force un
 * shim minimal sur `globalThis.localStorage` pour rendre les assertions
 * déterministes.
 */
function createMemoryStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      store = {};
    },
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    removeItem(key: string) {
      delete store[key];
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
  };
}

describe("useViewModePref", () => {
  let memoryStorage: Storage;

  beforeEach(() => {
    memoryStorage = createMemoryStorage();
    vi.stubGlobal("localStorage", memoryStorage);
  });

  it("should fall back to default mode when localStorage is empty", () => {
    const { result } = renderHook(() => useViewModePref("grouped"));
    expect(result.current[0]).toBe("grouped");
  });

  it("should fall back to default mode when stored value is invalid", () => {
    memoryStorage.setItem(STORAGE_KEY, "not-a-mode");
    const { result } = renderHook(() => useViewModePref("timeline"));
    expect(result.current[0]).toBe("timeline");
  });

  it("should read 'grouped' from localStorage and override default", () => {
    memoryStorage.setItem(STORAGE_KEY, "grouped");
    const { result } = renderHook(() => useViewModePref("timeline"));
    expect(result.current[0]).toBe("grouped");
  });

  it("should read 'timeline' from localStorage and override default", () => {
    memoryStorage.setItem(STORAGE_KEY, "timeline");
    const { result } = renderHook(() => useViewModePref("grouped"));
    expect(result.current[0]).toBe("timeline");
  });

  it("should persist update to localStorage", () => {
    const { result } = renderHook(() => useViewModePref("grouped"));
    act(() => {
      result.current[1]("timeline");
    });
    expect(result.current[0]).toBe("timeline");
    expect(memoryStorage.getItem(STORAGE_KEY)).toBe("timeline");
  });

  it("should toggle between modes", () => {
    const { result } = renderHook(() => useViewModePref("grouped"));
    act(() => {
      result.current[1]("timeline");
    });
    act(() => {
      result.current[1]("grouped");
    });
    expect(result.current[0]).toBe("grouped");
    expect(memoryStorage.getItem(STORAGE_KEY)).toBe("grouped");
  });
});
