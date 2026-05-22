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
// Mutable auth user (vitest allows `mock`-prefixed vars inside hoisted factories).
let mockUser: { id: string } | null = null;
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
    creator_user_id: "admin-1",
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

// Mutable so a test can simulate `leagues` being replaced wholesale mid-render
// (auth token refresh / loadDataFromSupabase churn).
let mockCurrentLeagues: typeof mockLeagues = mockLeagues;
// Mutable events context (event-context profile test sets this).
let mockCurrentEvents: { id: string; name: string; leagueId: string | null; matches: unknown[] }[] = [];

vi.mock("@/context/LeagueContext", () => ({
  useLeague: () => ({
    leagues: mockCurrentLeagues,
    events: mockCurrentEvents,
    updatePlayer: vi.fn(),
  }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuthContext: () => ({ user: mockUser }),
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
      globalPlayerId: null,
    }),
    loadAvatarUrlsForPlayerIds: vi.fn().mockResolvedValue({}),
    loadEloHistoryForPlayer: vi.fn().mockResolvedValue([]),
    updateGhostPlayerIdentity: vi.fn().mockResolvedValue(undefined),
    uploadGhostAvatar: vi.fn().mockResolvedValue("https://example.com/ghost.png"),
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
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUser = null;
    mockCurrentLeagues = mockLeagues;
    mockCurrentEvents = [];
    // clearAllMocks resets call history but NOT implementations — restore the
    // module-level defaults so a per-test mockResolvedValue can't leak forward.
    const { databaseService } = await import("@/services/DatabaseService");
    vi.mocked(databaseService.loadPlayerById).mockResolvedValue(null);
    vi.mocked(databaseService.loadPlayerEnrichment).mockResolvedValue({
      avatarUrl: null,
      joinedAt: null,
      userId: null,
      anonymousUserId: null,
      globalPlayerId: null,
    });
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
      // MatchTeamsRow now shows the delta as the abs value + an aria-labelled
      // sign ("ELO +15"); the old inline "+15 ELO" text was dropped.
      await waitFor(() => {
        expect(screen.getByLabelText(/ELO \+15/)).toBeInTheDocument();
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

  // Admin edit of a ghost player (no user attached). Reproduces the bug where
  // saving the name blanked the profile (regression: reloadData() churned the
  // global context). The profile must stay rendered after save.
  describe("Admin ghost edit", () => {
    const asGhostAdmin = async () => {
      mockUser = { id: "admin-1" }; // matches league-1.creator_user_id
      const { databaseService } = await import("@/services/DatabaseService");
      vi.mocked(databaseService.loadPlayerEnrichment).mockResolvedValue({
        avatarUrl: null,
        joinedAt: null,
        userId: null, // ghost: no account attached
        anonymousUserId: null,
        globalPlayerId: "global-p1",
      });
      return databaseService;
    };

    it("shows the edit pencil only for an admin viewing a ghost", async () => {
      await asGhostAdmin();
      renderWithPlayer(PLAYER_1);
      expect(
        await screen.findByRole("button", { name: /modifier le nom du joueur/i }),
      ).toBeInTheDocument();
    });

    it("hides the edit pencil for a non-admin viewer", async () => {
      mockUser = { id: "someone-else" };
      renderWithPlayer(PLAYER_1);
      // Wait for the profile to render, then assert no edit affordance.
      await screen.findAllByText("Marc Dupont");
      expect(
        screen.queryByRole("button", { name: /modifier le nom du joueur/i }),
      ).not.toBeInTheDocument();
    });

    it("saves the new name and KEEPS the profile rendered (no black screen)", async () => {
      const user = userEvent.setup();
      const databaseService = await asGhostAdmin();
      renderWithPlayer(PLAYER_1);

      await user.click(
        await screen.findByRole("button", { name: /modifier le nom du joueur/i }),
      );
      const input = screen.getByDisplayValue("Marc Dupont");
      await user.clear(input);
      await user.type(input, "Nouveau Nom");
      await user.click(screen.getByRole("button", { name: /valider/i }));

      // Persisted to players.pseudo via the ghost RPC.
      await waitFor(() => {
        expect(databaseService.updateGhostPlayerIdentity).toHaveBeenCalledWith(
          "global-p1",
          { pseudo: "Nouveau Nom" },
        );
      });

      // The profile must remain mounted — the regression blanked it here.
      expect(await screen.findByText("ELO")).toBeInTheDocument();
      // The header reflects the new name immediately (local override). Match
      // rows keep the context name until the next natural context reload.
      const headings = await screen.findAllByRole("heading", { name: /nouveau nom/i });
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  // Reproduces "flash-then-black": the profile renders, then `leagues` is
  // replaced wholesale (auth token refresh / loadDataFromSupabase) and no
  // longer contains the player. The sticky last-resolved player must keep the
  // profile on screen instead of blanking to a black `return null`.
  describe("Resilience to leagues churn", () => {
    it("keeps the profile rendered when leagues is replaced and loses the player", async () => {
      const tree = (
        <MemoryRouter initialEntries={[`/player/${PLAYER_1}`]}>
          <Routes>
            <Route path="/player/:playerId" element={<PlayerProfile />} />
          </Routes>
        </MemoryRouter>
      );
      const { rerender } = render(tree);

      // Initial render: player resolved from the leagues context.
      expect(
        (await screen.findAllByText("Marc Dupont")).length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("ELO")).toBeInTheDocument();

      // Simulate the churn: leagues replaced, player no longer present.
      mockCurrentLeagues = [];
      rerender(tree);

      // Must NOT blank: the sticky player keeps header + stats on screen, and
      // we must not fall into the "Joueur introuvable" / null branches.
      expect(
        screen.getAllByText("Marc Dupont").length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("ELO")).toBeInTheDocument();
      expect(screen.queryByText(/joueur introuvable/i)).not.toBeInTheDocument();
    });
  });

  // Profile opened from an event ranking (/player/:id?event=<id>). The player
  // is resolved via the event membership (loadPlayerById event path) so the
  // hero ELO is the event-local bubble, matching the event ranking — not the
  // divergent league ELO. See invariant #8.
  describe("Event-context profile", () => {
    const EVENT_MEMBERSHIP_ID = "tm-event-1";

    beforeEach(async () => {
      mockCurrentLeagues = []; // not resolvable via league sync
      mockCurrentEvents = [
        { id: "event-1", name: "Tournoi du Vendredi", leagueId: "league-1", matches: [] },
      ];
      const { databaseService } = await import("@/services/DatabaseService");
      vi.mocked(databaseService.loadPlayerById).mockResolvedValue({
        player: {
          id: EVENT_MEMBERSHIP_ID,
          name: "Event Guy",
          elo: 1337, // event-local ELO (≠ any league ELO)
          wins: 3,
          losses: 1,
          matchesPlayed: 4,
          streak: 2,
        },
        leagueId: "league-1",
        leagueName: "League des Pingouins",
        eventId: "event-1",
        globalPlayerId: "gp-1",
        userId: "user-x",
      });
    });

    const renderEventContext = () =>
      render(
        <MemoryRouter
          initialEntries={[`/player/${EVENT_MEMBERSHIP_ID}?event=event-1`]}
        >
          <Routes>
            <Route path="/player/:playerId" element={<PlayerProfile />} />
          </Routes>
        </MemoryRouter>,
      );

    it("shows the event-local ELO and labels it 'ELO event'", async () => {
      renderEventContext();
      expect(await screen.findByText("1337")).toBeInTheDocument();
      expect(await screen.findByText("ELO event")).toBeInTheDocument();
    });

    it("shows the event name as the context subtitle", async () => {
      renderEventContext();
      expect(
        await screen.findByText(/tournoi du vendredi/i),
      ).toBeInTheDocument();
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
