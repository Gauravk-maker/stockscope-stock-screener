"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";

function normalizeTime(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    // Lightweight Charts expects Unix seconds, not milliseconds.
    return value > 1e12 ? Math.floor(value / 1000) : value;
  }

  if (typeof value === "string") {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (dateOnly) {
      return {
        year: Number(dateOnly[1]),
        month: Number(dateOnly[2]),
        day: Number(dateOnly[3]),
      };
    }

    const milliseconds = Date.parse(value);

    if (Number.isFinite(milliseconds)) {
      return Math.floor(milliseconds / 1000);
    }
  }

  return null;
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

  return NaN;
}

function normalizeCandle(candle) {
  const time = normalizeTime(candle.time ?? candle.datetime);
  const open = Number(candle.open);
  const high = Number(candle.high);
  const low = Number(candle.low);
  const close = Number(candle.close);

  if (
    time == null ||
    !Number.isFinite(timeToNumber(time)) ||
    ![open, high, low, close].every(
      (value) => Number.isFinite(value) && value > 0,
    ) ||
    high < Math.max(open, close, low) ||
    low > Math.min(open, close, high)
  ) {
    return null;
  }

  return { time, open, high, low, close };
}

export default function CandlestickChart({
  data = [],
  livePrice,
  symbol,
  exchange,
  interval = "1day",
  timeframeSeconds = 60,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const lastCandleRef = useRef(null);
  const bucketRef = useRef(null);
  const liveLineRef = useRef(null);
  const lastLivePriceRef = useRef(null);
  const dataKeyRef = useRef("");
  const [chartReady, setChartReady] = useState(false);
  const [hasCandles, setHasCandles] = useState(false);
  const [historyCandles, setHistoryCandles] = useState([]);
  const [historySource, setHistorySource] = useState("");
  const [historyWarning, setHistoryWarning] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!symbol) {
      setHistoryCandles([]);
      return;
    }

    const controller = new AbortController();

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryWarning("");
      setHistorySource("");

      try {
        const params = new URLSearchParams({
          symbol,
          interval,
          outputsize: "100",
        });

        if (exchange) {
          params.set("exchange", exchange);
        }

        const response = await fetch(`/api/history?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.reason || result.error || "History unavailable",
          );
        }

        setHistoryCandles(Array.isArray(result.candles) ? result.candles : []);
        setHistorySource(result.source || "");
        setHistoryWarning(result.warning || "");
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Candlestick history fetch failed:", error);
          setHistoryCandles([]);
          setHistoryWarning("Historical data is currently unavailable.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setHistoryLoading(false);
        }
      }
    }

    loadHistory();

    return () => controller.abort();
  }, [symbol, exchange, interval]);

  const candlesToDisplay = historyCandles.length > 0 ? historyCandles : data;
  // Create chart once and keep it responsive.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: Math.max(container.clientWidth, 320),
      height: Math.max(container.clientHeight, 360),

      layout: {
        background: {
          type: ColorType.Solid,
          color: "#071225",
        },
        textColor: "#9fb0ca",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 12,
      },

      grid: {
        vertLines: { color: "#17263d" },
        horzLines: { color: "#17263d" },
      },

      rightPriceScale: {
        visible: true,
        borderColor: "#263650",
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.15,
        },
      },

      timeScale: {
        visible: true,
        borderColor: "#263650",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
        minBarSpacing: 3,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: true,
      },

      crosshair: {
        mode: 0,
        vertLine: {
          color: "#7c8da8",
          width: 1,
          style: 3,
          labelBackgroundColor: "#334155",
        },
        horzLine: {
          color: "#7c8da8",
          width: 1,
          style: 3,
          labelBackgroundColor: "#334155",
        },
      },

      handleScroll: true,
      handleScale: true,
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#10d6a0",
      downColor: "#f05270",
      borderUpColor: "#10d6a0",
      borderDownColor: "#f05270",
      wickUpColor: "#10d6a0",
      wickDownColor: "#f05270",
      priceLineVisible: false,
      lastValueVisible: true,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    const liveLine = chart.addSeries(LineSeries, {
      color: "#38bdf8",
      lineWidth: 1,
      lineStyle: 2,
      lastValueVisible: true,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
      title: "Live",
    });

    chartRef.current = chart;
    seriesRef.current = candles;
    liveLineRef.current = liveLine;
    setChartReady(true);

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !chartRef.current) return;

      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
        height: Math.max(containerRef.current.clientHeight, 320),
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();

      chartRef.current = null;
      seriesRef.current = null;
      liveLineRef.current = null;
      lastCandleRef.current = null;
      bucketRef.current = null;
      dataKeyRef.current = "";
      setChartReady(false);
    };
  }, []);

  // Load and validate historical candles.
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;

    if (!series || !chart) return;

    const normalized = (Array.isArray(candlesToDisplay) ? candlesToDisplay : [])
      .map(normalizeCandle)
      .filter(Boolean)
      .sort((a, b) => timeToNumber(a.time) - timeToNumber(b.time));

    // Keep the last candle when timestamps are duplicated.
    const byTime = new Map();

    for (const candle of normalized) {
      byTime.set(timeToNumber(candle.time), candle);
    }

    const unique = Array.from(byTime.values());

    if (!unique.length) {
      series.setData([]);
      liveLineRef.current?.setData([]);
      lastCandleRef.current = null;
      bucketRef.current = null;
      dataKeyRef.current = "";
      setHasCandles(false);
      return;
    }

    const key = unique
      .map(
        (c) =>
          `${timeToNumber(c.time)}:${c.open}:${c.high}:${c.low}:${c.close}`,
      )
      .join("|");

    // Avoid resetting the chart if identical data is supplied again.
    if (key === dataKeyRef.current) return;

    dataKeyRef.current = key;
    series.setData(unique);

    lastCandleRef.current = { ...unique[unique.length - 1] };
    bucketRef.current = null;
    lastLivePriceRef.current = null;

    liveLineRef.current?.setData([]);
    chart.timeScale().fitContent();
    setHasCandles(true);
  }, [candlesToDisplay, chartReady]);

  // Apply live prices without replacing the historical candle's timestamp.
  useEffect(() => {
    const series = seriesRef.current;
    const liveLine = liveLineRef.current;
    const price = Number(livePrice);

    if (
      !series ||
      !liveLine ||
      livePrice == null ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return;
    }

    const interval = Math.max(1, Number(timeframeSeconds) || 60);
    const now = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(now / interval) * interval;
    const previous = lastCandleRef.current;

    // A new candle must be later than the last historical candle.
    const previousTime = previous ? timeToNumber(previous.time) : -Infinity;
    const candleTime = Math.max(bucket, previousTime + 1);

    let next;

    if (previous && bucketRef.current === bucket) {
      next = {
        ...previous,
        high: Math.max(previous.high, price),
        low: Math.min(previous.low, price),
        close: price,
      };
    } else {
      next = {
        time: candleTime,
        open: previous ? previous.close : price,
        high: Math.max(previous ? previous.close : price, price),
        low: Math.min(previous ? previous.close : price, price),
        close: price,
      };
    }

    // Do not send a duplicate or older timestamp to Lightweight Charts.
    const nextTime = timeToNumber(next.time);
    if (!Number.isFinite(nextTime) || nextTime <= previousTime) {
      // The current bucket can update an existing candle only.
      if (
        previous &&
        bucketRef.current === bucket &&
        nextTime === previousTime
      ) {
        series.update(next);
        lastCandleRef.current = next;
      } else {
        return;
      }
    } else {
      series.update(next);
      lastCandleRef.current = next;
    }

    bucketRef.current = bucket;
    lastLivePriceRef.current = price;

    // Separate live price line; it does not change the candle's OHLC.
    liveLine.setData([{ time: next.time, value: price }]);
  }, [livePrice, timeframeSeconds, chartReady]);

  return (
    <section className="candle-panel">
      <div className="candle-panel-header">
        <div>
          <h2>Candlestick Chart</h2>
          <p>OHLC price movement</p>
        </div>

        <span className="candle-live-label">
          <i
            className={
              livePrice != null
                ? "candle-status-dot connected"
                : "candle-status-dot"
            }
          />
          {livePrice != null ? "Live feed" : "Waiting for price"}
        </span>
      </div>
      {historyLoading && (
        <p className="candle-disclaimer">Loading historical candles...</p>
      )}

      {historyWarning && <p className="candle-disclaimer">{historyWarning}</p>}

      {historySource === "Demo Data (Simulated)" && (
        <p className="candle-disclaimer">
          Demo mode: these candles are simulated, not real market prices.
        </p>
      )}
      <div className="candle-chart-area" ref={containerRef}>
        {!hasCandles && (
          <div className="candle-empty-state">
            <strong>No historical candles available</strong>
            <p>
              Historical price data could not be displayed for this selection.
            </p>
            <p>
              Your current market-data provider may restrict this symbol or
              timeframe. Try another supported stock or timeframe.
            </p>

            {livePrice != null &&
              Number.isFinite(Number(livePrice)) &&
              Number(livePrice) > 0 && (
                <div className="candle-empty-live-price">
                  Latest supplied price:{" "}
                  <strong>
                    {Number(livePrice).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>
              )}
          </div>
        )}
      </div>

      <div className="candle-legend">
        <span>
          <i className="candle-green" /> Bullish
        </span>
        <span>
          <i className="candle-red" /> Bearish
        </span>
        <span>
          <i className="candle-live-line" /> Live price
        </span>
      </div>

      <p className="candle-disclaimer">
        Historical candles and the live price feed are displayed separately.
        Prices depend on the configured data provider.
      </p>
    </section>
  );
}
