
"use client";

import useStockWebSocket from "../hooks/useStockWebSocket";

export default function WebSocketStatus() {
  const { prices, status } = useStockWebSocket();

  return (
    <div style={{ padding: 16 }}>
      <p>
        WebSocket status:{" "}
        <strong>
          {status === "connected"
            ? "Connected"
            : status === "connecting"
              ? "Connecting..."
              : "Disconnected — reconnecting"}
        </strong>
      </p>

      <h3>Simulated live prices</h3>

      {Object.entries(prices).length === 0 ? (
        <p>Waiting for price updates...</p>
      ) : (
        Object.entries(prices).map(([symbol, item]) => (
          <p key={symbol}>
            {symbol}: ${item.price.toFixed(2)}
            {" · "}
            {item.change >= 0 ? "+" : ""}
            {item.change.toFixed(2)}
          </p>
        ))
      )}
    </div>
  );
}
