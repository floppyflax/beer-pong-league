import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { LeagueActivityFeed } from "../../../../../src/components/leagues/activity";
import type { Event, League, Player } from "../../../../../src/types";

const STORAGE_KEY = "bpl_league_activity_view_mode";

function createMemoryStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      store = {};
    },
    getItem: (k: string) =>
      Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
    key: (i: number) => Object.keys(store)[i] ?? null,
    removeItem: (k: string) => {
      delete store[k];
    },
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
  };
}

const players: Player[] = [
  {
    id: "p1",
    name: "Alice",
    elo: 1500,
    wins: 0,
    losses: 0,
    matchesPlayed: 0,
    streak: 0,
  },
  {
    id: "p2",
    name: "Bob",
    elo: 1500,
    wins: 0,
    losses: 0,
    matchesPlayed: 0,
    streak: 0,
  },
];

const baseLeague: League = {
  id: "lg1",
  name: "Test League",
  type: "season",
  createdAt: "2026-01-01T10:00:00Z",
  players,
  matches: [],
  events: [],
};

const makeEvent = (
  id: string,
  name: string,
  isFinished = false,
  matchesCount = 0,
): Event => ({
  id,
  name,
  date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  format: "1v1",
  leagueId: "lg1",
  createdAt: "2026-01-01T10:00:00Z",
  playerIds: ["p1", "p2"],
  isFinished,
  matches: Array.from({ length: matchesCount }).map((_, i) => ({
    id: `${id}-m${i}`,
    date: new Date(Date.now() - i * 60_000).toISOString(),
    teamA: ["p1"],
    teamB: ["p2"],
    scoreA: 10,
    scoreB: i,
  })),
  startedAt: !isFinished ? new Date().toISOString() : null,
  pausedAt: null,
});

describe("LeagueActivityFeed", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  it("forces timeline mode and hides switcher when league has no events", () => {
    render(
      <BrowserRouter>
        <LeagueActivityFeed league={baseLeague} events={[]} />
      </BrowserRouter>,
    );
    // Empty timeline → empty state visible.
    expect(screen.getByText(/aucun match/i)).toBeInTheDocument();
    // Switcher hidden.
    expect(screen.queryByRole("tab", { name: "Par event" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Timeline" })).toBeNull();
  });

  it("defaults to grouped mode when league has at least one event", () => {
    const ev = makeEvent("e1", "Tournoi 1", false, 2);
    const league: League = {
      ...baseLeague,
      events: [ev.id],
    };
    render(
      <BrowserRouter>
        <LeagueActivityFeed league={league} events={[ev]} />
      </BrowserRouter>,
    );
    // Switcher visible avec mode "grouped" actif.
    const switcherTab = screen.getByRole("tab", { name: "Par event" });
    expect(switcherTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Tournoi 1")).toBeInTheDocument();
  });

  it("respects localStorage override to force timeline even with events", () => {
    window.localStorage.setItem(STORAGE_KEY, "timeline");
    const memory = createMemoryStorage();
    memory.setItem(STORAGE_KEY, "timeline");
    vi.stubGlobal("localStorage", memory);

    const ev = makeEvent("e1", "Tournoi 1", false, 0);
    const league: League = {
      ...baseLeague,
      events: [ev.id],
    };
    render(
      <BrowserRouter>
        <LeagueActivityFeed league={league} events={[ev]} />
      </BrowserRouter>,
    );
    const timelineTab = screen.getByRole("tab", { name: "Timeline" });
    expect(timelineTab).toHaveAttribute("aria-selected", "true");
  });

  it("toggles mode when switcher is clicked", () => {
    const ev = makeEvent("e1", "Tournoi 1", false, 1);
    const league: League = {
      ...baseLeague,
      events: [ev.id],
    };
    render(
      <BrowserRouter>
        <LeagueActivityFeed league={league} events={[ev]} />
      </BrowserRouter>,
    );
    expect(
      screen.getByRole("tab", { name: "Par event", selected: true }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Timeline" }));
    expect(
      screen.getByRole("tab", { name: "Timeline", selected: true }),
    ).toBeInTheDocument();
  });
});
