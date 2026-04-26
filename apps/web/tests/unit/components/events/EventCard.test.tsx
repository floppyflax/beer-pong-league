import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { EventCard } from "../../../../src/components/events/EventCard";
import type { Event } from "../../../../src/types";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("EventCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockActiveEvent: Event = {
    id: "event-1",
    name: "Beer Pong Championship 2024",
    date: "2024-06-15",
    format: "2v2",
    leagueId: null,
    createdAt: "2024-01-10T10:00:00Z",
    playerIds: ["p1", "p2", "p3", "p4", "p5"],
    matches: [],
    isFinished: false,
  };

  const mockFinishedEvent: Event = {
    ...mockActiveEvent,
    id: "event-2",
    name: "Summer Event",
    isFinished: true,
  };

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it("should render event name", () => {
    renderWithRouter(<EventCard event={mockActiveEvent} />);
    expect(screen.getByText("Beer Pong Championship 2024")).toBeInTheDocument();
  });

  it('should show "ACTIF" badge for active events', () => {
    renderWithRouter(<EventCard event={mockActiveEvent} />);
    expect(screen.getByText("ACTIF")).toBeInTheDocument();
  });

  it('should show "TERMINÉ" badge for finished events', () => {
    renderWithRouter(<EventCard event={mockFinishedEvent} />);
    expect(screen.getByText("TERMINÉ")).toBeInTheDocument();
  });

  it("should display player count and match count", () => {
    renderWithRouter(<EventCard event={mockActiveEvent} />);
    expect(screen.getByText("Joueurs")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Matchs")).toBeInTheDocument();
  });

  it("should display format in blue", () => {
    renderWithRouter(<EventCard event={mockActiveEvent} />);
    expect(screen.getByText("2v2")).toBeInTheDocument();
    expect(screen.getByText("Format")).toBeInTheDocument();
  });

  it("should display event date formatted", () => {
    renderWithRouter(<EventCard event={mockActiveEvent} />);
    expect(screen.getByText(/juin 2024/i)).toBeInTheDocument();
  });

  it("should navigate to event detail on click", () => {
    renderWithRouter(<EventCard event={mockActiveEvent} />);
    const card = screen.getByTestId("event-card");
    fireEvent.click(card);
    expect(mockNavigate).toHaveBeenCalledWith("/event/event-1");
  });

  it("should navigate on keyboard Enter", () => {
    renderWithRouter(<EventCard event={mockActiveEvent} />);
    const card = screen.getByTestId("event-card");
    fireEvent.keyDown(card, { key: "Enter" });
    expect(mockNavigate).toHaveBeenCalledWith("/event/event-1");
  });

  it("should display chevron when interactive", () => {
    renderWithRouter(<EventCard event={mockActiveEvent} />);
    expect(screen.getByTestId("event-card-chevron")).toBeInTheDocument();
  });

  it("should use bg-gradient-card and border-card/50", () => {
    const { getByTestId } = renderWithRouter(
      <EventCard event={mockActiveEvent} />,
    );
    const card = getByTestId("event-card");
    expect(card).toHaveClass("bg-gradient-card");
    expect(card).toHaveClass("border-card/50");
  });

  it("should have hover and active styles", () => {
    const { getByTestId } = renderWithRouter(
      <EventCard event={mockActiveEvent} />,
    );
    const card = getByTestId("event-card");
    expect(card).toHaveClass("hover:border-signal-red");
    expect(card).toHaveClass("active:scale-95");
  });

  it("should handle events with 0 players", () => {
    const noPlayersEvent = {
      ...mockActiveEvent,
      playerIds: undefined,
    };
    renderWithRouter(<EventCard event={noPlayersEvent} />);
    expect(screen.getByText("Joueurs")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(1);
  });

  it("should not navigate when interactive=false (display mode)", () => {
    renderWithRouter(
      <EventCard event={mockActiveEvent} interactive={false} />,
    );
    const card = screen.getByTestId("event-card");
    fireEvent.click(card);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should not display chevron when interactive=false", () => {
    renderWithRouter(
      <EventCard event={mockActiveEvent} interactive={false} />,
    );
    expect(
      screen.queryByTestId("event-card-chevron"),
    ).not.toBeInTheDocument();
  });

  it("should display format Libre for libre format", () => {
    const libreEvent = {
      ...mockActiveEvent,
      format: "libre" as const,
    };
    renderWithRouter(<EventCard event={libreEvent} />);
    expect(screen.getByText("Libre")).toBeInTheDocument();
  });
});
