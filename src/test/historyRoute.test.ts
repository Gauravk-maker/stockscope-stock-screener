import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/history/route";

describe("GET /api/history", () => {
  const originalApiKey = process.env.TWELVE_DATA_API_KEY;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.TWELVE_DATA_API_KEY = "test-api-key";
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();

    if (originalApiKey === undefined) {
      delete process.env.TWELVE_DATA_API_KEY;
    } else {
      process.env.TWELVE_DATA_API_KEY = originalApiKey;
    }
  });

  async function request(query: string) {
    return GET(new NextRequest(`http://localhost/api/history${query}`));
  }

  it("rejects a missing stock symbol", async () => {
    const response = await request("");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Please provide a valid stock symbol.",
    });
  });

  it("returns demo candles when the provider requires a paid plan", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 404,
          message:
            "This symbol is available starting with the Grow or Venture plan.",
        }),
        { status: 404 },
      ),
    );

    const response = await request("?symbol=RELIANCE&market=IN&timeframe=1W");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.demo).toBe(true);
    expect(data.source).toBe("Demo Data (Simulated)");
    expect(data.warning).toContain("SIMULATED DATA ONLY");
    expect(data.candles.length).toBeGreaterThan(0);
    expect(response.headers.get("X-StockScope-Data-Mode")).toBe("demo");
  });

  it("rejects an invalid stock symbol", async () => {
    const response = await request("?symbol=INVALID%20SYMBOL");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Please provide a valid stock symbol.",
    });
  });

  it("rejects an unsupported interval", async () => {
    const response = await request("?symbol=AAPL&interval=2min");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Unsupported historical interval.",
    });
  });

  it("returns an error when the API key is missing", async () => {
    delete process.env.TWELVE_DATA_API_KEY;

    const response = await request("?symbol=AAPL&timeframe=1W");
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.reason).toBe("missing_api_key");
    expect(data.candles).toEqual([]);
    expect(data.demo).toBe(false);
    expect(response.headers.get("X-StockScope-Data-Mode")).toBe("unavailable");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns a clear error when the provider reports a generic error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "error",
          message: "Temporary provider error",
        }),
        { status: 200 },
      ),
    );

    const response = await request("?symbol=AAPL");
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.reason).toBe("provider_error");
    expect(data.candles).toEqual([]);
    expect(data.demo).toBe(false);
  });

  it("returns an error when the provider request fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const response = await request("?symbol=MSFT&market=US");
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.reason).toBe("provider_connection_error");
    expect(data.candles).toEqual([]);
    expect(data.count).toBe(0);
    expect(data.demo).toBe(false);
  });

  it("returns real candles and filters invalid records", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          values: [
            {
              datetime: "2026-10-20 09:30:00",
              open: "100",
              high: "110",
              low: "95",
              close: "105",
              volume: "2000",
            },
            {
              datetime: "2026-10-20 09:35:00",
              open: "100",
              high: "101",
              low: "99",
              close: "120",
              volume: "500",
            },
            {
              datetime: "2026-10-20 09:40:00",
              open: "0",
              high: "10",
              low: "0",
              close: "5",
              volume: "10",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const response = await request("?symbol=AAPL&timeframe=1D");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe("Twelve Data");
    expect(data.demo).toBe(false);
    expect(data.count).toBe(1);
    expect(data.candles[0]).toMatchObject({
      time: "2026-10-20 09:30:00",
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      volume: 2000,
    });
    expect(response.headers.get("Cache-Control")).toBe("private, max-age=30");
  });

  it("uses NSE for the Indian market when exchange is not supplied", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ values: [] }), { status: 200 }),
    );

    await request("?symbol=RELIANCE&market=IN");

    const [calledUrl] = vi.mocked(fetch).mock.calls[0];
    expect(new URL(String(calledUrl)).searchParams.get("exchange")).toBe("NSE");
  });

  it("prefers an explicitly supplied exchange", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ values: [] }), { status: 200 }),
    );

    await request("?symbol=RELIANCE&market=IN&exchange=BSE");

    const [calledUrl] = vi.mocked(fetch).mock.calls[0];
    expect(new URL(String(calledUrl)).searchParams.get("exchange")).toBe("BSE");
  });

  it("uses the default timeframe and interval", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          values: Array.from({ length: 30 }, (_, i) => ({
            datetime: `2026-10-${String(i + 1).padStart(2, "0")}`,
            open: "100",
            high: "105",
            low: "95",
            close: "102",
            volume: "1000",
          })),
        }),
        { status: 200 },
      ),
    );

    const response = await request("?symbol=MSFT");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.timeframe).toBe("1M");
    expect(data.interval).toBe("1day");
    expect(data.count).toBe(30);
    expect(data.demo).toBe(false);
  });
});
