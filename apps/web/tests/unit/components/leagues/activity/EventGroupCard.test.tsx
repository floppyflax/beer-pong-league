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
    // Header tappable avec aria-expanded
    expect(
      screen.getByRole("button", { expanded: true, name: /Soirée Toulouse/i }),
    ).toBeInTheDocument();
    // CTA d'ouverture présent
    expect(
      screen.getByRole("button", { name: /Ouvrir l'événement/i }),
    ).toBeInTheDocument();
  });

  it("does not render body when defaultExpanded=false", () => {
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
      screen.queryByRole("button", { name: /Ouvrir l'événement/i }),
    ).toBeNull();
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
    const header = screen.getByRole("button", { name: /Soirée Toulouse/i });
    expect(header).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
  });

  it("invokes onOpen when the CTA is clicked", () => {
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
    fireEvent.click(screen.getByRole("button", { name: /Ouvrir l'événement/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("shows '+ N autres matchs' when more than 3 matches and triggers onOpen", () => {
    const onOpen = vi.fn();
    const event = makeEvent({ matches: makeMatches(5) });
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
    const more = screen.getByRole("button", { name: /2 autres matchs/ });
    fireEvent.click(more);
    expect(onOpen).toHaveBeenCalled();
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
