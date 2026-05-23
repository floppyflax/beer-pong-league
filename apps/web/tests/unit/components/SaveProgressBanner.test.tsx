import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SaveProgressBanner } from "../../../src/components/SaveProgressBanner";
import "@testing-library/jest-dom";

let mockAuth: { isAuthenticated: boolean } = { isAuthenticated: false };
vi.mock("../../../src/hooks/useAuth", () => ({
  useAuth: () => mockAuth,
}));

let mockIdentity: { localUser: { anonymousUserId: string; pseudo: string } | null } = {
  localUser: null,
};
vi.mock("../../../src/hooks/useIdentity", () => ({
  useIdentity: () => mockIdentity,
}));

// AuthModal pulls in heavier deps; stub it.
vi.mock("../../../src/components/AuthModal", () => ({
  AuthModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="auth-modal" /> : null,
}));

describe("SaveProgressBanner", () => {
  beforeEach(() => {
    mockAuth = { isAuthenticated: false };
    mockIdentity = { localUser: null };
    localStorage.clear();
  });

  it("renders for an anonymous player (guest)", () => {
    mockIdentity = { localUser: { anonymousUserId: "anon-1", pseudo: "Bob" } };
    render(<SaveProgressBanner />);
    expect(screen.getByTestId("save-progress-banner")).toBeInTheDocument();
    expect(screen.getByText(/sauvegarde ta progression/i)).toBeInTheDocument();
  });

  it("renders nothing for an authenticated user", () => {
    mockAuth = { isAuthenticated: true };
    mockIdentity = { localUser: { anonymousUserId: "anon-1", pseudo: "Bob" } };
    const { container } = render(<SaveProgressBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there is no identity at all", () => {
    render(<SaveProgressBanner />);
    expect(screen.queryByTestId("save-progress-banner")).not.toBeInTheDocument();
  });

  it("sets authReturnTo and opens the auth modal on click", () => {
    mockIdentity = { localUser: { anonymousUserId: "anon-1", pseudo: "Bob" } };
    render(<SaveProgressBanner />);
    fireEvent.click(screen.getByTestId("save-progress-banner"));
    expect(localStorage.getItem("authReturnTo")).not.toBeNull();
    expect(screen.getByTestId("auth-modal")).toBeInTheDocument();
  });

  it("can be dismissed", () => {
    mockIdentity = { localUser: { anonymousUserId: "anon-1", pseudo: "Bob" } };
    render(<SaveProgressBanner />);
    fireEvent.click(screen.getByRole("button", { name: /masquer/i }));
    expect(screen.queryByTestId("save-progress-banner")).not.toBeInTheDocument();
  });
});
