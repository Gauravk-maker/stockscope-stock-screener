import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { useEffect } from "react";
import StockWebSocketProvider from "../components/StockWebSocketProvider";

const mocks = vi.hoisted(() => ({
  useStockWebSocket: vi.fn(),
}));

vi.mock("../hooks/useStockWebSocket", () => ({
  default: mocks.useStockWebSocket,
}));

describe("StockWebSocketProvider", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders without producing visible UI", () => {
    const { container } = render(<StockWebSocketProvider />);

    expect(container.firstChild).toBeNull();
  });

  it("mounts the WebSocket hook", () => {
    render(<StockWebSocketProvider />);

    expect(mocks.useStockWebSocket).toHaveBeenCalledTimes(1);
  });

  it("mounts the WebSocket hook on initial render", () => {
    render(<StockWebSocketProvider />);

    expect(mocks.useStockWebSocket).toHaveBeenCalled();
  });

  it("does not render visible elements after mounting", () => {
    const { container } = render(<StockWebSocketProvider />);

    expect(container.querySelector("*")).toBeNull();
  });

  it("can mount more than once without throwing", () => {
    expect(() => {
      render(<StockWebSocketProvider />);
    }).not.toThrow();
  });
});