import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScreenLayout } from "../../../../src/components/design-system/ScreenLayout";

describe("ScreenLayout", () => {
  it("renders children inside the content wrapper", () => {
    render(
      <ScreenLayout>
        <p>hello world</p>
      </ScreenLayout>,
    );
    expect(screen.getByText("hello world")).toBeInTheDocument();
    expect(screen.getByTestId("screen-layout")).toBeInTheDocument();
  });

  it("applies Arcade cream background by default", () => {
    render(<ScreenLayout>content</ScreenLayout>);
    expect(screen.getByTestId("screen-layout")).toHaveClass("bg-navy");
    expect(screen.getByTestId("screen-layout")).toHaveClass("min-h-screen");
  });

  it("renders header slot before content", () => {
    render(
      <ScreenLayout header={<header data-testid="top-header">header</header>}>
        <p>body</p>
      </ScreenLayout>,
    );
    expect(screen.getByTestId("top-header")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("renders overlay slot after content", () => {
    render(
      <ScreenLayout overlay={<div data-testid="fab-slot">FAB</div>}>
        <p>body</p>
      </ScreenLayout>,
    );
    expect(screen.getByTestId("fab-slot")).toBeInTheDocument();
  });

  it("applies narrow max-width", () => {
    const { container } = render(
      <ScreenLayout maxWidth="narrow">content</ScreenLayout>,
    );
    const content = container.querySelector(".max-w-\\[720px\\]");
    expect(content).toBeInTheDocument();
  });

  it("applies wide max-width by default", () => {
    const { container } = render(<ScreenLayout>content</ScreenLayout>);
    const content = container.querySelector(".max-w-\\[1200px\\]");
    expect(content).toBeInTheDocument();
  });

  it("omits max-width when maxWidth=full", () => {
    const { container } = render(
      <ScreenLayout maxWidth="full">content</ScreenLayout>,
    );
    expect(container.querySelector(".max-w-\\[1200px\\]")).toBeNull();
    expect(container.querySelector(".max-w-\\[720px\\]")).toBeNull();
  });

  it("supports custom className on wrapper", () => {
    render(<ScreenLayout className="custom-bg">x</ScreenLayout>);
    expect(screen.getByTestId("screen-layout")).toHaveClass("custom-bg");
  });
});
