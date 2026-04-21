import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "../../../../src/components/design-system/SearchBar";

describe("SearchBar (Story 14-8)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render search icon on the left (AC: 1)", () => {
    render(
      <SearchBar value="" onChange={() => {}} placeholder="Rechercher..." />,
    );
    const input = screen.getByRole("searchbox");
    const container = input.closest(".relative");
    expect(container?.querySelector("svg")).toBeInTheDocument();
  });

  it("should have input with bg-slate-800 border border-slate-700 rounded-lg pl-12 (AC: 2)", () => {
    render(<SearchBar value="" onChange={() => {}} />);
    const input = screen.getByRole("searchbox");
    expect(input).toHaveClass("bg-slate-800");
    expect(input).toHaveClass("border");
    expect(input).toHaveClass("border-slate-700");
    expect(input).toHaveClass("rounded-lg");
    expect(input).toHaveClass("pl-12");
  });

  it("should display value and placeholder props (AC: 4)", () => {
    render(
      <SearchBar
        value="test query"
        onChange={() => {}}
        placeholder="Rechercher un tournoi..."
      />,
    );
    const input = screen.getByRole("searchbox");
    expect(input).toHaveValue("test query");
    expect(input).toHaveAttribute("placeholder", "Rechercher un tournoi...");
  });

  it("should use default placeholder when omitted", () => {
    render(<SearchBar value="" onChange={() => {}} />);
    const input = screen.getByRole("searchbox");
    expect(input).toHaveAttribute("placeholder", "Rechercher...");
  });

  it("should debounce onChange by 300ms (AC: 3)", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    const input = screen.getByRole("searchbox");

    fireEvent.change(input, { target: { value: "a" } });

    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("should only call onChange once after typing stops for 300ms", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    const input = screen.getByRole("searchbox");

    fireEvent.change(input, { target: { value: "a" } });
    vi.advanceTimersByTime(100);
    fireEvent.change(input, { target: { value: "ab" } });
    vi.advanceTimersByTime(100);
    fireEvent.change(input, { target: { value: "abc" } });

    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("abc");
  });

  it("should call onChange with empty string when user clears input after debounce", () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchBar value="" onChange={onChange} />);
    const input = screen.getByRole("searchbox");

    fireEvent.change(input, { target: { value: "abc" } });
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith("abc");

    // Simulate parent updating value after onChange (controlled component)
    rerender(<SearchBar value="abc" onChange={onChange} />);

    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it("should sync from parent value when value prop changes", () => {
    const { rerender } = render(
      <SearchBar value="" onChange={() => {}} />,
    );
    const input = screen.getByRole("searchbox");
    expect(input).toHaveValue("");

    rerender(<SearchBar value="external" onChange={() => {}} />);
    expect(input).toHaveValue("external");
  });
});
