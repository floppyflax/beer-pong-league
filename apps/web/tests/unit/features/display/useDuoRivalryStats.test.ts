import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Match } from "@/types";
import type {
  DisplaySource,
  DisplaySourcePlayer,
} from "@/features/display/types";
import {
  computePairExtremes,
  useDuoRivalryStats,
} from "@/features/display/hooks/useDuoRivalryStats";

function player(id: string, rank: number): DisplaySourcePlayer {
  return {
    id,
    name: id.toUpperCase(),
    elo: 1100 - rank,
    rank,
    wins: 5,
    losses: 5,
    winRate: 50,
    recentResults: [],
  };
}

function match(
  id: string,
  teamA: string[],
  teamB: string[],
  scoreA: number,
  scoreB: number,
): Match {
  return { id, date: new Date().toISOString(), teamA, teamB, scoreA, scoreB };
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

describe("computePairExtremes", () => {
  it("returns null/null when there is no match at all", () => {
    expect(computePairExtremes([])).toEqual({ best: null, worst: null });
  });

  it("best needs ≥3 matchs together — null sur 1 seul match", () => {
    // 1 match seulement : ab (100%), cd (0%) → best inéligible, worst OK.
    const matches = [match("m1", ["a", "b"], ["c", "d"], 10, 5)];
    const { best, worst } = computePairExtremes(matches);
    expect(best).toBeNull();
    expect(worst && [worst.aId, worst.bId].sort()).toEqual(["c", "d"]);
    expect(worst?.winRate).toBe(0);
  });

  it("finds the best and worst pair by winrate", () => {
    // a&b : 3W (100%) ; c&d : 0W/3 (0%)
    const matches = [
      match("m1", ["a", "b"], ["c", "d"], 10, 5),
      match("m2", ["a", "b"], ["c", "d"], 10, 4),
      match("m3", ["a", "b"], ["c", "d"], 10, 3),
    ];
    const { best, worst } = computePairExtremes(matches);
    expect(best && [best.aId, best.bId].sort()).toEqual(["a", "b"]);
    expect(best?.winRate).toBe(100);
    expect(worst && [worst.aId, worst.bId].sort()).toEqual(["c", "d"]);
    expect(worst?.winRate).toBe(0);
  });

  it("worst : à winrate égal, prend le binôme avec le plus de matchs", () => {
    // c&d : 0V/1 (0%) ; e&f : 0V/3 (0%) — même winrate, e&f plus de matchs.
    const matches = [
      match("m1", ["a", "b"], ["c", "d"], 10, 0),
      match("m2", ["a", "b"], ["e", "f"], 10, 0),
      match("m3", ["a", "b"], ["e", "f"], 10, 1),
      match("m4", ["a", "b"], ["e", "f"], 10, 2),
    ];
    const { worst } = computePairExtremes(matches);
    expect(worst && [worst.aId, worst.bId].sort()).toEqual(["e", "f"]);
    expect(worst?.total).toBe(3);
    expect(worst?.winRate).toBe(0);
  });
});

describe("useDuoRivalryStats", () => {
  it("builds global cards: best/worst pair + rivalry", () => {
    const players = [player("a", 1), player("b", 2), player("c", 3), player("d", 4)];
    const matches = [
      match("m1", ["a", "b"], ["c", "d"], 10, 5),
      match("m2", ["a", "b"], ["c", "d"], 10, 4),
      match("m3", ["a", "b"], ["c", "d"], 10, 3),
    ];
    const { result } = renderHook(() => useDuoRivalryStats(makeSource(players, matches)));
    const accents = result.current.globalCards.map((c) => c.accent).sort();
    expect(accents).toContain("best-pair");
    expect(accents).toContain("worst-pair");
    expect(accents).toContain("rivalry");
    expect(result.current.duosAvailable).toBe(true);
  });

  it("playerFocusFor inclut bilan, meilleur allié et bête noire", () => {
    // a&b gagnent 3 fois contre c&d ; a perd 3 fois en 1v1 contre e
    const players = [
      player("a", 1),
      player("b", 2),
      player("c", 3),
      player("d", 4),
      player("e", 5),
    ];
    const matches = [
      match("m1", ["a", "b"], ["c", "d"], 10, 5),
      match("m2", ["a", "b"], ["c", "d"], 10, 4),
      match("m3", ["a", "b"], ["c", "d"], 10, 3),
      match("m4", ["a"], ["e"], 4, 10),
      match("m5", ["a"], ["e"], 5, 10),
      match("m6", ["a"], ["e"], 6, 10),
    ];
    const { result } = renderHook(() =>
      useDuoRivalryStats(makeSource(players, matches)),
    );
    const focus = result.current.playerFocusFor("a");
    expect(focus).not.toBeNull();
    expect(focus?.player.id).toBe("a");
    const labels = focus?.tiles.map((t) => t.label) ?? [];
    expect(labels).toContain("Bilan");
    expect(labels).toContain("Meilleur allié");
    expect(labels).toContain("Bête noire");
    // Meilleur allié = b ; bête noire = e
    const ally = focus?.tiles.find((t) => t.label === "Meilleur allié");
    expect(ally?.value).toBe("B");
    const nem = focus?.tiles.find((t) => t.label === "Bête noire");
    expect(nem?.value).toBe("E");
    expect(result.current.focusAvailable).toBe(true);
  });

  it("playerFocusFor returns null for an unknown player", () => {
    const { result } = renderHook(() =>
      useDuoRivalryStats(makeSource([player("a", 1)], [])),
    );
    expect(result.current.playerFocusFor("zzz")).toBeNull();
  });
});
