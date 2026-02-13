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
import { CreateTournament } from "../../../src/pages/CreateTournament";
import { AuthProvider } from "../../../src/context/AuthContext";
import { IdentityProvider } from "../../../src/context/IdentityContext";
import { databaseService } from "../../../src/services/DatabaseService";
import { premiumService } from "../../../src/services/PremiumService";
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

vi.mock("../../../src/services/PremiumService", () => ({
  premiumService: {
    isPremium: vi.fn().mockResolvedValue(false),
    getTournamentCount: vi.fn().mockResolvedValue(0),
    canCreateTournament: vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 2,
      message: "OK",
    }),
  },
}));

vi.mock("../../../src/services/DatabaseService", () => ({
  databaseService: {
    createTournament: vi.fn().mockResolvedValue("tournament-123"),
    tournamentCodeExists: vi.fn().mockResolvedValue(false),
  },
}));

vi.mock("../../../src/context/LeagueContext", () => ({
  useLeague: () => ({
    reloadData: mockReloadData,
  }),
}));

vi.mock("../../../src/context/AuthContext", async () => {
  const actual = await vi.importActual("../../../src/context/AuthContext");
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

vi.mock("../../../src/context/IdentityContext", async () => {
  const actual = await vi.importActual("../../../src/context/IdentityContext");
  return {
    ...actual,
    IdentityProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("../../../src/hooks/useIdentity", () => ({
  useIdentity: () => ({
    localUser: { anonymousUserId: null },
  }),
}));

vi.mock("../../../src/components/PaymentModal", () => ({
  PaymentModal: () => null,
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <IdentityProvider>{children}</IdentityProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe("CreateTournament - Story 14.19", () => {
  beforeEach(() => {
    vi.mocked(databaseService.createTournament).mockResolvedValue("tournament-123");
    vi.mocked(databaseService.tournamentCodeExists).mockResolvedValue(false);
    vi.mocked(premiumService.isPremium).mockResolvedValue(false);
    vi.mocked(premiumService.getTournamentCount).mockResolvedValue(0);
    vi.mocked(premiumService.canCreateTournament).mockResolvedValue({
      allowed: true,
      remaining: 2,
      message: "OK",
    });
  });

  describe("AC1: Header with title + back", () => {
    it("should render header with title Créer un Tournoi", async () => {
      render(<CreateTournament />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /créer un tournoi/i })
        ).toBeInTheDocument();
      });
    });

    it("should have back button that navigates to /", async () => {
      render(<CreateTournament />, { wrapper: Wrapper });
      const backButton = await screen.findByRole("button", { name: /retour/i }, { timeout: 5000 });
      await userEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("AC2: Fields with labels, inline validation", () => {
    it("should render name field with label", async () => {
      render(<CreateTournament />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByLabelText(/nom du tournoi/i)).toBeInTheDocument();
      });
    });

    it("should render format selection with label", async () => {
      render(<CreateTournament />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText(/format du match/i)).toBeInTheDocument();
        expect(screen.getByText(/2v2 strict/i)).toBeInTheDocument();
        expect(screen.getByText(/1v1 strict/i)).toBeInTheDocument();
        expect(screen.getByText(/libre/i)).toBeInTheDocument();
      });
    });

    it("should show inline validation error when name is empty on blur", async () => {
      render(<CreateTournament />, { wrapper: Wrapper });
      const nameInput = await screen.findByLabelText(/nom du tournoi/i, {}, { timeout: 5000 });
      await userEvent.click(nameInput);
      await userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText(/le nom du tournoi est requis/i)).toBeInTheDocument();
      });
    });

    it("should show inline validation error when name exceeds 50 chars", async () => {
      render(<CreateTournament />, { wrapper: Wrapper });
      const nameInput = await screen.findByLabelText(/nom du tournoi/i, {}, { timeout: 5000 });
      await userEvent.type(nameInput, "a".repeat(51));
      await userEvent.tab();
      await waitFor(() => {
        expect(
          screen.getByText(/le nom ne peut pas dépasser 50 caractères/i)
        ).toBeInTheDocument();
      });
    });

    it("should clear validation error when user types valid name", async () => {
      render(<CreateTournament />, { wrapper: Wrapper });
      const nameInput = await screen.findByLabelText(/nom du tournoi/i, {}, { timeout: 5000 });
      await userEvent.click(nameInput);
      await userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText(/le nom du tournoi est requis/i)).toBeInTheDocument();
      });
      await userEvent.type(nameInput, "Summer Cup 2026");
      await waitFor(() => {
        expect(
          screen.queryByText(/le nom du tournoi est requis/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("AC3: Primary CTA at bottom", () => {
    it("should render submit button with CTA text", async () => {
      render(<CreateTournament />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /créer le tournoi/i })
        ).toBeInTheDocument();
      });
    });

    it("should disable submit when name is empty", async () => {
      render(<CreateTournament />, { wrapper: Wrapper });
      await waitFor(() => {
        const submitButton = screen.getByRole("button", {
          name: /créer le tournoi/i,
        });
        expect(submitButton).toBeDisabled();
      });
    });

    it("should not submit when name is empty", async () => {
      const { container } = render(<CreateTournament />, { wrapper: Wrapper });
      await screen.findByLabelText(/nom du tournoi/i, {}, { timeout: 5000 });
      const form = container.querySelector("form");
      expect(form).toBeTruthy();
      fireEvent.submit(form!);
      await waitFor(() => {
        expect(databaseService.createTournament).not.toHaveBeenCalled();
      });
    });

    it("should show validation error on submit when name is empty", async () => {
      const { container } = render(<CreateTournament />, { wrapper: Wrapper });
      await screen.findByLabelText(/nom du tournoi/i, {}, { timeout: 5000 });
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
      render(<CreateTournament />, { wrapper: Wrapper });
      const nameInput = await screen.findByLabelText(/nom du tournoi/i, {}, { timeout: 5000 });
      await userEvent.type(nameInput, "Summer Cup 2026");
      const submitButton = screen.getByRole("button", { name: /créer le tournoi/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(databaseService.createTournament).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/tournament/tournament-123");
      });
    });

    it("should allow selecting format (libre)", async () => {
      render(<CreateTournament />, { wrapper: Wrapper });
      await screen.findByLabelText(/nom du tournoi/i, {}, { timeout: 5000 });
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
      const { container } = render(<CreateTournament />, { wrapper: Wrapper });
      await waitFor(() => {
        const form = container.querySelector("form");
        expect(form).toBeInTheDocument();
        expect(container.querySelector(".bg-slate-900")).toBeInTheDocument();
      });
    });
  });

  describe("Limit reached scenario", () => {
    it("should show limit reached UI when canCreate is false", async () => {
      vi.mocked(premiumService.canCreateTournament).mockResolvedValue({
        allowed: false,
        remaining: 0,
        message: "Limite atteinte",
      });
      vi.mocked(premiumService.getTournamentCount).mockResolvedValue(2);

      render(<CreateTournament />, { wrapper: Wrapper });

      await waitFor(
        () => {
          expect(screen.getByText(/limite atteinte/i)).toBeInTheDocument();
          expect(
            screen.getByRole("button", { name: /passer premium/i }),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  });

  describe("Premium user", () => {
    it("should show premium badge when isPremium is true", async () => {
      vi.mocked(premiumService.isPremium).mockResolvedValue(true);

      render(<CreateTournament />, { wrapper: Wrapper });

      await waitFor(
        () => {
          expect(
            screen.getByText(/tournois illimités - premium actif/i),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  });

  describe("Player limit validation", () => {
    it("should show validation error when player limit is invalid", async () => {
      render(<CreateTournament />, { wrapper: Wrapper });
      await screen.findByLabelText(/nom du tournoi/i, {}, { timeout: 5000 });

      const limitToggle = screen.getByRole("button", {
        name: /limiter le nombre de joueurs/i,
      });
      await userEvent.click(limitToggle);

      const limitInput = await screen.findByLabelText(
        /nombre maximum de joueurs/i,
        {},
        { timeout: 5000 },
      );
      await userEvent.clear(limitInput);
      await userEvent.type(limitInput, "1");
      await userEvent.tab();

      await waitFor(
        () => {
          expect(
            screen.getByText(/au moins 2 joueurs requis/i),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });
});
