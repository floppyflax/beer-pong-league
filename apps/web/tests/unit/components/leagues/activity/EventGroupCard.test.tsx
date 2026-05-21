import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EventGroupCard } from "../../../../../src/components/leagues/activity";
import type { Event, Match, Player } from "../../../../../src/types";

const players: Player[] = [
  { id: "p1", name: "Alice", elo: 1500, wins: 0, losses: 0, matchesPlayed: 0, streak: 0 },
  { id: "p2", name: "Bob", elo: 1500, wins: 0, losses: 0, matchesPlayed: 0, streak: 0 },
];

const makeMatches = (n: number): Match[] =>
  Array.from({ length: n }).map((_, i) => ({
    id: `m${i}`,
    date: new Date(Date.now() - i * 60_000).toISOString(),
    teamA: ["p1"],
    teamB: ["p2"],
    scoreA: 10,
    scoreB: i,
  }));

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: "e1",
  name: "Soirée Toulouse",
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

describe("EventGroupCard", () => {
  it("renders body when defaultExpanded=true and matches are present", () => {
    const event = makeEvent({ matches: makeMatches(2) });
    render(
      <EventGroupCard
        event={event}
        matches={event.matches}
        players={players}
        variant="hero"
        defaultExpanded
        onOpen={() => {}}
      />,
    );
    // Le header expanded a aria-expanded=true et contient le nom de l'event.
    const header = screen.getAllByRole("button", { expanded: true })[0];
    expect(header).toHaveTextContent("Soirée Toulouse");
    // L'icône d'ouverture est présente même quand on est déplié
    expect(
      screen.getByRole("button", {
        name: /Ouvrir l'événement Soirée Toulouse/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the open icon even when collapsed", () => {
    const event = makeEvent({ matches: makeMatches(1) });
    render(
      <EventGroupCard
        event={event}
        matches={event.matches}
        players={players}
        variant="muted"
        defaultExpanded={false}
        onOpen={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: /Ouvrir l'événement Soirée Toulouse/i,
      }),
    ).toBeInTheDocument();
  });

  it("toggles aria-expanded when the header is clicked", () => {
    const event = makeEvent({ matches: makeMatches(1) });
    render(
      <EventGroupCard
        event={event}
        matches={event.matches}
        players={players}
        variant="muted"
        defaultExpanded={false}
        onOpen={() => {}}
      />,
    );
    // Cible le bouton header (celui qui contient le titre, donc le textContent
    // matche le nom de l'event).
    const headers = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.includes("Soirée Toulouse"));
    expect(headers).toHaveLength(1);
    const header = headers[0];
    expect(header).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
  });

  it("invokes onOpen when the open icon is clicked", () => {
    const onOpen = vi.fn();
    const event = makeEvent({ matches: makeMatches(1) });
    render(
      <EventGroupCard
        event={event}
        matches={event.matches}
        players={players}
        variant="hero"
        defaultExpanded
        onOpen={onOpen}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /Ouvrir l'événement Soirée Toulouse/i,
      }),
    );
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("renders all matches (no truncation) when expanded", () => {
    const event = makeEvent({ matches: makeMatches(5) });
    render(
      <EventGroupCard
        event={event}
        matches={event.matches}
        players={players}
        variant="hero"
        defaultExpanded
        onOpen={() => {}}
      />,
    );
    expect(screen.getAllByTestId("match-history-card")).toHaveLength(5);
  });

  it("shows an in_progress empty state when no matches", () => {
    const event = makeEvent({ matches: [] });
    render(
      <EventGroupCard
        event={event}
        matches={[]}
        players={players}
        variant="hero"
        defaultExpanded
        onOpen={() => {}}
      />,
    );
    expect(
      screen.getByText(/En attente du premier match/i),
    ).toBeInTheDocument();
  });

  it("displays 'Terminé' label for a finished event", () => {
    const event = makeEvent({
      isFinished: true,
      startedAt: null,
      matches: makeMatches(1),
    });
    render(
      <EventGroupCard
        event={event}
        matches={event.matches}
        players={players}
        variant="muted"
        defaultExpanded={false}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByText(/Terminé/i)).toBeInTheDocument();
  });
});
