
import { WebSocketServer, WebSocket } from "ws";

const PORT = Number(process.env.WS_PORT || 3001);
const UPDATE_INTERVAL_MS = Number(
  process.env.WS_UPDATE_INTERVAL_MS || 2000
);

// These are simulation starting points, not exchange quotes.
const stocks = [
  {
    symbol: "RELIANCE",
    market: "IN",
    price: 1462.35,
    basePrice: 1462.35,
    baseChange: 1.82,
  },
  {
    symbol: "TCS",
    market: "IN",
    price: 3218.6,
    basePrice: 3218.6,
    baseChange: -0.74,
  },
  {
    symbol: "INFY",
    market: "IN",
    price: 1548.9,
    basePrice: 1548.9,
    baseChange: 2.16,
  },
  {
    symbol: "AAPL",
    market: "US",
    price: 232.14,
    basePrice: 232.14,
    baseChange: 1.24,
  },
  {
    symbol: "MSFT",
    market: "US",
    price: 512.6,
    basePrice: 512.6,
    baseChange: 0.68,
  },
];

const wss = new WebSocketServer({ port: PORT });

function nextSimulatedPrice(stock) {
  // Small random movement for a development simulation.
  const movement = (Math.random() - 0.5) * 0.002;

  stock.price = Math.max(
    0.01,
    stock.price * (1 + movement)
  );

  // Keep "change" in percentage units, as the dashboard expects.
  const change =
    stock.baseChange +
    ((stock.price - stock.basePrice) / stock.basePrice) * 100;

  return {
    symbol: stock.symbol,
    market: stock.market,
    price: Number(stock.price.toFixed(2)),
    change: Number(change.toFixed(2)),
  };
}

function broadcastPrices() {
  const message = JSON.stringify({
    type: "price_update",
    source: "simulation",
    timestamp: Date.now(),
    data: stocks.map(nextSimulatedPrice),
  });

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

wss.on("connection", (socket) => {
  console.log("StockScope client connected");

  socket.send(
    JSON.stringify({
      type: "connected",
      source: "simulation",
      message: "StockScope simulation connected",
      timestamp: Date.now(),
    })
  );

  socket.on("error", (error) => {
    console.error("WebSocket client error:", error.message);
  });
});

const interval = setInterval(
  broadcastPrices,
  UPDATE_INTERVAL_MS
);

wss.on("listening", () => {
  console.log(
    `StockScope simulation running at ws://localhost:${PORT}`
  );
  console.log(
    `Broadcast interval: ${UPDATE_INTERVAL_MS} ms`
  );
});

wss.on("close", () => clearInterval(interval));

function shutdown() {
  clearInterval(interval);
  wss.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
