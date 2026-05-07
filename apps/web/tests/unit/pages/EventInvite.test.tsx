import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { EventInvite } from "../../../src/pages/EventInvite";
import * as LeagueContext from "../../../src/context/LeagueContext";
import "@testing-library/jest-dom";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "test-event-id" }),
  };
});

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value, "aria-label": ariaLabel }: { value: string; "aria-label"?: string }) => (
    <svg data-testid="qr-code" role="img" aria-label={ariaLabel}>
      {value}
    </svg>
  ),
}));

const mockEvent = {
  id: "test-event-id",
  name: "Soirée Beer Pong 2024",
  date: "2024-06-15",
  format: "2v2" as const,
  leagueId: null as string | null,
  createdAt: "2024-01-10T10:00:00Z",
  playerIds: ["p1", "p2"],
  matches: [],
  isFinished: false,
};

describe("EventInvite - Story 14-14", () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(LeagueContext, "useLeague").mockReturnValue({
      events: [mockEvent],
      leagues: [],
      isLoadingInitialData: false,
    } as ReturnType<typeof LeagueContext.useLeague>);
  });

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  const renderWithRouter = () =>
    render(
      <BrowserRouter>
        <EventInvite />
      </BrowserRouter>
    );

  describe("AC 1: Header title + back", () => {
    it("should display header with title Inviter des joueurs", () => {
      renderWithRouter();
      expect(screen.getByText("Inviter des joueurs")).toBeInTheDocument();
    });

    it("should navigate back to event dashboard when back is clicked", () => {
      renderWithRouter();
      const backButton = screen.getByRole("button", { name: /retour/i });
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith("/event/test-event-id");
    });
  });

  describe("AC 2: Event recap card (EventCard)", () => {
    it("should display event name in EventCard", () => {
      renderWithRouter();
      expect(screen.getByText("Soirée Beer Pong 2024")).toBeInTheDocument();
    });

    // Status badges (ACTIF / TERMINÉ) tests removed — the badge labels were
    // dropped during the EventCard refactor (status is now visualised
    // through icons / color, not through these literal strings).
  });

  describe("AC 3: QR code large and readable", () => {
    it("should display QR code", () => {
      renderWithRouter();
      const qrCodes = screen.getAllByRole("img", {
        name: "QR code pour rejoindre l'événement",
      });
      expect(qrCodes.length).toBeGreaterThanOrEqual(1);
    });

    it("should display QR code section title", () => {
      renderWithRouter();
      expect(screen.getByText("Scanne le QR code")).toBeInTheDocument();
    });
  });

  describe("AC 4: Link + Copy / Share", () => {
    it("should display invite link", () => {
      renderWithRouter();
      const inviteUrl = `${window.location.origin}/event/test-event-id/join`;
      const links = screen.getAllByText(inviteUrl);
      expect(links.length).toBeGreaterThanOrEqual(1);
    });

    it("should display Copy button", () => {
      renderWithRouter();
      expect(screen.getByRole("button", { name: /copier/i })).toBeInTheDocument();
    });

    it("should call clipboard.writeText when Copy is clicked", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        writable: true,
        configurable: true,
      });

      renderWithRouter();
      const copyButton = screen.getByRole("button", { name: /copier/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith(
          `${window.location.origin}/event/test-event-id/join`
        );
      });
    });

    it("should show error toast when clipboard.writeText fails", async () => {
      const toast = await import("react-hot-toast");
      const writeText = vi.fn().mockRejectedValue(new Error("Clipboard denied"));
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        writable: true,
        configurable: true,
      });

      renderWithRouter();
      const copyButton = screen.getByRole("button", { name: /copier/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.default.error).toHaveBeenCalledWith("Erreur lors de la copie");
      });
    });

    it("should have accessible Copy button with aria-label", () => {
      renderWithRouter();
      const copyButton = screen.getByRole("button", {
        name: /copier le lien d'invitation/i,
      });
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe("AC 5: How does it work block (HelpCard)", () => {
    it("should display Comment ça marche section", () => {
      renderWithRouter();
      expect(screen.getByText("Comment ça marche ?")).toBeInTheDocument();
    });

    it("should display instruction steps", () => {
      renderWithRouter();
      expect(
        screen.getByText(/Partage le QR code, le lien ou le code court/)
      ).toBeInTheDocument();
    });

    it("should display success message", () => {
      renderWithRouter();
      expect(
        screen.getByText("C'est parti pour la compétition !")
      ).toBeInTheDocument();
    });
  });

  describe("Event not found", () => {
    it("should display error when event does not exist", () => {
      vi.spyOn(LeagueContext, "useLeague").mockReturnValue({
        events: [],
        leagues: [],
        isLoadingInitialData: false,
      } as ReturnType<typeof LeagueContext.useLeague>);
      renderWithRouter();
      expect(screen.getByText("Événement introuvable")).toBeInTheDocument();
    });

    it("should display back to home button when event not found", () => {
      vi.spyOn(LeagueContext, "useLeague").mockReturnValue({
        events: [],
        leagues: [],
        isLoadingInitialData: false,
      } as ReturnType<typeof LeagueContext.useLeague>);
      renderWithRouter();
      const homeButton = screen.getByRole("button", {
        name: /retour à l'accueil/i,
      });
      fireEvent.click(homeButton);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
