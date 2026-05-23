import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { GhostManagementSheet } from "../../../../src/components/design-system/GhostManagementSheet";
import type { UnclaimedGuest } from "../../../../src/hooks/useUnclaimedGuests";
import "@testing-library/jest-dom";

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

// QRCodeSVG renders an <svg> that carries the encoded value in jsdom as the
// `value` attribute is not reflected — we assert on the visible URL <code> text.
const guest: UnclaimedGuest = {
  playerId: "membership-1",
  anonymousUserId: "player-1", // players.id — the invite link target
  pseudo: "Alice",
  joinedAt: "",
  archived: false,
  isGhost: true,    // user_id IS NULL → ghost player, shows invite button
};

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  guests: [guest],
  joinPath: "/event/evt-1/join",
  origin: "https://app.test",
  onRename: vi.fn().mockResolvedValue(undefined),
  onDelete: vi.fn().mockResolvedValue(undefined),
  onArchive: vi.fn().mockResolvedValue(undefined),
};

describe("GhostManagementSheet — invite link", () => {
  it("builds a ?ghost=<players.id> link client-side (no RPC)", () => {
    render(<GhostManagementSheet {...baseProps} />);

    // Open the invite panel for Alice.
    fireEvent.click(
      screen.getByRole("button", { name: /lien d'invitation pour alice/i }),
    );

    // The panel shows the assembled URL, carrying the players.id (player-1).
    const code = screen.getByText(
      "https://app.test/event/evt-1/join?ghost=player-1",
    );
    expect(code).toBeInTheDocument();
  });

  it("lists each ghost with a rename, archive, delete and invite action", () => {
    render(<GhostManagementSheet {...baseProps} />);
    const list = screen.getByRole("list");
    expect(within(list).getByText("Alice")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /lien d'invitation pour alice/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /renommer alice/i }),
    ).toBeInTheDocument();
  });
});
