
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useWatchlist } from "../hooks/useWatchlist";

const KEY = "stockscope-watchlist-v1";

describe("useWatchlist", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with an empty watchlist", () => {
    const { result } = renderHook(() => useWatchlist());

    expect(result.current.watchlist).toEqual([]);
  });

  it("loads the saved watchlist from localStorage", () => {
    localStorage.setItem(KEY, JSON.stringify(["AAPL", "MSFT"]));

    const { result } = renderHook(() => useWatchlist());

    expect(result.current.watchlist).toEqual(["AAPL", "MSFT"]);
  });

  it("adds a stock to the watchlist", () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => {
      result.current.toggle("AAPL");
    });

    expect(result.current.watchlist).toEqual(["AAPL"]);
  });

  it("removes a stock when toggled again", () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => {
      result.current.toggle("AAPL");
      result.current.toggle("AAPL");
    });

    expect(result.current.watchlist).toEqual([]);
  });

  it("preserves other stocks when removing one", () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => {
      result.current.toggle("AAPL");
      result.current.toggle("MSFT");
      result.current.toggle("AAPL");
    });

    expect(result.current.watchlist).toEqual(["MSFT"]);
  });

  it("handles invalid JSON in localStorage", () => {
    localStorage.setItem(KEY, "{invalid-json");

    const { result } = renderHook(() => useWatchlist());

    expect(result.current.watchlist).toEqual([]);
  });

  it("handles saved data that is not an array", () => {
    localStorage.setItem(KEY, JSON.stringify({ symbol: "AAPL" }));

    const { result } = renderHook(() => useWatchlist());

    expect(result.current.watchlist).toEqual([]);
  });

  it("persists watchlist changes to localStorage", async () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => {
      result.current.toggle("NVDA");
    });

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(KEY))).toEqual(["NVDA"]);
    });
  });
});
