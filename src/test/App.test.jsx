
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import App from "../App.jsx";

const mocks = vi.hoisted(() => ({
  toggle: vi.fn(),
  useWatchlist: vi.fn(),
  fetchQuote: vi.fn(),
}));

vi.mock("../hooks/useWatchlist.js", () => ({
  useWatchlist: mocks.useWatchlist,
}));

vi.mock("../services/stockApi.js", () => ({
  fetchQuote: mocks.fetchQuote,
}));

vi.mock("../components/StockTable.jsx", () => ({
  default: ({ stocks = [], onSelect }) => (
    <div data-testid="stock-table">
      <span>{stocks.length} stocks</span>
      {stocks.slice(0, 3).map((stock) => (
        <button
          key={`${stock.market}-${stock.symbol}`}
          onClick={() => onSelect?.(stock)}
        >
          Select {stock.symbol}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../components/PriceChart.jsx", () => ({
  default: ({ stock }) => (
    <div data-testid="price-chart">{stock?.symbol ?? "No stock"}</div>
  ),
}));

vi.mock("../components/StockDetails.jsx", () => ({
  default: ({ stock, onClose }) =>
    stock ? (
      <div data-testid="stock-details">
        {stock.symbol}
        <button onClick={onClose}>Close details</button>
      </div>
    ) : null,
}));

describe("App.jsx dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useWatchlist.mockReturnValue({
      watchlist: [],
      toggle: mocks.toggle,
    });

    mocks.fetchQuote.mockResolvedValue({
      symbol: "TEST",
      market: "US",
      company: "Test Company",
      exchange: "NASDAQ",
      currency: "USD",
      price: 100,
      change: 1,
      volume: 1000,
      sector: "Technology",
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the dashboard and stock table", () => {
    render(<App />);

    expect(screen.getByText(/MARKET INTELLIGENCE/i)).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /market overview/i }),
    ).toBeTruthy();
    expect(screen.getByTestId("stock-table")).toBeTruthy();
  });

  it("switches to the screener view", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: /stock screener/i }),
    );

    expect(
      screen.getByRole("heading", { name: /stock screener/i }),
    ).toBeTruthy();
  });

  it("filters stocks through the global search", () => {
    render(<App />);

    const search = screen.getByRole("textbox", {
      name: /search all stocks/i,
    });

    fireEvent.change(search, { target: { value: "AAPL" } });

    expect(search.value).toBe("AAPL");
    expect(
      screen.getByRole("heading", { name: /stock screener/i }),
    ).toBeTruthy();
  });

  it("opens settings and changes the dashboard theme", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^settings$/i }));

    expect(
      screen.getByRole("heading", { name: /workspace settings/i }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /teal/i }));

    expect(document.querySelector(".app-shell").className).toContain(
      "theme-teal",
    );
  });

  it("opens and closes stock details", () => {
    render(<App />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /^select /i })[0],
    );

    expect(screen.getByTestId("stock-details")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /close details/i }));

    expect(screen.queryByTestId("stock-details")).toBeNull();
  });

  it("opens and resets the filters", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^filters/i }));

    expect(screen.getByText("Reset all filters")).toBeTruthy();

    fireEvent.click(screen.getByText("Reset all filters"));

    expect(screen.getByLabelText("Performance").value).toBe("all");
  });

  it("switches to the watchlist view", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /watchlist/i }));

    expect(
      screen.getByRole("heading", { name: /your watchlist/i }),
    ).toBeTruthy();
  });
});
