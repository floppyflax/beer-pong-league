/**
 * PlayerProfile Page Tests - Story 14.20, 14-35
 *
 * Tests for design system alignment:
 * - AC1: Header with name + back
 * - AC2: Avatar + infos
 * - AC3: StatCards (ELO, W/L, Win rate)
 * - AC4: Streak card
 * - AC5: Sections (ELO evolution, Stats par league, Head-to-head, Recent matches)
 * - AC6: Bottom nav visible (pb-bottom-nav)
 * - Story 14-35: Avatar photo, Membre depuis, relative time, delta ELO, head-to-head avatars
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PlayerProfile } from "@/pages/PlayerProfile";
import "@testing-library/jest-dom";

// Mock Recharts to avoid ResponsiveContainer dimension warnings in jsdom (code review fix)
vi.mock("recharts", () => ({
  AreaChart: () => React.createElement("div", { "data-testid": "area-chart" }),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      "div",
      { style: { width: 100, height: 100 }, "data-testid": "recharts-container" },
      children,
    ),
}));

const mockNavigate = vi.fn();
const PLAYER_1 = "11111111-1111-4111-8111-111111111111";
const PLAYER_2 = "22222222-2222-4222-8222-222222222222";
const PLAYER_3 = "33333333-3333-4333-8333-333333333333";
const PLAYER_4 = "44444444-4444-4444-8444-444444444444"; // Story 14-35: streak >= 3 for "En feu !"

const mockLeagues = [
  {
    id: "league-1",
    name: "League des Pingouins",
    type: "one-shot" as const,
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
      {
        id: PLAYER_4,
        name: "Hot Player",
        elo: 1300,
        wins: 12,
        losses: 2,
        matchesPlayed: 14,
        streak: 4,
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
      {
        id: "match-2",
        date: "2026-01-16",
        teamA: [PLAYER_4],
        teamB: [PLAYER_2],
        scoreA: 10,
        scoreB: 6,
        eloChanges: { [PLAYER_4]: 20, [PLAYER_2]: -20 },
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
    events: [],
    updatePlayer: vi.fn(),
  }),
}));

vi.mock("@/services/DatabaseService", () => ({
  databaseService: {
    loadPlayerById: vi.fn().mockResolvedValue(null),
    loadEventParticipants: vi.fn().mockResolvedValue([]),
    loadPlayerEnrichment: vi.fn().mockResolvedValue({
      avatarUrl: null,
      joinedAt: null,
      userId: null,
      anonymousUserId: null,
    }),
    loadAvatarUrlsForPlayerIds: vi.fn().mockResolvedValue({}),
    loadEloHistoryForPlayer: vi.fn().mockResolvedValue([]),
  },
}));

const renderWithPlayer = (playerId: string) => {
  return render(
    <MemoryRouter initialEntries={[`/player/${playerId}`]}>
      <Routes>
        <Route path="/player/:playerId" element={<PlayerProfile />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("PlayerProfile - Story 14.20", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AC1: Header with name + back", () => {
    it("should render header with player name", async () => {
      renderWithPlayer(PLAYER_1);
      const headings = await screen.findAllByRole("heading", { name: /marc dupont/i });
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });

    it("should have back button", async () => {
      renderWithPlayer(PLAYER_1);
      expect(
        await screen.findByRole("button", { name: /retour/i }),
      ).toBeInTheDocument();
    });

    it("should call navigate(-1) when back is clicked", async () => {
      const user = userEvent.setup();
      renderWithPlayer(PLAYER_1);
      await user.click(await screen.findByRole("button", { name: /retour/i }));
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe("AC2: Avatar + infos", () => {
    it("should display player initials in avatar", async () => {
      renderWithPlayer(PLAYER_1);
      expect(await screen.findByText("MD")).toBeInTheDocument();
    });

    it("should display player name", async () => {
      renderWithPlayer(PLAYER_1);
      expect(
        (await screen.findAllByText("Marc Dupont")).length,
      ).toBeGreaterThanOrEqual(1);
    });

    it("should display league name when player is in a league", async () => {
      renderWithPlayer(PLAYER_1);
      expect(
        (await screen.findAllByText("League des Pingouins")).length,
      ).toBeGreaterThanOrEqual(1);
    });

    // TODO(Phase B): loadPlayerEnrichment stubbed out in PR0 — restore when method is added to DatabaseService
    it.skip("should display avatar photo when loadPlayerEnrichment returns avatarUrl (Story 14-35)", async () => {
      const { databaseService } = await import("@/services/DatabaseService");
      vi.mocked(databaseService.loadPlayerEnrichment).mockResolvedValue({
        avatarUrl: "https://example.com/avatar.png",
        joinedAt: "2025-01-15",
        userId: "user-1",
        anonymousUserId: null,
      });
      renderWithPlayer(PLAYER_1);
      await waitFor(() => {
        const img = document.querySelector('img[src="https://example.com/avatar.png"]');
        expect(img).toBeInTheDocument();
      });
    });

    // TODO(Phase B): loadPlayerEnrichment stubbed out in PR0 — restore when method is added to DatabaseService
    it.skip("should display Membre depuis when joinedAt is provided (Story 14-35)", async () => {
      const { databaseService } = await import("@/services/DatabaseService");
      vi.mocked(databaseService.loadPlayerEnrichment).mockResolvedValue({
        avatarUrl: null,
        joinedAt: "2025-01-15",
        userId: null,
        anonymousUserId: null,
      });
      renderWithPlayer(PLAYER_1);
      await waitFor(() => {
        expect(screen.getByText(/membre depuis janvier 2025/i)).toBeInTheDocument();
      });
    });
  });

  describe("AC3: StatCards (ELO, W/L, Win rate)", () => {
    it("should render StatCards with ELO, W/L, Win rate", async () => {
      renderWithPlayer(PLAYER_1);
      // Hero block has 3 StatCards (ELO, W/L, Win rate); the new
      // "Win rate par format" section adds 3 more (1v1 / 2v2 / 3v3).
      const statcards = await screen.findAllByTestId("statcard");
      expect(statcards.length).toBeGreaterThanOrEqual(3);
      expect(await screen.findByText("1250")).toBeInTheDocument();
      expect(
        (await screen.findAllByText(/1V - 0D/)).length,
      ).toBeGreaterThanOrEqual(1);
      // "100%" may now appear in both the hero card and the 1v1 format card.
      expect(
        (await screen.findAllByText("100%")).length,
      ).toBeGreaterThanOrEqual(1);
    });

    it("should display ELO label", async () => {
      renderWithPlayer(PLAYER_1);
      expect(await screen.findByText("ELO")).toBeInTheDocument();
    });

    it("should display W/L label", async () => {
      renderWithPlayer(PLAYER_1);
      expect(await screen.findByText("W/L")).toBeInTheDocument();
    });

    it("should display Win rate label", async () => {
      renderWithPlayer(PLAYER_1);
      expect(await screen.findByText("Win rate")).toBeInTheDocument();
    });
  });

  describe("AC4: Streak card", () => {
    it("should display positive streak", async () => {
      renderWithPlayer(PLAYER_1);
      expect(
        await screen.findByText(/2 victoires d'affilée/),
      ).toBeInTheDocument();
    });

    it("should display negative streak for player with losses", async () => {
      renderWithPlayer(PLAYER_2);
      expect(
        await screen.findByText(/1 défaites d'affilée/),
      ).toBeInTheDocument();
    });

    it("should display 'Aucune série' when streak is 0", async () => {
      renderWithPlayer(PLAYER_3);
      expect(await screen.findByText(/aucune série/i)).toBeInTheDocument();
    });

    it("should display 'En feu !' variant when streak >= 3 (Story 14-35)", async () => {
      renderWithPlayer(PLAYER_4);
      expect(await screen.findByText(/en feu !/i)).toBeInTheDocument();
    });
  });

  describe("AC5: Sections", () => {
    it("should display ELO evolution section when data exists", async () => {
      renderWithPlayer(PLAYER_1);
      expect(
        await screen.findByRole("heading", { name: /évolution elo/i }),
      ).toBeInTheDocument();
    });

    it("should display Stats par league section", async () => {
      renderWithPlayer(PLAYER_1);
      expect(
        await screen.findByRole("heading", { name: /statistiques par league/i }),
      ).toBeInTheDocument();
    });

    it("should display Head-to-head section", async () => {
      renderWithPlayer(PLAYER_1);
      expect(
        await screen.findByRole("heading", { name: /tête-à-tête/i }),
      ).toBeInTheDocument();
    });

    it("should display Recent matches section", async () => {
      renderWithPlayer(PLAYER_1);
      expect(
        await screen.findByRole("heading", { name: /matchs récents/i }),
      ).toBeInTheDocument();
    });

    it("should use ListRow for head-to-head opponents", async () => {
      renderWithPlayer(PLAYER_1);
      const listrows = await screen.findAllByTestId("listrow");
      expect(listrows.length).toBeGreaterThanOrEqual(1);
    });

    it("should display Victoire/Défaite badge in recent matches (Story 14-35)", async () => {
      renderWithPlayer(PLAYER_1);
      await waitFor(() => {
        const victoryBadge = screen.getByText("Victoire");
        expect(victoryBadge).toBeInTheDocument();
      });
    });

    it("should display delta ELO in recent matches when eloChanges present (Story 14-35)", async () => {
      renderWithPlayer(PLAYER_1);
      await waitFor(() => {
        // MatchTeamsRow renders the per-team delta compactly as "+15"
        // (visible text) with an aria-label of "ELO +15".
        expect(screen.getByText("+15")).toBeInTheDocument();
      });
    });

    it("should display ELO chart when loadEloHistoryForPlayer returns data (Story 14-35)", async () => {
      const { databaseService } = await import("@/services/DatabaseService");
      vi.mocked(databaseService.loadPlayerEnrichment).mockResolvedValue({
        avatarUrl: null,
        joinedAt: null,
        userId: "user-1",
        anonymousUserId: null,
      });
      vi.mocked(databaseService.loadEloHistoryForPlayer).mockResolvedValue([
        { date: "2025-01-01", elo: 1000 },
        { date: "2025-02-01", elo: 1050 },
      ]);
      renderWithPlayer(PLAYER_1);
      await waitFor(() => {
        // EloChart DS component replaces recharts AreaChart (Phase B.5 refactor)
        expect(screen.getByTestId("elo-chart")).toBeInTheDocument();
      });
    });

    // TODO(Phase B): loadAvatarUrlsForPlayerIds stubbed out in PR0 — restore when method is added to DatabaseService
    it.skip("should display opponent avatars in head-to-head when loadAvatarUrlsForPlayerIds returns URLs (Story 14-35)", async () => {
      const { databaseService } = await import("@/services/DatabaseService");
      vi.mocked(databaseService.loadAvatarUrlsForPlayerIds).mockResolvedValue({
        [PLAYER_2]: "https://example.com/opponent-avatar.png",
      });
      renderWithPlayer(PLAYER_1);
      await waitFor(() => {
        const img = document.querySelector(
          'img[src="https://example.com/opponent-avatar.png"]',
        );
        expect(img).toBeInTheDocument();
      });
    });
  });

  describe("AC6: Bottom nav visible", () => {
    it("should apply pb-bottom-nav to content area", async () => {
      const { container } = renderWithPlayer(PLAYER_1);
      await waitFor(() => {
        const scrollable = container.querySelector(".pb-bottom-nav");
        expect(scrollable).toBeInTheDocument();
      });
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
        expect(
          screen.getByRole("button", { name: /retour/i }),
        ).toBeInTheDocument();
      });
    });
  });
});
