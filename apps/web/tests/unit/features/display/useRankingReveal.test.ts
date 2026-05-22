import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Match } from "@/types";
import type {
  DisplaySource,
  DisplaySourcePlayer,
} from "@/features/display/types";
import { useRankingReveal } from "@/features/display/hooks/useRankingReveal";

function player(id: string, rank: number, eloDelta?: number): DisplaySourcePlayer {
  return {
    id,
    name: id.toUpperCase(),
    elo: 1000 + (10 - rank),
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
    scoreB: 7,
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

describe("useRankingReveal", () => {
  it("returns source order initially, no highlight/blink", () => {
    const P0 = [player("a", 1), player("b", 2)];
    const src = makeSource(P0, [match("m1", ["a"], ["b"])]);
    const { result } = renderHook(
      ({ s, scene }) => useRankingReveal(s, scene),
      { initialProps: { s: src as DisplaySource | null, scene: "podium" as const } },
    );
    expect(result.current.committedPlayers).toEqual(P0);
    expect(result.current.highlightedPlayerIds.size).toBe(0);
    expect(result.current.blinkMatchId).toBeNull();
  });

  it("freezes the ranking order when a new match arrives off the ranking scene", () => {
    const P0 = [player("a", 1), player("b", 2)];
    const src0 = makeSource(P0, [match("m1", ["a"], ["b"])]);
    const { result, rerender } = renderHook(
      ({ s, scene }: { s: DisplaySource | null; scene: "podium" | "ranking" }) =>
        useRankingReveal(s, scene),
      { initialProps: { s: src0, scene: "podium" } },
    );

    // Nouveau match m2 → b passe devant a, mais on est sur "podium"
    const P1 = [player("b", 1), player("a", 2)];
    const src1 = makeSource(P1, [match("m2", ["b"], ["a"]), match("m1", ["a"], ["b"])]);
    rerender({ s: src1, scene: "podium" });

    // L'ordre affiché reste gelé (P0), le match clignote, pas encore de glow
    expect(result.current.committedPlayers).toEqual(P0);
    expect(result.current.blinkMatchId).toBe("m2");
    expect(result.current.highlightedPlayerIds.size).toBe(0);
  });

  it("commits the new order + highlights protagonists ~1.5s after landing on ranking", () => {
    const P0 = [player("a", 1), player("b", 2)];
    const src0 = makeSource(P0, [match("m1", ["a"], ["b"])]);
    const { result, rerender } = renderHook(
      ({ s, scene }: { s: DisplaySource | null; scene: "podium" | "ranking" }) =>
        useRankingReveal(s, scene),
      { initialProps: { s: src0, scene: "podium" } },
    );

    const P1 = [player("b", 1), player("a", 2)];
    const src1 = makeSource(P1, [match("m2", ["b"], ["a"]), match("m1", ["a"], ["b"])]);
    rerender({ s: src1, scene: "podium" });
    expect(result.current.committedPlayers).toEqual(P0); // gelé

    // On arrive sur le slide Classement
    rerender({ s: src1, scene: "ranking" });
    // Avant le délai : toujours gelé
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.committedPlayers).toEqual(P0);

    // Après ~1.5s : commit du nouvel ordre + surbrillance des protagonistes
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.committedPlayers).toEqual(P1);
    expect([...result.current.highlightedPlayerIds].sort()).toEqual(["a", "b"]);
  });

  it("clears the highlight after the glow duration", () => {
    const P0 = [player("a", 1), player("b", 2)];
    const src0 = makeSource(P0, [match("m1", ["a"], ["b"])]);
    const { result, rerender } = renderHook(
      ({ s, scene }: { s: DisplaySource | null; scene: "podium" | "ranking" }) =>
        useRankingReveal(s, scene),
      { initialProps: { s: src0, scene: "podium" } },
    );
    const P1 = [player("b", 1), player("a", 2)];
    const src1 = makeSource(P1, [match("m2", ["b"], ["a"]), match("m1", ["a"], ["b"])]);
    rerender({ s: src1, scene: "ranking" });

    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(result.current.highlightedPlayerIds.size).toBe(2);

    act(() => {
      vi.advanceTimersByTime(6500);
    });
    expect(result.current.highlightedPlayerIds.size).toBe(0);
  });
});
