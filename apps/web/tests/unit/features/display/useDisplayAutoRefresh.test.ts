import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDisplayAutoRefresh } from "@/features/display/hooks/useDisplayAutoRefresh";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
}

describe("useDisplayAutoRefresh", () => {
  it("calls reloadData on each interval tick", async () => {
    setVisibility("visible");
    const reload = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useDisplayAutoRefresh(reload, { intervalMs: 1000 }));

    expect(reload).toHaveBeenCalledTimes(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(reload).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("clears the interval on unmount", async () => {
    setVisibility("visible");
    const reload = vi.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() =>
      useDisplayAutoRefresh(reload, { intervalMs: 1000 }),
    );
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(reload).toHaveBeenCalledTimes(0);
  });

  it("skips the tick when the tab is hidden", async () => {
    setVisibility("hidden");
    const reload = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useDisplayAutoRefresh(reload, { intervalMs: 1000 }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(reload).toHaveBeenCalledTimes(0);
  });

  it("does not overlap when a reload is still in flight", async () => {
    setVisibility("visible");
    let resolveReload: (() => void) | null = null;
    const reload = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveReload = resolve;
        }),
    );
    renderHook(() => useDisplayAutoRefresh(reload, { intervalMs: 1000 }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(reload).toHaveBeenCalledTimes(1);

    // 2e tick alors que le 1er n'a pas résolu → skip
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(reload).toHaveBeenCalledTimes(1);

    // résout le 1er, puis le tick suivant relance
    await act(async () => {
      resolveReload?.();
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("does nothing when disabled", async () => {
    setVisibility("visible");
    const reload = vi.fn().mockResolvedValue(undefined);
    renderHook(() =>
      useDisplayAutoRefresh(reload, { intervalMs: 1000, enabled: false }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(reload).toHaveBeenCalledTimes(0);
  });
});
