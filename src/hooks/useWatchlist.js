import { useEffect, useState } from "react";

const KEY = "stockscope-watchlist-v1";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const toggle = (symbol) => setWatchlist((current) =>
    current.includes(symbol)
      ? current.filter((item) => item !== symbol)
      : [...current, symbol]
  );

  return { watchlist, toggle };
}
