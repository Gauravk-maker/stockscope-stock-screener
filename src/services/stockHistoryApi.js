
const API_URL = "https://api.twelvedata.com/time_series";

const RANGE_CONFIG = {
  "1D": { days: 1, interval: "5min" },
  "1W": { days: 7, interval: "1day" },
  "1M": { days: 30, interval: "1day" },
  "6M": { days: 183, interval: "1day" },
  "1Y": { days: 365, interval: "1day" },
  "5Y": { days: 1825, interval: "1week" },
};

export async function fetchStockHistory(stock, range) {
  const apiKey = import.meta.env.VITE_TWELVE_DATA_API_KEY;

  if (!apiKey) {
    throw new Error("Twelve Data API key is missing.");
  }

  const config = RANGE_CONFIG[range];
  if (!config) throw new Error("Unsupported date range.");

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - config.days);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const params = new URLSearchParams({
    symbol: stock.symbol,
    interval: config.interval,
    start_date: formatDate(start),
    end_date: formatDate(end),
    order: "asc",
    apikey: apiKey,
  });

  if (stock.exchange) {
    params.set("exchange", stock.exchange);
  }

  const response = await fetch(`${API_URL}?${params}`);
  const data = await response.json();

  if (!response.ok || data.status === "error" || !data.values) {
    throw new Error(data.message || "Could not load historical prices.");
  }

  return data.values
    .map((item) => ({
      date: item.datetime,
      price: Number(item.close),
      volume: Number(item.volume || 0),
    }))
    .filter((item) => Number.isFinite(item.price));
}
