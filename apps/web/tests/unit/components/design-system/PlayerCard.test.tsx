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
});
