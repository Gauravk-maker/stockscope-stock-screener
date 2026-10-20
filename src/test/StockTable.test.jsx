import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StockTable from "../components/StockTable.jsx";

const stocks = [
  {
    symbol: "AAPL",
    company: "Apple Inc.",
    market: "US",
    exchange: "NASDAQ",
    sector: "Technology",
    currency: "USD",
    price: 200,
    change: 1.5,
    volume: 1000000,
  },
  {
    symbol: "RELIANCE",
    company: "Reliance Industries",
    market: "IN",
    exchange: "NSE",
    sector: "Energy",
    currency: "INR",
    price: 1400,
    change: -0.5,
    volume: 2000000,
  },
];
const baseProps = {
  stocks,
  watchlist: [],
  onToggleWatch: vi.fn(),
  onSelect: vi.fn(),
  sort: { key: "symbol", direction: "asc" },
  onSort: vi.fn(),
  page: 1,
  pageSize: 8,
  onPage: vi.fn(),
};

describe("StockTable", () => {
  it("calls watchlist toggle when a star is clicked", async () => {
    const user = userEvent.setup();
    const onToggleWatch = vi.fn();

    render(<StockTable {...baseProps} onToggleWatch={onToggleWatch} />);

    await user.click(
      screen.getByRole("button", {
        name: "Add AAPL to watchlist",
      }),
    );

    expect(onToggleWatch).toHaveBeenCalledWith("AAPL");
  });

  it("keeps rendered rows bounded when given a 5,000-record universe", () => {
    const largeStocks = Array.from({ length: 5000 }, (_, index) => ({
      ...stocks[0],
      symbol: `SIM${String(index).padStart(4, "0")}`,
      company: `Simulation Equity ${index}`,
    }));
    const { container } = render(
      <StockTable {...baseProps} stocks={largeStocks} />,
    );
    const renderedRows = container.querySelectorAll(
      "tbody tr:not(.virtual-spacer)",
    );
    expect(renderedRows.length).toBeLessThanOrEqual(30);
    expect(container.querySelector("table")).toHaveAttribute(
      "aria-rowcount",
      "5001",
    );
  });

  it("shows an empty state when there are no stocks", () => {
    render(<StockTable {...baseProps} stocks={[]} />);
    expect(screen.getByText("No stocks found")).toBeInTheDocument();
  });
});
