import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CreateIdentityModal } from "../../../src/components/CreateIdentityModal";

describe("CreateIdentityModal - Story 14.11", () => {
  const mockOnClose = vi.fn();
  const mockOnIdentityCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <CreateIdentityModal
        isOpen={false}
        onClose={mockOnClose}
        onIdentityCreated={mockOnIdentityCreated}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should have X close button in top right that calls onClose", () => {
    render(
      <CreateIdentityModal
        isOpen={true}
        onClose={mockOnClose}
        onIdentityCreated={mockOnIdentityCreated}
      />,
    );

    const closeButton = screen.getByLabelText("Fermer");
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
