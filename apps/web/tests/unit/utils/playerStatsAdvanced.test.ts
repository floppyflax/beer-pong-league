import { describe, it, expect } from "vitest";
import {
  computeBestAlly,
  computeFormTrend,
  computeNemesis,
  computeWinRateByFormat,
  type PlayerStatsMatch,
} from "@/utils/playerStatsAdvanced";

const m = (overrides: Partial<PlayerStatsMatch> & { id: string }): PlayerStatsMatch => ({
  date: "2026-01-01",
  teamA: [],
  teamB: [],
  scoreA: 0,
  scoreB: 0,
  ...overrides,
});

describe("computeWinRateByFormat", () => {
  it("returns zeros for all formats when no matches", () => {
    const result = computeWinRateByFormat("p1", []);
    expect(result).toEqual([
      { format: "1v1", matches: 0, wins: 0, winRate: 0 },
      { format: "2v2", matches: 0, wins: 0, winRate: 0 },
      { format: "3v3", matches: 0, wins: 0, winRate: 0 },
    ]);
  });

  it("splits matches into 1v1 / 2v2 / 3v3 buckets", () => {
    const matches: PlayerStatsMatch[] = [
      m({ id: "1", teamA: ["p1"], teamB: ["p2"], scoreA: 11, scoreB: 5 }),
      m({ id: "2", teamA: ["p1"], teamB: ["p2"], scoreA: 5, scoreB: 11 }),
      m({ id: "3", teamA: ["p1", "p3"], teamB: ["p2", "p4"], scoreA: 11, scoreB: 9 }),
      m({ id: "4", teamA: ["p1", "p3", "p5"], teamB: ["p2", "p4", "p6"], scoreA: 11, scoreB: 0 }),
      m({ id: "5", teamA: ["p1", "p3", "p5"], teamB: ["p2", "p4", "p6"], scoreA: 9, scoreB: 11 }),
    ];
    const result = computeWinRateByFormat("p1", matches);
    expect(result.find((r) => r.format === "1v1")).toEqual({
      format: "1v1",
      matches: 2,
      wins: 1,
      winRate: 50,
    });
    expect(result.find((r) => r.format === "2v2")).toEqual({
      format: "2v2",
      matches: 1,
      wins: 1,
      winRate: 100,
    });
    expect(result.find((r) => r.format === "3v3")).toEqual({
      format: "3v3",
      matches: 2,
      wins: 1,
      winRate: 50,
    });
  });

  it("ignores asymmetric team sizes (4v3 etc.)", () => {
    const matches: PlayerStatsMatch[] = [
      m({
        id: "1",
        teamA: ["p1", "p2", "p3", "p4"],
        teamB: ["p5", "p6", "p7"],
        scoreA: 11,
        scoreB: 9,
      }),
    ];
    const result = computeWinRateByFormat("p1", matches);
    expect(result.every((r) => r.matches === 0)).toBe(true);
  });

  it("ignores draws", () => {
    const matches: PlayerStatsMatch[] = [
      m({ id: "1", teamA: ["p1"], teamB: ["p2"], scoreA: 11, scoreB: 11 }),
    ];
    const result = computeWinRateByFormat("p1", matches);
    expect(result.every((r) => r.matches === 0)).toBe(true);
  });
});

describe("computeBestAlly", () => {
  it("returns null when no partner reaches the minimum", () => {
    const matches: PlayerStatsMatch[] = [
      m({ id: "1", teamA: ["p1", "p2"], teamB: ["p3", "p4"], scoreA: 11, scoreB: 0 }),
      m({ id: "2", teamA: ["p1", "p2"], teamB: ["p3", "p4"], scoreA: 11, scoreB: 0 }),
    ];
    expect(computeBestAlly("p1", matches, 3)).toBeNull();
  });

  it("picks the partner with the highest win rate", () => {
    const matches: PlayerStatsMatch[] = [
      // p1 + p2 = 3W 0L = 100%
      m({ id: "1", teamA: ["p1", "p2"], teamB: ["p3", "p4"], scoreA: 11, scoreB: 0 }),
      m({ id: "2", teamA: ["p1", "p2"], teamB: ["p3", "p4"], scoreA: 11, scoreB: 0 }),
      m({ id: "3", teamA: ["p1", "p2"], teamB: ["p3", "p4"], scoreA: 11, scoreB: 0 }),
      // p1 + p5 = 2W 1L = 67%
      m({ id: "4", teamA: ["p1", "p5"], teamB: ["p3", "p4"], scoreA: 11, scoreB: 0 }),
      m({ id: "5", teamA: ["p1", "p5"], teamB: ["p3", "p4"], scoreA: 11, scoreB: 0 }),
      m({ id: "6", teamA: ["p1", "p5"], teamB: ["p3", "p4"], scoreA: 0, scoreB: 11 }),
    ];
    const best = computeBestAlly("p1", matches);
    expect(best?.playerId).toBe("p2");
    expect(best?.winRate).toBe(100);
    expect(best?.matchesPlayed).toBe(3);
  });

  it("breaks ties by higher matches-played count", () => {
    const matches: PlayerStatsMatch[] = [
      // p1 + p2 = 3W 0L
      m({ id: "1", teamA: ["p1", "p2"], teamB: ["p3", "p4"], scoreA: 11, scoreB: 0 }),
      m({ id: "2", teamA: ["p1", "p2"], teamB: ["p3", "p4"], scoreA: 11, scoreB: 0 }),
      m({ id: "3", teamA: ["p1", "p2"], teamB: ["p3", "p4"], scoreA: 11, scoreB: 0 }),
      // p1 + p5 = 4W 0L
      m({ id: "4", teamA: ["p1", "p5"], teamB: ["p3", "p4"], scoreA: 11, scoreB: 0 }),
      m({ id: "5", teamA: ["p1", "p5"], teamB: ["p3", "p4"], scoreA: 11, scoreB: 0 }),
      m({ id: "6", teamA: ["p1", "p5"], teamB: ["p3", "p4"], scoreA: 11, scoreB: 0 }),
      m({ id: "7", teamA: ["p1", "p5"], teamB: ["p3", "p4"], scoreA: 11, scoreB: 0 }),
    ];
    const best = computeBestAlly("p1", matches);
    expect(best?.playerId).toBe("p5");
    expect(best?.matchesPlayed).toBe(4);
  });
});

