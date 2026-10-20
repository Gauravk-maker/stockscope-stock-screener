
import { describe, expect, it } from "vitest";
import { initialStocks, syntheticUniverseSize } from "../data/stocks.js";
import {
  FILTER_METRICS,
  matchesMetricFilters,
  toCsv,
} from "../utils/screener.js";

describe("large demo universe", () => {
  it("provides 5,000 records and marks generated rows", () => {
    expect(initialStocks).toHaveLength(5000);
    expect(syntheticUniverseSize).toBeGreaterThan(0);
    expect(
      initialStocks.some(
        (stock) => stock.isSynthetic && stock.symbol.startsWith("SIM")
      )
    ).toBe(true);
  });

  it("exposes 30 unique numeric filter criteria", () => {
    expect(FILTER_METRICS).toHaveLength(30);
    expect(new Set(FILTER_METRICS.map((metric) => metric.key)).size).toBe(30);
  });

  it("applies minimum and maximum bounds together", () => {
    const stock = { price: 120, peRatio: 18 };

    expect(
      matchesMetricFilters(stock, {
        price: { min: "100", max: "150" },
        peRatio: { min: "10", max: "20" },
      })
    ).toBe(true);

    expect(
      matchesMetricFilters(stock, {
        price: { min: "121", max: "150" },
      })
    ).toBe(false);
  });

  it("passes when there are no active metric filters", () => {
    expect(matchesMetricFilters({ price: 120 }, {})).toBe(true);
  });

  it("accepts values exactly at the minimum and maximum", () => {
    const stock = { price: 100 };

    expect(
      matchesMetricFilters(stock, {
        price: { min: "100", max: "100" },
      })
    ).toBe(true);
  });

  it("supports empty and null bounds", () => {
    expect(
      matchesMetricFilters({ price: 100 }, {
        price: { min: "", max: null },
      })
    ).toBe(true);
  });

  it("ignores non-numeric bounds", () => {
    expect(
      matchesMetricFilters({ price: 100 }, {
        price: { min: "abc", max: "xyz" },
      })
    ).toBe(true);
  });

  it("rejects missing or non-numeric stock values for an active filter", () => {
    expect(
      matchesMetricFilters({}, { price: { min: "10" } })
    ).toBe(false);

    expect(
      matchesMetricFilters({ price: "unknown" }, {
        price: { min: "10" },
      })
    ).toBe(false);
  });

  it("exports CSV with escaped comma and quote values", () => {
    const csv = toCsv([
      {
        symbol: "SIM001",
        company: 'Company, "A"',
        market: "US",
        exchange: "NASDAQ",
        sector: "Technology",
        currency: "USD",
        price: 10,
        change: 1,
        volume: 20,
        dataSource: "demo",
      },
    ]);

    expect(csv.split("\r\n")).toHaveLength(2);
    expect(csv).toContain('"Company, ""A"""');
  });

  it("includes the expected CSV header and column order", () => {
    const csv = toCsv([]);

    expect(csv.split("\r\n")[0]).toBe(
      "symbol,company,market,exchange,sector,currency,price,change,volume,peRatio,dividendYield,rsi,dataSource"
    );
    expect(csv.split("\r\n")).toHaveLength(1);
  });

  it("exports null and undefined values as empty CSV fields", () => {
    const csv = toCsv([
      {
        symbol: "TEST",
        company: null,
        market: undefined,
      },
    ]);

    expect(csv.split("\r\n")[1].startsWith("TEST,,")).toBe(true);
  });

  it("escapes values containing line breaks", () => {
    const csv = toCsv([
      {
        symbol: "TEST",
        company: "First line\nSecond line",
      },
    ]);

    expect(csv).toContain('"First line\nSecond line"');
  });
});
