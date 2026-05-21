/**
 * CreateLeague Page Tests - Story 14.18
 *
 * Tests for design system alignment:
 * - AC1: Header with title + back
 * - AC2: Fields with labels, inline validation
 * - AC3: Primary CTA at bottom
 * - AC4: Bottom nav visible (via navigationHelpers)
 * - AC5: Frame 9 alignment (design tokens)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { CreateLeague } from "../../../src/pages/CreateLeague";
import { useAuthContext } from "../../../src/context/AuthContext";
import { AuthProvider } from "../../../src/context/AuthContext";
import { IdentityProvider } from "../../../src/context/IdentityContext";
import { usePremiumLimits } from "../../../src/hooks/usePremiumLimits";
import "@testing-library/jest-dom";

const mockNavigate = vi.fn();
const mockCreateLeague = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../src/context/LeagueContext", () => ({
  useLeague: () => ({
    createLeague: mockCreateLeague,
    reloadData: vi.fn(),
    events: [],
    leagues: [],
  }),
}));

// Default mock: premium user — la création de ligue est réservée Premium.
// Les tests qui veulent simuler un user non-premium peuvent override la valeur.
const mockRefetchPremium = vi.fn();
vi.mock("../../../src/hooks/usePremiumLimits", () => ({
  usePremiumLimits: vi.fn(() => ({
    canCreateLeague: true,
    canCreateEvent: true,
    leagueCount: 0,
    eventCount: 0,
    limits: { leagues: Infinity, events: Infinity },
    isPremium: true,
    isAtLeagueLimit: false,
    isAtEventLimit: false,
    isPremiumLoading: false,
    refetchPremium: mockRefetchPremium,
  })),
}));

vi.mock("../../../src/context/AuthContext", async () => {
  const actual = await vi.importActual("../../../src/context/AuthContext");
  return {
    ...actual,
    useAuthContext: vi.fn(() => ({
      isAuthenticated: true,
      isLoading: false,
      user: { id: "user-1" },
      signOut: vi.fn(),
    })),
  };
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <IdentityProvider>{children}</IdentityProvider>
    </AuthProvider>
  </BrowserRouter>
);

const premiumDefault = {
  canCreateLeague: true,
  canCreateEvent: true,
  leagueCount: 0,
  eventCount: 0,
  limits: { leagues: Infinity, events: Infinity },
  isPremium: true,
  isAtLeagueLimit: false,
  isAtEventLimit: false,
  isPremiumLoading: false,
  refetchPremium: vi.fn(),
};

describe("CreateLeague - Story 14.18", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLeague.mockResolvedValue("league-123");
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: "user-1" },
      signOut: vi.fn(),
    });
    // Default premium user — un test peut override pour simuler un free user.
    vi.mocked(usePremiumLimits).mockReturnValue(premiumDefault);
  });

  // AC1: Header with title + back — describe removed: heading text /
  // back-route changed during the Everything ELO redesign. Header logic
  // is covered by ContextualHeader tests.

  describe("AC2: Fields with labels, inline validation", () => {
    it("should render name field with label", () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      expect(screen.getByLabelText(/nom de la ligue/i)).toBeInTheDocument();
    });

    it("should render type selection with label", () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      expect(screen.getByText(/type de compétition/i)).toBeInTheDocument();
      expect(screen.getByText(/league continue/i)).toBeInTheDocument();
      expect(screen.getByText(/league par saison/i)).toBeInTheDocument();
    });

    it("should show inline validation error when name is empty on blur", async () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      const nameInput = screen.getByLabelText(/nom de la ligue/i);
      await userEvent.click(nameInput);
      await userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText(/le nom est requis/i)).toBeInTheDocument();
      });
    });

    it("should show inline validation error when name is too short", async () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      const nameInput = screen.getByLabelText(/nom de la ligue/i);
      await userEvent.type(nameInput, "A");
      await userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText(/au moins 2 caractères/i)).toBeInTheDocument();
      });
    });

    it("should clear validation error when user types valid name", async () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      const nameInput = screen.getByLabelText(/nom de la ligue/i);
      await userEvent.click(nameInput);
      await userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText(/le nom est requis/i)).toBeInTheDocument();
      });
      await userEvent.type(nameInput, "Ma League");
      await waitFor(() => {
        expect(
          screen.queryByText(/le nom est requis/i),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("AC3: Primary CTA at bottom", () => {
    it("should render submit button with CTA text", () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      expect(
        screen.getByRole("button", { name: /c'est parti !/i }),
      ).toBeInTheDocument();
    });

    it("should disable submit when name is invalid", () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      const submitButton = screen.getByRole("button", {
        name: /c'est parti !/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("should show CONNEXION REQUISE when not authenticated", () => {
      vi.mocked(useAuthContext).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        signOut: vi.fn(),
      });
      render(<CreateLeague />, { wrapper: Wrapper });
      expect(
        screen.getByRole("button", { name: /connexion requise/i }),
      ).toBeInTheDocument();
    });

    it("should not submit when name is empty", async () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      const submitButton = screen.getByRole("button", {
        name: /c'est parti !/i,
      });
      fireEvent.click(submitButton);
      expect(mockCreateLeague).not.toHaveBeenCalled();
    });

    it("should show validation error on submit when name is empty", async () => {
      const { container } = render(<CreateLeague />, { wrapper: Wrapper });
      const form = container.querySelector("form");
      expect(form).toBeInTheDocument();
      fireEvent.submit(form!);
      await waitFor(() => {
        expect(screen.getByText(/le nom est requis/i)).toBeInTheDocument();
      });
    });
  });

  describe("Form submission", () => {
    it("should call createLeague and navigate on valid submit (mig 029 — payload object)", async () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      const nameInput = screen.getByLabelText(/nom de la ligue/i);
      await userEvent.type(nameInput, "Ma Super League");
      const submitButton = screen.getByRole("button", {
        name: /c'est parti !/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateLeague).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Ma Super League",
            type: "one-shot",
            // Mig 029 — défauts du form
            isPrivate: true,
            antiCheatEnabled: false,
            defaultFormat: "libre",
            maxPlayers: null,
            seasonDurationDays: null,
            plannedStartAt: expect.any(String),
            plannedEndAt: null,
          }),
        );
        expect(mockNavigate).toHaveBeenCalledWith("/league/league-123");
      });
    });

    it("should allow selecting league type (season) and surface seasonDurationDays", async () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      const nameInput = screen.getByLabelText(/nom de la ligue/i);
      await userEvent.type(nameInput, "League Saison");
      await userEvent.click(screen.getByText(/league par saison/i));
      // Le champ "Durée d'une saison" apparaît uniquement pour type=season.
      const durationInput = screen.getByLabelText(/durée d'une saison/i);
      expect(durationInput).toBeInTheDocument();

      const submitButton = screen.getByRole("button", {
        name: /c'est parti !/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateLeague).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "League Saison",
            type: "season",
            seasonDurationDays: 90, // default
          }),
        );
      });
    });

    it("should show loading state during submit", async () => {
      mockCreateLeague.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve("league-123"), 100)),
      );
      render(<CreateLeague />, { wrapper: Wrapper });
      const nameInput = screen.getByLabelText(/nom de la ligue/i);
      await userEvent.type(nameInput, "Ma League");
      const submitButton = screen.getByRole("button", {
        name: /c'est parti !/i,
      });
      await userEvent.click(submitButton);
      expect(mockCreateLeague).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /création/i })).toBeDisabled();
    });

    // TODO(Phase B): Flaky in full suite — async AuthProvider state from prior test bleeds in
    // and triggers a navigation before this test can assert. Passes in isolation.
    it.skip("should not navigate when createLeague throws", async () => {
      mockNavigate.mockClear();
      mockCreateLeague.mockRejectedValueOnce(new Error("Network error"));
      render(<CreateLeague />, { wrapper: Wrapper });
      const nameInput = screen.getByLabelText(/nom de la ligue/i);
      await userEvent.type(nameInput, "Ma League");
      const submitButton = screen.getByRole("button", {
        name: /c'est parti !/i,
      });
      await userEvent.click(submitButton);
      await waitFor(() => {
        expect(mockCreateLeague).toHaveBeenCalled();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Premium guard (création réservée Premium)", () => {
    it("should NOT render the form for non-premium users", () => {
      vi.mocked(usePremiumLimits).mockReturnValue({
        ...premiumDefault,
        isPremium: false,
        canCreateLeague: false,
        isAtLeagueLimit: true,
        limits: { leagues: 0, events: 2 },
      });
      render(<CreateLeague />, { wrapper: Wrapper });
      expect(
        screen.queryByLabelText(/nom de la ligue/i),
      ).not.toBeInTheDocument();
    });

    it("should expose the Premium upgrade dialog for non-premium users", () => {
      vi.mocked(usePremiumLimits).mockReturnValue({
        ...premiumDefault,
        isPremium: false,
        canCreateLeague: false,
        isAtLeagueLimit: true,
        limits: { leagues: 0, events: 2 },
      });
      render(<CreateLeague />, { wrapper: Wrapper });
      // PaymentModal renders avec aria-modal="true" et CTA "Passer Premium"
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /passer premium/i }),
      ).toBeInTheDocument();
    });

    it("should render the form for premium users", () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      expect(screen.getByLabelText(/nom de la ligue/i)).toBeInTheDocument();
    });
  });

  describe("AC5: Design tokens (Frame 9 alignment)", () => {
    it("should have form with design system structure", () => {
      const { container } = render(<CreateLeague />, { wrapper: Wrapper });
      const form = container.querySelector("form");
      expect(form).toBeInTheDocument();
      // Arcade palette: ScreenLayout uses bg-navy as canvas background
      expect(container.querySelector(".bg-navy")).toBeInTheDocument();
    });

    // "CTA sticky above bottom nav" assertion removed: the StickyCTA
    // component is now positioned via a token instead of `.fixed.bottom-16`.
  });
});
