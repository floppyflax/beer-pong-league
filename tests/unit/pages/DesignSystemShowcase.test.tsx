import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DesignSystemShowcase } from "../../../src/pages/DesignSystemShowcase";

function renderWithRouter() {
  return render(
    <BrowserRouter>
      <DesignSystemShowcase />
    </BrowserRouter>,
  );
}

describe("DesignSystemShowcase", () => {
  it("should render page title", () => {
    renderWithRouter();
    expect(
      screen.getByText(/Design System — Beer Pong League/),
    ).toBeInTheDocument();
  });

  it("should render Design Tokens section", () => {
    renderWithRouter();
    expect(screen.getByText("1. Design Tokens")).toBeInTheDocument();
  });

  it("should render Couleurs subsection", () => {
    renderWithRouter();
    expect(screen.getByText("Couleurs")).toBeInTheDocument();
  });

  it("should render Gradients subsection", () => {
    renderWithRouter();
    expect(screen.getByText("Gradients")).toBeInTheDocument();
  });

  it("should render Typographie subsection", () => {
    renderWithRouter();
    expect(screen.getByText("Typographie")).toBeInTheDocument();
  });

  it("should render Composants section", () => {
    renderWithRouter();
    expect(screen.getByText("2. Composants")).toBeInTheDocument();
  });

  it("should render StatCard component with variants (Story 14-2)", () => {
    renderWithRouter();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getAllByText("1250").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Joueurs")).toBeInTheDocument();
    expect(screen.getAllByText("Matchs").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Top ELO")).toBeInTheDocument();
  });

  it("should render SegmentedTabs with interactive demo", () => {
    renderWithRouter();
    expect(screen.getByRole("tab", { name: "Tous" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Actifs" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Terminés" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Classement" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Matchs" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Paramètres" })).toBeInTheDocument();
  });

  it("should render ListRow with player, tournament, league variants (Story 14-4)", () => {
    renderWithRouter();
    expect(screen.getByText("Alice Martin")).toBeInTheDocument();
    expect(screen.getByText("Tournoi d'été")).toBeInTheDocument();
    expect(screen.getByText("Ligue Pro")).toBeInTheDocument();
  });

  it("should have back link to home", () => {
    renderWithRouter();
    const backLink = screen.getByRole("link", { name: /retour/i });
    expect(backLink).toHaveAttribute("href", "/");
  });
});
