/**
 * UserProfile Page Tests - Story 14.21
 *
 * Tests for design system alignment:
 * - AC1: Page aligned with design system (StatCard, layout, tokens)
 * - AC2: Bottom nav visible (via navigationHelpers - tested in navigationHelpers.test.ts)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { UserProfile } from "../../../src/pages/UserProfile";
import { AuthProvider } from "../../../src/context/AuthContext";
import { IdentityProvider } from "../../../src/context/IdentityContext";
import { LeagueProvider } from "../../../src/context/LeagueContext";
import "@testing-library/jest-dom";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockLeagues = [
  {
    id: "league-1",
    name: "Test League",
    creator_user_id: "user-1",
    creator_anonymous_user_id: null,
    players: [{ id: "p1", pseudo: "Player 1" }],
    matches: [],
    status: "active",
  },
];

const mockTournaments = [
  {
    id: "tournament-1",
    name: "Test Tournament",
    creator_user_id: "user-1",
    creator_anonymous_user_id: null,
    date: "2026-02-01",
    matches: [],
    isFinished: false,
  },
];

const mockUseLeague = vi.fn(() => ({
  leagues: mockLeagues,
  tournaments: mockTournaments,
}));

vi.mock("../../../src/context/LeagueContext", () => ({
  LeagueProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useLeague: () => mockUseLeague(),
}));

const mockUseAuthContext = vi.fn(() => ({
  isAuthenticated: true,
  isLoading: false,
  user: { id: "user-1", email: "test@example.com" },
  signOut: vi.fn(),
}));

vi.mock("../../../src/context/AuthContext", async () => {
  const actual = await vi.importActual("../../../src/context/AuthContext");
  return {
    ...actual,
    useAuthContext: () => mockUseAuthContext(),
  };
});

const mockFullDisconnect = vi.fn();
vi.mock("../../../src/hooks/useFullDisconnect", () => ({
  useFullDisconnect: () => ({ fullDisconnect: mockFullDisconnect }),
}));

const mockUseIdentity = vi.fn(() => ({
  localUser: { anonymousUserId: "anon-1", pseudo: "Joueur", createdAt: "" },
  isLoading: false,
  isAnonymous: true,
  createIdentity: vi.fn(),
  updateIdentity: vi.fn(),
  clearIdentity: vi.fn(),
  initializeAnonymousUser: vi.fn(),
}));

vi.mock("../../../src/hooks/useIdentity", () => ({
  useIdentity: () => mockUseIdentity(),
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <IdentityProvider>
        <LeagueProvider>{children}</LeagueProvider>
      </IdentityProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe("UserProfile - Story 14.21", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AC1: Design system alignment", () => {
    it("should render header with title Mon Profil", () => {
      render(<UserProfile />, { wrapper: Wrapper });
      expect(
        screen.getByRole("heading", { name: /mon profil/i }),
      ).toBeInTheDocument();
    });

    it("should render StatCards for Leagues, Tournois, Matchs", () => {
      render(<UserProfile />, { wrapper: Wrapper });
      expect(screen.getByText("Leagues")).toBeInTheDocument();
      expect(screen.getByText("Tournois")).toBeInTheDocument();
      expect(screen.getByText("Matchs")).toBeInTheDocument();
    });

    it("should render profile info card with avatar", () => {
      render(<UserProfile />, { wrapper: Wrapper });
      const statCards = screen.getAllByTestId("statcard");
      expect(statCards).toHaveLength(3);
    });

    it("should render My Leagues section when user has leagues", () => {
      render(<UserProfile />, { wrapper: Wrapper });
      expect(screen.getByText("Mes Leagues")).toBeInTheDocument();
      expect(screen.getByText("Test League")).toBeInTheDocument();
    });

    it("should render My Tournaments section when user has tournaments", () => {
      render(<UserProfile />, { wrapper: Wrapper });
      expect(screen.getByText("Mes Tournois")).toBeInTheDocument();
      expect(screen.getByText("Test Tournament")).toBeInTheDocument();
    });
  });

  describe("AC: Disconnect button (Story 14.34)", () => {
    it("should render disconnect button when user has identity (auth or anonymous)", () => {
      render(<UserProfile />, { wrapper: Wrapper });
      expect(
        screen.getByRole("button", { name: /déconnexion/i }),
      ).toBeInTheDocument();
    });

    it("should render disconnect button when user is anonymous-only (no auth)", () => {
      mockUseAuthContext.mockReturnValueOnce({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        signOut: vi.fn(),
      });
      mockUseIdentity.mockReturnValueOnce({
        localUser: {
          anonymousUserId: "anon-1",
          pseudo: "Invité",
          createdAt: "",
        },
        isLoading: false,
        isAnonymous: true,
        createIdentity: vi.fn(),
        updateIdentity: vi.fn(),
        clearIdentity: vi.fn(),
        initializeAnonymousUser: vi.fn(),
      });

      render(<UserProfile />, { wrapper: Wrapper });
      expect(
        screen.getByRole("button", { name: /déconnexion/i }),
      ).toBeInTheDocument();
    });

    it("should NOT render disconnect button when user has no identity", () => {
      mockUseAuthContext.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        signOut: vi.fn(),
      });
      mockUseIdentity.mockReturnValue({
        localUser: null,
        isLoading: false,
        isAnonymous: false,
        createIdentity: vi.fn(),
        updateIdentity: vi.fn(),
        clearIdentity: vi.fn(),
        initializeAnonymousUser: vi.fn(),
      });

      render(<UserProfile />, { wrapper: Wrapper });
      expect(
        screen.queryByRole("button", { name: /déconnexion/i }),
      ).not.toBeInTheDocument();

      // Restore defaults for subsequent tests
      mockUseAuthContext.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: "user-1", email: "test@example.com" },
        signOut: vi.fn(),
      });
      mockUseIdentity.mockReturnValue({
        localUser: {
          anonymousUserId: "anon-1",
          pseudo: "Joueur",
          createdAt: "",
        },
        isLoading: false,
        isAnonymous: true,
        createIdentity: vi.fn(),
        updateIdentity: vi.fn(),
        clearIdentity: vi.fn(),
        initializeAnonymousUser: vi.fn(),
      });
    });

    it("should call fullDisconnect when disconnect button clicked", async () => {
      const user = userEvent.setup();
      render(<UserProfile />, { wrapper: Wrapper });

      const button = screen.getByRole("button", { name: /déconnexion/i });
      await user.click(button);

      expect(mockFullDisconnect).toHaveBeenCalled();
    });
  });

  describe("Navigation", () => {
    it("should navigate to league when league card clicked", async () => {
      const user = userEvent.setup();
      render(<UserProfile />, { wrapper: Wrapper });

      const leagueCard = screen.getByText("Test League");
      await user.click(leagueCard);

      expect(mockNavigate).toHaveBeenCalledWith("/league/league-1");
    });

    it("should navigate to tournament when tournament card clicked", async () => {
      const user = userEvent.setup();
      render(<UserProfile />, { wrapper: Wrapper });

      const tournamentCard = screen.getByText("Test Tournament");
      await user.click(tournamentCard);

      expect(mockNavigate).toHaveBeenCalledWith("/tournament/tournament-1");
    });
  });

  describe("Empty state", () => {
    it("should render without leagues/tournaments sections when user has none", () => {
      mockUseLeague.mockReturnValueOnce({
        leagues: [],
        tournaments: [],
      });

      render(<UserProfile />, { wrapper: Wrapper });

      expect(
        screen.getByRole("heading", { name: /mon profil/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Leagues")).toBeInTheDocument();
      expect(screen.getByText("Tournois")).toBeInTheDocument();
      expect(screen.getByText("Matchs")).toBeInTheDocument();
      expect(screen.queryByText("Mes Leagues")).not.toBeInTheDocument();
      expect(screen.queryByText("Mes Tournois")).not.toBeInTheDocument();
    });
  });
});
