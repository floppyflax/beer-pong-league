/**
 * InviteSheet — multi-select picker for league players.
 *
 * Covers the refactored "Add" tab: chips grid, multi-select toggle, search,
 * remainingSlots guard, and empty state.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InviteSheet } from "../../../src/components/design-system/InviteSheet";

// react-hot-toast: keep no-op for these tests.
vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// QRCode renders nothing visible — avoid pulling the SVG library in jsdom.
vi.mock("qrcode.react", () => ({
  QRCodeSVG: () => null,
}));

const buildPlayers = (n: number) =>
  Array.from({ length: n }).map((_, i) => ({
    id: `lp-${i + 1}`,
    name: `Joueur ${i + 1}`,
    elo: 1000 + i * 10,
  }));

describe("InviteSheet multi-select", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders one chip per league player with ELO", () => {
    render(
      <InviteSheet
        isOpen
        onClose={() => {}}
        leaguePlayers={buildPlayers(3)}
        onAddFromLeagueBulk={vi.fn()}
      />,
    );

    expect(screen.getByText("Joueur 1")).toBeInTheDocument();
    expect(screen.getByText("Joueur 2")).toBeInTheDocument();
    expect(screen.getByText("Joueur 3")).toBeInTheDocument();
    expect(screen.getByText("ELO 1000")).toBeInTheDocument();
  });

  it("CTA is disabled when nothing is selected, enabled after a toggle", async () => {
    const user = userEvent.setup();
    render(
      <InviteSheet
        isOpen
        onClose={() => {}}
        leaguePlayers={buildPlayers(3)}
        onAddFromLeagueBulk={vi.fn()}
      />,
    );

    const cta = screen.getByRole("button", { name: /Sélectionne des joueurs/i });
    expect(cta).toBeDisabled();

    await user.click(screen.getByRole("option", { name: /Joueur 1/i }));
    expect(
      screen.getByRole("button", { name: /Ajouter 1 joueur/i }),
    ).toBeEnabled();
  });

  it("CTA label updates with the count and bulk callback receives all ids", async () => {
    const user = userEvent.setup();
    const onAddBulk = vi.fn();
    render(
      <InviteSheet
        isOpen
        onClose={() => {}}
        leaguePlayers={buildPlayers(3)}
        onAddFromLeagueBulk={onAddBulk}
      />,
    );

    await user.click(screen.getByRole("option", { name: /Joueur 1/i }));
    await user.click(screen.getByRole("option", { name: /Joueur 3/i }));

    const cta = screen.getByRole("button", { name: /Ajouter 2 joueurs/i });
    await user.click(cta);

    expect(onAddBulk).toHaveBeenCalledTimes(1);
    const ids = onAddBulk.mock.calls[0][0] as string[];
    expect(ids).toEqual(expect.arrayContaining(["lp-1", "lp-3"]));
    expect(ids).toHaveLength(2);
  });

  it("filters the list when a search query is typed (≥ 8 league players)", async () => {
    const user = userEvent.setup();
    render(
      <InviteSheet
        isOpen
        onClose={() => {}}
        leaguePlayers={buildPlayers(10)}
        onAddFromLeagueBulk={vi.fn()}
      />,
    );

    const search = screen.getByLabelText(/Filtrer les joueurs/i);
    await user.type(search, "Joueur 1");

    // "Joueur 1" matches "Joueur 1" and "Joueur 10"
    const list = screen.getByRole("listbox");
    expect(within(list).getByText("Joueur 1")).toBeInTheDocument();
    expect(within(list).getByText("Joueur 10")).toBeInTheDocument();
    expect(within(list).queryByText("Joueur 2")).not.toBeInTheDocument();
  });

  it("blocks selection beyond remainingSlots", async () => {
    const user = userEvent.setup();
    render(
      <InviteSheet
        isOpen
        onClose={() => {}}
        leaguePlayers={buildPlayers(3)}
        remainingSlots={1}
        onAddFromLeagueBulk={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("option", { name: /Joueur 1/i }));
    expect(
      screen.getByRole("button", { name: /Ajouter 1 joueur/i }),
    ).toBeEnabled();

    // Joueur 2 and 3 should now be disabled — the cap is 1 ajout en une fois.
    expect(screen.getByRole("option", { name: /Joueur 2/i })).toBeDisabled();
    expect(screen.getByRole("option", { name: /Joueur 3/i })).toBeDisabled();
  });

  it("shows the empty message when all league players are already in the event", () => {
    render(
      <InviteSheet
        isOpen
        onClose={() => {}}
        leaguePlayers={[]}
        onAddFromLeagueBulk={vi.fn()}
        onAddManual={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Tous les joueurs de la ligue sont déjà/i),
    ).toBeInTheDocument();
    // No CTA "Ajouter N" should be rendered.
    expect(
      screen.queryByRole("button", { name: /Sélectionne des joueurs/i }),
    ).not.toBeInTheDocument();
  });
});
