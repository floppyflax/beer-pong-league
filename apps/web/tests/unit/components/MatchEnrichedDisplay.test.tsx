/**
 * Unit tests for MatchEnrichedDisplay component
 *
 * History
 * - Story 14-28 : thumbnail carrée 64×64 + cups badge.
 * - PR #31 : thumbnail portrait 60×107 + label « Photo finish ».
 * - PR #31 follow-up : retour à une icône camera lime cliquable
 *   (la thumbnail prenait trop de place dans la liste). La photo
 *   ne s'affiche plus que dans le lightbox au clic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MatchEnrichedDisplay } from "../../../src/components/MatchEnrichedDisplay";

describe("MatchEnrichedDisplay", () => {
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

  it("should render a clickable Photo button when photoUrl is provided", () => {
    render(
      <MatchEnrichedDisplay
        photoUrl="https://example.com/photo.jpg"
        cupsRemaining={null}
      />,
    );
    expect(
      screen.getByRole("button", { name: /voir la photo finish/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/photo/i)).toBeInTheDocument();
    // No visible image until the lightbox opens.
    expect(
      screen.queryByRole("img", { name: /collage photo finish/i }),
    ).not.toBeInTheDocument();
  });

  it("should render cups badge when cupsRemaining is provided", () => {
    render(<MatchEnrichedDisplay photoUrl={null} cupsRemaining={3} />);
    expect(screen.getByText(/3 gobelets restants/i)).toBeInTheDocument();
  });

  it("should use singular form for 1 cup", () => {
    render(<MatchEnrichedDisplay photoUrl={null} cupsRemaining={1} />);
    expect(screen.getByText(/1 gobelet restant/i)).toBeInTheDocument();
  });

  it("should render both photo button and cups when both are provided", () => {
    render(
      <MatchEnrichedDisplay
        photoUrl="https://example.com/photo.jpg"
        cupsRemaining={5}
      />,
    );
    expect(
      screen.getByRole("button", { name: /voir la photo finish/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/5 gobelets restants/i)).toBeInTheDocument();
  });

  it("should open enlarged photo modal when photo button is clicked", () => {
    render(
      <MatchEnrichedDisplay
        photoUrl="https://example.com/photo.jpg"
        cupsRemaining={null}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /voir la photo finish/i }),
    );
    expect(
      screen.getByRole("dialog", { name: /photo finish agrandie/i }),
    ).toBeInTheDocument();
    // The full-size image is now visible inside the dialog.
    expect(
      screen.getByRole("img", { name: /collage photo finish/i }),
    ).toBeInTheDocument();
  });

  it("should close enlarged photo modal when close button is clicked", () => {
    render(
      <MatchEnrichedDisplay
        photoUrl="https://example.com/photo.jpg"
        cupsRemaining={null}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /voir la photo finish/i }),
    );
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
    fireEvent.click(
      screen.getByRole("button", { name: /voir la photo finish/i }),
    );
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
    fireEvent.click(
      screen.getByRole("button", { name: /voir la photo finish/i }),
    );
    const dialog = screen.getByRole("dialog", {
      name: /photo finish agrandie/i,
    });
    expect(dialog).toBeInTheDocument();
    fireEvent.click(dialog);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should hide the photo button when the hidden preload image fails", () => {
    render(
      <MatchEnrichedDisplay
        photoUrl="https://example.com/invalid.jpg"
        cupsRemaining={5}
      />,
    );
    // Preload <img aria-hidden> is rendered with empty alt to trigger the
    // onError handler without surfacing it to assistive tech.
    const preload = document.querySelector('img[aria-hidden="true"]');
    expect(preload).not.toBeNull();
    fireEvent.error(preload!);
    expect(
      screen.queryByRole("button", { name: /voir la photo finish/i }),
    ).not.toBeInTheDocument();
    // Cups badge stays visible — graceful degradation.
    expect(screen.getByText(/5 gobelets restants/i)).toBeInTheDocument();
  });

  it("should render nothing when preload image fails and no cups", () => {
    const { container } = render(
      <MatchEnrichedDisplay
        photoUrl="https://example.com/invalid.jpg"
        cupsRemaining={null}
      />,
    );
    const preload = document.querySelector('img[aria-hidden="true"]');
    expect(preload).not.toBeNull();
    fireEvent.error(preload!);
    expect(container.firstChild).toBeNull();
  });
});
