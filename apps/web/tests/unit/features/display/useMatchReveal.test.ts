import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Match } from "@/types";
import type {
  DisplaySource,
  DisplaySourcePlayer,
} from "@/features/display/types";
import { useMatchReveal } from "@/features/display/hooks/useMatchReveal";

// jsdom n'a pas AudioContext → la sonnerie est un no-op (testé indirectement).

function player(id: string, rank: number, eloDelta?: number): DisplaySourcePlayer {
  return {
    id,
    name: id.toUpperCase(),
    elo: 1100 - rank,
    rank,
    eloDelta,
    wins: 0,
    losses: 0,
    winRate: 0,
    recentResults: [],
  };
}

function match(id: string, teamA: string[], teamB: string[]): Match {
  return {
    id,
    date: new Date().toISOString(),
    teamA,
    teamB,
    scoreA: 10,
    scoreB: 4,
    eloChanges: {},
  };
}

function makeSource(
  players: DisplaySourcePlayer[],
  matches: Match[],
): DisplaySource {
  return {
    kind: "league",
    name: "T",
    joinUrl: "",
    isLive: true,
    players,
    matches,
    matchesPlayedCount: matches.length,
    isLoading: false,
    sourceId: "x",
    exitPath: "/",
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useMatchReveal", () => {
  it("is idle initially and exposes the source order", () => {
    const P0 = [player("a", 1), player("b", 2)];
    const src = makeSource(P0, [match("m1", ["a"], ["b"])]);
    const { result } = renderHook(
      ({ s }) => useMatchReveal(s),
      { initialProps: { s: src as DisplaySource | null } },
    );
    expect(result.current.phase).toBe("idle");
    expect(result.current.active).toBe(false);
    expect(result.current.committedPlayers).toEqual(P0);
    expect(result.current.blur).toBe(false);
  });

  it("runs alert → reveal → idle on a new match, with blur + focus visiting", () => {
    const P0 = [player("a", 1), player("b", 2)];
    const src0 = makeSource(P0, [match("m1", ["a"], ["b"])]);
    const { result, rerender } = renderHook(
      ({ s }: { s: DisplaySource | null }) => useMatchReveal(s),
      { initialProps: { s: src0 } },
    );

    // Nouveau match m2 : a (gagnant) reste 1, b (perdant) reste 2.
    const P1 = [player("a", 1, 12), player("b", 2, -12)];
    const src1 = makeSource(P1, [match("m2", ["a"], ["b"]), match("m1", ["a"], ["b"])]);
    rerender({ s: src1 });

    // Phase ALERT : blur + alertMatch + actif
    expect(result.current.phase).toBe("alert");
    expect(result.current.blur).toBe(true);
    expect(result.current.alertMatch?.id).toBe("m2");
    expect(result.current.active).toBe(true);
    expect(result.current.blinkMatchId).toBe("m2");

    // Fin de l'alerte (~3.5s) → REVEAL : commit + surbrillance, plus de blur
    act(() => {
      vi.advanceTimersByTime(3_600);
    });
    expect(result.current.phase).toBe("reveal");
    expect(result.current.blur).toBe(false);
    expect([...result.current.highlightedPlayerIds].sort()).toEqual(["a", "b"]);

    // Visite : focus d'abord le vainqueur (a), puis le perdant (b)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.focusedPlayerId).toBe("a");
    act(() => {
      vi.advanceTimersByTime(1_900);
    });
    expect(result.current.focusedPlayerId).toBe("b");

    // Fin → idle, plus de surbrillance ni focus, rotation reprend
    act(() => {
      vi.advanceTimersByTime(1_900 + 1_500);
    });
    expect(result.current.phase).toBe("idle");
    expect(result.current.active).toBe(false);
    expect(result.current.focusedPlayerId).toBeNull();
    expect(result.current.highlightedPlayerIds.size).toBe(0);
  });

  it("toggles sound with the M key", () => {
    const src = makeSource([player("a", 1)], [match("m1", ["a"], ["b"])]);
    const { result } = renderHook(() => useMatchReveal(src));
    expect(result.current.soundOn).toBe(true);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "m" }));
    });
    expect(result.current.soundOn).toBe(false);
  });
});
