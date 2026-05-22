import { describe, it, expect } from "vitest";
import type { Match } from "@/types";
import type {
  DisplaySource,
  DisplaySourcePlayer,
} from "@/features/display/types";
import {
  computeBiggestEloGain,
  computeBiggestRankClimb,
  computeCurrentStreak,
  computeUpset,
} from "@/features/display/hooks/useDisplayHighlights";

function makePlayer(
  id: string,
  name: string,
  elo: number,
  rank: number,
): DisplaySourcePlayer {
  return {
    id,
    name,
    elo,
    rank,
    wins: 0,
    losses: 0,
    winRate: 0,
    recentResults: [],
  };
}

function makeMatch(
  id: string,
  date: string,
  teamA: string[],
  teamB: string[],
  scoreA: number,
  scoreB: number,
  eloChanges?: Record<string, number>,
): Match {
  return { id, date, teamA, teamB, scoreA, scoreB, eloChanges };
}

function makeSource(
  players: DisplaySourcePlayer[],
  matches: Match[],
): DisplaySource {
  return {
    kind: "event",
    name: "TEST",
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

describe("computeBiggestEloGain", () => {
  it("returns null when no matches", () => {
    const players = [makePlayer("a", "A", 1000, 1)];
    expect(computeBiggestEloGain(makeSource(players, []))).toBeNull();
  });

  it("picks the player with the highest cumulative ELO gain", () => {
    const players = [
      makePlayer("a", "Alice", 1080, 1),
      makePlayer("b", "Bob", 1020, 2),
      makePlayer("c", "Carol", 1010, 3),
    ];
    const matches = [
      makeMatch("m1", "2026-05-22T12:00:00Z", ["a"], ["b"], 10, 5, {
        a: 30,
        b: -30,
      }),
      makeMatch("m2", "2026-05-22T11:00:00Z", ["a"], ["c"], 10, 4, {
        a: 50,
        c: -50,
      }),
    ];
    const h = computeBiggestEloGain(makeSource(players, matches));
    expect(h?.subject.id).toBe("a");
    expect(h?.metric).toBe("+80");
  });
});

describe("computeBiggestRankClimb", () => {
  it("returns null when no rank moved", () => {
    const players = [
      makePlayer("a", "Alice", 1000, 1),
      makePlayer("b", "Bob", 950, 2),
    ];
    expect(
      computeBiggestRankClimb(makeSource(players, [])),
    ).toBeNull();
  });

  it("detects the player who climbed the most", () => {
    // Alice 1080 (rank 1) — gained +80 → était 1000 avant.
    // Bob 1020 (rank 2) — neutre.
    // Carol 950 (rank 3) — perdu -50 → était 1000 avant.
    // Rangs initiaux : Alice/Carol 1000 → tri alphabétique : Alice 1, Carol 2, Bob 3 (950 hypothèse).
    // Hmm. Adjusting test for clarity.
    const players = [
      makePlayer("a", "Alice", 1080, 1),
      makePlayer("b", "Bob", 1020, 2),
      makePlayer("c", "Carol", 950, 3),
    ];
    const matches = [
      makeMatch("m1", "2026-05-22T12:00:00Z", ["a"], ["c"], 10, 5, {
        a: 80,
        c: -50,
      }),
    ];
    const h = computeBiggestRankClimb(makeSource(players, matches));
    // Avant : a 1000, b 1020, c 1000 → tri : b 1, a 2 (alpha), c 3.
    // Après : a 1080(1), b 1020(2), c 950(3).
    // Climbs : a: 2-1 = 1, b: 1-2 = -1, c: 3-3 = 0.
    // Le plus grand climb positif est Alice (+1).
    expect(h?.subject.id).toBe("a");
    expect(h?.metric).toBe("+1");
  });
});

describe("computeCurrentStreak", () => {
  it("returns null if no 2+ streak", () => {
    const players = [makePlayer("a", "Alice", 1000, 1)];
    const matches = [
      makeMatch("m1", "2026-05-22T12:00:00Z", ["a"], ["b"], 10, 5),
    ];
    expect(computeCurrentStreak(makeSource(players, matches))).toBeNull();
  });

  it("detects an ongoing 3-win streak", () => {
    const players = [
      makePlayer("a", "Alice", 1100, 1),
      makePlayer("b", "Bob", 900, 2),
    ];
    const matches = [
      // récent en premier
      makeMatch("m3", "2026-05-22T14:00:00Z", ["a"], ["b"], 10, 4),
      makeMatch("m2", "2026-05-22T13:00:00Z", ["a"], ["b"], 10, 3),
      makeMatch("m1", "2026-05-22T12:00:00Z", ["a"], ["b"], 10, 2),
    ];
    const h = computeCurrentStreak(makeSource(players, matches));
    expect(h?.subject.id).toBe("a");
    expect(h?.metric).toBe("3W");
  });

  it("streak breaks on a defeat (most recent)", () => {
    const players = [
      makePlayer("a", "Alice", 1100, 1),
      makePlayer("b", "Bob", 900, 2),
    ];
    const matches = [
      makeMatch("m3", "2026-05-22T14:00:00Z", ["a"], ["b"], 4, 10), // a perd
      makeMatch("m2", "2026-05-22T13:00:00Z", ["a"], ["b"], 10, 3),
      makeMatch("m1", "2026-05-22T12:00:00Z", ["a"], ["b"], 10, 2),
    ];
    expect(computeCurrentStreak(makeSource(players, matches))).toBeNull();
  });
});

describe("computeUpset", () => {
  it("returns null if no ELO diff ≥ 100", () => {
    const players = [
      makePlayer("a", "Alice", 1020, 1),
      makePlayer("b", "Bob", 980, 2),
    ];
    const matches = [
      makeMatch("m1", "2026-05-22T12:00:00Z", ["b"], ["a"], 10, 5, {
        a: -20,
        b: 20,
      }),
    ];
    expect(computeUpset(makeSource(players, matches))).toBeNull();
  });

  it("detects an upset (sub-150 ELO beats top-1200)", () => {
    const players = [
      makePlayer("a", "Alice", 1150, 1),
      makePlayer("b", "Bob", 1050, 2),
    ];
    // Avant le match : Alice 1200, Bob 1000 (delta +50 / -50).
    const matches = [
      makeMatch("m1", "2026-05-22T12:00:00Z", ["b"], ["a"], 10, 5, {
        a: -50,
        b: 50,
      }),
    ];
    const h = computeUpset(makeSource(players, matches));
    expect(h?.subject.id).toBe("b");
    expect(h?.metric).toBe("Δ200");
  });
});

// computeNemesis / computeBestPair (paire) ont été déplacés vers
// useDuoRivalryStats (scène "Duos & Rivalités") — cf. useDuoRivalryStats.test.ts.
