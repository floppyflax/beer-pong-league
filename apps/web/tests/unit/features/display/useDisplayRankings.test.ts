import { describe, it, expect } from "vitest";
import type { Match, Player } from "@/types";
import { deriveDisplayPlayers } from "@/features/display/hooks/useDisplayRankings";

function makePlayer(
  id: string,
  name: string,
  elo: number,
  wins = 0,
  losses = 0,
): Player {
  return { id, name, elo, wins, losses, matchesPlayed: wins + losses, streak: 0 };
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

describe("deriveDisplayPlayers", () => {
  it("returns empty for empty players", () => {
    expect(deriveDisplayPlayers([], [])).toEqual([]);
  });

  it("ranks players by ELO descending", () => {
    const players = [
      makePlayer("a", "Alice", 1100, 3, 1),
      makePlayer("b", "Bob", 1050, 2, 2),
      makePlayer("c", "Carol", 1200, 5, 0),
    ];
    const out = deriveDisplayPlayers(players, []);
    expect(out.map((p) => p.id)).toEqual(["c", "a", "b"]);
    expect(out.map((p) => p.rank)).toEqual([1, 2, 3]);
  });

  it("breaks ELO ties alphabetically by name (stable)", () => {
    const players = [
      makePlayer("z", "Zoé", 1000),
      makePlayer("a", "Alice", 1000),
      makePlayer("m", "Marc", 1000),
    ];
    const out = deriveDisplayPlayers(players, []);
    expect(out.map((p) => p.name)).toEqual(["Alice", "Marc", "Zoé"]);
  });

  it("computes winRate from wins and losses", () => {
    const players = [
      makePlayer("a", "Alice", 1100, 3, 1), // 75%
      makePlayer("b", "Bob", 1000, 0, 0), // 0% (pas de match)
    ];
    const out = deriveDisplayPlayers(players, []);
    expect(out.find((p) => p.id === "a")?.winRate).toBe(75);
    expect(out.find((p) => p.id === "b")?.winRate).toBe(0);
  });

  it("computes recentResults (5 max, latest first)", () => {
    const players = [makePlayer("a", "Alice", 1100, 3, 2)];
    const matches: Match[] = [
      makeMatch("m6", "2026-05-22T12:00:00Z", ["a"], ["b"], 10, 5), // win — latest
      makeMatch("m5", "2026-05-22T11:00:00Z", ["b"], ["a"], 10, 3), // loss
      makeMatch("m4", "2026-05-22T10:00:00Z", ["a"], ["b"], 10, 8), // win
      makeMatch("m3", "2026-05-22T09:00:00Z", ["b"], ["a"], 10, 7), // loss
      makeMatch("m2", "2026-05-22T08:00:00Z", ["a"], ["b"], 10, 9), // win
      makeMatch("m1", "2026-05-22T07:00:00Z", ["a"], ["b"], 4, 10), // loss — exclu (5 max)
    ];
    const a = deriveDisplayPlayers(players, matches).find((p) => p.id === "a");
    expect(a?.recentResults).toEqual([true, false, true, false, true]);
  });

  it("computes eloDelta from the last match", () => {
    const players = [
      makePlayer("a", "Alice", 1120, 1, 0),
      makePlayer("b", "Bob", 980, 0, 1),
    ];
    const matches: Match[] = [
      makeMatch("m1", "2026-05-22T12:00:00Z", ["a"], ["b"], 10, 5, {
        a: 20,
        b: -20,
      }),
    ];
    const out = deriveDisplayPlayers(players, matches);
    expect(out.find((p) => p.id === "a")?.eloDelta).toBe(20);
    expect(out.find((p) => p.id === "b")?.eloDelta).toBe(-20);
  });

  it("computes rankDelta from pre-last-match ranking", () => {
    // Avant le dernier match : Alice 1100, Bob 1100 → Alice 1, Bob 2 (alpha)
    // Après le match (Alice gagne +20, Bob perd -20) : Alice 1120, Bob 1080
    // Donc rangs actuels : Alice 1, Bob 2. Les deux ont JOUÉ et sont restés
    // sur place → rankDelta 0 (badge "=").
    const playersNoChange = [
      makePlayer("a", "Alice", 1120, 1, 0),
      makePlayer("b", "Bob", 1080, 0, 1),
    ];
    const noChangeMatches: Match[] = [
      makeMatch("m1", "2026-05-22T12:00:00Z", ["a"], ["b"], 10, 5, {
        a: 20,
        b: -20,
      }),
    ];
    const outNoChange = deriveDisplayPlayers(playersNoChange, noChangeMatches);
    expect(outNoChange.find((p) => p.id === "a")?.rankDelta).toBe(0);
    expect(outNoChange.find((p) => p.id === "b")?.rankDelta).toBe(0);

    // Cas avec changement : Alice était 1080, Bob 1120. Bob 1, Alice 2.
    // Alice gagne +50, Bob perd -50. Alice 1130, Bob 1070. Alice 1, Bob 2.
    // Alice : 2 → 1 = rankDelta +1 (monté).
    // Bob : 1 → 2 = rankDelta -1 (descendu).
    const playersFlip = [
      makePlayer("a", "Alice", 1130, 1, 0),
      makePlayer("b", "Bob", 1070, 0, 1),
    ];
    const flipMatches: Match[] = [
      makeMatch("m1", "2026-05-22T12:00:00Z", ["a"], ["b"], 10, 5, {
        a: 50,
        b: -50,
      }),
    ];
    const outFlip = deriveDisplayPlayers(playersFlip, flipMatches);
    expect(outFlip.find((p) => p.id === "a")?.rankDelta).toBe(1);
    expect(outFlip.find((p) => p.id === "b")?.rankDelta).toBe(-1);
  });

  it("shows 0 (resté sur place) for participants but hides non-participants who stayed", () => {
    // Carol (1300) ne joue pas. Alice & Bob jouent et restent à leur rang.
    // Avant : Carol 1300, Alice 1100, Bob 1100 → Carol 1, Alice 2, Bob 3.
    // Après (Alice +20, Bob -20) : Carol 1300, Alice 1120, Bob 1080 → mêmes rangs.
    const players = [
      makePlayer("c", "Carol", 1300, 5, 0),
      makePlayer("a", "Alice", 1120, 1, 0),
      makePlayer("b", "Bob", 1080, 0, 1),
    ];
    const matches: Match[] = [
      makeMatch("m1", "2026-05-22T12:00:00Z", ["a"], ["b"], 10, 5, {
        a: 20,
        b: -20,
      }),
    ];
    const out = deriveDisplayPlayers(players, matches);
    expect(out.find((p) => p.id === "a")?.rankDelta).toBe(0); // a joué, resté → "="
    expect(out.find((p) => p.id === "b")?.rankDelta).toBe(0); // a joué, resté → "="
    expect(out.find((p) => p.id === "c")?.rankDelta).toBeUndefined(); // pas joué, resté → rien
  });

  it("leaves rankDelta undefined when no matches", () => {
    const players = [makePlayer("a", "Alice", 1100)];
    const out = deriveDisplayPlayers(players, []);
    expect(out[0].rankDelta).toBeUndefined();
    expect(out[0].eloDelta).toBeUndefined();
  });

  it("supports doubles (2v2) when computing recentResults", () => {
    const players = [
      makePlayer("a", "Alice", 1100, 1, 0),
      makePlayer("b", "Bob", 1100, 1, 0),
      makePlayer("c", "Carol", 950, 0, 1),
      makePlayer("d", "Dave", 950, 0, 1),
    ];
    const matches: Match[] = [
      makeMatch("m1", "2026-05-22T12:00:00Z", ["a", "b"], ["c", "d"], 10, 4),
    ];
    const out = deriveDisplayPlayers(players, matches);
    expect(out.find((p) => p.id === "a")?.recentResults).toEqual([true]);
    expect(out.find((p) => p.id === "b")?.recentResults).toEqual([true]);
    expect(out.find((p) => p.id === "c")?.recentResults).toEqual([false]);
    expect(out.find((p) => p.id === "d")?.recentResults).toEqual([false]);
  });
});
