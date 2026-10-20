"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  LineStyle,
} from "lightweight-charts";

import {
  calculateSMA,
  calculateEMA,
  calculateBollinger,
  calculateRSI,
  calculateVolumeProfile,
} from "../utils/indicators.js";

const TIMEFRAMES = [
  { label: "1D", interval: "5min", outputsize: 78 },
  { label: "1W", interval: "1h", outputsize: 40 },
  { label: "1M", interval: "1day", outputsize: 22 },
  { label: "3M", interval: "1day", outputsize: 66 },
  { label: "1Y", interval: "1day", outputsize: 252 },
  { label: "5Y", interval: "1day", outputsize: 1260 },
];

const INDICATOR_KEYS = [
  "sma20",
  "sma50",
  "sma200",
  "ema12",
  "ema26",
  "bbUpper",
  "bbMiddle",
  "bbLower",
];

function toChartTime(value) {
  if (value == null || value === "") return null;

  const datetime = String(value).trim();
  const dateOnly = datetime.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnly) {
    return {
      year: Number(dateOnly[1]),
      month: Number(dateOnly[2]),
      day: Number(dateOnly[3]),
    };
  }

  const timestamp = Date.parse(datetime.replace(" ", "T"));

  return Number.isFinite(timestamp)
    ? Math.floor(timestamp / 1000)
    : null;
}

function timeToNumber(time) {
  if (typeof time === "number") return time;

  if (
    time &&
    typeof time === "object" &&
    Number.isFinite(time.year) &&
    Number.isFinite(time.month) &&
    Number.isFinite(time.day)
  ) {
    return Date.UTC(time.year, time.month - 1, time.day) / 1000;
  }

  return 0;
}

function timeKey(time) {
  if (typeof time === "number") return String(time);

  if (time && typeof time === "object") {
    return `${time.year}-${time.month}-${time.day}`;
  }

  return String(time);
}

function emptyIndicators() {
  return {
    sma20: [],
    sma50: [],
    sma200: [],
    ema12: [],
    ema26: [],
    bbUpper: [],
    bbMiddle: [],
    bbLower: [],
    rsi14: [],
  };
}

