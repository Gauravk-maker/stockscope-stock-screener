import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import CandlestickChart from "../components/CandlestickChart";

const mocks = vi.hoisted(() => ({
  createChart: vi.fn(),
  addSeries: vi.fn(),
  setData: vi.fn(),
  update: vi.fn(),
  applyOptions: vi.fn(),
  remove: vi.fn(),
  fitContent: vi.fn(),
  disconnect: vi.fn(),
  observe: vi.fn(),
  chartInstances: [],
}));

vi.mock("lightweight-charts", () => ({
  createChart: mocks.createChart,
  ColorType: { Solid: "solid" },
  CandlestickSeries: { type: "Candlestick" },
  LineSeries: { type: "Line" },
}));

function makeChartMock() {
  const series = {
    setData: mocks.setData,
    update: mocks.update,
  };

  const chart = {
    addSeries: mocks.addSeries,
    applyOptions: mocks.applyOptions,
    remove: mocks.remove,
    timeScale: () => ({ fitContent: mocks.fitContent }),
  };

  mocks.addSeries.mockReturnValue(series);
  mocks.chartInstances.push(chart);

  return chart;
}

describe("CandlestickChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.chartInstances.length = 0;

    mocks.createChart.mockImplementation(() => makeChartMock());

    globalThis.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
      }

      observe(...args) {
        mocks.observe(...args);
      }

      disconnect(...args) {
        mocks.disconnect(...args);
      }
    };
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const candles = [
    {
      time: 1700000000,
      open: 100,
      high: 110,
      low: 95,
      close: 105,
    },
    {
      time: 1700000060,
      open: 105,
      high: 115,
      low: 100,
      close: 112,
    },
  ];

  it("renders chart heading, legend and waiting message", () => {
    render(<CandlestickChart />);

    expect(screen.getByText("Candlestick Chart")).toBeTruthy();
    expect(screen.getByText("OHLC price movement")).toBeTruthy();
    expect(screen.getByText("Bullish")).toBeTruthy();
    expect(screen.getByText("Bearish")).toBeTruthy();
    expect(
      screen.getByText("No historical candles available"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Historical price data could not be displayed/),
    ).toBeInTheDocument();
  });

  it("creates a chart and adds candlestick and live-price series", () => {
    render(<CandlestickChart />);

    expect(mocks.createChart).toHaveBeenCalledTimes(1);
    expect(mocks.addSeries).toHaveBeenCalledTimes(2);
    expect(mocks.observe).toHaveBeenCalledTimes(1);
  });

  it("loads historical candles and fits chart content", async () => {
    render(<CandlestickChart data={candles} />);

    await waitFor(() => {
      expect(mocks.setData).toHaveBeenCalled();
    });

    expect(mocks.setData).toHaveBeenCalledWith(candles);
    expect(mocks.fitContent).toHaveBeenCalledTimes(1);
  });

  it("sorts historical candles by time", async () => {
    render(<CandlestickChart data={[candles[1], candles[0]]} />);

    await waitFor(() => {
      expect(mocks.setData).toHaveBeenCalled();
    });

    const result = mocks.setData.mock.calls[0][0];

    expect(result[0].time).toBe(candles[0].time);
    expect(result[1].time).toBe(candles[1].time);
  });

  it("removes duplicate candle timestamps", async () => {
    render(<CandlestickChart data={[candles[0], candles[0], candles[1]]} />);

    await waitFor(() => {
      expect(mocks.setData).toHaveBeenCalled();
    });

    expect(mocks.setData.mock.calls[0][0]).toHaveLength(2);
  });

  it("normalizes date-only string timestamps", async () => {
    const data = [
      {
        time: "2026-01-01",
        open: "100",
        high: "110",
        low: "90",
        close: "105",
      },
    ];

    render(<CandlestickChart data={data} />);

    await waitFor(() => {
      expect(mocks.setData).toHaveBeenCalled();
    });

    expect(mocks.setData.mock.calls[0][0][0]).toMatchObject({
      time: { year: 2026, month: 1, day: 1 },
      open: 100,
      high: 110,
      low: 90,
      close: 105,
    });
  });

  it("ignores candles with invalid numeric prices", async () => {
    const data = [{ ...candles[0], open: "invalid" }, candles[1]];

    render(<CandlestickChart data={data} />);

    await waitFor(() => {
      expect(mocks.setData).toHaveBeenCalled();
    });

    const result = mocks.setData.mock.calls[0][0];

    expect(result).toHaveLength(1);
    expect(result[0].time).toBe(candles[1].time);
  });

  it("updates the active candle when a live price arrives", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1700000100000);

    render(
      <CandlestickChart data={candles} livePrice={120} timeframeSeconds={60} />,
    );

    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalled();
    });

    const updated = mocks.update.mock.calls.at(-1)[0];

    expect(updated.close).toBe(120);
    expect(updated.high).toBe(120);
    expect(updated.low).toBe(112);

    nowSpy.mockRestore();
  });

  it("does not update the series for an invalid live price", () => {
    render(<CandlestickChart livePrice={-1} />);

    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("shows the live feed label when a live price is available", () => {
    render(<CandlestickChart livePrice={100} />);

    expect(screen.getByText(/Live feed/)).toBeTruthy();

    expect(
      screen.getByText(
        /Historical candles and the live price feed are displayed separately/,
      ),
    ).toBeTruthy();
  });

  it("cleans up the chart and resize observer on unmount", () => {
    const { unmount } = render(<CandlestickChart />);

    unmount();

    expect(mocks.disconnect).toHaveBeenCalledTimes(1);
    expect(mocks.remove).toHaveBeenCalledTimes(1);
  });
});
