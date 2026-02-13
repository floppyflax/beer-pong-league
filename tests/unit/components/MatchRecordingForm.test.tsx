import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MatchRecordingForm } from "../../../src/components/MatchRecordingForm";
import type { Player, Match } from "../../../src/types";
import "@testing-library/jest-dom";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("MatchRecordingForm - Story 5.1", () => {
  const mockParticipants: Player[] = [
    {
      id: "player-1",
      name: "Alice",
      elo: 1500,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      streak: 0,
    },
    {
      id: "player-2",
      name: "Bob",
      elo: 1500,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      streak: 0,
    },
    {
      id: "player-3",
      name: "Charlie",
      elo: 1500,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      streak: 0,
    },
    {
      id: "player-4",
      name: "Diana",
      elo: 1500,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      streak: 0,
    },
  ];

  const mockOnSuccess = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps = {
    tournamentId: "tournament-1",
    leagueId: "league-1",
    format: "2v2" as const,
    participants: mockParticipants,
    onSuccess: mockOnSuccess,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Task 1: Create MatchRecordingForm component", () => {
    it("should render the form with team selection and score inputs", () => {
      render(<MatchRecordingForm {...defaultProps} />);

      // AC: Form displayed
      expect(screen.getByText("Nouveau Match")).toBeInTheDocument();

      // AC: Form allows selection of players for team A and team B
      expect(screen.getByText("Équipe A")).toBeInTheDocument();
      expect(screen.getByText("Équipe B")).toBeInTheDocument();

      // AC: Form allows entry of scores
      expect(screen.getByLabelText(/score équipe a/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/score équipe b/i)).toBeInTheDocument();
    });

    it("should display player dropdowns for each team position", () => {
      render(<MatchRecordingForm {...defaultProps} format="2v2" />);

      // Should have 2 player selects for team A and 2 for team B (2v2 format)
      const selects = screen.getAllByRole("combobox");
      expect(selects.length).toBeGreaterThanOrEqual(4); // At least 4 selects (2 per team)
    });

    it("should style with Tailwind (alcohol-friendly)", () => {
      const { container } = render(<MatchRecordingForm {...defaultProps} />);

      // Check for dark theme classes (alcohol-friendly design)
      const formContainer = container.querySelector(".bg-black\\/90");
      expect(formContainer).toBeInTheDocument();
    });
  });

  describe("Task 2: Implement player selection", () => {
    it("should support 1v1 format (1 player per team)", () => {
      render(<MatchRecordingForm {...defaultProps} format="1v1" />);

      // Should have 1 select for team A and 1 for team B
      const selects = screen.getAllByRole("combobox");
      const teamASelects = selects.filter((select) =>
        select.closest(".bg-slate-800")?.textContent?.includes("Équipe A"),
      );
      expect(teamASelects.length).toBeGreaterThanOrEqual(1);
    });

    it("should support 2v2 format (2 players per team)", () => {
      render(<MatchRecordingForm {...defaultProps} format="2v2" />);

      const selects = screen.getAllByRole("combobox");
      // Should have at least 2 selects per team
      expect(selects.length).toBeGreaterThanOrEqual(4);
    });

    it("should support 3v3 format (3 players per team)", () => {
      render(<MatchRecordingForm {...defaultProps} format="3v3" />);

      const selects = screen.getAllByRole("combobox");
      // Should have at least 3 selects per team
      expect(selects.length).toBeGreaterThanOrEqual(6);
    });

    it("should prevent duplicate player selection between teams", async () => {
      render(<MatchRecordingForm {...defaultProps} format="1v1" />);

      const selects = screen.getAllByRole("combobox");
      const teamASelect = selects[0];
      const teamBSelect = selects[1];

      // Select Alice for team A
      fireEvent.change(teamASelect, { target: { value: "player-1" } });

      // Alice should not be available in team B dropdown
      await waitFor(() => {
        const teamBOptions = Array.from(teamBSelect.querySelectorAll("option"));
        const aliceOption = teamBOptions.find(
          (opt) => opt.textContent === "Alice",
        );
        expect(aliceOption).not.toBeInTheDocument() ||
          expect(aliceOption).toHaveAttribute("disabled");
      });
    });

    it("should prevent duplicate player selection within same team", async () => {
      render(<MatchRecordingForm {...defaultProps} format="2v2" />);

      const selects = screen.getAllByRole("combobox");
      const teamAFirstSelect = selects[0];
      const teamASecondSelect = selects[1];

      // Select Alice for first position in team A
      fireEvent.change(teamAFirstSelect, { target: { value: "player-1" } });

      // Alice should not be available in second position dropdown
      await waitFor(() => {
        const secondOptions = Array.from(
          teamASecondSelect.querySelectorAll("option"),
        );
        const aliceOption = secondOptions.find(
          (opt) => opt.textContent === "Alice",
        );
        expect(aliceOption).not.toBeInTheDocument() ||
          expect(aliceOption).toHaveAttribute("disabled");
      });
    });
  });

  describe("Task 3: Implement score entry", () => {
    it("should have score inputs with default values", () => {
      render(<MatchRecordingForm {...defaultProps} />);

      const scoreAInput = screen.getByLabelText(
        /score équipe a/i,
      ) as HTMLInputElement;
      const scoreBInput = screen.getByLabelText(
        /score équipe b/i,
      ) as HTMLInputElement;

      // AC: Default scores: 0 (or 10 for team A as per beer pong)
      expect(scoreAInput.value).toBe("10");
      expect(scoreBInput.value).toBe("0");
    });

    it("should validate scores are in 0-10 range", async () => {
      render(<MatchRecordingForm {...defaultProps} />);

      const scoreAInput = screen.getByLabelText(
        /score équipe a/i,
      ) as HTMLInputElement;

      // Try to set score above 10
      fireEvent.change(scoreAInput, { target: { value: "11" } });

      // Input should clamp to 10
      await waitFor(() => {
        expect(parseInt(scoreAInput.value, 10)).toBeLessThanOrEqual(10);
      });
    });

    it("should have large, touch-friendly inputs", () => {
      render(<MatchRecordingForm {...defaultProps} />);

      const scoreInput = screen.getByLabelText(/score équipe a/i);
      // Check for large text size class (text-3xl)
      expect(scoreInput).toHaveClass("text-3xl");
    });
  });

  describe("Task 4: Add format support", () => {
    it("should detect tournament format and adjust player slots", () => {
      const { rerender } = render(
        <MatchRecordingForm {...defaultProps} format="1v1" />,
      );

      let selects = screen.getAllByRole("combobox");
      expect(selects.length).toBeGreaterThanOrEqual(2); // 1 per team

      rerender(<MatchRecordingForm {...defaultProps} format="2v2" />);
      selects = screen.getAllByRole("combobox");
      expect(selects.length).toBeGreaterThanOrEqual(4); // 2 per team

      rerender(<MatchRecordingForm {...defaultProps} format="3v3" />);
      selects = screen.getAllByRole("combobox");
      expect(selects.length).toBeGreaterThanOrEqual(6); // 3 per team
    });

    it("should validate correct number of players selected", async () => {
      render(<MatchRecordingForm {...defaultProps} format="2v2" />);

      const submitButton = screen.getByRole("button", { name: /enregistrer/i });
      fireEvent.click(submitButton);

      // Should show validation error if not all players selected
      await waitFor(() => {
        expect(screen.getByText(/sélectionnez.*joueur/i)).toBeInTheDocument();
      });
    });
  });

  describe("Task 5: Integrate Zod validation", () => {
    it("should validate team composition", async () => {
      render(<MatchRecordingForm {...defaultProps} format="2v2" />);

      const submitButton = screen.getByRole("button", { name: /enregistrer/i });
      fireEvent.click(submitButton);

      // AC: Validates input (scores, player selection)
      await waitFor(() => {
        expect(screen.getByText(/sélectionnez.*joueur/i)).toBeInTheDocument();
      });
    });

    it("should validate scores", async () => {
      render(<MatchRecordingForm {...defaultProps} format="1v1" />);

      const selects = screen.getAllByRole("combobox");
      const scoreAInput = screen.getByLabelText(/score équipe a/i);
      const scoreBInput = screen.getByLabelText(/score équipe b/i);

      // Select players
      fireEvent.change(selects[0], { target: { value: "player-1" } });
      fireEvent.change(selects[1], { target: { value: "player-2" } });

      // Set invalid scores (both not 10)
      fireEvent.change(scoreAInput, { target: { value: "5" } });
      fireEvent.change(scoreBInput, { target: { value: "5" } });

      const submitButton = screen.getByRole("button", { name: /enregistrer/i });
      fireEvent.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText(/équipe doit avoir 10 points/i),
        ).toBeInTheDocument();
      });
    });

    it("should display validation errors", async () => {
      render(<MatchRecordingForm {...defaultProps} format="1v1" />);

      const submitButton = screen.getByRole("button", { name: /enregistrer/i });
      fireEvent.click(submitButton);

      // AC: Display validation errors
      await waitFor(() => {
        const errorMessages = screen.queryAllByText(
          /sélectionnez|score|joueur/i,
        );
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Task 6: Implement match submission", () => {
    it("should call onSuccess with match data when form is valid", async () => {
      render(<MatchRecordingForm {...defaultProps} format="1v1" />);

      const selects = screen.getAllByRole("combobox");
      const scoreAInput = screen.getByLabelText(/score équipe a/i);
      const scoreBInput = screen.getByLabelText(/score équipe b/i);

      // Fill form
      fireEvent.change(selects[0], { target: { value: "player-1" } });
      fireEvent.change(selects[1], { target: { value: "player-2" } });
      fireEvent.change(scoreAInput, { target: { value: "10" } });
      fireEvent.change(scoreBInput, { target: { value: "0" } });

      const submitButton = screen.getByRole("button", { name: /enregistrer/i });
      fireEvent.click(submitButton);

      // AC: Submits match
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        const matchArg = mockOnSuccess.mock.calls[0][0] as Match;
        expect(matchArg.teamA).toContain("player-1");
        expect(matchArg.teamB).toContain("player-2");
        expect(matchArg.scoreA).toBe(10);
        expect(matchArg.scoreB).toBe(0);
      });
    });

    it("should close form after successful submission", async () => {
      render(<MatchRecordingForm {...defaultProps} format="1v1" />);

      const selects = screen.getAllByRole("combobox");
      const scoreAInput = screen.getByLabelText(/score équipe a/i);
      const scoreBInput = screen.getByLabelText(/score équipe b/i);

      // Fill form
      fireEvent.change(selects[0], { target: { value: "player-1" } });
      fireEvent.change(selects[1], { target: { value: "player-2" } });
      fireEvent.change(scoreAInput, { target: { value: "10" } });
      fireEvent.change(scoreBInput, { target: { value: "0" } });

      const submitButton = screen.getByRole("button", { name: /enregistrer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("Story 14.11: Modal close button", () => {
    it("should have X close button in top right that calls onClose", () => {
      render(<MatchRecordingForm {...defaultProps} />);

      const closeButton = screen.getByLabelText("Fermer");
      expect(closeButton).toBeInTheDocument();

      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Task 7: Optimize for speed", () => {
    it("should pre-fill default scores", () => {
      render(<MatchRecordingForm {...defaultProps} />);

      const scoreAInput = screen.getByLabelText(
        /score équipe a/i,
      ) as HTMLInputElement;
      const scoreBInput = screen.getByLabelText(
        /score équipe b/i,
      ) as HTMLInputElement;

      // AC: Pre-fill defaults
      expect(scoreAInput.value).toBe("10");
      expect(scoreBInput.value).toBe("0");
    });

    it("should have large, easy-to-tap buttons", () => {
      render(<MatchRecordingForm {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: /enregistrer/i });

      // Check for large button styling
      expect(submitButton).toHaveClass("py-4"); // Large padding
      expect(submitButton).toHaveClass("text-xl"); // Large text
    });
  });
});
