import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Match } from "@/types";
import type { DisplaySource } from "@/features/display/types";
import { useNewMatchAlert } from "@/features/display/hooks/useNewMatchAlert";

function match(id: string): Match {
  return {
    id,
    date: new Date().toISOString(),
    teamA: ["a"],
    teamB: ["b"],
    scoreA: 10,
    scoreB: 7,
  };
}

function makeSource(matches: Match[]): DisplaySource {
  return {
    kind: "league",
    name: "T",
    joinUrl: "",
    isLive: true,
    players: [],
    matches,
    matchesPlayedCount: matches.length,
    isLoading: false,
    sourceId: "x",
    exitPath: "/",
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useNewMatchAlert", () => {
  it("does not alert on first mount", () => {
    const src = makeSource([match("m1")]);
    const { result } = renderHook(
      ({ s }) => useNewMatchAlert(s),
      { initialProps: { s: src as DisplaySource | null } },
    );
    expect(result.current.alertMatch).toBeNull();
    expect(result.current.soundOn).toBe(true);
  });

  it("raises an alert when a new match arrives, then clears it", () => {
    const src0 = makeSource([match("m1")]);
    const { result, rerender } = renderHook(
      ({ s }: { s: DisplaySource | null }) => useNewMatchAlert(s),
      { initialProps: { s: src0 } },
    );
    expect(result.current.alertMatch).toBeNull();

    const src1 = makeSource([match("m2"), match("m1")]);
    rerender({ s: src1 });
    expect(result.current.alertMatch?.id).toBe("m2");

    act(() => {
      vi.advanceTimersByTime(3300);
    });
    expect(result.current.alertMatch).toBeNull();
  });

  it("toggles sound with the M key", () => {
    const src = makeSource([match("m1")]);
    const { result } = renderHook(() => useNewMatchAlert(src));
    expect(result.current.soundOn).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "m" }));
    });
    expect(result.current.soundOn).toBe(false);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "M" }));
    });
    expect(result.current.soundOn).toBe(true);
  });

  it("does not crash when audio is unavailable (jsdom has no AudioContext)", () => {
    const src0 = makeSource([match("m1")]);
    const { rerender } = renderHook(
      ({ s }: { s: DisplaySource | null }) => useNewMatchAlert(s),
      { initialProps: { s: src0 } },
    );
    // arme l'audio (no-op en jsdom) puis nouveau match → playChime no-op
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }));
    });
    const src1 = makeSource([match("m2"), match("m1")]);
    expect(() => rerender({ s: src1 })).not.toThrow();
  });
});
