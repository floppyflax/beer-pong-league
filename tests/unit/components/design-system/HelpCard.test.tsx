import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HelpCard } from "../../../../src/components/design-system/HelpCard";

describe("HelpCard", () => {
  it("should render with title and steps", () => {
    render(
      <HelpCard
        title="Comment ça marche ?"
        steps={[
          { number: 1, text: "Étape un" },
          { number: 2, text: "Étape deux" },
        ]}
      />
    );
    expect(screen.getByText("Comment ça marche ?")).toBeInTheDocument();
    expect(screen.getByText("Étape un")).toBeInTheDocument();
    expect(screen.getByText("Étape deux")).toBeInTheDocument();
  });

  it("should render success message when provided", () => {
    render(
      <HelpCard
        title="Aide"
        steps={[{ number: 1, text: "Step" }]}
        successMessage="C'est parti !"
      />
    );
    expect(screen.getByText("C'est parti !")).toBeInTheDocument();
  });

  it("should have data-testid helpcard", () => {
    const { container } = render(
      <HelpCard title="T" steps={[]} />
    );
    expect(container.querySelector('[data-testid="helpcard"]')).toBeInTheDocument();
  });

  it("should have light blue styling (aide/tuto variant)", () => {
    const { container } = render(
      <HelpCard title="T" steps={[]} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("bg-blue-500/20");
    expect(card).toHaveClass("border-blue-400/50");
  });

  it("should support children for custom content", () => {
    render(
      <HelpCard title="Custom">
        <div data-testid="custom-help">Contenu personnalisé</div>
      </HelpCard>
    );
    expect(screen.getByTestId("custom-help")).toHaveTextContent("Contenu personnalisé");
  });
});
