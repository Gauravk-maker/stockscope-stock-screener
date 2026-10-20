
import { beforeEach, describe, expect, it } from "vitest";
import useLivePriceStore from "../store/livePriceStore";

describe("livePriceStore", () => {
  beforeEach(() => {
    useLivePriceStore.setState({
      prices: {},
      status: "connecting",
    });
  });

  it("starts with empty prices and connecting status", () => {
    const state = useLivePriceStore.getState();

    expect(state.prices).toEqual({});
    expect(state.status).toBe("connecting");
  });

  it("updates connection status", () => {
    useLivePriceStore.getState().setStatus("connected");

    expect(useLivePriceStore.getState().status).toBe("connected");
  });

  it("normalizes symbol and US market names", () => {
    useLivePriceStore.getState().updatePrices([
      { symbol: " aapl ", price: "150.5", market: "nasdaq" },
    ]);

    expect(useLivePriceStore.getState().prices["US:AAPL"]).toMatchObject({
      symbol: "AAPL",
      market: "US",
      price: 150.5,
      change: 0,
    });
  });

  it("classifies Indian exchanges as the IN market", () => {
    useLivePriceStore.getState().updatePrices([
      { symbol: " reliance ", price: 1200, exchange: "NSE" },
    ]);

    expect(useLivePriceStore.getState().prices["IN:RELIANCE"]).toMatchObject({
      symbol: "RELIANCE",
      market: "IN",
      price: 1200,
    });
  });

  it("supports all recognized US market labels", () => {
    const labels = ["US", "USA", "NASDAQ", "NYSE", "NYSEARCA"];

    useLivePriceStore.getState().updatePrices(
      labels.map((market, index) => ({
        symbol: `TEST${index}`,
        price: index + 10,
        market,
      }))
    );

    const prices = useLivePriceStore.getState().prices;

    for (let index = 0; index < labels.length; index++) {
      expect(prices[`US:TEST${index}`]).toBeDefined();
    }
  });

  it("ignores invalid symbols and non-positive or invalid prices", () => {
    useLivePriceStore.getState().updatePrices([
      { symbol: 123, price: 100 },
      { symbol: "ZERO", price: 0 },
      { symbol: "NEGATIVE", price: -5 },
      { symbol: "INVALID", price: "unknown" },
      { symbol: "NAN", price: NaN },
    ]);

    expect(useLivePriceStore.getState().prices).toEqual({});
  });

  it("updates existing prices without removing other stocks", () => {
    const store = useLivePriceStore.getState();

    store.updatePrices([
      { symbol: "AAPL", price: 150, market: "US" },
      { symbol: "MSFT", price: 300, market: "US" },
    ]);

    useLivePriceStore.getState().updatePrices([
      { symbol: "AAPL", price: 155, market: "US" },
    ]);

    const prices = useLivePriceStore.getState().prices;

    expect(prices["US:AAPL"].price).toBe(155);
    expect(prices["US:MSFT"].price).toBe(300);
  });

  it("preserves supplied change and timestamp values", () => {
    useLivePriceStore.getState().updatePrices([
      {
        symbol: "AAPL",
        price: 150,
        change: 2.5,
        timestamp: 123456,
        market: "US",
      },
    ]);

    expect(useLivePriceStore.getState().prices["US:AAPL"]).toMatchObject({
      price: 150,
      change: 2.5,
      timestamp: 123456,
    });
  });

  it("uses exchange when market is absent and keeps market keys separate", () => {
    useLivePriceStore.getState().updatePrices([
      { symbol: "ABC", price: 100, exchange: "NYSE" },
      { symbol: "ABC", price: 200, exchange: "NSE" },
    ]);

    const prices = useLivePriceStore.getState().prices;

    expect(prices["US:ABC"].price).toBe(100);
    expect(prices["IN:ABC"].price).toBe(200);
  });
});
