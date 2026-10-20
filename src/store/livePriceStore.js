import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const useLivePriceStore = create(
  immer((set) => ({
    prices: {},
    status: "connecting",

    setStatus: (status) =>
      set((state) => {
        state.status = status;
      }),

    updatePrices: (updates) =>
      set((state) => {
        for (const item of updates) {
          if (
            typeof item.symbol !== "string" ||
            !Number.isFinite(Number(item.price)) ||
            Number(item.price) <= 0
          ) {
            continue;
          }

          const symbol = item.symbol.trim().toUpperCase();

          const marketValue = String(item.market ?? item.exchange ?? "")
            .trim()
            .toUpperCase();

          const market = ["US", "USA", "NASDAQ", "NYSE", "NYSEARCA"].includes(
            marketValue,
          )
            ? "US"
            : "IN";

          const key = `${market}:${symbol}`;

          state.prices[key] = {
            symbol,
            market,
            price: Number(item.price),
            change: Number(item.change ?? 0),
            timestamp: item.timestamp ?? Date.now(),
          };
        }
      }),
  })),
);

export default useLivePriceStore;
