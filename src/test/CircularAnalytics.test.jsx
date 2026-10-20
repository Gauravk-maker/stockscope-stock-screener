import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import CircularAnalytics from "../components/CircularAnalytics.jsx";
import { calculateRSI } from "../utils/indicators.js";

vi.mock("recharts", () => ({
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  RadialBarChart: ({ children }) => <div>{children}</div>,
  RadialBar: () => null,
  PolarAngleAxis: () => null,
}));

vi.mock("../utils/indicators.js", () => ({
  calculateRSI: vi.fn(() => [50]),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CircularAnalytics", () => {
  it("renders the analytics heading and disclaimer", () => {
    render(<CircularAnalytics stocks={[]} />);

    expect(
      screen.getByRole("heading", { name: "Circular analytics" }),
    ).toBeTruthy();

    expect(screen.getByText("MARKET INSIGHTS")).toBeTruthy();

    expect(
      screen.getByText(/Synthetic demo records are illustrative/),
    ).toBeTruthy();
  });

  it("counts Indian and US stocks by market or exchange", () => {
    const stocks = [
      { symbol: "RELIANCE", market: "IN", change: 1 },
      { symbol: "TCS", exchange: "NSE", change: -1 },
      { symbol: "AAPL", market: "US", change: 2 },
      { symbol: "MSFT", exchange: "NASDAQ", change: 0 },
      { symbol: "UNKNOWN", market: "OTHER", change: 1 },
    ];

    render(<CircularAnalytics stocks={stocks} />);

    expect(screen.getByText("India")).toBeTruthy();
    expect(screen.getByText("United States")).toBeTruthy();

    const marketCard = screen
      .getByRole("heading", { name: "Market distribution" })
      .closest("section");

    expect(
      marketCard.querySelectorAll(".circular-legend-item")[0].textContent,
    ).toContain("India2");

    expect(
      marketCard.querySelectorAll(".circular-legend-item")[1].textContent,
    ).toContain("United States2");
  });

  it("shows the empty state when there are no market distribution records", () => {
    render(<CircularAnalytics stocks={[]} />);

    expect(
      screen.getAllByText("No data available for this chart.").length,
    ).toBe(2);
  });

  it("counts advancing, declining and unchanged stocks", () => {
    const stocks = [
      { symbol: "A", change: 2.5 },
      { symbol: "B", change: -1.2 },
      { symbol: "C", change: 0 },
      { symbol: "D", change: "invalid" },
    ];

    render(<CircularAnalytics stocks={stocks} />);

    expect(screen.getByText("Advancing")).toBeTruthy();
    expect(screen.getByText("Declining")).toBeTruthy();
    expect(screen.getByText("Unchanged")).toBeTruthy();

    const breadthCard = screen
      .getByRole("heading", { name: "Market breadth" })
      .closest("section");

    const breadthItems = breadthCard.querySelectorAll(".circular-legend-item");

    expect(breadthItems[0].textContent).toContain("Advancing1");
    expect(breadthItems[1].textContent).toContain("Declining1");
    expect(breadthItems[2].textContent).toContain("Unchanged2");
  });

  it("handles a non-array stocks prop safely", () => {
    render(<CircularAnalytics stocks={null} />);

    expect(
      screen.getByRole("heading", { name: "Circular analytics" }),
    ).toBeTruthy();

    expect(
      screen.getAllByText("No data available for this chart.").length,
    ).toBe(2);
  });

  it("shows the unavailable message when price history is insufficient", () => {
    render(
      <CircularAnalytics stock={{ symbol: "AAPL", price: 150 }} stocks={[]} />,
    );

    expect(
      screen.getByText("Not enough valid price history to calculate RSI."),
    ).toBeTruthy();

    expect(screen.getByText("AAPL · 14 periods")).toBeTruthy();
    expect(calculateRSI).not.toHaveBeenCalled();
  });

  it("displays an overbought RSI value", () => {
    calculateRSI.mockReturnValue([75]);

    render(
      <CircularAnalytics
        stock={{
          symbol: "AAPL",
          price: 150,
          history: [140, 145, 150],
        }}
        stocks={[]}
      />,
    );

    expect(screen.getByText("75.0")).toBeTruthy();
    expect(screen.getByText("Overbought")).toBeTruthy();
    expect(calculateRSI).toHaveBeenCalled();
  });

  it("displays an oversold RSI value", () => {
    calculateRSI.mockReturnValue([25]);

    render(
      <CircularAnalytics
        stock={{
          symbol: "TSLA",
          history: [110, 105, 100],
        }}
        stocks={[]}
      />,
    );

    expect(screen.getByText("25.0")).toBeTruthy();
    expect(screen.getByText("Oversold")).toBeTruthy();
  });

  it("displays a neutral RSI value", () => {
    calculateRSI.mockReturnValue([50]);

    render(
      <CircularAnalytics
        stock={{
          symbol: "MSFT",
          history: [100, 102, 101],
        }}
        stocks={[]}
      />,
    );

    expect(screen.getByText("50.0")).toBeTruthy();
    expect(screen.getByText("Neutral zone")).toBeTruthy();
  });

  it("handles an invalid RSI result", () => {
    calculateRSI.mockReturnValue([Number.NaN]);

    render(
      <CircularAnalytics
        stock={{
          symbol: "AAPL",
          history: [100, 105, 110],
        }}
        stocks={[]}
      />,
    );

    expect(
      screen.getByText("Not enough valid price history to calculate RSI."),
    ).toBeTruthy();
  });
});
