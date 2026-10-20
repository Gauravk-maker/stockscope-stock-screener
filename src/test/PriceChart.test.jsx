
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import PriceChart from "../components/PriceChart.jsx";

const mocks = vi.hoisted(() => ({
  createChart: vi.fn(),
  chartInstances: [],
  calculateSMA: vi.fn(() => []),
  calculateEMA: vi.fn(() => []),
  calculateBollinger: vi.fn(() => []),
  calculateRSI: vi.fn(() => []),
  calculateVolumeProfile: vi.fn(() => []),
}));

vi.mock("lightweight-charts", () => ({
  createChart: (...args) => mocks.createChart(...args),
  CandlestickSeries: "CandlestickSeries",
  LineSeries: "LineSeries",
  HistogramSeries: "HistogramSeries",
  LineStyle: { Dashed: 2 },
}));

vi.mock("../utils/indicators.js", () => ({
  calculateSMA: (...args) => mocks.calculateSMA(...args),
  calculateEMA: (...args) => mocks.calculateEMA(...args),
  calculateBollinger: (...args) => mocks.calculateBollinger(...args),
  calculateRSI: (...args) => mocks.calculateRSI(...args),
  calculateVolumeProfile: (...args) => mocks.calculateVolumeProfile(...args),
}));

function makeChartMock() {
  const series = {
    setData: vi.fn(),
    createPriceLine: vi.fn(),
  };

  const chart = {
    addSeries: vi.fn(() => series),
    applyOptions: vi.fn(),
    remove: vi.fn(),
    timeScale: vi.fn(() => ({ fitContent: vi.fn() })),
    series,
  };

  mocks.chartInstances.push(chart);
  return chart;
}

function mockHistory(candles = []) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ candles }),
  });
}

const validCandles = [
  {
    time: "2026-10-01",
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 1200,
  },
  {
    time: "2026-10-02",
    open: 105,
    high: 115,
    low: 100,
    close: 110,
    volume: 1500,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.chartInstances = [];

  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };

  mocks.createChart.mockImplementation(() => makeChartMock());

  mockHistory(validCandles);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PriceChart", () => {
  it("renders timeframe buttons, chart labels and caption", () => {
    render(<PriceChart stock={{ symbol: "AAPL", exchange: "NASDAQ" }} />);

    expect(screen.getByRole("button", { name: "1D" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "1W" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "1M" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "3M" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "1Y" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "5Y" })).toBeTruthy();

    expect(screen.getByText("Trading Volume")).toBeTruthy();
    expect(screen.getByText("Bollinger Bands (20, 2)")).toBeTruthy();
    expect(screen.getByText(/Historical OHLCV is fetched/)).toBeTruthy();
  });

  it("loads historical candles and sends the selected symbol and timeframe", async () => {
    render(<PriceChart stock={{ symbol: "AAPL", exchange: "NASDAQ" }} />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
      expect(screen.getByText(/2 candles/)).toBeTruthy();
    });

    const url = globalThis.fetch.mock.calls[0][0];
    expect(url).toContain("/api/history?");
    expect(url).toContain("symbol=AAPL");
    expect(url).toContain("exchange=NASDAQ");
    expect(url).toContain("interval=1day");
    expect(url).toContain("outputsize=22");
  });

  it("changes timeframe and requests the corresponding history", async () => {
    render(<PriceChart stock={{ symbol: "MSFT" }} />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "1D" }));

    await waitFor(() => {
      expect(globalThis.fetch.mock.calls.length).toBeGreaterThan(1);
    });

    const urls = globalThis.fetch.mock.calls.map(([url]) => url);
    expect(urls.some((url) => url.includes("interval=5min"))).toBe(true);
    expect(urls.some((url) => url.includes("outputsize=78"))).toBe(true);
  });

  it("shows the empty state when no stock symbol is provided", () => {
    render(<PriceChart stock={null} />);

    expect(screen.getByText("No chart data")).toBeTruthy();
    expect(
      screen.getByText(/No historical candles are available/)
    ).toBeTruthy();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("shows an API error when the history request fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "History service unavailable" }),
    });

    render(<PriceChart stock={{ symbol: "AAPL" }} />);

    expect(
      await screen.findByRole("alert")
    ).toBeTruthy();

    expect(
      screen.getByText(/History service unavailable/)
    ).toBeTruthy();
  });

  it("shows an error when the API response has no candles array", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    render(<PriceChart stock={{ symbol: "AAPL" }} />);

    expect(
      await screen.findByRole("alert")
    ).toBeTruthy();

    expect(
      screen.getByText(/expected a candles array/i)
    ).toBeTruthy();
  });

  it("shows an error when all returned candles are invalid", async () => {
    mockHistory([
      {
        time: "not-a-date",
        open: -1,
        high: 0,
        low: -5,
        close: -2,
        volume: -10,
      },
    ]);

    render(<PriceChart stock={{ symbol: "AAPL" }} />);

    expect(
      await screen.findByRole("alert")
    ).toBeTruthy();

    expect(
      screen.getByText(/No valid historical candles/)
    ).toBeTruthy();
  });

  it("creates and cleans up the chart instances", async () => {
    const { unmount } = render(
      <PriceChart stock={{ symbol: "AAPL" }} />
    );

    await waitFor(() => {
      expect(mocks.createChart).toHaveBeenCalledTimes(3);
    });

    unmount();

    expect(mocks.chartInstances.every((chart) => chart.remove.mock.calls.length === 1)).toBe(true);
  });
});
