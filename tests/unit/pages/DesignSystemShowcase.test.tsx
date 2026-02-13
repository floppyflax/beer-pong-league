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

  it("should render SearchBar with interactive demo (Story 14-8)", () => {
    renderWithRouter();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/rechercher un tournoi ou une league/i)).toBeInTheDocument();
    expect(screen.getByText(/Valeur débouncée/)).toBeInTheDocument();
  });

  it("should render InfoCard component (Story 14-5)", () => {
    renderWithRouter();
    expect(screen.getByText("Tournoi Beer Pong Mars 2025")).toBeInTheDocument();
    expect(screen.getAllByText(/En cours/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/15 mars 2025/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/8 joueurs/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/2v2/).length).toBeGreaterThanOrEqual(1);
  });

  it("should render FAB component with variants (Story 14-6)", () => {
    renderWithRouter();
    expect(screen.getByRole("button", { name: /créer \(primary\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /nouveau match/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /action secondaire/i })).toBeInTheDocument();
  });

  it("should render Banner component with success and error variants (Story 14-7)", () => {
    renderWithRouter();
    expect(screen.getByText(/Tournoi rejoint ! Redirection…/)).toBeInTheDocument();
    expect(screen.getByText(/Erreur lors de la connexion/)).toBeInTheDocument();
    expect(screen.getByText(/Message dismissable/)).toBeInTheDocument();
    expect(screen.getAllByRole("alert").length).toBeGreaterThanOrEqual(3);
  });
});
