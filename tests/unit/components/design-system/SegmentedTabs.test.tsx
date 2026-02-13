import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { SegmentedTabs } from "../../../../src/components/design-system/SegmentedTabs";

describe("SegmentedTabs", () => {
  const defaultTabs = [
    { id: "all", label: "Tous" },
    { id: "active", label: "Actifs" },
    { id: "finished", label: "Terminés" },
  ];

  it("should render a list of tabs", () => {
    render(
      <SegmentedTabs
        tabs={defaultTabs}
        activeId="all"
        onChange={() => {}}
      />
    );
    expect(screen.getByRole("tab", { name: "Tous" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Actifs" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Terminés" })).toBeInTheDocument();
  });

  it("should have role tablist on container", () => {
    render(
      <SegmentedTabs
        tabs={defaultTabs}
        activeId="all"
        onChange={() => {}}
      />
    );
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("should mark active tab with aria-selected", () => {
    render(
      <SegmentedTabs
        tabs={defaultTabs}
        activeId="active"
        onChange={() => {}}
      />
    );
    const activeTab = screen.getByRole("tab", { name: "Actifs" });
    expect(activeTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Tous" })).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  it("should call onChange when tab is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedTabs
        tabs={defaultTabs}
        activeId="all"
        onChange={onChange}
      />
    );
    await user.click(screen.getByRole("tab", { name: "Actifs" }));
    expect(onChange).toHaveBeenCalledWith("active");
  });

  it("should apply flex gap-2 structure", () => {
    const { container } = render(
      <SegmentedTabs
        tabs={defaultTabs}
        activeId="all"
        onChange={() => {}}
      />
    );
    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist).toHaveClass("flex");
    expect(tablist).toHaveClass("gap-2");
  });

  it("should render with single tab", () => {
    render(
      <SegmentedTabs
        tabs={[{ id: "only", label: "Seul" }]}
        activeId="only"
        onChange={() => {}}
      />
    );
    expect(screen.getByRole("tab", { name: "Seul" })).toBeInTheDocument();
  });
});
