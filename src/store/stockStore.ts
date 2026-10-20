import { create } from "zustand";
import type { Stock, StockFilters } from "../types/stock";

interface StockStore {
  filters: StockFilters;
  selectedSymbol: string | null;
  watchlist: string[];

  setFilters: (filters: Partial<StockFilters>) => void;
  clearFilters: () => void;
  setSelectedSymbol: (symbol: string | null) => void;
  toggleWatchlist: (symbol: string) => void;
}

const initialFilters: StockFilters = {
  exchanges: [],
  search: "",
};

export const useStockStore = create<StockStore>((set) => ({
  filters: initialFilters,
  selectedSymbol: null,
  watchlist: [],

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  clearFilters: () => set({ filters: initialFilters }),

  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),

  toggleWatchlist: (symbol) =>
    set((state) => ({
      watchlist: state.watchlist.includes(symbol)
        ? state.watchlist.filter((item) => item !== symbol)
        : [...state.watchlist, symbol],
    })),
}));