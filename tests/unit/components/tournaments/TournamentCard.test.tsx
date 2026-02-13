import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { TournamentCard } from "../../../../src/components/tournaments/TournamentCard";
import type { Tournament } from "../../../../src/types";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("TournamentCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockActiveTournament: Tournament = {
    id: "tournament-1",
    name: "Beer Pong Championship 2024",
    date: "2024-06-15",
    format: "2v2",
    leagueId: null,
    createdAt: "2024-01-10T10:00:00Z",
    playerIds: ["p1", "p2", "p3", "p4", "p5"],
    matches: [],
    isFinished: false,
  };

  const mockFinishedTournament: Tournament = {
    ...mockActiveTournament,
    id: "tournament-2",
    name: "Summer Tournament",
    isFinished: true,
  };

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it("should render tournament name", () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    expect(screen.getByText("Beer Pong Championship 2024")).toBeInTheDocument();
  });

  it('should show "ACTIF" badge for active tournaments', () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    expect(screen.getByText("ACTIF")).toBeInTheDocument();
  });

  it('should show "TERMINÉ" badge for finished tournaments', () => {
    renderWithRouter(<TournamentCard tournament={mockFinishedTournament} />);
    expect(screen.getByText("TERMINÉ")).toBeInTheDocument();
  });

  it("should display player count and match count", () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    expect(screen.getByText("Joueurs")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Matchs")).toBeInTheDocument();
  });

  it("should display format in blue", () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    expect(screen.getByText("2v2")).toBeInTheDocument();
    expect(screen.getByText("Format")).toBeInTheDocument();
  });

  it("should display tournament date formatted", () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    expect(screen.getByText(/juin 2024/i)).toBeInTheDocument();
  });

  it("should navigate to tournament detail on click", () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    const card = screen.getByTestId("tournament-card");
    fireEvent.click(card);
    expect(mockNavigate).toHaveBeenCalledWith("/tournament/tournament-1");
  });

  it("should navigate on keyboard Enter", () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    const card = screen.getByTestId("tournament-card");
    fireEvent.keyDown(card, { key: "Enter" });
    expect(mockNavigate).toHaveBeenCalledWith("/tournament/tournament-1");
  });

  it("should display chevron when interactive", () => {
    renderWithRouter(<TournamentCard tournament={mockActiveTournament} />);
    expect(screen.getByTestId("tournament-card-chevron")).toBeInTheDocument();
  });

  it("should use bg-gradient-card and border-slate-700/50", () => {
    const { getByTestId } = renderWithRouter(
      <TournamentCard tournament={mockActiveTournament} />,
    );
    const card = getByTestId("tournament-card");
    expect(card).toHaveClass("bg-gradient-card");
    expect(card).toHaveClass("border-slate-700/50");
  });

  it("should have hover and active styles", () => {
    const { getByTestId } = renderWithRouter(
      <TournamentCard tournament={mockActiveTournament} />,
    );
    const card = getByTestId("tournament-card");
    expect(card).toHaveClass("hover:border-primary");
    expect(card).toHaveClass("active:scale-95");
  });

  it("should handle tournaments with 0 players", () => {
    const noPlayersTournament = {
      ...mockActiveTournament,
      playerIds: undefined,
    };
    renderWithRouter(<TournamentCard tournament={noPlayersTournament} />);
    expect(screen.getByText("Joueurs")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(1);
  });

  it("should not navigate when interactive=false (display mode)", () => {
    renderWithRouter(
      <TournamentCard tournament={mockActiveTournament} interactive={false} />,
    );
    const card = screen.getByTestId("tournament-card");
    fireEvent.click(card);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should not display chevron when interactive=false", () => {
    renderWithRouter(
      <TournamentCard tournament={mockActiveTournament} interactive={false} />,
    );
    expect(
      screen.queryByTestId("tournament-card-chevron"),
    ).not.toBeInTheDocument();
  });

  it("should display format Libre for libre format", () => {
    const libreTournament = {
      ...mockActiveTournament,
      format: "libre" as const,
    };
    renderWithRouter(<TournamentCard tournament={libreTournament} />);
    expect(screen.getByText("Libre")).toBeInTheDocument();
  });
});
