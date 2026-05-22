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
  it("returns null/null when no pair reaches the min-together threshold", () => {
    const matches = [match("m1", ["a", "b"], ["c", "d"], 10, 5)];
    expect(computePairExtremes(matches)).toEqual({ best: null, worst: null });
  });

  it("finds the best and worst pair by winrate (≥3 together)", () => {
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
    expect(result.current.available).toBe(true);
  });

  it("bête noire = adversaire qui bat le joueur (du point de vue du joueur)", () => {
    // a perd 3 fois contre b → b est la bête noire de a
    const players = [player("a", 2), player("b", 1)];
    const matches = [
      match("m1", ["a"], ["b"], 4, 10),
      match("m2", ["a"], ["b"], 5, 10),
      match("m3", ["a"], ["b"], 6, 10),
    ];
    const { result } = renderHook(() => useDuoRivalryStats(makeSource(players, matches)));
    const card = result.current.nemesisCardFor("a");
    expect(card).not.toBeNull();
    expect(card?.accent).toBe("nemesis");
    expect(card?.subjects[0].id).toBe("b");
    expect(card?.headline).toContain("A");
    expect(card?.metric).toBe("3"); // b a battu a 3 fois
  });

  it("meilleur allié = coéquipier avec qui le joueur gagne le plus", () => {
    const players = [player("a", 1), player("b", 2), player("c", 3), player("d", 4)];
    const matches = [
      match("m1", ["a", "b"], ["c", "d"], 10, 5),
      match("m2", ["a", "b"], ["c", "d"], 10, 4),
      match("m3", ["a", "b"], ["c", "d"], 10, 3),
    ];
    const { result } = renderHook(() => useDuoRivalryStats(makeSource(players, matches)));
    const card = result.current.bestAllyCardFor("a");
    expect(card?.accent).toBe("best-ally");
    expect(card?.subjects[0].id).toBe("b");
  });

  it("buildCards returns at most `max` cards with distinct accents", () => {
    const players = [player("a", 1), player("b", 2), player("c", 3), player("d", 4)];
    const matches = [
      match("m1", ["a", "b"], ["c", "d"], 10, 5),
      match("m2", ["a", "b"], ["c", "d"], 10, 4),
      match("m3", ["a", "b"], ["c", "d"], 10, 3),
    ];
    const { result } = renderHook(() => useDuoRivalryStats(makeSource(players, matches)));
    const cards = result.current.buildCards(3, () => 0.5);
    expect(cards.length).toBeLessThanOrEqual(3);
    const accents = cards.map((c) => c.accent);
    expect(new Set(accents).size).toBe(accents.length); // pas de doublon d'accent
  });
});
