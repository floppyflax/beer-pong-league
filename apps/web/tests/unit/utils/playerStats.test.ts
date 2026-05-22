import { describe, it, expect } from "vitest";
import { getRankDeltasFromLastMatch } from "@/utils/playerStats";

type Match = {
  date: string;
  teamA: string[];
  teamB: string[];
  scoreA: number;
  scoreB: number;
  eloChanges?: Record<string, number>;
};

const sortedPlayers = (
  list: { id: string; elo: number }[],
): { id: string; elo: number }[] =>
  [...list].sort((a, b) => b.elo - a.elo);

describe("getRankDeltasFromLastMatch", () => {
  it("returns an empty map when there are no players", () => {
    expect(getRankDeltasFromLastMatch([], [])).toEqual(new Map());
  });

  it("returns an empty map when there are no matches", () => {
    const players = sortedPlayers([
      { id: "a", elo: 1500 },
      { id: "b", elo: 1400 },
    ]);
    expect(getRankDeltasFromLastMatch(players, [])).toEqual(new Map());
  });

  it("returns an empty map when last match has no eloChanges", () => {
    const players = sortedPlayers([
      { id: "a", elo: 1500 },
      { id: "b", elo: 1400 },
    ]);
    const matches: Match[] = [
      {
        date: "2026-05-20",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 5,
      },
    ];
    expect(getRankDeltasFromLastMatch(players, matches)).toEqual(new Map());
  });

  it("returns 0 for every player when ranking did not change", () => {
    const players = sortedPlayers([
      { id: "a", elo: 1520 },
      { id: "b", elo: 1480 },
    ]);
    const matches: Match[] = [
      {
        date: "2026-05-20",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 9,
        eloChanges: { a: 8, b: -8 },
      },
    ];
    const deltas = getRankDeltasFromLastMatch(players, matches);
    expect(deltas.get("a")).toBe(0);
    expect(deltas.get("b")).toBe(0);
  });

  it("detects when a player climbs over another", () => {
    // Before match: B 1500, A 1490, C 1400 → A=2, B=1, C=3
    // After match (A beats B): A 1510, B 1480, C 1400 → A=1, B=2, C=3
    const players = sortedPlayers([
      { id: "a", elo: 1510 },
      { id: "b", elo: 1480 },
      { id: "c", elo: 1400 },
    ]);
    const matches: Match[] = [
      {
        date: "2026-05-20",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 9,
        eloChanges: { a: 20, b: -20 },
      },
    ];
    const deltas = getRankDeltasFromLastMatch(players, matches);
    expect(deltas.get("a")).toBe(1); // climbed 1 place
    expect(deltas.get("b")).toBe(-1); // dropped 1 place
    expect(deltas.has("c")).toBe(false); // C didn't play → no badge
  });

  it("omits non-participants even when their rank shifts", () => {
    // Before match: A 1500, C 1450, B 1400 → A=1, C=2, B=3
    // After match (B beats D, large swing): A 1500, B 1480, C 1450 → A=1, B=2, C=3
    // C did not play but dropped 1 rank; only B played and is reported.
    const players = sortedPlayers([
      { id: "a", elo: 1500 },
      { id: "b", elo: 1480 },
      { id: "c", elo: 1450 },
    ]);
    const matches: Match[] = [
      {
        date: "2026-05-20",
        teamA: ["b"],
        teamB: ["d"],
        scoreA: 11,
        scoreB: 0,
        eloChanges: { b: 80, d: -80 },
      },
    ];
    const deltas = getRankDeltasFromLastMatch(players, matches);
    expect(deltas.get("b")).toBe(1); // climbed — played
    expect(deltas.has("a")).toBe(false); // A didn't play
    expect(deltas.has("c")).toBe(false); // C didn't play, even though it dropped a rank
  });

  it("handles multi-position climbs", () => {
    // Before: B 1500, C 1490, D 1480, A 1400 → A=4, B=1, C=2, D=3
    // Match: A wins big, A 1500. After: A 1500, B 1500, C 1490, D 1480 → A=1 (tie-break stable)
    // A climbs from rank 4 to 1 (+3); B drops 1; C drops 1; D drops 1.
    const players = sortedPlayers([
      { id: "a", elo: 1500 },
      { id: "b", elo: 1500 }, // tied; stable order keeps A above B in current ranking
    ]);
    // Override to make A first in current order, B second:
    const current = [
      { id: "a", elo: 1500 },
      { id: "b", elo: 1500 },
      { id: "c", elo: 1490 },
      { id: "d", elo: 1480 },
    ];
    const matches: Match[] = [
      {
        date: "2026-05-20",
        teamA: ["a"],
        teamB: ["x"],
        scoreA: 11,
        scoreB: 0,
        eloChanges: { a: 100, x: -100 },
      },
    ];
    // sanity check on `players` to avoid lint warning
    expect(players.map((p) => p.id)).toEqual(["a", "b"]);

    const deltas = getRankDeltasFromLastMatch(current, matches);
    expect(deltas.get("a")).toBe(3); // 4 → 1 — the only participant
    expect(deltas.has("b")).toBe(false); // shifted 1 → 2 but didn't play
    expect(deltas.has("c")).toBe(false); // shifted 2 → 3 but didn't play
    expect(deltas.has("d")).toBe(false); // shifted 3 → 4 but didn't play
  });

  it("keeps a participant who stayed on the same rank (delta 0)", () => {
    // A and B both play; A wins but doesn't pass C above → A stays rank 2.
    // Before: C 1600, A 1500, B 1490 → C=1, A=2, B=3
    // After (A beats B): C 1600, A 1510, B 1480 → C=1, A=2, B=3
    const players = sortedPlayers([
      { id: "c", elo: 1600 },
      { id: "a", elo: 1510 },
      { id: "b", elo: 1480 },
    ]);
    const matches: Match[] = [
      {
        date: "2026-05-20",
        teamA: ["a"],
        teamB: ["b"],
        scoreA: 11,
        scoreB: 9,
        eloChanges: { a: 10, b: -10 },
      },
    ];
    const deltas = getRankDeltasFromLastMatch(players, matches);
    expect(deltas.get("a")).toBe(0); // played, stayed on rank 2
    expect(deltas.get("b")).toBe(0); // played, stayed on rank 3
    expect(deltas.has("c")).toBe(false); // didn't play
  });
});
