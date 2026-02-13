/**
 * CreateTournament Page Tests - Story 14.19
 *
 * Tests for design system alignment:
 * - AC1: Header with title + back
 * - AC2: Fields with labels, inline validation
 * - AC3: Primary CTA at bottom
 * - AC4: Frame 10 alignment (design tokens)
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import toast from "react-hot-toast";
import { CreateTournament } from "@/pages/CreateTournament";
import { AuthProvider } from "../../../src/context/AuthContext";
import { IdentityProvider } from "../../../src/context/IdentityContext";
import { databaseService } from "@/services/DatabaseService";
import { premiumService } from "@/services/PremiumService";
import "@testing-library/jest-dom";

const mockNavigate = vi.fn();
const mockReloadData = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock("@/services/DatabaseService", () => ({
  databaseService: {
    createTournament: vi.fn().mockResolvedValue("tournament-123"),
    tournamentCodeExists: vi.fn().mockResolvedValue(false),
  },
}));

vi.mock("@/services/PremiumService", () => ({
  premiumService: {
    isPremium: vi.fn().mockResolvedValue(false),
    getTournamentCount: vi.fn().mockResolvedValue(0),
    canCreateTournament: vi.fn().mockResolvedValue({ allowed: true, remaining: 2 }),
  },
}));

vi.mock("@/context/LeagueContext", () => ({
  useLeague: () => ({
    reloadData: mockReloadData,
  }),
}));

vi.mock("@/context/AuthContext", async () => {
  const actual = await vi.importActual("@/context/AuthContext");
  return {
    ...actual,
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuthContext: () => ({
      isAuthenticated: true,
      isLoading: false,
      user: { id: "user-1" },
      signOut: vi.fn(),
    }),
  };
});

vi.mock("@/context/IdentityContext", async () => {
  const actual = await vi.importActual("@/context/IdentityContext");
  return {
    ...actual,
    IdentityProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({
    localUser: { anonymousUserId: null },
  }),
}));

vi.mock("@/components/PaymentModal", () => ({
  PaymentModal: () => null,
}));

vi.mock("@/components/LoadingSpinner", () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <IdentityProvider>{children}</IdentityProvider>
    </AuthProvider>
  </BrowserRouter>
);

/** Wait for form to be visible (skipPremiumCheck bypasses loading) */
const waitForFormReady = async () => {
  return screen.findByLabelText(/nom du tournoi/i, {}, { timeout: 3000 });
};