describe("computeNemesis", () => {
  it("returns null when no opponent reaches the minimum", () => {
    const matches: PlayerStatsMatch[] = [
      m({ id: "1", teamA: ["p1"], teamB: ["p2"], scoreA: 0, scoreB: 11 }),
    ];
    expect(computeNemesis("p1", matches, 3)).toBeNull();
  });

  it("picks the opponent with the lowest win rate for the player", () => {
    const matches: PlayerStatsMatch[] = [
      // p1 vs p2 → 0W 3L
      m({ id: "1", teamA: ["p1"], teamB: ["p2"], scoreA: 0, scoreB: 11 }),
      m({ id: "2", teamA: ["p1"], teamB: ["p2"], scoreA: 0, scoreB: 11 }),
      m({ id: "3", teamA: ["p1"], teamB: ["p2"], scoreA: 0, scoreB: 11 }),
      // p1 vs p3 → 1W 2L
      m({ id: "4", teamA: ["p1"], teamB: ["p3"], scoreA: 11, scoreB: 0 }),
      m({ id: "5", teamA: ["p1"], teamB: ["p3"], scoreA: 0, scoreB: 11 }),
      m({ id: "6", teamA: ["p1"], teamB: ["p3"], scoreA: 0, scoreB: 11 }),
    ];
    const nemesis = computeNemesis("p1", matches);
    expect(nemesis?.playerId).toBe("p2");
    expect(nemesis?.winRate).toBe(0);
  });

  it("counts each opponent on a 2v2 team separately", () => {
    const matches: PlayerStatsMatch[] = [
      m({
        id: "1",
        teamA: ["p1", "ally"],
        teamB: ["p2", "p3"],
        scoreA: 0,
        scoreB: 11,
      }),
      m({
        id: "2",
        teamA: ["p1", "ally"],
        teamB: ["p2", "p3"],
        scoreA: 0,
        scoreB: 11,
      }),
      m({
        id: "3",
        teamA: ["p1", "ally"],
        teamB: ["p2", "p3"],
        scoreA: 0,
        scoreB: 11,
      }),
    ];
    const nemesis = computeNemesis("p1", matches);
    // p2 and p3 are tied at 0%; deterministic selection via first-encountered
    // map iteration: p2 first.
    expect(nemesis?.playerId).toBeOneOf(["p2", "p3"]);
    expect(nemesis?.matchesPlayed).toBe(3);
  });
});

describe("computeFormTrend", () => {
  it("returns zeros for an empty match list", () => {
    expect(computeFormTrend("p1", [])).toEqual({
      recentWinRate: 0,
      lifetimeWinRate: 0,
      delta: 0,
      recentMatches: 0,
      lifetimeMatches: 0,
    });
  });

  it("computes recent vs lifetime when more than recentWindow matches exist", () => {
    // 15 matches, p1 wins all but the first 5 → lifetime 10/15 = 67%, recent 10/10 = 100%
    const matches: PlayerStatsMatch[] = [];
    for (let i = 0; i < 15; i++) {
      const won = i >= 5;
      matches.push(
        m({
          id: `m${i}`,
          date: `2026-01-${String(i + 1).padStart(2, "0")}`,
          teamA: ["p1"],
          teamB: ["p2"],
          scoreA: won ? 11 : 0,
          scoreB: won ? 0 : 11,
        }),
      );
    }
    const trend = computeFormTrend("p1", matches);
    expect(trend.lifetimeMatches).toBe(15);
    expect(trend.recentMatches).toBe(10);
    expect(trend.recentWinRate).toBe(100);
    expect(trend.lifetimeWinRate).toBe(67);
    expect(trend.delta).toBe(33);
  });

  it("uses the entire history when fewer than recentWindow matches", () => {
    const matches: PlayerStatsMatch[] = [
      m({ id: "1", date: "2026-01-01", teamA: ["p1"], teamB: ["p2"], scoreA: 11, scoreB: 0 }),
      m({ id: "2", date: "2026-01-02", teamA: ["p1"], teamB: ["p2"], scoreA: 0, scoreB: 11 }),
    ];
    const trend = computeFormTrend("p1", matches);
    expect(trend.recentMatches).toBe(2);
    expect(trend.lifetimeMatches).toBe(2);
    expect(trend.delta).toBe(0);
  });

  it("ignores draws and matches the player did not play", () => {
    const matches: PlayerStatsMatch[] = [
      m({ id: "1", date: "2026-01-01", teamA: ["p1"], teamB: ["p2"], scoreA: 11, scoreB: 11 }),
      m({ id: "2", date: "2026-01-02", teamA: ["px"], teamB: ["py"], scoreA: 11, scoreB: 0 }),
      m({ id: "3", date: "2026-01-03", teamA: ["p1"], teamB: ["p2"], scoreA: 11, scoreB: 0 }),
    ];
    const trend = computeFormTrend("p1", matches);
    expect(trend.lifetimeMatches).toBe(1);
    expect(trend.recentWinRate).toBe(100);
  });
});
