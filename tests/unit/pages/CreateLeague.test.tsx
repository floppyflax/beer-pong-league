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
  }),
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
  });

  describe("AC1: Header with title + back", () => {
    it("should render header with title Nouvelle League", () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      expect(
        screen.getByRole("heading", { name: /nouvelle league/i }),
      ).toBeInTheDocument();
    });

    it("should have back button that navigates to /leagues", async () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      const backButton = screen.getByRole("button", { name: /retour/i });
      await userEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith("/leagues");
    });
  });

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
    it("should call createLeague and navigate on valid submit", async () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      const nameInput = screen.getByLabelText(/nom de la ligue/i);
      await userEvent.type(nameInput, "Ma Super League");
      const submitButton = screen.getByRole("button", {
        name: /c'est parti !/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateLeague).toHaveBeenCalledWith(
          "Ma Super League",
          "event",
        );
        expect(mockNavigate).toHaveBeenCalledWith("/league/league-123");
      });
    });

    it("should allow selecting league type (season)", async () => {
      render(<CreateLeague />, { wrapper: Wrapper });
      const nameInput = screen.getByLabelText(/nom de la ligue/i);
      await userEvent.type(nameInput, "League Saison");
      await userEvent.click(screen.getByText(/league par saison/i));
      const submitButton = screen.getByRole("button", {
        name: /c'est parti !/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateLeague).toHaveBeenCalledWith(
          "League Saison",
          "season",
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

    it("should not navigate when createLeague throws", async () => {
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

  describe("AC5: Design tokens (Frame 9 alignment)", () => {
    it("should have form with design system structure", () => {
      const { container } = render(<CreateLeague />, { wrapper: Wrapper });
      const form = container.querySelector("form");
      expect(form).toBeInTheDocument();
      expect(container.querySelector(".bg-slate-900")).toBeInTheDocument();
    });

    it("should have CTA sticky above bottom nav (fixed bottom-16)", () => {
      const { container } = render(<CreateLeague />, { wrapper: Wrapper });
      const ctaBar = container.querySelector(".fixed.bottom-16");
      expect(ctaBar).toBeInTheDocument();
    });
  });
});
