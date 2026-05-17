import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DetailedStatsPanel } from "@/components/stats/DetailedStatsPanel";
import type { ContextMatch, ContextPlayer } from "@/utils/contextStats";

function makeMatch(overrides: Partial<ContextMatch> & { id: string }): ContextMatch {
  return {
    date: "2026-01-01T12:00:00.000Z",
    teamA: [],
    teamB: [],
    scoreA: 0,
    scoreB: 0,
    ...overrides,
  };
}

const baseMatches: ContextMatch[] = [
  makeMatch({
    id: "m1",
    date: "2026-01-01",
    teamA: ["a"],
    teamB: ["b"],
    scoreA: 11,
    scoreB: 5,
  }),
  makeMatch({
    id: "m2",
    date: "2026-01-02",
    teamA: ["a"],
    teamB: ["b"],
    scoreA: 11,
    scoreB: 7,
  }),
  makeMatch({
    id: "m3",
    date: "2026-01-03",
    teamA: ["a"],
    teamB: ["b"],
    scoreA: 11,
    scoreB: 9,
  }),
];

const basePlayers: ContextPlayer[] = [
  { id: "a", name: "Alice", elo: 1100 },
  { id: "b", name: "Bob", elo: 900 },
];

describe("DetailedStatsPanel", () => {
  it("renders the empty state when below the minimum match threshold", () => {
    render(<DetailedStatsPanel matches={[baseMatches[0]]} players={basePlayers} />);
    expect(screen.getByText(/pas encore de stats/i)).toBeInTheDocument();
    expect(screen.getByText(/cette league/i)).toBeInTheDocument();
  });

  it("uses the event copy when contextLabel is event", () => {
    render(
      <DetailedStatsPanel
        matches={[]}
        players={basePlayers}
        contextLabel="event"
      />,
    );
    expect(screen.getByText(/cet event/i)).toBeInTheDocument();
  });

  it("renders top scorers, streaks and rivalries when enough matches", () => {
    render(<DetailedStatsPanel matches={baseMatches} players={basePlayers} />);

    expect(screen.getByText("Top scorers")).toBeInTheDocument();
    expect(screen.getByText("Séries")).toBeInTheDocument();
    expect(screen.getByText("Top rivalités")).toBeInTheDocument();

    // Alice should appear as top scorer (3-0) and current streak holder.
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getByText(/série en cours : 3 v/i)).toBeInTheDocument();
  });

  it("renders biggest upset when one happened", () => {
    const players: ContextPlayer[] = [
      { id: "fav", name: "Favorite", elo: 1450 },
      { id: "under", name: "Underdog", elo: 950 },
    ];
    const matches: ContextMatch[] = [
      makeMatch({
        id: "u1",
        teamA: ["under"],
        teamB: ["fav"],
        scoreA: 11,
        scoreB: 7,
        eloChanges: { under: 50, fav: -50 },
      }),
      makeMatch({
        id: "u2",
        teamA: ["fav"],
        teamB: ["under"],
        scoreA: 11,
        scoreB: 5,
        eloChanges: { under: -25, fav: 25 },
      }),
      makeMatch({
        id: "u3",
        teamA: ["fav"],
        teamB: ["under"],
        scoreA: 11,
        scoreB: 3,
        eloChanges: { under: -25, fav: 25 },
      }),
    ];
    render(<DetailedStatsPanel matches={matches} players={players} />);
    expect(screen.getByText(/plus gros upset/i)).toBeInTheDocument();
    // ELO gap (~500) appears only in the upset section.
    expect(screen.getByText(/\+5\d\d/)).toBeInTheDocument();
  });

  it("invokes onPlayerClick when a top scorer row is clicked", async () => {
    const onPlayerClick = vi.fn();
    render(
      <DetailedStatsPanel
        matches={baseMatches}
        players={basePlayers}
        onPlayerClick={onPlayerClick}
      />,
    );

    const aliceRow = screen.getAllByText("Alice")[0].closest("button");
    expect(aliceRow).not.toBeNull();
    await userEvent.click(aliceRow!);
    expect(onPlayerClick).toHaveBeenCalledWith("a");
  });
});
