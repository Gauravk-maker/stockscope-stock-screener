
"use client";

import { useEffect } from "react";
import useStockWebSocket from "../hooks/useStockWebSocket";

export default function StockWebSocketProvider() {
  useEffect(() => {
    // The hook is mounted by this provider,
    // so the WebSocket connection is shared app-wide.
  }, []);

  useStockWebSocket();

  return null;
}
