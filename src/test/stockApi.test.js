import { describe, expect, it, vi } from "vitest";
import { fetchQuote } from "../services/stockApi";

function mockFetch(data, options = {}) {
  return vi.fn().mockResolvedValue({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: options.json ?? (() => Promise.resolve(data)),
  });
}

describe("fetchQuote", () => {
  it("fetches a quote and returns normalized stock data", async () => {
    const fetchImpl = mockFetch({
      close: "150.5",
      percent_change: "2.5",
      volume: "1200",
      datetime: "2026-10-20 10:00:00",
    });

    const stock = { symbol: "AAPL", exchange: "NASDAQ" };
    const result = await fetchQuote(stock, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/quote?symbol=AAPL&exchange=NASDAQ",
      { cache: "no-store" },
    );
    expect(result).toMatchObject({
      symbol: "AAPL",
      exchange: "NASDAQ",
      price: 150.5,
      change: 2.5,
      volume: 1200,
      lastUpdated: "2026-10-20 10:00:00",
      dataSource: "Twelve Data",
    });
  });

  it("omits exchange when none is provided", async () => {
    const fetchImpl = mockFetch({ close: "25" });

    await fetchQuote({ symbol: "XYZ" }, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith("/api/quote?symbol=XYZ", {
      cache: "no-store",
    });
  });

  it("encodes special characters in the symbol", async () => {
    const fetchImpl = mockFetch({ close: "25" });

    await fetchQuote({ symbol: "BRK/B" }, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith("/api/quote?symbol=BRK%2FB", {
      cache: "no-store",
    });
  });

  it("preserves existing change and volume if API values are invalid", async () => {
    const fetchImpl = mockFetch({
      close: "40",
      percent_change: "unknown",
      volume: "unknown",
    });

    const result = await fetchQuote(
      { symbol: "XYZ", change: 3, volume: 500 },
      fetchImpl,
    );

    expect(result.change).toBe(3);
    expect(result.volume).toBe(500);
  });

  it("throws when the API response is not valid JSON", async () => {
    const fetchImpl = mockFetch(null, {
      status: 502,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(fetchQuote({ symbol: "XYZ" }, fetchImpl)).rejects.toThrow(
      "Invalid API response (HTTP 502).",
    );
  });

  it("throws when the HTTP response is unsuccessful", async () => {
    const fetchImpl = mockFetch(
      { error: "Service unavailable" },
      { ok: false, status: 503 },
    );

    await expect(fetchQuote({ symbol: "XYZ" }, fetchImpl)).rejects.toThrow(
      "Service unavailable",
    );
  });

  it("throws when the API returns an error", async () => {
    const fetchImpl = mockFetch({ error: "Invalid symbol" });

    await expect(fetchQuote({ symbol: "XYZ" }, fetchImpl)).rejects.toThrow(
      "Invalid symbol",
    );
  });

  it.each(["0", "-5", "unknown", null])(
    "rejects invalid prices: %s",
    async (close) => {
      const fetchImpl = mockFetch({ close });

      await expect(fetchQuote({ symbol: "XYZ" }, fetchImpl)).rejects.toThrow(
        "No valid price returned for XYZ. Check symbol coverage.",
      );
    },
  );

  it("uses the current timestamp when datetime is missing", async () => {
    const fetchImpl = mockFetch({ close: "80" });

    const result = await fetchQuote({ symbol: "XYZ" }, fetchImpl);

    expect(Number.isNaN(Date.parse(result.lastUpdated))).toBe(false);
  });
});
