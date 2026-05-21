import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyRankBadge } from "../../../src/components/design-system/atoms/MyRankBadge";
import "@testing-library/jest-dom";

describe("MyRankBadge", () => {
  it('renders "1er / N" for rank 1', () => {
    render(<MyRankBadge rank={1} total={10} />);
    expect(screen.getByTestId("my-rank-badge")).toHaveTextContent("1er / 10");
  });

  it('renders "2e / N" for rank 2', () => {
    render(<MyRankBadge rank={2} total={10} />);
    expect(screen.getByTestId("my-rank-badge")).toHaveTextContent("2e / 10");
  });

  it('renders "3e / N" for rank 3', () => {
    render(<MyRankBadge rank={3} total={10} />);
    expect(screen.getByTestId("my-rank-badge")).toHaveTextContent("3e / 10");
  });

  it('renders "Ne / N" for higher ranks', () => {
    render(<MyRankBadge rank={42} total={100} />);
    expect(screen.getByTestId("my-rank-badge")).toHaveTextContent("42e / 100");
  });

  it("uses ping-yellow text class for the podium colour", () => {
    render(<MyRankBadge rank={1} total={5} />);
    expect(screen.getByTestId("my-rank-badge").className).toContain(
      "text-ping-yellow",
    );
  });

  it('exposes an aria-label "Tu es Xe sur N" for screen readers', () => {
    render(<MyRankBadge rank={3} total={12} />);
    expect(screen.getByTestId("my-rank-badge")).toHaveAttribute(
      "aria-label",
      "Tu es 3e sur 12",
    );
  });

  it("switches font-size for size='sm'", () => {
    render(<MyRankBadge rank={2} total={5} size="sm" />);
    expect(screen.getByTestId("my-rank-badge").className).toContain(
      "text-[13px]",
    );
  });
});
