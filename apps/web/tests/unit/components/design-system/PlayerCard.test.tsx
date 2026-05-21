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

  describe("variant leaderRow — size display", () => {
    it("renders without chevron in display size", () => {
      const { container } = render(
        <PlayerCard
          variant="leaderRow"
          name="Niko"
          elo={1037}
          rank={1}
          wins={5}
          losses={3}
          recentResults={[true, false, true, true, true]}
          size="display"
        />,
      );
      // Le chevron n'est pas rendu en display
      const svgs = container.querySelectorAll("svg");
      // Avatar + rank ne génèrent pas de SVG ici, mais on en a 0 ou 1 (avatar)
      // Le chevron lucide rend un svg — on vérifie qu'aucun ne porte la
      // lucide-chevron-right class.
      svgs.forEach((svg) => {
        expect(svg.getAttribute("class") ?? "").not.toContain(
          "lucide-chevron-right",
        );
      });
    });

    it("applies XL paddings and font sizes in display mode", () => {
      render(
        <PlayerCard
          variant="leaderRow"
          name="Flo"
          elo={1029}
          rank={2}
          size="display"
        />,
      );
      const card = screen.getByTestId("playercard-leaderrow");
      // Padding XL et gap XL
      expect(card).toHaveClass("p-6");
      expect(card).toHaveClass("gap-6");
      // Nom en text-3xl (vs text-base par défaut)
      const name = screen.getByText("Flo");
      expect(name.className).toContain("text-3xl");
    });

    it("keeps default size when size prop is omitted", () => {
      render(
        <PlayerCard
          variant="leaderRow"
          name="Amar"
          elo={1010}
          rank={3}
        />,
      );
      const card = screen.getByTestId("playercard-leaderrow");
      expect(card).toHaveClass("p-4");
      expect(card).not.toHaveClass("p-6");
    });
  });
});
