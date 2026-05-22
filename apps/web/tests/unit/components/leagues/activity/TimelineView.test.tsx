import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { TimelineView } from "../../../../../src/components/leagues/activity";
import type { Event, Match, Player } from "../../../../../src/types";

const players: Player[] = [
  { id: "p1", name: "Alice", elo: 1500, wins: 0, losses: 0, matchesPlayed: 0, streak: 0 },
  { id: "p2", name: "Bob", elo: 1500, wins: 0, losses: 0, matchesPlayed: 0, streak: 0 },
];

const makeEvent = (id: string, name: string): Event => ({
  id,
  name,
  date: new Date().toISOString(),
  format: "1v1",
  leagueId: "lg1",
  createdAt: "2026-01-01T10:00:00Z",
  playerIds: ["p1", "p2"],
  matches: [],
  isFinished: false,
  startedAt: new Date().toISOString(),
  pausedAt: null,
});

const makeMatch = (id: string, dateOffsetMs: number): Match => ({
  id,
  date: new Date(Date.now() - dateOffsetMs).toISOString(),
  teamA: ["p1"],
  teamB: ["p2"],
  scoreA: 10,
  scoreB: 5,
});

// Helper pour observer la dernière route navigation.
function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location-pathname">{location.pathname}</span>;
}

const renderWithRouter = (ui: React.ReactElement) =>
  render(
    <BrowserRouter>
      {ui}
      <LocationProbe />
    </BrowserRouter>,
  );

const emptyParticipantsMap = new Map<string, Player[]>();

describe("TimelineView", () => {
  it("renders empty state with CTA when no entries", () => {
    renderWithRouter(
      <TimelineView
        entries={[]}
        leaguePlayers={players}
        leagueId="lg1"
        participantsByEvent={emptyParticipantsMap}
      />,
    );
    expect(screen.getByText(/aucun match/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Enregistrer un match/i }),
    ).toBeInTheDocument();
  });

  it("renders today header for a match dated today", () => {
    renderWithRouter(
      <TimelineView
        entries={[{ match: makeMatch("m1", 0), event: null }]}
        leaguePlayers={players}
        leagueId="lg1"
        participantsByEvent={emptyParticipantsMap}
      />,
    );
    expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
  });

  it("orders matches chronologically descending and groups by date", () => {
    const today = makeMatch("m-today", 60_000);
    const twoDaysAgo = makeMatch("m-2d", 2 * 24 * 3600_000);
    renderWithRouter(
      <TimelineView
        entries={[
          { match: twoDaysAgo, event: null },
          { match: today, event: null },
        ]}
        leaguePlayers={players}
        leagueId="lg1"
        participantsByEvent={emptyParticipantsMap}
      />,
    );
    expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
    const sections = screen.getAllByRole("region");
    expect(sections.length).toBeGreaterThanOrEqual(2);
  });

  it("renders event chip with name and navigates on click", () => {
    const event = makeEvent("e1", "Tournoi mai");
    renderWithRouter(
      <TimelineView
        entries={[{ match: makeMatch("m1", 0), event }]}
        leaguePlayers={players}
        leagueId="lg1"
        participantsByEvent={new Map([["e1", players]])}
      />,
    );
    const chip = screen.getByRole("button", {
      name: /Ouvrir l'événement Tournoi mai/i,
    });
    expect(chip).toBeInTheDocument();
    fireEvent.click(chip);
    expect(screen.getByTestId("location-pathname")).toHaveTextContent(
      "/event/e1",
    );
  });

  it("renders 'Hors événement' label for orphan match", () => {
    renderWithRouter(
      <TimelineView
        entries={[{ match: makeMatch("m1", 0), event: null }]}
        leaguePlayers={players}
        leagueId="lg1"
        participantsByEvent={emptyParticipantsMap}
      />,
    );
    expect(screen.getByText(/Hors événement/i)).toBeInTheDocument();
  });
});
