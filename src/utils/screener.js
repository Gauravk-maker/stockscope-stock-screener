export const FILTER_METRICS = [
  { key: "price", label: "Last price", unit: "price" },
  { key: "change", label: "Daily change", unit: "%" },
  { key: "volume", label: "Volume", unit: "shares" },
  { key: "marketCapValue", label: "Market cap (demo value)", unit: "value" },
  { key: "peRatio", label: "P/E ratio", unit: "x" },
  { key: "priceToBook", label: "Price / book", unit: "x" },
  { key: "eps", label: "EPS", unit: "currency" },
  { key: "dividendYield", label: "Dividend yield", unit: "%" },
  { key: "beta", label: "Beta", unit: "x" },
  { key: "high52", label: "52-week high", unit: "price" },
  { key: "low52", label: "52-week low", unit: "price" },
  { key: "avgVolume", label: "Average volume", unit: "shares" },
  { key: "revenueGrowth", label: "Revenue growth", unit: "%" },
  { key: "profitMargin", label: "Profit margin", unit: "%" },
  { key: "debtToEquity", label: "Debt / equity", unit: "x" },
  { key: "rsi", label: "RSI (demo)", unit: "index" },
  { key: "sma20", label: "SMA 20", unit: "price" },
  { key: "sma50", label: "SMA 50", unit: "price" },
  { key: "ema20", label: "EMA 20", unit: "price" },
  { key: "volatility", label: "Volatility", unit: "%" },
  { key: "roe", label: "Return on equity", unit: "%" },
  { key: "roa", label: "Return on assets", unit: "%" },
  { key: "currentRatio", label: "Current ratio", unit: "x" },
  { key: "grossMargin", label: "Gross margin", unit: "%" },
  { key: "operatingMargin", label: "Operating margin", unit: "%" },
  { key: "freeCashFlow", label: "Free cash flow", unit: "value" },
  { key: "institutionalOwnership", label: "Institutional ownership", unit: "%" },
  { key: "shortInterest", label: "Short interest", unit: "%" },
  { key: "dayHigh", label: "Day high", unit: "price" },
  { key: "dayLow", label: "Day low", unit: "price" },
];

export function matchesMetricFilters(stock, metricFilters) {
  return Object.entries(metricFilters).every(([key, bounds]) => {
    const value = Number(stock[key]);
    if (!Number.isFinite(value)) return false;
    const min = bounds?.min === "" || bounds?.min == null ? null : Number(bounds.min);
    const max = bounds?.max === "" || bounds?.max == null ? null : Number(bounds.max);
    return (min === null || !Number.isFinite(min) || value >= min) &&
      (max === null || !Number.isFinite(max) || value <= max);
  });
}

export function toCsv(stocks) {
  const columns = ["symbol", "company", "market", "exchange", "sector", "currency", "price", "change", "volume", "peRatio", "dividendYield", "rsi", "dataSource"];
  const escape = (value) => {
    const text = value == null ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [columns.join(","), ...stocks.map(stock => columns.map(key => escape(stock[key])).join(","))].join("\r\n");
}
