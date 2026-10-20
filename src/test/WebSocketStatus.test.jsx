
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import WebSocketStatus from "../components/WebSocketStatus";
import useStockWebSocket from "../hooks/useStockWebSocket";

vi.mock("../hooks/useStockWebSocket", () => ({
  default: vi.fn(),
}));

describe("WebSocketStatus", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("displays the connecting status", () => {
    useStockWebSocket.mockReturnValue({
      prices: {},
      status: "connecting",
    });

    render(<WebSocketStatus />);

    expect(screen.getByText("Connecting...")).toBeTruthy();
  });

  it("displays the connected status", () => {
    useStockWebSocket.mockReturnValue({
      prices: {},
      status: "connected",
    });

    render(<WebSocketStatus />);

    expect(screen.getByText("Connected")).toBeTruthy();
  });

  it("displays the disconnected status", () => {
    useStockWebSocket.mockReturnValue({
      prices: {},
      status: "disconnected",
    });

    render(<WebSocketStatus />);

    expect(screen.getByText(/Disconnected/)).toBeTruthy();
  });

  it("shows a waiting message when there are no prices", () => {
    useStockWebSocket.mockReturnValue({
      prices: {},
      status: "connecting",
    });

    render(<WebSocketStatus />);

    expect(
      screen.getByText("Waiting for price updates...")
    ).toBeTruthy();

    expect(
      screen.getByRole("heading", { name: "Simulated live prices" })
    ).toBeTruthy();
  });

  it("renders positive and negative price changes correctly", () => {
    useStockWebSocket.mockReturnValue({
      status: "connected",
      prices: {
        AAPL: { price: 150.5, change: 2.25 },
        TSLA: { price: 240, change: -3.5 },
      },
    });

    render(<WebSocketStatus />);

    expect(screen.getByText(/AAPL: \$150\.50/)).toBeTruthy();
    expect(screen.getByText(/\+2\.25/)).toBeTruthy();

    expect(screen.getByText(/TSLA: \$240\.00/)).toBeTruthy();
    expect(screen.getByText(/-3\.50/)).toBeTruthy();

    expect(
      screen.queryByText("Waiting for price updates...")
    ).toBeNull();
  });
});
