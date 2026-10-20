
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import StockDetails from "../components/StockDetails";

vi.mock("../components/PriceChart.jsx", () => ({
  default: ({ stock }) => (
    <div data-testid="price-chart">Chart for {stock.symbol}</div>
  ),
}));

const stock = {
  symbol: "AAPL",
  company: "Apple Inc.",
  exchange: "NASDAQ",
  sector: "Technology",
  market: "US",
  currency: "USD",
  price: 150.5,
  change: 2.25,
  volume: 1250000,
  marketCap: "2.5T",
};

describe("StockDetails", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders nothing when stock is null", () => {
    const { container } = render(
      <StockDetails stock={null} onClose={vi.fn()} saved={false} onToggleWatch={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("displays stock information and demo disclaimer", () => {
    render(
      <StockDetails stock={stock} onClose={vi.fn()} saved={false} onToggleWatch={vi.fn()} />
    );

    expect(screen.getByRole("heading", { name: "Apple Inc." })).toBeTruthy();
    expect(screen.getByText(/AAPL\s*·\s*NASDAQ/)).toBeTruthy();
    expect(screen.getByText("$150.50")).toBeTruthy();
    expect(screen.getByText(/DEMO DATA/)).toBeTruthy();
    expect(screen.getByText("United States")).toBeTruthy();
    expect(screen.getAllByTestId("price-chart")).toHaveLength(2);
  });

  it("shows positive price change and adds stock to watchlist", () => {
    const onToggleWatch = vi.fn();

    render(
      <StockDetails
        stock={stock}
        onClose={vi.fn()}
        saved={false}
        onToggleWatch={onToggleWatch}
      />
    );

    expect(screen.getByText("+2.25% today")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Add to watchlist/i }));

    expect(onToggleWatch).toHaveBeenCalledWith("AAPL");
  });

  it("shows saved state and negative price change", () => {
    render(
      <StockDetails
        stock={{ ...stock, change: -3.5 }}
        onClose={vi.fn()}
        saved={true}
        onToggleWatch={vi.fn()}
      />
    );

    expect(screen.getByText("-3.50% today")).toBeTruthy();
    expect(screen.getByRole("button", { name: /In watchlist/i })).toBeTruthy();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();

    render(
      <StockDetails stock={stock} onClose={onClose} saved={false} onToggleWatch={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Close stock details" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the backdrop is clicked but not when the modal is clicked", () => {
    const onClose = vi.fn();

    render(
      <StockDetails stock={stock} onClose={onClose} saved={false} onToggleWatch={vi.fn()} />
    );

    const backdrop = screen.getByRole("presentation");
    const dialog = screen.getByRole("dialog");

    fireEvent.mouseDown(dialog);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders Indian market details and missing market-cap fallback", () => {
    render(
      <StockDetails
        stock={{
          ...stock,
          symbol: "RELIANCE",
          company: "Reliance Industries",
          market: "IN",
          currency: "INR",
          price: 2500,
          marketCap: "",
        }}
        onClose={vi.fn()}
        saved={false}
        onToggleWatch={vi.fn()}
      />
    );

    expect(screen.getByText("India")).toBeTruthy();
    expect(screen.getByText(/₹2,500/)).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
  });
});
