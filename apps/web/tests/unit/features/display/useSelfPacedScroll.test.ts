import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSelfPacedScroll } from "@/features/display/hooks/useSelfPacedScroll";

interface MockEl {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

function makeMockRef(scrollHeight: number, clientHeight: number) {
  const el: MockEl = { scrollTop: 0, scrollHeight, clientHeight };
  return { current: el as unknown as HTMLElement };
}

beforeEach(() => {
  vi.useFakeTimers();
  // Mock requestAnimationFrame avec un timing déterministe
  let raf = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    raf++;
    setTimeout(() => cb(performance.now()), 16);
    return raf;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    void id;
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useSelfPacedScroll", () => {
  it("starts in 'idle' phase when disabled", () => {
    const ref = makeMockRef(2000, 600);
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useSelfPacedScroll(ref, { enabled: false, onComplete }),
    );
    expect(result.current).toBe("idle");
  });

  it("transitions hold-top → scrolling → hold-bottom → done when list overflows", () => {
    const ref = makeMockRef(2000, 600);
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useSelfPacedScroll(ref, {
        enabled: true,
        holdTopMs: 100,
        scrollSpeedPxPerSec: 1400,
        holdBottomMs: 50,
        onComplete,
      }),
    );
    expect(result.current).toBe("hold-top");

    // Fin du hold-top → scrolling
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("scrolling");

    // Avance jusqu'à ce que le scroll soit complet : il faut scroller
    // (scrollHeight - clientHeight) = 1400px à 1400px/s = 1s.
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current === "hold-bottom" || result.current === "done").toBe(
      true,
    );

    // Fin du hold-bottom → done + onComplete()
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("done");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("skips scrolling when content fits in viewport", () => {
    const ref = makeMockRef(500, 600); // contenu < viewport
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useSelfPacedScroll(ref, {
        enabled: true,
        holdTopMs: 100,
        scrollSpeedPxPerSec: 30,
        holdBottomMs: 500,
        onComplete,
      }),
    );
    expect(result.current).toBe("hold-top");

    // Fin du hold-top → skip vers hold-bottom (pas de scrolling)
    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(result.current).toBe("hold-bottom");

    // Fin du hold-bottom → done
    act(() => {
      vi.advanceTimersByTime(550);
    });
    expect(result.current).toBe("done");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("calls onComplete via ref so changes to the callback don't reset the cycle", () => {
    // S'assure que passer une nouvelle fonction onComplete sans changer
    // d'autres deps ne provoque pas de re-init du cycle.
    const ref = makeMockRef(300, 500); // skip scrolling
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const { result, rerender } = renderHook(
      ({ cb }: { cb: () => void }) =>
        useSelfPacedScroll(ref, {
          enabled: true,
          holdTopMs: 100,
          holdBottomMs: 50,
          onComplete: cb,
        }),
      { initialProps: { cb: cb1 } },
    );
    expect(result.current).toBe("hold-top");

    // On change la callback en cours de cycle
    rerender({ cb: cb2 });

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(cb1).toHaveBeenCalledTimes(0);
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});
