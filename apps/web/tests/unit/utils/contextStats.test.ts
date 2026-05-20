import { describe, it, expect } from "vitest";
import {
  computeBiggestUpset,
  computeContextStats,
  computeStreaks,
  computeTopRivalries,
  computeTopScorers,
  type ContextMatch,
  type ContextPlayer,
} from "@/utils/contextStats";

const player = (
  id: string,
  name: string,
  elo: number = 1000,
): ContextPlayer => ({ id, name, elo });

const match = (overrides: Partial<ContextMatch> & { id: string }): ContextMatch => ({
  date: "2026-01-01T12:00:00.000Z",
  teamA: [],
  teamB: [],
  scoreA: 0,
  scoreB: 0,
  ...overrides,
});

describe("computeTopScorers", () => {
  it("counts wins and losses per player", () => {
    const players = [player("a", "Alice"), player("b", "Bob"), player("c", "Carol")];
    const matches: ContextMatch[] = [
      match({ id: "m1", teamA: ["a"], teamB: ["b"], scoreA: 11, scoreB: 5 }),
      match({ id: "m2", teamA: ["a"], teamB: ["c"], scoreA: 11, scoreB: 8 }),
      match({ id: "m3", teamA: ["b"], teamB: ["c"], scoreA: 11, scoreB: 9 }),
    ];
    const result = computeTopScorers(matches, players);
    expect(result[0]).toMatchObject({ playerId: "a", wins: 2, losses: 0, winRate: 100 });
    expect(result[1]).toMatchObject({ playerId: "b", wins: 1, losses: 1, winRate: 50 });
    expect(result[2]).toMatchObject({ playerId: "c", wins: 0, losses: 2, winRate: 0 });
  });

  it("excludes players with zero matches", () => {
    const players = [player("a", "Alice"), player("b", "Bob"), player("ghost", "Ghost")];
    const matches: ContextMatch[] = [
      match({ id: "m1", teamA: ["a"], teamB: ["b"], scoreA: 11, scoreB: 5 }),
    ];
    const result = computeTopScorers(matches, players);
    expect(result.map((s) => s.playerId)).toEqual(["a", "b"]);
  });

  it("respects the limit param", () => {
    const players = Array.from({ length: 8 }, (_, i) => player(`p${i}`, `P${i}`));
    const matches: ContextMatch[] = Array.from({ length: 8 }, (_, i) =>
      match({
        id: `m${i}`,
        teamA: [`p${i}`],
        teamB: [`p${(i + 1) % 8}`],
        scoreA: 11,
        scoreB: 0,
      }),
    );
    expect(computeTopScorers(matches, players, 3)).toHaveLength(3);
  });

  it("ignores draws", () => {
    const players = [player("a", "A"), player("b", "B")];
    const matches: ContextMatch[] = [
      match({ id: "m1", teamA: ["a"], teamB: ["b"], scoreA: 11, scoreB: 11 }),
    ];
    expect(computeTopScorers(matches, players)).toEqual([]);
  });

  it("handles 2v2 matches", () => {
    const players = [
      player("a", "A"),
      player("b", "B"),
      player("c", "C"),
      player("d", "D"),
    ];
    const matches: ContextMatch[] = [
      match({ id: "m1", teamA: ["a", "b"], teamB: ["c", "d"], scoreA: 11, scoreB: 7 }),
    ];
    const result = computeTopScorers(matches, players);
    expect(result.find((s) => s.playerId === "a")?.wins).toBe(1);
    expect(result.find((s) => s.playerId === "b")?.wins).toBe(1);
    expect(result.find((s) => s.playerId === "c")?.losses).toBe(1);
    expect(result.find((s) => s.playerId === "d")?.losses).toBe(1);
  });

  it("returns an empty array when there are no matches", () => {
    expect(computeTopScorers([], [player("a", "A")])).toEqual([]);
  });

  it("falls back to a generated name for missing players", () => {
    const matches: ContextMatch[] = [
      match({ id: "m1", teamA: ["ghostid1234567890"], teamB: ["x"], scoreA: 11, scoreB: 0 }),
    ];
    const result = computeTopScorers(matches, []);
    expect(result[0].name).toBe("Joueur ghostid1");
  });
});

