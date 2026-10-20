
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../app/api/quote/route";

describe("GET /api/quote", () => {
  const originalApiKey = process.env.TWELVE_DATA_API_KEY;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.TWELVE_DATA_API_KEY = "test-api-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    if (originalApiKey === undefined) {
      delete process.env.TWELVE_DATA_API_KEY;
    } else {
      process.env.TWELVE_DATA_API_KEY = originalApiKey;
    }
  });

  it("returns 503 when the API key is missing", async () => {
    delete process.env.TWELVE_DATA_API_KEY;

    const response = await GET(
      new Request("http://localhost/api/quote?symbol=AAPL")
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Missing TWELVE_DATA_API_KEY in .env.local",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([null, "", "INVALID SYMBOL!", "A".repeat(31)])(
    "rejects invalid symbols: %s",
    async (symbol) => {
      const url = new URL("http://localhost/api/quote");

      if (symbol !== null) {
        url.searchParams.set("symbol", symbol);
      }

      const response = await GET(new Request(url));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "A valid stock symbol is required.",
      });
      expect(fetch).not.toHaveBeenCalled();
    }
  );

  it("returns quote data and disables caching", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ symbol: "AAPL", close: "150" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const response = await GET(
      new Request("http://localhost/api/quote?symbol=AAPL")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      symbol: "AAPL",
      close: "150",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const [calledUrl, options] = vi.mocked(fetch).mock.calls[0];

    expect(String(calledUrl)).toContain(
      "https://api.twelvedata.com/quote?"
    );
    expect(String(calledUrl)).toContain("symbol=AAPL");
    expect(String(calledUrl)).toContain("apikey=test-api-key");
    expect(options).toEqual({ cache: "no-store" });
  });

  it("includes exchange when provided", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ symbol: "AAPL" }), { status: 200 })
    );

    await GET(
      new Request(
        "http://localhost/api/quote?symbol=AAPL&exchange=NASDAQ"
      )
    );

    const [calledUrl] = vi.mocked(fetch).mock.calls[0];
    const url = new URL(String(calledUrl));

    expect(url.searchParams.get("exchange")).toBe("NASDAQ");
    expect(url.searchParams.get("symbol")).toBe("AAPL");
  });

  it("returns 502 when the provider returns an HTTP error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "Provider unavailable" }), {
        status: 500,
      })
    );

    const response = await GET(
      new Request("http://localhost/api/quote?symbol=AAPL")
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Provider unavailable",
    });
  });

  it("returns 502 when the provider reports an API error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ status: "error", message: "Invalid symbol" }),
        { status: 200 }
      )
    );

    const response = await GET(
      new Request("http://localhost/api/quote?symbol=UNKNOWN")
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Invalid symbol",
    });
  });

  it("returns 502 when the provider request throws", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network failure"));

    const response = await GET(
      new Request("http://localhost/api/quote?symbol=AAPL")
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Unable to connect to the quote provider.",
    });
  });
});
