import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TournamentInvite } from "../../../src/pages/TournamentInvite";
import * as LeagueContext from "../../../src/context/LeagueContext";
import "@testing-library/jest-dom";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "test-tournament-id" }),
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

const mockTournament = {
  id: "test-tournament-id",
  name: "Soirée Beer Pong 2024",
  date: "2024-06-15",
  format: "2v2" as const,
  leagueId: null as string | null,
  createdAt: "2024-01-10T10:00:00Z",
  playerIds: ["p1", "p2"],
  matches: [],
  isFinished: false,
};

describe("TournamentInvite - Story 14-14", () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(LeagueContext, "useLeague").mockReturnValue({
      tournaments: [mockTournament],
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
        <TournamentInvite />
      </BrowserRouter>
    );

  describe("AC 1: Header title + back", () => {
    it("should display header with title Inviter des joueurs", () => {
      renderWithRouter();
      expect(screen.getByText("Inviter des joueurs")).toBeInTheDocument();
    });

    it("should navigate back to tournament dashboard when back is clicked", () => {
      renderWithRouter();
      const backButton = screen.getByRole("button", { name: /retour/i });
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith("/tournament/test-tournament-id");
    });
  });

  describe("AC 2: Tournament recap card (TournamentCard)", () => {
    it("should display tournament name in TournamentCard", () => {
      renderWithRouter();
      expect(screen.getByText("Soirée Beer Pong 2024")).toBeInTheDocument();
    });

    it("should display tournament status badge ACTIF when not finished", () => {
      renderWithRouter();
      expect(screen.getByText("ACTIF")).toBeInTheDocument();
    });

    it("should display TERMINÉ badge when tournament is finished", () => {
      vi.spyOn(LeagueContext, "useLeague").mockReturnValue({
        tournaments: [{ ...mockTournament, isFinished: true }],
        leagues: [],
        isLoadingInitialData: false,
      } as ReturnType<typeof LeagueContext.useLeague>);
      renderWithRouter();
      expect(screen.getByText("TERMINÉ")).toBeInTheDocument();
    });
  });

  describe("AC 3: QR code large and readable", () => {
    it("should display QR code", () => {
      renderWithRouter();
      const qrCodes = screen.getAllByRole("img", {
        name: "QR code pour rejoindre le tournoi",
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
      const inviteUrl = `${window.location.origin}/tournament/test-tournament-id/join`;
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
          `${window.location.origin}/tournament/test-tournament-id/join`
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
        screen.getByText(/Partage le QR code ou le lien avec les joueurs/)
      ).toBeInTheDocument();
    });

    it("should display success message", () => {
      renderWithRouter();
      expect(
        screen.getByText("C'est parti pour la compétition !")
      ).toBeInTheDocument();
    });
  });

  describe("Tournament not found", () => {
    it("should display error when tournament does not exist", () => {
      vi.spyOn(LeagueContext, "useLeague").mockReturnValue({
        tournaments: [],
        leagues: [],
        isLoadingInitialData: false,
      } as ReturnType<typeof LeagueContext.useLeague>);
      renderWithRouter();
      expect(screen.getByText("Tournoi introuvable")).toBeInTheDocument();
    });

    it("should display back to home button when tournament not found", () => {
      vi.spyOn(LeagueContext, "useLeague").mockReturnValue({
        tournaments: [],
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