function formatPrice(value) {
  return Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatVolume(value) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function PriceChart({ stock, livePrice }) {
  const priceContainer = useRef(null);
  const rsiContainer = useRef(null);
  const volumeContainer = useRef(null);

  const priceChartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const indicatorSeriesRef = useRef({});

  const rsiChartRef = useRef(null);
  const rsiSeriesRef = useRef(null);

  const volumeChartRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const shouldFitContentRef = useRef(true);

  const [timeframe, setTimeframe] = useState("1M");
  const [apiCandles, setApiCandles] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const selectedTimeframe =
    TIMEFRAMES.find((item) => item.label === timeframe) || TIMEFRAMES[2];

  // 1. Fetch historical OHLCV data from the existing API route.
  useEffect(() => {
    if (!stock?.symbol) {
      setApiCandles([]);
      setHistoryError("");
      setHistoryLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadHistory() {
      shouldFitContentRef.current = true;
      setHistoryLoading(true);
      setHistoryError("");
      setApiCandles([]);

      try {
        const params = new URLSearchParams({
          symbol: stock.symbol,
          interval: selectedTimeframe.interval,
          outputsize: String(selectedTimeframe.outputsize),
        });

        if (stock.exchange) {
          params.set("exchange", stock.exchange);
        }

        const response = await fetch(
          `/api/history?${params.toString()}`,
          { signal: controller.signal },
        );

        const result = await response.json();

        if (!response.ok || result?.error) {
          throw new Error(
            result?.error || "Historical data could not be loaded.",
          );
        }

        if (!Array.isArray(result?.candles)) {
          throw new Error(
            "Invalid history API response: expected a candles array.",
          );
        }

        const parsed = result.candles
          .map((item) => {
            const time = toChartTime(item.time ?? item.datetime);

            return {
              time,
              open: Number(item.open),
              high: Number(item.high),
              low: Number(item.low),
              close: Number(item.close),
              volume: Number(item.volume ?? 0),
            };
          })
          .filter((candle) => {
            const prices = [
              candle.open,
              candle.high,
              candle.low,
              candle.close,
            ];

            return (
              candle.time !== null &&
              prices.every(Number.isFinite) &&
              prices.every((price) => price > 0) &&
              Number.isFinite(candle.volume) &&
              candle.volume >= 0 &&
              candle.high >= Math.max(candle.open, candle.close) &&
              candle.low <= Math.min(candle.open, candle.close)
            );
          })
          .sort(
            (a, b) => timeToNumber(a.time) - timeToNumber(b.time),
          );

        // Remove duplicate timestamps before chart rendering.
        const uniqueCandles = [
          ...new Map(
            parsed.map((candle) => [timeKey(candle.time), candle]),
          ).values(),
        ];

        if (!uniqueCandles.length) {
          throw new Error(
            "No valid historical candles were returned for this symbol.",
          );
        }

        setApiCandles(uniqueCandles);
      } catch (error) {
        if (error.name !== "AbortError") {
          setHistoryError(
            error instanceof Error
              ? error.message
              : "Unable to load historical data.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setHistoryLoading(false);
        }
      }
    }

    loadHistory();

    return () => controller.abort();
  }, [
    stock?.symbol,
    stock?.exchange,
    selectedTimeframe.interval,
    selectedTimeframe.outputsize,
  ]);

  // 2. Apply the WebSocket quote to the last displayed candle.
  // This updates the last candle; it does not create a new time bucket.
  const chartCandles = useMemo(() => {
    if (!apiCandles.length) return [];

    const livePriceValue = Number(livePrice?.price);

    if (!Number.isFinite(livePriceValue) || livePriceValue <= 0) {
      return apiCandles;
    }

    const lastIndex = apiCandles.length - 1;
    const lastCandle = apiCandles[lastIndex];

    if (lastCandle.close === livePriceValue) {
      return apiCandles;
    }

    const updatedLastCandle = {
      ...lastCandle,
      close: livePriceValue,
      high: Math.max(lastCandle.high, livePriceValue),
      low: Math.min(lastCandle.low, livePriceValue),
    };

    return [
      ...apiCandles.slice(0, lastIndex),
      updatedLastCandle,
    ];
  }, [apiCandles, livePrice?.price]);

  // 3. Calculate SMA, EMA, Bollinger Bands and RSI.
  const indicators = useMemo(() => {
    if (!chartCandles.length) return emptyIndicators();

    const closes = chartCandles.map((candle) => candle.close);
    const times = chartCandles.map((candle) => candle.time);

    const toLineData = (values) =>
      values
        .map((value, index) => ({
          time: times[index],
          value:
            typeof value === "number" && Number.isFinite(value)
              ? value
              : null,
        }))
        .filter((point) => point.value !== null);

    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);

    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);

    const bands = calculateBollinger(closes, 20, 2);
    const rsi14 = calculateRSI(closes, 14);

    return {
      sma20: toLineData(sma20),
      sma50: toLineData(sma50),
      sma200: toLineData(sma200),
      ema12: toLineData(ema12),
      ema26: toLineData(ema26),
      bbUpper: toLineData(bands.map((item) => item.upper)),
      bbMiddle: toLineData(bands.map((item) => item.middle)),
      bbLower: toLineData(bands.map((item) => item.lower)),
      rsi14: toLineData(rsi14),
    };
  }, [chartCandles]);

  // 4. Calculate the horizontal Volume Profile.
  const volumeProfile = useMemo(() => {
    if (!chartCandles.length) return [];

    return calculateVolumeProfile(chartCandles, 12);
  }, [chartCandles]);

  // FIX: maxProfileVolume is defined before it is used in JSX.
  const maxProfileVolume = useMemo(
    () =>
      volumeProfile.reduce(
        (maximum, bucket) =>
          Math.max(maximum, Number(bucket.volume) || 0),
        0,
      ),
    [volumeProfile],
  );

  // 5. Create chart instances when the timeframe changes.
  useEffect(() => {
    if (
      !priceContainer.current ||
      !rsiContainer.current ||
      !volumeContainer.current
    ) {
      return;
    }

    shouldFitContentRef.current = true;

    const commonOptions = {
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.08)" },
        horzLines: { color: "rgba(148,163,184,0.08)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148,163,184,0.2)",
      },
      timeScale: {
        borderColor: "rgba(148,163,184,0.2)",
        timeVisible: timeframe === "1D" || timeframe === "1W",
        secondsVisible: false,
      },
    };

    const priceChart = createChart(priceContainer.current, {
      ...commonOptions,
      width: Math.max(1, priceContainer.current.clientWidth),
      height: 320,
    });

    priceChartRef.current = priceChart;

    candleSeriesRef.current = priceChart.addSeries(
      CandlestickSeries,
      {
        upColor: "#10b981",
        downColor: "#ef4444",
        borderUpColor: "#10b981",
        borderDownColor: "#ef4444",
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
      },
    );

    const addLine = (key, color, title, lineWidth = 2) => {
      indicatorSeriesRef.current[key] = priceChart.addSeries(
        LineSeries,
        {
          color,
          lineWidth,
          title,
          priceLineVisible: false,
          lastValueVisible: false,
        },
      );
    };

    addLine("sma20", "#f59e0b", "SMA 20");
    addLine("sma50", "#f97316", "SMA 50");
    addLine("sma200", "#dc8c45", "SMA 200");

    addLine("ema12", "#38bdf8", "EMA 12");
    addLine("ema26", "#2563eb", "EMA 26");

    addLine("bbUpper", "#a78bfa", "BB Upper");
    addLine("bbMiddle", "#c4b5fd", "BB Middle");
    addLine("bbLower", "#a78bfa", "BB Lower");

    const rsiChart = createChart(rsiContainer.current, {
      ...commonOptions,
      width: Math.max(1, rsiContainer.current.clientWidth),
      height: 130,
    });

    rsiChartRef.current = rsiChart;

    rsiSeriesRef.current = rsiChart.addSeries(LineSeries, {
      color: "#c084fc",
      lineWidth: 2,
      title: "RSI 14",
      priceLineVisible: false,
    });

    rsiSeriesRef.current.createPriceLine({
      price: 70,
      color: "#ef4444",
      lineStyle: LineStyle.Dashed,
      title: "Overbought 70",
    });

    rsiSeriesRef.current.createPriceLine({
      price: 30,
      color: "#10b981",
      lineStyle: LineStyle.Dashed,
      title: "Oversold 30",
    });

    const volumeChart = createChart(volumeContainer.current, {
      ...commonOptions,
      width: Math.max(1, volumeContainer.current.clientWidth),
      height: 100,
    });

    volumeChartRef.current = volumeChart;

    volumeSeriesRef.current = volumeChart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: "volume" },
        priceScaleId: "",
      },
    );

    const resizeObserver = new ResizeObserver(() => {
      if (priceContainer.current) {
        priceChart.applyOptions({
          width: Math.max(1, priceContainer.current.clientWidth),
        });
      }

      if (rsiContainer.current) {
        rsiChart.applyOptions({
          width: Math.max(1, rsiContainer.current.clientWidth),
        });
      }

      if (volumeContainer.current) {
        volumeChart.applyOptions({
          width: Math.max(1, volumeContainer.current.clientWidth),
        });
      }
    });

    resizeObserver.observe(priceContainer.current);
    resizeObserver.observe(rsiContainer.current);
    resizeObserver.observe(volumeContainer.current);

    return () => {
      resizeObserver.disconnect();

      priceChart.remove();
      rsiChart.remove();
      volumeChart.remove();

      priceChartRef.current = null;
      candleSeriesRef.current = null;
      indicatorSeriesRef.current = {};

      rsiChartRef.current = null;
      rsiSeriesRef.current = null;

      volumeChartRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [timeframe]);

  // 6. Update existing chart series when history or live prices change.
  // Do not recreate chart instances for every WebSocket message.
  useEffect(() => {
    const candleSeries = candleSeriesRef.current;

    if (!candleSeries) return;

    if (!chartCandles.length) {
      candleSeries.setData([]);

      for (const key of INDICATOR_KEYS) {
        indicatorSeriesRef.current[key]?.setData([]);
      }

      rsiSeriesRef.current?.setData([]);
      volumeSeriesRef.current?.setData([]);

      return;
    }

    candleSeries.setData(chartCandles);

    for (const key of INDICATOR_KEYS) {
      indicatorSeriesRef.current[key]?.setData(
        indicators[key] || [],
      );
    }

    rsiSeriesRef.current?.setData(indicators.rsi14 || []);

    volumeSeriesRef.current?.setData(
      chartCandles.map((candle) => ({
        time: candle.time,
        value: candle.volume,
        color:
          candle.close >= candle.open
            ? "rgba(16,185,129,0.65)"
            : "rgba(239,68,68,0.65)",
      })),
    );

    if (shouldFitContentRef.current) {
      priceChartRef.current?.timeScale().fitContent();
      rsiChartRef.current?.timeScale().fitContent();
      volumeChartRef.current?.timeScale().fitContent();

      shouldFitContentRef.current = false;
    }
  }, [chartCandles, indicators]);

  return (
    <div className="chart-wrap">
      <div className="chart-toolbar">
        <div
          className="chart-timeframes"
          aria-label="Historical chart timeframe"
        >
          {TIMEFRAMES.map((item) => (
            <button
              key={item.label}
              type="button"
              className={timeframe === item.label ? "active" : ""}
              aria-pressed={timeframe === item.label}
              onClick={() => setTimeframe(item.label)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span className="chart-status" aria-live="polite">
          {historyLoading
            ? "Loading historical data…"
            : chartCandles.length
              ? `${chartCandles.length} candles · ${stock?.symbol}`
              : "No chart data"}
        </span>
      </div>

      {historyError && (
        <p className="chart-message chart-error" role="alert">
          Historical data unavailable: {historyError}
        </p>
      )}

      {!historyLoading && !chartCandles.length && (
        <p className="chart-message">
          No historical candles are available for this symbol and timeframe.
        </p>
      )}

      <div className="chart-price-layout">
        <div
          ref={priceContainer}
          className="chart-canvas"
          aria-label="Historical candlestick chart with overlays"
        />

        {chartCandles.length > 0 && (
          <aside
            className="volume-profile-panel"
            aria-label="Volume Profile by price level"
          >
            <strong>Volume Profile</strong>
            <span className="volume-profile-caption">
              Volume by price
            </span>

            <div className="volume-profile-rows">
              {[...volumeProfile]
                .sort((a, b) => b.price - a.price)
                .map((bucket, index) => {
                  const volume = Number(bucket.volume) || 0;
                  const width =
                    maxProfileVolume > 0
                      ? (volume / maxProfileVolume) * 100
                      : 0;

                  return (
                    <div
                      className="volume-profile-row"
                      key={`${bucket.price}-${index}`}
                      title={`Price ${formatPrice(bucket.price)} · Volume ${formatVolume(volume)}`}
                    >
                      <span className="volume-profile-price">
                        {formatPrice(bucket.price)}
                      </span>

                      <span className="volume-profile-track">
                        <span
                          className="volume-profile-bar"
                          style={{ width: `${width}%` }}
                        />
                      </span>
                    </div>
                  );
                })}
            </div>
          </aside>
        )}
      </div>

      <div className="chart-indicator-labels">
        <span className="legend-sma">SMA 20 / 50 / 200</span>
        <span className="legend-ema">EMA 12 / 26</span>
        <span className="legend-bollinger">
          Bollinger Bands (20, 2)
        </span>
      </div>

      <div className="chart-subtitle">
        RSI (14) · overbought 70 / oversold 30
      </div>
      <div
        ref={rsiContainer}
        className="chart-canvas chart-rsi"
      />

      <div className="chart-subtitle">Trading Volume</div>
      <div
        ref={volumeContainer}
        className="chart-canvas chart-volume"
      />

      <p className="chart-caption">
        Historical OHLCV is fetched through the server-side history
        endpoint. Availability depends on the selected exchange and
        your Twelve Data plan. Indicator values require enough
        historical candles for their configured periods. WebSocket
        prices in simulation mode are simulated, not exchange-live
        prices.
      </p>
    </div>
  );
}