describe("CreateTournament - Story 14.19", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    if (typeof mockReloadData === 'function' && 'mockClear' in mockReloadData) {
      (mockReloadData as ReturnType<typeof vi.fn>).mockClear();
    }
    vi.mocked(databaseService.createTournament).mockResolvedValue("tournament-123");
    vi.mocked(databaseService.tournamentCodeExists).mockResolvedValue(false);
  });

  describe("AC1: Header with title + back", () => {
    it("should render header with title Créer un Tournoi", async () => {
      render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      await waitForFormReady();
      expect(screen.getByRole("heading", { name: /créer un tournoi/i })).toBeInTheDocument();
    });

    it("should have back button that navigates to /", async () => {
      render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      await waitForFormReady();
      const backButton = screen.getByRole("button", { name: /retour/i });
      await userEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("AC2: Fields with labels, inline validation", () => {
    it("should render name field with label", async () => {
      render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      await waitForFormReady();
      expect(screen.getByLabelText(/nom du tournoi/i)).toBeInTheDocument();
    });

    it("should render format selection with label", async () => {
      render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      await waitForFormReady();
      expect(screen.getByText(/format du match/i)).toBeInTheDocument();
      expect(screen.getByText(/2v2 strict/i)).toBeInTheDocument();
      expect(screen.getByText(/1v1 strict/i)).toBeInTheDocument();
      expect(screen.getByText(/libre/i)).toBeInTheDocument();
    });

    it("should show inline validation error when name is empty on blur", async () => {
      render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      const nameInput = await waitForFormReady();
      await userEvent.click(nameInput);
      await userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText(/le nom du tournoi est requis/i)).toBeInTheDocument();
      });
    });

    it("should show inline validation error when name exceeds 50 chars", async () => {
      render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      const nameInput = await waitForFormReady();
      // Use fireEvent.change to bypass maxLength (userEvent.type is limited to 50 chars)
      fireEvent.change(nameInput, { target: { value: "a".repeat(51) } });
      fireEvent.blur(nameInput);
      await waitFor(() => {
        expect(
          screen.getByText(/le nom ne peut pas dépasser 50 caractères/i)
        ).toBeInTheDocument();
      });
    });

    it("should clear validation error when user types valid name", async () => {
      render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      const nameInput = await waitForFormReady();
      await userEvent.click(nameInput);
      await userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText(/le nom du tournoi est requis/i)).toBeInTheDocument();
      });
      await userEvent.type(nameInput, "Summer Cup 2026");
      await userEvent.tab(); // Blur to trigger re-validation
      await waitFor(() => {
        expect(
          screen.queryByText(/le nom du tournoi est requis/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("AC3: Primary CTA at bottom", () => {
    it("should render submit button with CTA text", async () => {
      render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      await waitForFormReady();
      expect(screen.getByRole("button", { name: /créer le tournoi/i })).toBeInTheDocument();
    });

    it("should disable submit when name is empty", async () => {
      render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      await waitForFormReady();
      const submitButton = screen.getByRole("button", { name: /créer le tournoi/i });
      expect(submitButton).toBeDisabled();
    });

    it("should not submit when name is empty", async () => {
      const { container } = render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      await waitForFormReady();
      const form = container.querySelector("form");
      expect(form).toBeTruthy();
      fireEvent.submit(form!);
      await waitFor(() => {
        expect(databaseService.createTournament).not.toHaveBeenCalled();
      });
    });

    it("should show validation error on submit when name is empty", async () => {
      const { container } = render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      await waitForFormReady();
      const form = container.querySelector("form");
      expect(form).toBeTruthy();
      fireEvent.submit(form!);
      await waitFor(() => {
        expect(screen.getByText(/le nom du tournoi est requis/i)).toBeInTheDocument();
      });
    });
  });

  describe("Form submission", () => {
    it("should call createTournament and navigate on valid submit", async () => {
      render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      const nameInput = await waitForFormReady();
      await userEvent.type(nameInput, "Summer Cup 2026");
      const submitButton = screen.getByRole("button", { name: /créer le tournoi/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(databaseService.createTournament).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/tournament/tournament-123");
      });
    });

    it("should allow selecting format (libre)", async () => {
      render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      await waitForFormReady();
      await userEvent.click(screen.getByText(/libre/i));
      const nameInput = screen.getByLabelText(/nom du tournoi/i);
      await userEvent.type(nameInput, "Free Format Tourney");
      const submitButton = screen.getByRole("button", { name: /créer le tournoi/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(databaseService.createTournament).toHaveBeenCalledWith(
          expect.objectContaining({
            formatType: "free",
            team1Size: null,
            team2Size: null,
          })
        );
      });
    });
  });

  describe("AC4: Design tokens (Frame 10 alignment)", () => {
    it("should have form with design system structure", async () => {
      const { container } = render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      await waitForFormReady();
      const form = container.querySelector("#create-tournament-form");
      expect(form).toBeInTheDocument();
      expect(form?.tagName.toLowerCase()).toBe("form");
    });
  });

  describe("Premium flow (with PremiumService mock)", () => {
    it("should render form after premium check completes (without skipPremiumCheck)", async () => {
      render(<CreateTournament />, { wrapper: Wrapper });
      await waitForFormReady();
      expect(screen.getByLabelText(/nom du tournoi/i)).toBeInTheDocument();
    });

    it("should show limit-reached modal when canCreateTournament returns allowed: false", async () => {
      vi.mocked(premiumService.canCreateTournament).mockResolvedValue({
        allowed: false,
        remaining: 0,
      });
      vi.mocked(premiumService.getTournamentCount).mockResolvedValue(2);
      vi.mocked(premiumService.isPremium).mockResolvedValue(false);

      render(<CreateTournament />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /limite atteinte/i })).toBeInTheDocument();
      });
      expect(screen.getByText(/passer premium/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /plus tard/i })).toBeInTheDocument();
    });
  });

  describe("Code generation error", () => {
    it("should show user-friendly error when unique code cannot be generated", async () => {
      vi.mocked(databaseService.tournamentCodeExists).mockResolvedValue(true);
      render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      const nameInput = await waitForFormReady();
      await userEvent.type(nameInput, "Summer Cup 2026");
      const submitButton = screen.getByRole("button", { name: /créer le tournoi/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining("code unique")
        );
      });
    });
  });

  describe("Player limit validation", () => {
    it("should reject player limit above 100", async () => {
      render(<CreateTournament skipPremiumCheck />, { wrapper: Wrapper });
      await waitForFormReady();
      await userEvent.click(screen.getByRole("button", { name: /limiter le nombre de joueurs/i }));
      const limitInput = screen.getByLabelText(/nombre maximum de joueurs/i);
      fireEvent.change(limitInput, { target: { value: "150" } });
      fireEvent.blur(limitInput);
      await waitFor(() => {
        expect(screen.getByText(/maximum 100 joueurs/i)).toBeInTheDocument();
      });
    });
  });
});
