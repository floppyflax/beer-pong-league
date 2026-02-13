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
      expect(card).toHaveClass("border-primary");
      expect(card).toHaveClass("bg-primary/20");
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

  describe("variant full", () => {
    it("should render name, subtitle and elo", () => {
      render(
        <PlayerCard
          variant="full"
          name="Alice"
          subtitle="5W - 3L"
          elo={1200}
        />,
      );

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("5W - 3L")).toBeInTheDocument();
      expect(screen.getByText("1200")).toBeInTheDocument();
    });
  });
});
