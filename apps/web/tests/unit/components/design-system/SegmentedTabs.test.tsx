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
      <SegmentedTabs tabs={defaultTabs} activeId="all" onChange={() => {}} />,
    );
    expect(screen.getByRole("tab", { name: "Tous" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Actifs" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Terminés" })).toBeInTheDocument();
  });

  it("should have role tablist on container", () => {
    render(
      <SegmentedTabs tabs={defaultTabs} activeId="all" onChange={() => {}} />,
    );
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("should mark active tab with aria-selected", () => {
    render(
      <SegmentedTabs
        tabs={defaultTabs}
        activeId="active"
        onChange={() => {}}
      />,
    );
    const activeTab = screen.getByRole("tab", { name: "Actifs" });
    expect(activeTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Tous" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("should call onChange when tab is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedTabs tabs={defaultTabs} activeId="all" onChange={onChange} />,
    );
    await user.click(screen.getByRole("tab", { name: "Actifs" }));
    expect(onChange).toHaveBeenCalledWith("active");
  });

  it("should apply flex gap-2 structure", () => {
    const { container } = render(
      <SegmentedTabs tabs={defaultTabs} activeId="all" onChange={() => {}} />,
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
      />,
    );
    expect(screen.getByRole("tab", { name: "Seul" })).toBeInTheDocument();
  });

  describe("variant encapsulated (Story 14-30, Arcade)", () => {
    it("should render encapsulated container with bg-navy-soft rounded-card p-1 border", () => {
      const { container } = render(
        <SegmentedTabs
          tabs={defaultTabs}
          activeId="all"
          onChange={() => {}}
          variant="encapsulated"
        />,
      );
      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toHaveClass("bg-navy-soft");
      expect(tablist).toHaveClass("rounded-card");
      expect(tablist).toHaveClass("p-1");
      expect(tablist).toHaveClass("w-full");
      expect(tablist).toHaveClass("border");
      expect(tablist).toHaveClass("border-card");
    });

    it("should distribute tab buttons evenly with flex-1 in encapsulated", () => {
      render(
        <SegmentedTabs
          tabs={defaultTabs}
          activeId="all"
          onChange={() => {}}
          variant="encapsulated"
        />,
      );
      const tousTab = screen.getByRole("tab", { name: "Tous" });
      expect(tousTab).toHaveClass("flex-1");
      expect(tousTab).toHaveClass("text-center");
    });

    it("should have flex with no gap between tabs in encapsulated", () => {
      const { container } = render(
        <SegmentedTabs
          tabs={defaultTabs}
          activeId="all"
          onChange={() => {}}
          variant="encapsulated"
        />,
      );
      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toHaveClass("flex");
      expect(tablist).not.toHaveClass("gap-2");
    });

    it("should apply bg-electric-blue text-white rounded-sm to active tab in encapsulated", () => {
      render(
        <SegmentedTabs
          tabs={defaultTabs}
          activeId="active"
          onChange={() => {}}
          variant="encapsulated"
        />,
      );
      const activeTab = screen.getByRole("tab", { name: "Actifs" });
      expect(activeTab).toHaveClass("bg-electric-blue");
      expect(activeTab).toHaveClass("text-white");
      expect(activeTab).toHaveClass("rounded-sm");
    });

    it("should apply transparent bg and text-cool-gray to inactive tab in encapsulated", () => {
      render(
        <SegmentedTabs
          tabs={defaultTabs}
          activeId="all"
          onChange={() => {}}
          variant="encapsulated"
        />,
      );
      const inactiveTab = screen.getByRole("tab", { name: "Actifs" });
      expect(inactiveTab).toHaveClass("bg-transparent");
      expect(inactiveTab).toHaveClass("text-cool-gray");
      expect(inactiveTab).not.toHaveClass("bg-electric-blue");
    });

    it("should render empty container when tabs is empty in encapsulated", () => {
      const { container } = render(
        <SegmentedTabs
          tabs={[]}
          activeId=""
          onChange={() => {}}
          variant="encapsulated"
        />,
      );
      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toBeInTheDocument();
      expect(tablist).toHaveClass("bg-navy-soft");
      expect(screen.queryAllByRole("tab")).toHaveLength(0);
    });

    it("should remain backward compatible when variant is default or omitted", () => {
      const { container } = render(
        <SegmentedTabs
          tabs={defaultTabs}
          activeId="all"
          onChange={() => {}}
          variant="default"
        />,
      );
      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toHaveClass("flex");
      expect(tablist).toHaveClass("gap-2");
      expect(tablist).not.toHaveClass("bg-navy-soft");
    });
  });
});
