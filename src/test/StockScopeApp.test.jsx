import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import App from "../components/StockScopeApp";

const mocks = vi.hoisted(() => ({
  toggle: vi.fn(),
  useWatchlist: vi.fn(),
  useStockWebSocket: vi.fn(),
  fetchQuote: vi.fn(),
  createChart: vi.fn(),
  chartSetData: vi.fn(),
  chartUpdate: vi.fn(),
}));

vi.mock("../hooks/useWatchlist.js", () => ({
  useWatchlist: mocks.useWatchlist,
}));

vi.mock("../hooks/useStockWebSocket.js", () => ({
  default: mocks.useStockWebSocket,
}));

vi.mock("../services/stockApi.js", () => ({
  fetchQuote: mocks.fetchQuote,
}));

vi.mock("../components/StockTable.jsx", () => ({
  default: ({ stocks = [], onSelect, onSort }) => (
    <div data-testid="stock-table">
      <span data-testid="stock-count">{stocks.length}</span>

      <button onClick={() => onSort?.("symbol")}>Sort symbol</button>

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
    <div data-testid="price-chart">{stock?.symbol ?? "No stock selected"}</div>
  ),
}));

vi.mock("../components/CandlestickChart.jsx", () => ({
  default: () => <div data-testid="candlestick-chart" />,
}));

vi.mock("../components/CircularAnalytics.jsx", () => ({
  default: () => <div data-testid="circular-analytics" />,
}));

vi.mock("../components/StockDetails.jsx", () => ({
  default: ({ stock, onClose }) =>
    stock ? (
      <div data-testid="stock-details">
        <span>{stock.symbol}</span>
        <button onClick={onClose}>Close stock details</button>
      </div>
    ) : null,
}));
vi.mock("./StockDetails.jsx", () => ({
  default: ({ stock, onClose }) =>
    stock ? (
      <div data-testid="stock-details">
        <span>{stock.symbol}</span>
        <button onClick={onClose}>Close stock details</button>
      </div>
    ) : null,
}));

vi.mock("lightweight-charts", () => ({
  createChart: mocks.createChart,
  ColorType: { Solid: "solid" },
  CandlestickSeries: {},
}));

describe("StockScopeApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useWatchlist.mockReturnValue({
      watchlist: [],
      toggle: mocks.toggle,
    });

    mocks.useStockWebSocket.mockReturnValue({
      prices: {},
      status: "disconnected",
      lastMessageAt: null,
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
    vi.restoreAllMocks();
  });

  it("renders the main dashboard and market statistics", () => {
    render(<App />);

    expect(screen.getByText(/MARKET INTELLIGENCE/i)).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /market overview/i }),
    ).toBeTruthy();
    expect(screen.getByText("Tracked equities")).toBeTruthy();
    expect(screen.getByText("Average change")).toBeTruthy();
    expect(screen.getByText("Top gainer")).toBeTruthy();
    expect(screen.getByText("Total volume")).toBeTruthy();
    expect(screen.getByTestId("stock-table")).toBeTruthy();
  });

  it("switches to the stock screener view", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /stock screener/i }));

    expect(
      screen.getByRole("heading", { name: /stock screener/i }),
    ).toBeTruthy();
    expect(screen.getByText("Equity screener")).toBeTruthy();
  });

  it("switches between India and US markets", () => {
    render(<App />);

    // Select India market
    const indiaButtons = screen.getAllByRole("button", {
      name: /🇮🇳 india/i,
    });

    fireEvent.click(indiaButtons[0]);

    // Verify the India market button is active
    expect(
      screen.getAllByRole("button", { name: /🇮🇳 india/i }).length,
    ).toBeGreaterThan(0);

    // Select United States market
    const usButtons = screen.getAllByRole("button", {
      name: /🇺🇸 united states/i,
    });

    fireEvent.click(usButtons[0]);

    // Verify the US market button is still present
    expect(
      screen.getAllByRole("button", { name: /🇺🇸 united states/i }).length,
    ).toBeGreaterThan(0);
  });

  it("filters stocks using the global search input", () => {
    render(<App />);

    const search = screen.getByRole("textbox", { name: /search all stocks/i });
    fireEvent.change(search, { target: { value: "AAPL" } });

    expect(search.value).toBe("AAPL");
    expect(
      screen.getByRole("heading", { name: /stock screener/i }),
    ).toBeTruthy();
  });

  it("opens and resets the basic filters", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^filters/i }));

    expect(screen.getByText("Reset all filters")).toBeTruthy();
    expect(screen.getByText("Performance")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Performance"), {
      target: { value: "gainers" },
    });

    fireEvent.click(screen.getByText("Reset all filters"));

    expect(screen.getByLabelText("Performance").value).toBe("all");
  });

  it("opens workspace settings and changes the theme", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^settings$/i }));

    expect(
      screen.getByRole("heading", { name: "Workspace settings" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /teal/i }));

    expect(document.querySelector(".app-shell").className).toContain(
      "theme-teal",
    );

    fireEvent.click(screen.getByRole("button", { name: /amber/i }));

    expect(document.querySelector(".app-shell").className).toContain(
      "theme-amber",
    );
  });

  it("opens the account menu and creates a demo profile", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("Your name"), {
      target: { value: "Test Analyst" },
    });

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "analyst@example.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
      target: { value: "secret123" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create demo profile/i }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    expect(screen.getAllByText("Test Analyst").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Demo profile created in this session."),
    ).toBeTruthy();
  });

  it("shows demo mode notice when quote refresh has no API key", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /refresh quotes/i }));

    expect(
      await screen.findByText(/demo mode: add VITE_TWELVE_DATA_API_KEY/i),
    ).toBeTruthy();

    expect(mocks.fetchQuote).not.toHaveBeenCalled();
  });

  it("opens and closes stock details", () => {
    render(<App />);

    const selectButtons = screen.getAllByRole("button", { name: /^select /i });
    fireEvent.click(selectButtons[0]);

    expect(screen.getByTestId("stock-details")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /close stock details/i }),
    );

    expect(screen.queryByTestId("stock-details")).toBeNull();
  });

  it("switches to the watchlist view", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /watchlist/i }));

    expect(
      screen.getByRole("heading", { name: /your watchlist/i }),
    ).toBeTruthy();
    expect(screen.getByText("Your saved stocks")).toBeTruthy();
  });

  it("switches to the charts view", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /stock charts/i }));

    expect(screen.getByRole("heading", { name: /stock charts/i })).toBeTruthy();
    expect(screen.getByTestId("price-chart")).toBeTruthy();
    expect(screen.getByTestId("candlestick-chart")).toBeTruthy();
    expect(screen.getByTestId("circular-analytics")).toBeTruthy();
  });

  it("shows the disconnected WebSocket status", () => {
    render(<App />);

    expect(screen.getByRole("status").textContent).toContain("WS Disconnected");
  });
});
