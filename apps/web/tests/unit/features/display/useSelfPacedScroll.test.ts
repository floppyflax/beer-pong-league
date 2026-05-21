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
});

afterEach(() => {
  vi.useRealTimers();
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
    // overflow = 1400, speed 1400px/s → scrollMs = 1000.
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

    // Pendant hold-top
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(result.current).toBe("hold-top");

    // Entre dans scrolling après holdTopMs
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("scrolling");
    expect((ref.current as unknown as MockEl).scrollTop).toBeGreaterThan(0);

    // hold-bottom après la fin du scroll (holdTop 100 + scroll 1000 = 1100)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(["hold-bottom", "done"]).toContain(result.current);

    // done + onComplete au timer maître (total = 100 + 1000 + 50 = 1150)
    act(() => {
      vi.advanceTimersByTime(100);
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

    // Après holdTopMs : pas de scrolling, on passe direct à hold-bottom
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("hold-bottom");
    expect(onComplete).not.toHaveBeenCalled();

    // total = holdTop 100 + holdBottom 500 = 600 → done
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe("done");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("completes via the master timer without requestAnimationFrame", () => {
    // Garantit qu'on ne dépend pas de rAF (jamais stubbé ici) : le seul moteur
    // est setTimeout/setInterval. Régression du bug "rotation bloquée".
    const ref = makeMockRef(500, 600);
    const onComplete = vi.fn();
    renderHook(() =>
      useSelfPacedScroll(ref, {
        enabled: true,
        holdTopMs: 200,
        holdBottomMs: 200,
        onComplete,
      }),
    );
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("uses the latest onComplete callback (ref) without resetting the cycle", () => {
    const ref = makeMockRef(300, 500); // skip scrolling
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const { rerender } = renderHook(
      ({ cb }: { cb: () => void }) =>
        useSelfPacedScroll(ref, {
          enabled: true,
          holdTopMs: 100,
          holdBottomMs: 50,
          onComplete: cb,
        }),
      { initialProps: { cb: cb1 } },
    );

    rerender({ cb: cb2 });

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(cb1).toHaveBeenCalledTimes(0);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it("does not run when paused", () => {
    const ref = makeMockRef(2000, 600);
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useSelfPacedScroll(ref, {
        enabled: true,
        paused: true,
        holdTopMs: 100,
        holdBottomMs: 50,
        onComplete,
      }),
    );
    expect(result.current).toBe("idle");
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });
});
