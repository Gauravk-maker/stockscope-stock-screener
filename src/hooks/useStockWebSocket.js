
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WS_URL =
  process.env.NEXT_PUBLIC_STOCK_WS_URL ||
  "ws://localhost:3001";

const MAX_RECONNECT_DELAY = 16000;

export default function useStockWebSocket() {
  const [prices, setPrices] = useState({});
  const [status, setStatus] = useState("connecting");
  const [lastMessageAt, setLastMessageAt] = useState(null);

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const retryDelayRef = useRef(1000);
  const mountedRef = useRef(false);

  // Hold incoming ticks until the next animation frame.
  const pendingUpdatesRef = useRef({});
  const frameRef = useRef(null);
  const frameTypeRef = useRef(null);

  const cancelScheduledFlush = useCallback(() => {
    if (frameRef.current === null) return;

    if (
      frameTypeRef.current === "raf" &&
      typeof window !== "undefined"
    ) {
      window.cancelAnimationFrame(frameRef.current);
    } else {
      clearTimeout(frameRef.current);
    }

    frameRef.current = null;
    frameTypeRef.current = null;
  }, []);

  const flushPendingUpdates = useCallback(() => {
    frameRef.current = null;
    frameTypeRef.current = null;

    if (!mountedRef.current) return;

    const batch = pendingUpdatesRef.current;
    pendingUpdatesRef.current = {};

    const symbols = Object.keys(batch);
    if (symbols.length === 0) return;

    setPrices((previous) => {
      let changed = false;
      const next = { ...previous };

      for (const symbol of symbols) {
        const incoming = batch[symbol];
        const existing = previous[symbol];

        if (
          existing?.price === incoming.price &&
          existing?.timestamp === incoming.timestamp
        ) {
          continue;
        }

        next[symbol] = incoming;
        changed = true;
      }

      return changed ? next : previous;
    });

    setLastMessageAt(Date.now());
  }, []);

  const scheduleFlush = useCallback(() => {
    if (frameRef.current !== null) return;

    if (
      typeof window !== "undefined" &&
      typeof window.requestAnimationFrame === "function"
    ) {
      frameTypeRef.current = "raf";
      frameRef.current =
        window.requestAnimationFrame(flushPendingUpdates);
    } else {
      // Fallback for test environments without requestAnimationFrame.
      frameTypeRef.current = "timeout";
      frameRef.current = setTimeout(flushPendingUpdates, 16);
    }
  }, [flushPendingUpdates]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    if (
      typeof WebSocket === "undefined" ||
      !WS_URL
    ) {
      setStatus("disconnected");
      return;
    }

    setStatus("connecting");

    let socket;

    try {
      socket = new WebSocket(WS_URL);
    } catch (error) {
      console.error("Could not create WebSocket:", error);
      setStatus("disconnected");
      return;
    }

    socketRef.current = socket;

    socket.onopen = () => {
      retryDelayRef.current = 1000;
      setStatus("connected");
      console.info("StockScope WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // The server sends a separate connection acknowledgement.
        if (message.type === "connected") return;

        if (
          message.type !== "price_update" ||
          !Array.isArray(message.data)
        ) {
          return;
        }

        for (const item of message.data) {
          const price = Number(item.price);
          const change = Number(item.change);

          if (
            typeof item.symbol !== "string" ||
            !Number.isFinite(price) ||
            price <= 0
          ) {
            continue;
          }

          pendingUpdatesRef.current[item.symbol] = {
            symbol: item.symbol,
            market: item.market || null,
            price,
            change: Number.isFinite(change) ? change : 0,
            timestamp: Number(message.timestamp) || Date.now(),
            source: message.source || "simulation",
          };
        }

        scheduleFlush();
      } catch {
        console.error("Invalid WebSocket message received");
      }
    };

    socket.onerror = () => {
      // onclose owns the reconnection process.
      socket.close();
    };

    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      if (!mountedRef.current) return;

      setStatus("disconnected");

      if (reconnectTimerRef.current !== null) return;

      const delay = retryDelayRef.current;
      retryDelayRef.current = Math.min(
        retryDelayRef.current * 2,
        MAX_RECONNECT_DELAY
      );

      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    };
  }, [scheduleFlush]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;

      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      cancelScheduledFlush();
      pendingUpdatesRef.current = {};

      const socket = socketRef.current;
      socketRef.current = null;

      if (socket) {
        // Prevent cleanup from scheduling a reconnect.
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.onopen = null;

        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close();
        }
      }
    };
  }, [connect, cancelScheduledFlush]);

  return {
    prices,
    status,
    lastMessageAt,
  };
}
