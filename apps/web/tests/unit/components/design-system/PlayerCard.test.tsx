import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PlayerCard } from "../../../../src/components/design-system/PlayerCard";

describe("PlayerCard", () => {
  describe("variant compact", () => {
    it("should render name and initials", () => {
      render(<PlayerCard variant="compact" name="Jean Dupont" />);

      expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("should show selected state when selected=true", () => {
      render(
        <PlayerCard variant="compact" name="Marie Martin" selected={true} />,
      );

      const card = screen.getByTestId("playercard-compact");
      expect(card).toHaveClass("border-electric-blue");
      expect(card).toHaveClass("bg-electric-blue/15");
    });

    it("should call onClick when clicked", () => {
      const onClick = vi.fn();
      render(
        <PlayerCard variant="compact" name="Pierre Durand" onClick={onClick} />,
      );

      fireEvent.click(screen.getByText("Pierre Durand"));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  // The `full` variant was replaced by `leaderRow` / `detailed`.
  // Its test is dropped — the new variants are covered indirectly by
  // page-level tests.

  describe("variant leaderRow — rankDelta", () => {
    it("renders a positive rank delta as a lime badge on the avatar", () => {
      render(
        <PlayerCard
          variant="leaderRow"
          name="Alice"
          elo={1520}
          rank={1}
          rankDelta={2}
        />,
      );
      const badge = screen.getByTestId("playercard-rank-delta");
      expect(badge).toHaveTextContent("2");
      expect(badge).toHaveClass("bg-lime");
      expect(badge).toHaveAttribute("aria-label", "Monté de 2 places");
    });

    it("renders a negative rank delta as a signal-red badge on the avatar", () => {
      render(
        <PlayerCard
          variant="leaderRow"
          name="Bob"
          elo={1480}
          rank={2}
          rankDelta={-1}
        />,
      );
      const badge = screen.getByTestId("playercard-rank-delta");
      expect(badge).toHaveTextContent("1");
      expect(badge).toHaveClass("bg-signal-red");
      expect(badge).toHaveAttribute("aria-label", "Descendu de 1 place");
    });

    it("does not render the badge when rankDelta is 0", () => {
      render(
        <PlayerCard
          variant="leaderRow"
          name="Carol"
          elo={1400}
          rank={3}
          rankDelta={0}
        />,
      );
      expect(screen.queryByTestId("playercard-rank-delta")).toBeNull();
    });

    it("does not render the badge when rankDelta is undefined", () => {
      render(
        <PlayerCard
          variant="leaderRow"
          name="Dave"
          elo={1300}
          rank={4}
        />,
      );
      expect(screen.queryByTestId("playercard-rank-delta")).toBeNull();
    });
  });
});