describe("computeStreaks", () => {
  it("returns null active and record when there are no matches", () => {
    expect(computeStreaks([], [player("a", "A")])).toEqual({
      active: null,
      record: null,
    });
  });

  it("detects an active win streak", () => {
    const players = [player("a", "A"), player("b", "B")];
    const matches: ContextMatch[] = [
      match({
        id: "m1",
        date: "2026-01-01",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 5,
      }),
      match({
        id: "m2",
        date: "2026-01-02",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 7,
      }),
      match({
        id: "m3",
        date: "2026-01-03",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 9,
      }),
    ];
    const { active, record } = computeStreaks(matches, players);
    expect(active).toEqual({ playerId: "a", name: "A", streak: 3 });
    expect(record).toEqual({ playerId: "a", name: "A", streak: 3 });
  });

  it("clears active streak when player ends on a loss", () => {
    const players = [player("a", "A"), player("b", "B")];
    const matches: ContextMatch[] = [
      match({
        id: "m1",
        date: "2026-01-01",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 0,
      }),
      match({
        id: "m2",
        date: "2026-01-02",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 0,
      }),
      match({
        id: "m3",
        date: "2026-01-03",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 5,
        scoreB: 11,
      }),
    ];
    const { active, record } = computeStreaks(matches, players);
    // A's record stays at 2 even though they lost their last match.
    expect(record).toEqual({ playerId: "a", name: "A", streak: 2 });
    // Active goes to B (their last match was a win).
    expect(active).toEqual({ playerId: "b", name: "B", streak: 1 });
  });

  it("tracks a historical record larger than any active streak", () => {
    const players = [player("a", "A"), player("b", "B")];
    const matches: ContextMatch[] = [
      // A wins 4 in a row first, then loses, then wins 1 (active=1, record=4).
      match({
        id: "m1",
        date: "2026-01-01",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 0,
      }),
      match({
        id: "m2",
        date: "2026-01-02",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 0,
      }),
      match({
        id: "m3",
        date: "2026-01-03",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 0,
      }),
      match({
        id: "m4",
        date: "2026-01-04",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 0,
      }),
      match({
        id: "m5",
        date: "2026-01-05",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 5,
        scoreB: 11,
      }),
      match({
        id: "m6",
        date: "2026-01-06",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 0,
      }),
    ];
    const { active, record } = computeStreaks(matches, players);
    expect(record).toEqual({ playerId: "a", name: "A", streak: 4 });
    expect(active).toEqual({ playerId: "a", name: "A", streak: 1 });
  });

  it("sorts matches chronologically regardless of input order", () => {
    const players = [player("a", "A"), player("b", "B")];
    const unsorted: ContextMatch[] = [
      match({
        id: "m3",
        date: "2026-01-03",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 0,
      }),
      match({
        id: "m1",
        date: "2026-01-01",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 0,
      }),
      match({
        id: "m2",
        date: "2026-01-02",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 0,
      }),
    ];
    const { active } = computeStreaks(unsorted, players);
    expect(active?.streak).toBe(3);
  });
});

