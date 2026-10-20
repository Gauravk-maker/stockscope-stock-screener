
import { beforeEach, describe, expect, it } from "vitest";
import { useStockStore } from "../store/stockStore";

describe("stockStore", () => {
  beforeEach(() => {
    useStockStore.setState({
      filters: { exchanges: [], search: "" },
      selectedSymbol: null,
      watchlist: [],
    });
  });

  it("starts with default filters and empty selections", () => {
    const state = useStockStore.getState();

    expect(state.filters).toEqual({ exchanges: [], search: "" });
    expect(state.selectedSymbol).toBeNull();
    expect(state.watchlist).toEqual([]);
  });

  it("updates search filter without removing other filters", () => {
    useStockStore.getState().setFilters({ exchanges: ["NASDAQ"] });
    useStockStore.getState().setFilters({ search: "AAPL" });

    expect(useStockStore.getState().filters).toEqual({
      exchanges: ["NASDAQ"],
      search: "AAPL",
    });
  });

  it("clears filters", () => {
    useStockStore.getState().setFilters({
      exchanges: ["NYSE"],
      search: "Tesla",
    });

    useStockStore.getState().clearFilters();

    expect(useStockStore.getState().filters).toEqual({
      exchanges: [],
      search: "",
    });
  });

  it("sets the selected stock symbol", () => {
    useStockStore.getState().setSelectedSymbol("AAPL");

    expect(useStockStore.getState().selectedSymbol).toBe("AAPL");
  });

  it("clears the selected stock symbol", () => {
    useStockStore.getState().setSelectedSymbol("AAPL");
    useStockStore.getState().setSelectedSymbol(null);

    expect(useStockStore.getState().selectedSymbol).toBeNull();
  });

  it("adds a symbol to the watchlist", () => {
    useStockStore.getState().toggleWatchlist("AAPL");

    expect(useStockStore.getState().watchlist).toEqual(["AAPL"]);
  });

  it("removes a symbol when toggled a second time", () => {
    useStockStore.getState().toggleWatchlist("AAPL");
    useStockStore.getState().toggleWatchlist("AAPL");

    expect(useStockStore.getState().watchlist).toEqual([]);
  });

  it("preserves other symbols when removing one from watchlist", () => {
    useStockStore.getState().toggleWatchlist("AAPL");
    useStockStore.getState().toggleWatchlist("MSFT");
    useStockStore.getState().toggleWatchlist("AAPL");

    expect(useStockStore.getState().watchlist).toEqual(["MSFT"]);
  });
});
