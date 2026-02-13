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
      id: "11111111-1111-4111-8111-111111111111",
      name: "Alice",
      elo: 1500,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      streak: 0,
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Bob",
      elo: 1500,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      streak: 0,
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Charlie",
      elo: 1500,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      streak: 0,
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
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
    it("should render the form with team selection and winner choice (Story 14-25)", () => {
      render(<MatchRecordingForm {...defaultProps} />);

      // AC: Form displayed
      expect(screen.getByText("Nouveau Match")).toBeInTheDocument();

      // AC: Form allows selection of players for team A and team B
      expect(screen.getByText("Équipe A")).toBeInTheDocument();
      expect(screen.getByText("Équipe B")).toBeInTheDocument();

      // AC: Form shows "Who won?" with Team 1 / Team 2 (Story 14-25)
      expect(screen.getByText("Qui a gagné ?")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Équipe 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Équipe 2" })).toBeInTheDocument();
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
      fireEvent.change(teamASelect, { target: { value: "11111111-1111-4111-8111-111111111111" } });

      // Alice should not be available in team B dropdown
      await waitFor(() => {
        const teamBOptions = Array.from(teamBSelect.querySelectorAll("option"));
        const aliceOption = teamBOptions.find(
          (opt) => opt.textContent === "Alice",
        );
        expect(aliceOption).toBeUndefined();
      });
    });

    it("should prevent duplicate player selection within same team", async () => {
      render(<MatchRecordingForm {...defaultProps} format="2v2" />);

      const selects = screen.getAllByRole("combobox");
      const teamAFirstSelect = selects[0];
      const teamASecondSelect = selects[1];

      // Select Alice for first position in team A
      fireEvent.change(teamAFirstSelect, { target: { value: "11111111-1111-4111-8111-111111111111" } });

      // Alice should not be available in second position dropdown
      await waitFor(() => {
        const secondOptions = Array.from(
          teamASecondSelect.querySelectorAll("option"),
        );
        const aliceOption = secondOptions.find(
          (opt) => opt.textContent === "Alice",
        );
        expect(aliceOption).toBeUndefined();
      });
    });
  });

  describe("Task 3: Winner selection (Story 14-25)", () => {
    it("should have winner unselected by default", () => {
      render(<MatchRecordingForm {...defaultProps} />);

      const team1Button = screen.getByRole("button", { name: "Équipe 1" });
      const team2Button = screen.getByRole("button", { name: "Équipe 2" });

      // Neither should show selected state (amber border)
      expect(team1Button).not.toHaveClass("border-amber-500");
      expect(team2Button).not.toHaveClass("border-amber-500");
    });

    it("should disable submit until winner selected (Story 14-25 AC3)", () => {
      render(<MatchRecordingForm {...defaultProps} format="1v1" />);

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "11111111-1111-4111-8111-111111111111" } });
      fireEvent.change(selects[1], { target: { value: "22222222-2222-4222-8222-222222222222" } });
      // Do not select winner

      const submitButton = screen.getByRole("button", { name: /enregistrer/i });
      expect(submitButton).toBeDisabled();
    });

    it("should have touch-friendly winner buttons", () => {
      render(<MatchRecordingForm {...defaultProps} />);

      const team1Button = screen.getByRole("button", { name: "Équipe 1" });
      expect(team1Button).toHaveClass("p-4");
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

      // Select winner to enable submit button
      fireEvent.click(screen.getByRole("button", { name: "Équipe 1" }));
      const submitButton = screen.getByRole("button", { name: /enregistrer/i });
      fireEvent.click(submitButton);

      // Should show validation error if not all players selected
      await waitFor(() => {
        const errors = screen.getAllByText(/sélectionnez.*joueur/i);
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Task 5: Integrate Zod validation", () => {
    it("should validate team composition", async () => {
      render(<MatchRecordingForm {...defaultProps} format="2v2" />);

      // Select winner to enable submit button
      fireEvent.click(screen.getByRole("button", { name: "Équipe 1" }));
      const submitButton = screen.getByRole("button", { name: /enregistrer/i });
      fireEvent.click(submitButton);

      // AC: Validates input (player selection)
      await waitFor(() => {
        const errors = screen.getAllByText(/sélectionnez.*joueur/i);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    it("should require winner selection before submit", () => {
      render(<MatchRecordingForm {...defaultProps} format="1v1" />);

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "11111111-1111-4111-8111-111111111111" } });
      fireEvent.change(selects[1], { target: { value: "22222222-2222-4222-8222-222222222222" } });
      // Submit button disabled without winner
      expect(screen.getByRole("button", { name: /enregistrer/i })).toBeDisabled();

      // Select winner enables submit
      fireEvent.click(screen.getByRole("button", { name: "Équipe 1" }));
      expect(screen.getByRole("button", { name: /enregistrer/i })).not.toBeDisabled();
    });

    it("should display validation errors", async () => {
      render(<MatchRecordingForm {...defaultProps} format="1v1" />);

      // Select winner to enable submit (teams still empty)
      fireEvent.click(screen.getByRole("button", { name: "Équipe 1" }));
      const submitButton = screen.getByRole("button", { name: /enregistrer/i });
      fireEvent.click(submitButton);

      // AC: Display validation errors
      await waitFor(() => {
        const errorMessages = screen.queryAllByText(
          /sélectionnez|joueur/i,
        );
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Task 6: Implement match submission", () => {
    it("should call onSuccess with match data when form is valid (Story 14-25)", async () => {
      render(<MatchRecordingForm {...defaultProps} format="1v1" />);

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "11111111-1111-4111-8111-111111111111" } });
      fireEvent.change(selects[1], { target: { value: "22222222-2222-4222-8222-222222222222" } });
      fireEvent.click(screen.getByRole("button", { name: "Équipe 1" }));

      const submitButton = screen.getByRole("button", { name: /enregistrer/i });
      fireEvent.click(submitButton);

      // AC: Submits match with winner mapped to scores (10-0)
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        const matchArg = mockOnSuccess.mock.calls[0][0] as Match;
        expect(matchArg.teamA).toContain("11111111-1111-4111-8111-111111111111");
        expect(matchArg.teamB).toContain("22222222-2222-4222-8222-222222222222");
        expect(matchArg.scoreA).toBe(10);
        expect(matchArg.scoreB).toBe(0);
      });
    });

    it("should close form after successful submission", async () => {
      render(<MatchRecordingForm {...defaultProps} format="1v1" />);

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "11111111-1111-4111-8111-111111111111" } });
      fireEvent.change(selects[1], { target: { value: "22222222-2222-4222-8222-222222222222" } });
      fireEvent.click(screen.getByRole("button", { name: "Équipe 1" }));

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
    it("should have winner selection for quick validation (Story 14-25)", () => {
      render(<MatchRecordingForm {...defaultProps} />);

      // AC: Winner choice replaces score entry for faster recording
      expect(screen.getByText("Qui a gagné ?")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Équipe 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Équipe 2" })).toBeInTheDocument();
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