describe("computeBiggestUpset", () => {
  it("returns null when no upset occurred", () => {
    const players = [player("fav", "Favorite", 1500), player("under", "Underdog", 900)];
    const matches: ContextMatch[] = [
      match({
        id: "m1",
        teamA: ["fav"],
        teamB: ["under"],
        scoreA: 11,
        scoreB: 0,
        eloChanges: { fav: 2, under: -2 },
      }),
    ];
    expect(computeBiggestUpset(matches, players)).toBeNull();
  });

  it("returns null on empty input", () => {
    expect(computeBiggestUpset([], [])).toBeNull();
  });

  it("identifies the match with the largest pre-match elo gap won by the underdog", () => {
    // Underdog ELO before match = 900, favorite = 1500. Underdog wins → gap = 600.
    const players = [player("fav", "Favorite", 1480), player("under", "Underdog", 920)];
    const matches: ContextMatch[] = [
      match({
        id: "m1",
        teamA: ["under"],
        teamB: ["fav"],
        scoreA: 11,
        scoreB: 7,
        eloChanges: { under: 20, fav: -20 },
      }),
    ];
    const upset = computeBiggestUpset(matches, players);
    expect(upset?.matchId).toBe("m1");
    expect(upset?.eloGap).toBe(600);
    expect(upset?.winnerAvgElo).toBe(900);
    expect(upset?.loserAvgElo).toBe(1500);
    expect(upset?.winners[0]).toEqual({ playerId: "under", name: "Underdog" });
    expect(upset?.losers[0]).toEqual({ playerId: "fav", name: "Favorite" });
  });

  it("picks the biggest gap among multiple upsets", () => {
    const players = [
      player("a", "A", 1050),
      player("b", "B", 1450),
      player("c", "C", 900),
      player("d", "D", 1600),
    ];
    // Two upsets: A beats B (gap=400, pre-match), C beats D (gap=700, pre-match).
    const matches: ContextMatch[] = [
      match({
        id: "small",
        date: "2026-01-01",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 9,
        eloChanges: { a: 50, b: -50 },
      }),
      match({
        id: "big",
        date: "2026-01-02",
        teamA: ["c"],
        teamB: ["d"],
        scoreA: 11,
        scoreB: 9,
        eloChanges: { c: 100, d: -100 },
      }),
    ];
    const upset = computeBiggestUpset(matches, players);
    expect(upset?.matchId).toBe("big");
  });

  it("falls back to current ELO when eloChanges is missing", () => {
    const players = [player("fav", "Favorite", 1500), player("under", "Underdog", 900)];
    const matches: ContextMatch[] = [
      match({
        id: "m1",
        teamA: ["under"],
        teamB: ["fav"],
        scoreA: 11,
        scoreB: 0,
      }),
    ];
    const upset = computeBiggestUpset(matches, players);
    expect(upset?.matchId).toBe("m1");
    expect(upset?.eloGap).toBe(600);
  });

  it("averages elo across team members", () => {
    const players = [
      player("a", "A", 950),
      player("b", "B", 950),
      player("c", "C", 1450),
      player("d", "D", 1550),
    ];
    const matches: ContextMatch[] = [
      match({
        id: "m1",
        teamA: ["a", "b"],
        teamB: ["c", "d"],
        scoreA: 11,
        scoreB: 7,
      }),
    ];
    const upset = computeBiggestUpset(matches, players);
    expect(upset?.winnerAvgElo).toBe(950);
    expect(upset?.loserAvgElo).toBe(1500);
    expect(upset?.eloGap).toBe(550);
  });
});

