/**
 * PlayerProfile Page Tests - Story 14.20
 *
 * Tests for design system alignment:
 * - AC1: Header with name + back
 * - AC2: Avatar + infos
 * - AC3: StatCards (ELO, W/L, Win rate)
 * - AC4: Streak card
 * - AC5: Sections (ELO evolution, Stats par league, Head-to-head, Recent matches)
 * - AC6: Bottom nav visible (pb-bottom-nav)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import { PlayerProfile } from "@/pages/PlayerProfile";
import "@testing-library/jest-dom";

const mockNavigate = vi.fn();
const PLAYER_1 = "11111111-1111-4111-8111-111111111111";
const PLAYER_2 = "22222222-2222-4222-8222-222222222222";
const PLAYER_3 = "33333333-3333-4333-8333-333333333333";

const mockLeagues = [
  {
    id: "league-1",
    name: "League des Pingouins",
    type: "event" as const,
    createdAt: "2026-01-01",
    players: [
      {
        id: PLAYER_1,
        name: "Marc Dupont",
        elo: 1250,
        wins: 10,
        losses: 5,
        matchesPlayed: 15,
        streak: 2,
      },
      {
        id: PLAYER_2,
        name: "Jean Martin",
        elo: 1100,
        wins: 8,
        losses: 7,
        matchesPlayed: 15,
        streak: -1,
      },
      {
        id: PLAYER_3,
        name: "Paul Zero",
        elo: 1000,
        wins: 5,
        losses: 5,
        matchesPlayed: 10,
        streak: 0,
      },
    ],
    matches: [
      {
        id: "match-1",
        date: "2026-01-15",
        teamA: [PLAYER_1],
        teamB: [PLAYER_2],
        scoreA: 10,
        scoreB: 8,
        eloChanges: { [PLAYER_1]: 15, [PLAYER_2]: -15 },
      },
    ],
  },
];

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/context/LeagueContext", () => ({
  useLeague: () => ({
    leagues: mockLeagues,
    tournaments: [],
    updatePlayer: vi.fn(),
  }),
}));

vi.mock("@/services/DatabaseService", () => ({
  databaseService: {
    loadPlayerById: vi.fn().mockResolvedValue(null),
    loadTournamentParticipants: vi.fn().mockResolvedValue([]),
  },
}));

const renderWithPlayer = (playerId: string) => {
  return render(
    <MemoryRouter initialEntries={[`/player/${playerId}`]}>
      <Routes>
        <Route path="/player/:playerId" element={<PlayerProfile />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("PlayerProfile - Story 14.20", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AC1: Header with name + back", () => {
    it("should render header with player name", () => {
      renderWithPlayer(PLAYER_1);
      const headings = screen.getAllByRole("heading", { name: /marc dupont/i });
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });

    it("should have back button", () => {
      renderWithPlayer(PLAYER_1);
      expect(
        screen.getByRole("button", { name: /retour/i }),
      ).toBeInTheDocument();
    });

    it("should call navigate(-1) when back is clicked", async () => {
      const user = userEvent.setup();
      renderWithPlayer(PLAYER_1);
      await user.click(screen.getByRole("button", { name: /retour/i }));
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe("AC2: Avatar + infos", () => {
    it("should display player initials in avatar", () => {
      renderWithPlayer(PLAYER_1);
      expect(screen.getByText("MD")).toBeInTheDocument();
    });

    it("should display player name", () => {
      renderWithPlayer(PLAYER_1);
      expect(screen.getAllByText("Marc Dupont").length).toBeGreaterThanOrEqual(1);
    });

    it("should display league name when player is in a league", () => {
      renderWithPlayer(PLAYER_1);
      expect(screen.getAllByText("League des Pingouins").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("AC3: StatCards (ELO, W/L, Win rate)", () => {
    it("should render StatCards with ELO, W/L, Win rate", () => {
      renderWithPlayer(PLAYER_1);
      const statcards = screen.getAllByTestId("statcard");
      expect(statcards).toHaveLength(3);
      expect(screen.getByText("1250")).toBeInTheDocument();
      expect(screen.getAllByText(/1V - 0D/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("should display ELO label", () => {
      renderWithPlayer(PLAYER_1);
      expect(screen.getByText("ELO")).toBeInTheDocument();
    });

    it("should display W/L label", () => {
      renderWithPlayer(PLAYER_1);
      expect(screen.getByText("W/L")).toBeInTheDocument();
    });

    it("should display Win rate label", () => {
      renderWithPlayer(PLAYER_1);
      expect(screen.getByText("Win rate")).toBeInTheDocument();
    });
  });

  describe("AC4: Streak card", () => {
    it("should display positive streak", () => {
      renderWithPlayer(PLAYER_1);
      expect(
        screen.getByText(/2 victoires d'affilée/),
      ).toBeInTheDocument();
    });

    it("should display negative streak for player with losses", () => {
      renderWithPlayer(PLAYER_2);
      expect(
        screen.getByText(/1 défaites d'affilée/),
      ).toBeInTheDocument();
    });

    it("should display 'Aucune série' when streak is 0", () => {
      renderWithPlayer(PLAYER_3);
      expect(screen.getByText(/aucune série/i)).toBeInTheDocument();
    });
  });

  describe("AC5: Sections", () => {
    it("should display ELO evolution section when data exists", () => {
      renderWithPlayer(PLAYER_1);
      expect(
        screen.getByRole("heading", { name: /évolution elo/i }),
      ).toBeInTheDocument();
    });

    it("should display Stats par league section", () => {
      renderWithPlayer(PLAYER_1);
      expect(
        screen.getByRole("heading", { name: /statistiques par league/i }),
      ).toBeInTheDocument();
    });

    it("should display Head-to-head section", () => {
      renderWithPlayer(PLAYER_1);
      expect(
        screen.getByRole("heading", { name: /tête-à-tête/i }),
      ).toBeInTheDocument();
    });

    it("should display Recent matches section", () => {
      renderWithPlayer(PLAYER_1);
      expect(
        screen.getByRole("heading", { name: /matchs récents/i }),
      ).toBeInTheDocument();
    });

    it("should use ListRow for head-to-head opponents", () => {
      renderWithPlayer(PLAYER_1);
      const listrows = screen.getAllByTestId("listrow");
      expect(listrows.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("AC6: Bottom nav visible", () => {
    it("should apply pb-bottom-nav to content area", () => {
      const { container } = renderWithPlayer(PLAYER_1);
      const scrollable = container.querySelector(".pb-bottom-nav");
      expect(scrollable).toBeInTheDocument();
    });
  });

  describe("Player not found", () => {
    it("should show message when player not found", async () => {
      renderWithPlayer("unknown-player");
      await waitFor(() => {
        expect(screen.getByText(/joueur introuvable/i)).toBeInTheDocument();
      });
    });

    it("should show Retour button when player not found", async () => {
      renderWithPlayer("unknown-player");
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /retour/i })).toBeInTheDocument();
      });
    });
  });
});
