import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LandingPage } from "../../../src/pages/LandingPage";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthModal component
vi.mock("../../../src/components/AuthModal", () => ({
  AuthModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="auth-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

describe("LandingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Page Layout and Structure (AC1)", () => {
    it("should render app branding at top (Frame 1 PongELO)", () => {
      render(<LandingPage />);

      expect(screen.getByText("PongELO")).toBeInTheDocument();
    });

    it("should have hero icon with trophy and star (Frame 1 reference)", () => {
      const { container } = render(<LandingPage />);

      const heroIcon = container.querySelector(".rounded-full.bg-amber-500");
      expect(heroIcon).toBeInTheDocument();
      // Star is positioned inside/adjacent to hero circle
      expect(heroIcon?.querySelector("svg")).toBeInTheDocument();
    });

    it("should display full-screen layout without scroll", () => {
      const { container } = render(<LandingPage />);

      const mainContainer = container.querySelector(".h-screen");
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass("overflow-hidden");
    });

    it("should not render header or navigation elements", () => {
      const { container } = render(<LandingPage />);

      expect(container.querySelector("header")).not.toBeInTheDocument();
      expect(container.querySelector("nav")).not.toBeInTheDocument();
    });

    it("should display 4 action buttons", () => {
      render(<LandingPage />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(4);
    });
  });

  describe("Button 1 - Rejoindre un Tournoi (AC2)", () => {
    it('should display "Rejoindre un tournoi" button', () => {
      render(<LandingPage />);

      expect(screen.getByText(/Rejoindre un tournoi/i)).toBeInTheDocument();
    });

    it("should navigate to /join when clicked", () => {
      render(<LandingPage />);

      const button = screen.getByText(/Rejoindre un tournoi/i);
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith("/join");
    });
  });

  describe("Button 2 - Créer un tournoi (AC3)", () => {
    it('should display "Créer un tournoi" button', () => {
      render(<LandingPage />);

      expect(screen.getByText(/Créer un tournoi/i)).toBeInTheDocument();
    });

    it("should open auth modal and store returnTo", () => {
      render(<LandingPage />);

      const button = screen.getByText(/Créer un tournoi/i);
      fireEvent.click(button);

      expect(screen.getByTestId("auth-modal")).toBeInTheDocument();
      expect(sessionStorage.getItem("authReturnTo")).toBe("/create-tournament");
    });
  });

  describe("Button 3 - Créer une league (AC4)", () => {
    it('should display "Créer une league" button', () => {
      render(<LandingPage />);

      expect(screen.getByText(/Créer une league/i)).toBeInTheDocument();
    });

    it("should open auth modal and store returnTo", () => {
      render(<LandingPage />);

      const button = screen.getByText(/Créer une league/i);
      fireEvent.click(button);

      expect(screen.getByTestId("auth-modal")).toBeInTheDocument();
      expect(sessionStorage.getItem("authReturnTo")).toBe("/create-league");
    });
  });

  describe("Button 4 - Se Connecter (AC5)", () => {
    it('should display "Se connecter" link', () => {
      render(<LandingPage />);

      expect(screen.getByText(/Se connecter/i)).toBeInTheDocument();
    });

    it("should open auth modal when clicked", () => {
      render(<LandingPage />);

      expect(screen.queryByTestId("auth-modal")).not.toBeInTheDocument();

      const button = screen.getByText(/Se connecter/i);
      fireEvent.click(button);

      expect(screen.getByTestId("auth-modal")).toBeInTheDocument();
    });

    it("should have discrete link styling", () => {
      render(<LandingPage />);

      const button = screen.getByText(/Se connecter/i).closest("button");
      expect(button).toHaveClass("text-slate-400");
    });
  });

  describe("Frame 1 layout (AC2)", () => {
    it("should have Participer card with description", () => {
      render(<LandingPage />);

      expect(screen.getByText("Participer")).toBeInTheDocument();
      expect(
        screen.getByText(/Rejoins un tournoi en cours/i),
      ).toBeInTheDocument();
    });

    it("should have Organiser card with description", () => {
      render(<LandingPage />);

      expect(screen.getByText("Organiser")).toBeInTheDocument();
      expect(
        screen.getByText(/Crée tes propres compétitions/i),
      ).toBeInTheDocument();
    });

    it("should use gradient for hero CTA (blue→violet)", () => {
      render(<LandingPage />);

      const heroButton = screen
        .getByText(/Rejoindre un tournoi/i)
        .closest("button");
      expect(heroButton).toHaveClass("bg-gradient-cta-alt");
    });

    it("should have tagline under logo", () => {
      render(<LandingPage />);

      expect(
        screen.getByText(/Ton classement ELO entre amis/i),
      ).toBeInTheDocument();
    });
  });

  describe("Visual Design", () => {
    it("should use dark background (slate-950 or gradient)", () => {
      const { container } = render(<LandingPage />);

      // Landing uses bg-slate-950 + gradient overlay (design system update)
      const mainContainer = container.querySelector(".bg-slate-950");
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should render without loading spinner initially", () => {
      render(<LandingPage />);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper button roles", () => {
      render(<LandingPage />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(4);
    });

    it("should have descriptive button text", () => {
      render(<LandingPage />);

      expect(screen.getByText(/Rejoindre un tournoi/i)).toBeVisible();
      expect(screen.getByText(/Créer un tournoi/i)).toBeVisible();
      expect(screen.getByText(/Créer une league/i)).toBeVisible();
      expect(screen.getByText(/Se connecter/i)).toBeVisible();
    });
  });

  describe("SessionStorage Management", () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it("should store returnTo for tournament creation", () => {
      render(<LandingPage />);

      const button = screen.getByText(/Créer un tournoi/i);
      fireEvent.click(button);

      expect(sessionStorage.getItem("authReturnTo")).toBe("/create-tournament");
    });

    it("should store returnTo for league creation", () => {
      render(<LandingPage />);

      const button = screen.getByText(/Créer une league/i);
      fireEvent.click(button);

      expect(sessionStorage.getItem("authReturnTo")).toBe("/create-league");
    });

    it("should NOT store returnTo for general sign in", () => {
      render(<LandingPage />);

      const button = screen.getByText(/Se connecter/i);
      fireEvent.click(button);

      expect(sessionStorage.getItem("authReturnTo")).toBeNull();
    });

    it("should NOT store returnTo for join tournament (public)", () => {
      render(<LandingPage />);

      const button = screen.getByText(/Rejoindre un tournoi/i);
      fireEvent.click(button);

      expect(sessionStorage.getItem("authReturnTo")).toBeNull();
    });
  });
});
