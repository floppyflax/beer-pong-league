import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IdentityModal } from "../../../src/components/IdentityModal";

vi.mock("../../../src/services/LocalUserService", () => ({
  localUserService: {
    getLocalUser: vi.fn(() => null),
  },
}));

describe("IdentityModal - Story 14.11", () => {
  const mockOnClose = vi.fn();
  const mockOnSelectIdentity = vi.fn();
  const mockOnCreateNew = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <IdentityModal
        isOpen={false}
        onClose={mockOnClose}
        onSelectIdentity={mockOnSelectIdentity}
        onCreateNew={mockOnCreateNew}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should have X close button in top right that calls onClose", () => {
    render(
      <IdentityModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectIdentity={mockOnSelectIdentity}
        onCreateNew={mockOnCreateNew}
      />,
    );

    const closeButton = screen.getByLabelText("Fermer");
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
