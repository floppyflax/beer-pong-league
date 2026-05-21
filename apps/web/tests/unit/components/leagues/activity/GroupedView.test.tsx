import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { GroupedView } from "../../../../../src/components/leagues/activity";
import type { Event, Player } from "../../../../../src/types";

const players: Player[] = [
  { id: "p1", name: "Alice", elo: 1500, wins: 0, losses: 0, matchesPlayed: 0, streak: 0 },
  { id: "p2", name: "Bob", elo: 1500, wins: 0, losses: 0, matchesPlayed: 0, streak: 0 },
];

const makeEvent = (overrides: Partial<Event>): Event => ({
  id: "e",
  name: "Generic",
  date: new Date().toISOString(),
  format: "1v1",
  leagueId: "lg1",
  createdAt: "2026-01-01T10:00:00Z",
  playerIds: ["p1", "p2"],
  matches: [],
  isFinished: false,
  startedAt: new Date().toISOString(),
  pausedAt: null,
  ...overrides,
});

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("GroupedView", () => {
  it("renders global empty state when no events and no orphan matches", () => {
    renderWithRouter(
      <GroupedView events={[]} orphanMatches={[]} players={players} leagueId="lg1" />,
    );
    expect(screen.getByText(/aucune activité/i)).toBeInTheDocument();
  });

  it("orders events: in_progress first, then not_started, then finished", () => {
    const finishedOld = makeEvent({
      id: "finished",
      name: "Ancien tournoi",
      isFinished: true,
      startedAt: null,
      date: new Date(Date.now() - 7 * 24 * 3600_000).toISOString(),
    });
    const notStarted = makeEvent({
      id: "upcoming",
      name: "À venir",
      startedAt: null,
      date: new Date(Date.now() + 24 * 3600_000).toISOString(),
    });
    const inProgress = makeEvent({
      id: "active",
      name: "En cours",
      startedAt: new Date().toISOString(),
      date: new Date(Date.now() - 3600_000).toISOString(),
    });

    renderWithRouter(
      <GroupedView
        events={[finishedOld, notStarted, inProgress]}
        orphanMatches={[]}
        players={players}
        leagueId="lg1"
      />,
    );

    // Récupère les cards dans l'ordre du DOM.
    const cards = screen.getAllByTestId("event-group-card");
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveTextContent("En cours");
    expect(cards[1]).toHaveTextContent("À venir");
    expect(cards[2]).toHaveTextContent("Ancien tournoi");
  });

  it("expands the hero (first in_progress) by default and collapses others", () => {
    const hero = makeEvent({
      id: "hero",
      name: "Soirée vedette",
      matches: [
        {
          id: "m1",
          date: new Date().toISOString(),
          teamA: ["p1"],
          teamB: ["p2"],
          scoreA: 10,
          scoreB: 3,
        },
      ],
    });
    const otherInProgress = makeEvent({
      id: "other",
      name: "Soirée en parallèle",
      startedAt: new Date(Date.now() - 7200_000).toISOString(),
      matches: [],
    });

    renderWithRouter(
      <GroupedView
        events={[hero, otherInProgress]}
        orphanMatches={[]}
        players={players}
        leagueId="lg1"
      />,
    );

    // Hero expanded → CTA "Ouvrir l'événement" visible une fois.
    const openButtons = screen.queryAllByRole("button", {
      name: /Ouvrir l'événement/i,
    });
    expect(openButtons).toHaveLength(1);
    // Le hero doit être au-dessus de l'autre in_progress (tri par dernière activité).
    const cards = screen.getAllByTestId("event-group-card");
    expect(cards[0]).toHaveTextContent("Soirée vedette");
  });

  it("renders orphan matches section with proper count when present", () => {
    renderWithRouter(
      <GroupedView
        events={[]}
        orphanMatches={[
          {
            id: "free1",
            date: new Date().toISOString(),
            teamA: ["p1"],
            teamB: ["p2"],
            scoreA: 10,
            scoreB: 5,
          },
          {
            id: "free2",
            date: new Date().toISOString(),
            teamA: ["p2"],
            teamB: ["p1"],
            scoreA: 7,
            scoreB: 10,
          },
        ]}
        players={players}
        leagueId="lg1"
      />,
    );

    expect(
      screen.getByText(/Matchs hors événement \(2\)/i),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("orphan-match-card")).toHaveLength(2);
  });
});