describe("computeTopRivalries", () => {
  it("returns an empty array when no pair reaches the minimum match count", () => {
    const players = [player("a", "A"), player("b", "B")];
    const matches: ContextMatch[] = [
      match({ id: "m1", teamA: ["a"], teamB: ["b"], scoreA: 11, scoreB: 7 }),
    ];
    expect(computeTopRivalries(matches, players)).toEqual([]);
  });

  it("counts opposing pairs ignoring team order", () => {
    const players = [player("a", "Alice"), player("b", "Bob")];
    const matches: ContextMatch[] = [
      match({ id: "m1", teamA: ["a"], teamB: ["b"], scoreA: 11, scoreB: 7 }),
      match({ id: "m2", teamA: ["b"], teamB: ["a"], scoreA: 11, scoreB: 9 }),
      match({ id: "m3", teamA: ["a"], teamB: ["b"], scoreA: 11, scoreB: 8 }),
    ];
    const rivalries = computeTopRivalries(matches, players);
    expect(rivalries).toHaveLength(1);
    expect(rivalries[0].matchesPlayed).toBe(3);
    expect(rivalries[0].winsA + rivalries[0].winsB).toBe(3);
  });

  it("attributes wins to the correct player perspective", () => {
    const players = [player("a", "Alice"), player("b", "Bob")];
    const matches: ContextMatch[] = [
      match({ id: "m1", teamA: ["a"], teamB: ["b"], scoreA: 11, scoreB: 0 }),
      match({ id: "m2", teamA: ["b"], teamB: ["a"], scoreA: 11, scoreB: 0 }),
    ];
    const rivalries = computeTopRivalries(matches, players);
    expect(rivalries[0].winsA + rivalries[0].winsB).toBe(2);
    expect(rivalries[0].winsA).toBe(1);
    expect(rivalries[0].winsB).toBe(1);
  });

  it("creates separate entries for 2v2 cross pairs", () => {
    const players = [
      player("a", "A"),
      player("b", "B"),
      player("c", "C"),
      player("d", "D"),
    ];
    // Same 4 players play 3 times: 4 cross pairs each match → 12 pair-matches.
    const matches: ContextMatch[] = [
      match({ id: "m1", teamA: ["a", "b"], teamB: ["c", "d"], scoreA: 11, scoreB: 7 }),
      match({ id: "m2", teamA: ["a", "b"], teamB: ["c", "d"], scoreA: 11, scoreB: 9 }),
      match({ id: "m3", teamA: ["a", "b"], teamB: ["c", "d"], scoreA: 7, scoreB: 11 }),
    ];
    const rivalries = computeTopRivalries(matches, players, 10);
    // 4 cross pairs: a-c, a-d, b-c, b-d. Each has 3 matches.
    expect(rivalries).toHaveLength(4);
    for (const r of rivalries) {
      expect(r.matchesPlayed).toBe(3);
    }
  });

  it("respects the limit param", () => {
    const players = Array.from({ length: 6 }, (_, i) => player(`p${i}`, `P${i}`));
    const matches: ContextMatch[] = [];
    for (let i = 0; i < 5; i++) {
      for (let k = 0; k < 2; k++) {
        matches.push(
          match({
            id: `m${i}-${k}`,
            teamA: [`p${i}`],
            teamB: [`p${i + 1}`],
            scoreA: 11,
            scoreB: 7,
          }),
        );
      }
    }
    expect(computeTopRivalries(matches, players, 2)).toHaveLength(2);
  });
});

describe("computeContextStats", () => {
  it("aggregates all stats with a coherent shape", () => {
    const players = [player("a", "A", 1100), player("b", "B", 900)];
    const matches: ContextMatch[] = [
      match({
        id: "m1",
        date: "2026-01-01",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 5,
        eloChanges: { a: 10, b: -10 },
      }),
      match({
        id: "m2",
        date: "2026-01-02",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 7,
        eloChanges: { a: 10, b: -10 },
      }),
    ];
    const stats = computeContextStats(matches, players);
    expect(stats.totalMatches).toBe(2);
    expect(stats.topScorers).toHaveLength(2);
    expect(stats.streaks.active?.playerId).toBe("a");
    expect(stats.streaks.record?.playerId).toBe("a");
    // No upset: A was already favored.
    expect(stats.biggestUpset).toBeNull();
    expect(stats.topRivalries).toHaveLength(1);
    expect(stats.topRivalries[0].matchesPlayed).toBe(2);
  });

  it("returns safe empty values for an empty context", () => {
    const stats = computeContextStats([], []);
    expect(stats).toEqual({
      topScorers: [],
      streaks: { active: null, record: null },
      biggestUpset: null,
      topRivalries: [],
      totalMatches: 0,
    });
  });
});
