import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_INTERVALS = new Set([
  "1min",
  "5min",
  "15min",
  "30min",
  "1h",
  "1day",
  "1week",
  "1month",
]);

const TIMEFRAMES: Record<string, { interval: string; outputsize: number }> = {
  "1D": { interval: "5min", outputsize: 78 },
  "1W": { interval: "1day", outputsize: 7 },
  "1M": { interval: "1day", outputsize: 30 },
  "6M": { interval: "1day", outputsize: 180 },
};

const INTERVAL_MS: Record<string, number> = {
  "1min": 60_000,
  "5min": 5 * 60_000,
  "15min": 15 * 60_000,
  "30min": 30 * 60_000,
  "1h": 60 * 60_000,
  "1day": 24 * 60 * 60_000,
  "1week": 7 * 24 * 60 * 60_000,
  "1month": 30 * 24 * 60 * 60_000,
};

function generateDemoCandles(
  symbol: string,
  interval: string,
  outputsize: number,
) {
  // Deterministic seed: same symbol gets a repeatable price pattern.
  let seed = 0;

  for (const char of symbol.toUpperCase()) {
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  }

  const basePrice = 100 + (seed % 4900);
  const step = INTERVAL_MS[interval] || INTERVAL_MS["1day"];
  const now = Date.now();
  let previousClose = basePrice;

  return Array.from({ length: outputsize }, (_, index) => {
    const wave = seed + index + 1;

    const change =
      Math.sin(wave * 0.37) * 0.008 + Math.cos(wave * 0.11) * 0.004;

    const open = previousClose * (1 + Math.sin(wave * 0.23) * 0.002);

    const close = previousClose * (1 + change);

    const high =
      Math.max(open, close) * (1.002 + Math.abs(Math.sin(wave * 0.41)) * 0.003);

    const low =
      Math.min(open, close) *
      (1 - 0.002 - Math.abs(Math.cos(wave * 0.29)) * 0.003);

    previousClose = close;

    const timestamp = now - (outputsize - 1 - index) * step;

    return {
      time: new Date(timestamp).toISOString().slice(0, 19).replace("T", " "),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(100000 + Math.abs(Math.sin(wave)) * 800000),
    };
  });
}

function demoResponse(
  symbol: string,
  interval: string,
  outputsize: number,
  timeframe: string,
  reason: string,
) {
  const candles = generateDemoCandles(symbol, interval, outputsize);

  return NextResponse.json(
    {
      symbol,
      interval,
      timeframe,
      candles,
      count: candles.length,
      source: "Demo Data (Simulated)",
      demo: true,
      warning: "SIMULATED DATA ONLY. These are not real market prices.",
      reason,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-StockScope-Data-Mode": "demo",
      },
    },
  );
}

function historyError(message: string, status: number, reason: string) {
  return NextResponse.json(
    {
      error: message,
      reason,
      candles: [],
      count: 0,
      demo: false,
      source: null,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-StockScope-Data-Mode": "unavailable",
      },
    },
  );
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const symbol = params.get("symbol")?.trim();
  const market = params.get("market")?.trim().toUpperCase();
  const exchangeParam = params.get("exchange")?.trim();

  const timeframe = (params.get("timeframe") || "1M").toUpperCase();

  const timeframeConfig = TIMEFRAMES[timeframe];
  const interval =
    params.get("interval") || timeframeConfig?.interval || "1day";

  const requestedSize = Number(
    params.get("outputsize") || timeframeConfig?.outputsize || 100,
  );

  const outputsize = Math.min(
    5000,
    Math.max(
      1,
      Number.isFinite(requestedSize) ? Math.floor(requestedSize) : 100,
    ),
  );

  if (!symbol || !/^[A-Za-z0-9._-]{1,30}$/.test(symbol)) {
    return NextResponse.json(
      { error: "Please provide a valid stock symbol." },
      { status: 400 },
    );
  }

  if (!ALLOWED_INTERVALS.has(interval)) {
    return NextResponse.json(
      { error: "Unsupported historical interval." },
      { status: 400 },
    );
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;

  // Missing key? Return clearly labelled demo data.
  if (!apiKey) {
    return historyError(
      "Historical data is unavailable. Configure your Twelve Data API key.",
      503,
      "missing_api_key",
    );
  }

  const exchange = exchangeParam || (market === "IN" ? "NSE" : undefined);

  const url = new URL("https://api.twelvedata.com/time_series");

  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", String(outputsize));
  url.searchParams.set("order", "ASC");
  url.searchParams.set("apikey", apiKey);

  if (exchange) {
    url.searchParams.set("exchange", exchange);
  }

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json();

    if (
      !response.ok ||
      data.status === "error" ||
      data.code ||
      !Array.isArray(data.values)
    ) {
      console.error("Twelve Data history error:", {
        status: response.status,
        code: data.code,
        message: data.message,
        symbol,
        exchange,
        interval,
      });

      // Plan restrictions and provider errors use demo fallback.
      const message = String(data.message || "Historical data unavailable.");

      const isPlanRestriction =
        /grow or venture|upgrade|plan does not support|not available on your plan/i.test(
          message,
        );

      if (isPlanRestriction) {
        return demoResponse(
          symbol,
          interval,
          outputsize,
          timeframe,
          "Twelve Data plan restriction",
        );
      }

      return historyError(
        "Historical data is currently unavailable.",
        502,
        "provider_error",
      );
    }

    const candles = data.values
      .map((item: Record<string, string>) => ({
        time: item.datetime,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
        volume: Number(item.volume || 0),
      }))
      .filter(
        (item: {
          time: string;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
        }) =>
          Boolean(item.time) &&
          [item.open, item.high, item.low, item.close].every(Number.isFinite) &&
          item.open > 0 &&
          item.high > 0 &&
          item.low > 0 &&
          item.close > 0 &&
          item.high >= Math.max(item.open, item.close) &&
          item.low <= Math.min(item.open, item.close),
      );

    return NextResponse.json(
      {
        symbol,
        interval,
        timeframe,
        candles,
        count: candles.length,
        source: "Twelve Data",
        demo: false,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30",
        },
      },
    );
  } catch (error) {
    console.error("History API connection error:", error);

    return historyError(
      "Unable to connect to the historical data provider.",
      502,
      "provider_connection_error",
    );
  }
}
