/**
 * Unit tests for MatchEnrichedDisplay component
 * Story 14-28: Display photo and cups in match history
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MatchEnrichedDisplay } from "../../../src/components/MatchEnrichedDisplay";

describe("MatchEnrichedDisplay - Story 14-28", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing when no photo and no cups", () => {
    const { container } = render(
      <MatchEnrichedDisplay photoUrl={null} cupsRemaining={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render nothing when photoUrl is empty string", () => {
    const { container } = render(
      <MatchEnrichedDisplay photoUrl="" cupsRemaining={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render photo thumbnail when photoUrl is provided", () => {
    render(
      <MatchEnrichedDisplay
        photoUrl="https://example.com/photo.jpg"
        cupsRemaining={null}
      />,
    );
    const img = screen.getByRole("img", {
      name: /photo de l'équipe gagnante/i,
    });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("should render cups badge when cupsRemaining is provided", () => {
    render(<MatchEnrichedDisplay photoUrl={null} cupsRemaining={3} />);
    expect(screen.getByText(/3 gobelets restants/i)).toBeInTheDocument();
  });

  it("should use singular form for 1 cup", () => {
    render(<MatchEnrichedDisplay photoUrl={null} cupsRemaining={1} />);
    expect(screen.getByText(/1 gobelet restant/i)).toBeInTheDocument();
  });

  it("should render both photo and cups when both are provided", () => {
    render(
      <MatchEnrichedDisplay
        photoUrl="https://example.com/photo.jpg"
        cupsRemaining={5}
      />,
    );
    expect(
      screen.getByRole("img", { name: /photo de l'équipe gagnante/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/5 gobelets restants/i)).toBeInTheDocument();
  });

  it("should open enlarged photo modal when thumbnail is clicked", () => {
    render(
      <MatchEnrichedDisplay
        photoUrl="https://example.com/photo.jpg"
        cupsRemaining={null}
      />,
    );
    const button = screen.getByRole("button", { name: /agrandir la photo/i });
    fireEvent.click(button);
    const dialog = screen.getByRole("dialog", { name: /photo agrandie/i });
    expect(dialog).toBeInTheDocument();
  });

  it("should close enlarged photo modal when close button is clicked", () => {
    render(
      <MatchEnrichedDisplay
        photoUrl="https://example.com/photo.jpg"
        cupsRemaining={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /agrandir la photo/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /fermer/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should not render cups badge when cupsRemaining is 0 or out of range", () => {
    const { container: container0 } = render(
      <MatchEnrichedDisplay photoUrl={null} cupsRemaining={0} />,
    );
    expect(container0.firstChild).toBeNull();

    const { container: container11 } = render(
      <MatchEnrichedDisplay photoUrl={null} cupsRemaining={11} />,
    );
    expect(container11.firstChild).toBeNull();
  });

  it("should close modal when Escape key is pressed", () => {
    render(
      <MatchEnrichedDisplay
        photoUrl="https://example.com/photo.jpg"
        cupsRemaining={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /agrandir la photo/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should close modal when backdrop is clicked", () => {
    render(
      <MatchEnrichedDisplay
        photoUrl="https://example.com/photo.jpg"
        cupsRemaining={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /agrandir la photo/i }));
    const dialog = screen.getByRole("dialog", { name: /photo agrandie/i });
    expect(dialog).toBeInTheDocument();
    fireEvent.click(dialog);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should show error placeholder when image fails to load", () => {
    render(
      <MatchEnrichedDisplay
        photoUrl="https://example.com/invalid.jpg"
        cupsRemaining={null}
      />,
    );
    const img = screen.getByRole("img", {
      name: /photo de l'équipe gagnante/i,
    });
    fireEvent.error(img);
    expect(screen.getByText("Erreur")).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: /photo de l'équipe gagnante/i }),
    ).not.toBeInTheDocument();
  });
});
