
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import useStockWebSocket from "../hooks/useStockWebSocket";

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.close = vi.fn(() => {
      this.readyState = MockWebSocket.CLOSED;
    });

    MockWebSocket.instances.push(this);
  }
}

const originalRaf = Object.getOwnPropertyDescriptor(
  window,
  "requestAnimationFrame"
);
const originalCancelRaf = Object.getOwnPropertyDescriptor(
  window,
  "cancelAnimationFrame"
);

let frames;
let nextFrameId;

function flushFrames() {
  const callbacks = [...frames.entries()];
  frames.clear();

  for (const [, callback] of callbacks) {
    callback(performance.now());
  }
}

function sendMessage(socket, message) {
  act(() => {
    socket.onmessage({ data: JSON.stringify(message) });
  });
}

describe("useStockWebSocket", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", MockWebSocket);

    MockWebSocket.instances = [];
    frames = new Map();
    nextFrameId = 1;

    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: vi.fn((callback) => {
        const id = nextFrameId++;
        frames.set(id, callback);
        return id;
      }),
    });

    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: vi.fn((id) => frames.delete(id)),
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();

    if (originalRaf) {
      Object.defineProperty(window, "requestAnimationFrame", originalRaf);
    } else {
      delete window.requestAnimationFrame;
    }

    if (originalCancelRaf) {
      Object.defineProperty(window, "cancelAnimationFrame", originalCancelRaf);
    } else {
      delete window.cancelAnimationFrame;
    }
  });

  it("starts connecting and creates a WebSocket", () => {
    const { result } = renderHook(() => useStockWebSocket());

    expect(result.current.status).toBe("connecting");
    expect(result.current.prices).toEqual({});
    expect(result.current.lastMessageAt).toBeNull();
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe("ws://localhost:3001");
  });

  it("changes status to connected when the socket opens", () => {
    const { result } = renderHook(() => useStockWebSocket());
    const socket = MockWebSocket.instances[0];

    act(() => {
      socket.readyState = MockWebSocket.OPEN;
      socket.onopen();
    });

    expect(result.current.status).toBe("connected");
  });

  it("processes valid price updates and flushes them on animation frame", () => {
    const { result } = renderHook(() => useStockWebSocket());
    const socket = MockWebSocket.instances[0];

    sendMessage(socket, {
      type: "price_update",
      timestamp: 123456,
      source: "test-feed",
      data: [
        {
          symbol: "AAPL",
          market: "US",
          price: "150.5",
          change: "2.5",
        },
      ],
    });

    // Updates are batched until the scheduled frame runs.
    expect(result.current.prices).toEqual({});

    act(() => {
      flushFrames();
    });

    expect(result.current.prices.AAPL).toEqual({
      symbol: "AAPL",
      market: "US",
      price: 150.5,
      change: 2.5,
      timestamp: 123456,
      source: "test-feed",
    });
    expect(result.current.lastMessageAt).toEqual(expect.any(Number));
  });

  it("ignores connection acknowledgements and unrelated messages", () => {
    const { result } = renderHook(() => useStockWebSocket());
    const socket = MockWebSocket.instances[0];

    sendMessage(socket, { type: "connected" });
    sendMessage(socket, { type: "heartbeat" });
    sendMessage(socket, { type: "price_update", data: "invalid" });

    expect(result.current.prices).toEqual({});
    expect(result.current.lastMessageAt).toBeNull();
    expect(frames.size).toBe(0);
  });

  it("ignores invalid prices and symbols", () => {
    const { result } = renderHook(() => useStockWebSocket());
    const socket = MockWebSocket.instances[0];

    sendMessage(socket, {
      type: "price_update",
      data: [
        { symbol: "ZERO", price: 0 },
        { symbol: "NEGATIVE", price: -10 },
        { symbol: "INVALID", price: "abc" },
        { symbol: 123, price: 100 },
        { symbol: "VALID", price: 25, change: "invalid" },
      ],
    });

    act(() => {
      flushFrames();
    });

    expect(result.current.prices).toHaveProperty("VALID");
    expect(result.current.prices.VALID.change).toBe(0);
    expect(result.current.prices).not.toHaveProperty("ZERO");
    expect(result.current.prices).not.toHaveProperty("NEGATIVE");
    expect(result.current.prices).not.toHaveProperty("INVALID");
    expect(result.current.prices).not.toHaveProperty("123");
  });

  it("reconnects after the socket closes", () => {
    const { result } = renderHook(() => useStockWebSocket());
    const socket = MockWebSocket.instances[0];

    act(() => {
      socket.onclose();
    });

    expect(result.current.status).toBe("disconnected");
    expect(MockWebSocket.instances).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(MockWebSocket.instances).toHaveLength(2);
    expect(result.current.status).toBe("connecting");
  });

  it("closes the socket and cancels scheduled work on unmount", () => {
    const { unmount } = renderHook(() => useStockWebSocket());
    const socket = MockWebSocket.instances[0];

    unmount();

    expect(socket.close).toHaveBeenCalledTimes(1);
    expect(socket.onclose).toBeNull();
    expect(socket.onmessage).toBeNull();
    expect(socket.onopen).toBeNull();
    expect(socket.onerror).toBeNull();
    expect(frames.size).toBe(0);
  });
});
