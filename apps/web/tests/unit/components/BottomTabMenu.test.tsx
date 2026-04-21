import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BottomTabMenu } from "../../../src/components/navigation/BottomTabMenu";

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { pathname: "/" };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

describe("BottomTabMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.pathname = "/";
  });

  describe("Component Structure (AC1)", () => {
    it("should render fixed bottom navigation", () => {
      const { container } = render(<BottomTabMenu />);

      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("fixed");
      expect(nav).toHaveClass("bottom-0");
      expect(nav).toHaveClass("left-0");
      expect(nav).toHaveClass("right-0");
    });

    it("should render 5 tabs", () => {
      render(<BottomTabMenu />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(5);
    });

    it("should display all tab labels", () => {
      render(<BottomTabMenu />);

      expect(screen.getByText("ACCUEIL")).toBeInTheDocument();
      expect(screen.getByText("REJOINDRE")).toBeInTheDocument();
      expect(screen.getByText("TOURNOIS")).toBeInTheDocument();
      expect(screen.getByText("LEAGUES")).toBeInTheDocument();
      expect(screen.getByText("PROFIL")).toBeInTheDocument();
    });

    it("should have proper navigation role", () => {
      const { container } = render(<BottomTabMenu />);

      const nav = container.querySelector("nav");
      expect(nav).toHaveAttribute("role", "navigation");
    });
  });

  describe("Active Tab Highlight (AC2)", () => {
    it("should highlight home tab when on home route", () => {
      mockLocation.pathname = "/";
      render(<BottomTabMenu />);

      const homeButton = screen.getByLabelText("Home");
      expect(homeButton).toHaveClass("bg-gradient-tab-active");
      expect(homeButton).toHaveClass("text-white");
    });

    it("should highlight join tab when on join route", () => {
      mockLocation.pathname = "/join";
      render(<BottomTabMenu />);

      const joinButton = screen.getByLabelText("Join");
      expect(joinButton).toHaveClass("bg-gradient-tab-active");
      expect(joinButton).toHaveClass("text-white");
    });

    it("should highlight tournaments tab when on tournaments route", () => {
      mockLocation.pathname = "/tournaments";
      render(<BottomTabMenu />);

      const tournamentsButton = screen.getByLabelText("Tournaments");
      expect(tournamentsButton).toHaveClass("bg-gradient-tab-active");
      expect(tournamentsButton).toHaveClass("text-white");
    });

    it("should highlight leagues tab when on leagues route", () => {
      mockLocation.pathname = "/leagues";
      render(<BottomTabMenu />);

      const leaguesButton = screen.getByLabelText("Leagues");
      expect(leaguesButton).toHaveClass("bg-gradient-tab-active");
      expect(leaguesButton).toHaveClass("text-white");
    });

    it("should highlight profile tab when on profile route", () => {
      mockLocation.pathname = "/user/profile";
      render(<BottomTabMenu />);

      const profileButton = screen.getByLabelText("Profile");
      expect(profileButton).toHaveClass("bg-gradient-tab-active");
      expect(profileButton).toHaveClass("text-white");
    });

    it("should show inactive style for non-active tabs", () => {
      mockLocation.pathname = "/";
      render(<BottomTabMenu />);

      const joinButton = screen.getByLabelText("Join");
      expect(joinButton).toHaveClass("border-transparent");
      expect(joinButton).toHaveClass("text-slate-400");
    });

    it("should have gradient background for active tab (design-system-convergence 2.1)", () => {
      mockLocation.pathname = "/";
      render(<BottomTabMenu />);

      const homeButton = screen.getByLabelText("Home");
      expect(homeButton).toHaveClass("bg-gradient-tab-active");
    });

    it("should highlight Tournaments tab when on /tournament/:id (nested route)", () => {
      mockLocation.pathname = "/tournament/abc123";
      render(<BottomTabMenu />);

      const tournamentsButton = screen.getByLabelText("Tournaments");
      expect(tournamentsButton).toHaveClass("bg-gradient-tab-active");
    });

    it("should highlight Leagues tab when on /league/:id (nested route)", () => {
      mockLocation.pathname = "/league/xyz456";
      render(<BottomTabMenu />);

      const leaguesButton = screen.getByLabelText("Leagues");
      expect(leaguesButton).toHaveClass("bg-gradient-tab-active");
    });

    it("should highlight Profile tab when on /player/:id (nested route)", () => {
      mockLocation.pathname = "/player/user789";
      render(<BottomTabMenu />);

      const profileButton = screen.getByLabelText("Profile");
      expect(profileButton).toHaveClass("bg-gradient-tab-active");
    });
  });

  describe("Tab Navigation (AC3)", () => {
    it("should have 200ms transition duration for smooth navigation", () => {
      render(<BottomTabMenu />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass("duration-200");
      });
    });

    it("should navigate to home when home tab clicked", () => {
      render(<BottomTabMenu />);

      const homeButton = screen.getByLabelText("Home");
      fireEvent.click(homeButton);

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("should navigate to join when join tab clicked", () => {
      render(<BottomTabMenu />);

      const joinButton = screen.getByLabelText("Join");
      fireEvent.click(joinButton);

      expect(mockNavigate).toHaveBeenCalledWith("/join");
    });

    it("should navigate to tournaments when tournaments tab clicked", () => {
      render(<BottomTabMenu />);

      const tournamentsButton = screen.getByLabelText("Tournaments");
      fireEvent.click(tournamentsButton);

      expect(mockNavigate).toHaveBeenCalledWith("/tournaments");
    });

    it("should navigate to leagues when leagues tab clicked", () => {
      render(<BottomTabMenu />);

      const leaguesButton = screen.getByLabelText("Leagues");
      fireEvent.click(leaguesButton);

      expect(mockNavigate).toHaveBeenCalledWith("/leagues");
    });

    it("should navigate to profile when profile tab clicked", () => {
      render(<BottomTabMenu />);

      const profileButton = screen.getByLabelText("Profile");
      fireEvent.click(profileButton);

      expect(mockNavigate).toHaveBeenCalledWith("/user/profile");
    });
  });

  describe("Responsive Behavior (AC5)", () => {
    it("should be hidden on desktop (lg:hidden)", () => {
      const { container } = render(<BottomTabMenu />);

      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("lg:hidden");
    });

    it("should be visible on mobile (no hidden class)", () => {
      const { container } = render(<BottomTabMenu />);

      const nav = container.querySelector("nav");
      // Should not have md:hidden, sm:hidden, or standalone hidden classes
      // but lg:hidden is expected (hidden on desktop)
      const classList = Array.from(nav?.classList || []);
      expect(classList).not.toContain("hidden");
      expect(classList).not.toContain("md:hidden");
      expect(classList).not.toContain("sm:hidden");
      expect(classList).toContain("lg:hidden");
    });
  });

  describe("Touch Targets & Accessibility (AC6)", () => {
    it("should have aria-label for each tab", () => {
      render(<BottomTabMenu />);

      expect(screen.getByLabelText("Home")).toBeInTheDocument();
      expect(screen.getByLabelText("Join")).toBeInTheDocument();
      expect(screen.getByLabelText("Tournaments")).toBeInTheDocument();
      expect(screen.getByLabelText("Leagues")).toBeInTheDocument();
      expect(screen.getByLabelText("Profile")).toBeInTheDocument();
    });

    it('should have aria-current="page" for active tab', () => {
      mockLocation.pathname = "/";
      render(<BottomTabMenu />);

      const homeButton = screen.getByLabelText("Home");
      expect(homeButton).toHaveAttribute("aria-current", "page");
    });

    it("should not have aria-current for inactive tabs", () => {
      mockLocation.pathname = "/";
      render(<BottomTabMenu />);

      const joinButton = screen.getByLabelText("Join");
      expect(joinButton).not.toHaveAttribute("aria-current");
    });

    it("should have minimum height for touch targets", () => {
      render(<BottomTabMenu />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass("min-h-[48px]");
      });
    });

    it("should have nav bar min height 64px (design-system-convergence 2.1)", () => {
      const { container } = render(<BottomTabMenu />);

      const nav = container.querySelector("nav");
      const innerDiv = nav?.querySelector("div");
      expect(innerDiv).toHaveClass("h-16");
    });

    it("should have tap feedback (scale down on active)", () => {
      render(<BottomTabMenu />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass("active:scale-95");
      });
    });

    it("should have focus-visible ring for keyboard accessibility (WCAG 2.1)", () => {
      render(<BottomTabMenu />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass("focus-visible:ring-2");
        expect(button).toHaveClass("focus-visible:ring-primary");
      });
    });

    it("should activate tab on Enter key press", async () => {
      const user = userEvent.setup();
      render(<BottomTabMenu />);

      const joinButton = screen.getByLabelText("Join");
      joinButton.focus();
      await user.keyboard("{Enter}");

      expect(mockNavigate).toHaveBeenCalledWith("/join");
    });

    it("should activate tab on Space key press", async () => {
      const user = userEvent.setup();
      render(<BottomTabMenu />);

      const tournamentsButton = screen.getByLabelText("Tournaments");
      tournamentsButton.focus();
      await user.keyboard(" ");

      expect(mockNavigate).toHaveBeenCalledWith("/tournaments");
    });
  });

  describe("Visual Design", () => {
    it("should have proper z-index for overlay", () => {
      const { container } = render(<BottomTabMenu />);

      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("z-40");
    });

    it("should have dark background", () => {
      const { container } = render(<BottomTabMenu />);

      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("bg-slate-800");
    });

    it("should have top border", () => {
      const { container } = render(<BottomTabMenu />);

      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("border-t");
      expect(nav).toHaveClass("border-slate-700");
    });

    it("should use uppercase labels", () => {
      render(<BottomTabMenu />);

      // All labels should be in uppercase
      expect(screen.getByText("ACCUEIL")).toBeInTheDocument();
      expect(screen.getByText("REJOINDRE")).toBeInTheDocument();
      expect(screen.getByText("TOURNOIS")).toBeInTheDocument();
      expect(screen.getByText("LEAGUES")).toBeInTheDocument();
      expect(screen.getByText("PROFIL")).toBeInTheDocument();
    });
  });

  describe("Preview Mode (Story 14-10b)", () => {
    it("should use absolute positioning when previewMode is true", () => {
      const { container } = render(
        <BottomTabMenu
          previewMode
          previewActiveRoute="/"
          previewOnTabClick={() => {}}
        />,
      );
      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("absolute");
      expect(nav).not.toHaveClass("fixed");
    });

    it("should use previewActiveRoute to determine active tab", () => {
      mockLocation.pathname = "/design-system";
      render(
        <BottomTabMenu
          previewMode
          previewActiveRoute="/tournaments"
          previewOnTabClick={() => {}}
        />,
      );
      const tournamentsButton = screen.getByLabelText("Tournaments");
      expect(tournamentsButton).toHaveClass("bg-gradient-tab-active");
      expect(tournamentsButton).toHaveAttribute("aria-current", "page");
    });

    it("should call previewOnTabClick instead of navigate when tab clicked in preview mode", () => {
      const mockPreviewOnTabClick = vi.fn();
      render(
        <BottomTabMenu
          previewMode
          previewActiveRoute="/"
          previewOnTabClick={mockPreviewOnTabClick}
        />,
      );
      const tournamentsButton = screen.getByLabelText("Tournaments");
      fireEvent.click(tournamentsButton);
      expect(mockPreviewOnTabClick).toHaveBeenCalledWith("/tournaments");
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should not navigate when previewMode is true and previewOnTabClick is omitted", () => {
      render(
        <BottomTabMenu previewMode previewActiveRoute="/" />,
      );
      const tournamentsButton = screen.getByLabelText("Tournaments");
      fireEvent.click(tournamentsButton);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
