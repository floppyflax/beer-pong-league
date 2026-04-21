/**
 * useFullDisconnect hook tests - Story 14.34
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFullDisconnect } from "../../../src/hooks/useFullDisconnect";

const mockReplace = vi.fn();
const mockSignOut = vi.fn();
const mockClearIdentity = vi.fn();

Object.defineProperty(window, "location", {
  value: { ...window.location, replace: mockReplace },
  writable: true,
});

vi.mock("../../../src/context/AuthContext", () => ({
  useAuthContext: () => ({ signOut: mockSignOut }),
}));

vi.mock("../../../src/hooks/useIdentity", () => ({
  useIdentity: () => ({ clearIdentity: mockClearIdentity }),
}));

describe("useFullDisconnect - Story 14.34", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue(undefined);
    sessionStorage.clear();
    localStorage.clear();
  });

  it("should call signOut when fullDisconnect is invoked", async () => {
    const { result } = renderHook(() => useFullDisconnect());

    await act(async () => {
      await result.current.fullDisconnect();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("should call clearIdentity when fullDisconnect is invoked", async () => {
    const { result } = renderHook(() => useFullDisconnect());

    await act(async () => {
      await result.current.fullDisconnect();
    });

    expect(mockClearIdentity).toHaveBeenCalled();
  });

  it("should remove authReturnTo from sessionStorage", async () => {
    sessionStorage.setItem("authReturnTo", "/create-tournament");
    const { result } = renderHook(() => useFullDisconnect());

    await act(async () => {
      await result.current.fullDisconnect();
    });

    expect(sessionStorage.getItem("authReturnTo")).toBeNull();
  });

  it("should reload page to / via window.location.replace", async () => {
    const { result } = renderHook(() => useFullDisconnect());

    await act(async () => {
      await result.current.fullDisconnect();
    });

    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("should clear LeagueContext cache from localStorage", async () => {
    localStorage.setItem("bpl_leagues", '[{"id":"l1"}]');
    localStorage.setItem("bpl_tournaments", '[{"id":"t1"}]');
    localStorage.setItem("bpl_current_league_id", "l1");
    localStorage.setItem("bpl_current_tournament_id", "t1");

    const { result } = renderHook(() => useFullDisconnect());

    await act(async () => {
      await result.current.fullDisconnect();
    });

    expect(localStorage.getItem("bpl_leagues")).toBeNull();
    expect(localStorage.getItem("bpl_tournaments")).toBeNull();
    expect(localStorage.getItem("bpl_current_league_id")).toBeNull();
    expect(localStorage.getItem("bpl_current_tournament_id")).toBeNull();
  });
});
