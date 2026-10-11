
const BASE_URL = "https://api.twelvedata.com/quote";

export async function fetchQuote(stock, apiKey, fetchImpl = fetch) {
  if (!apiKey) {
    throw new Error(
      "API key missing. Add VITE_TWELVE_DATA_API_KEY to .env.local."
    );
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("symbol", stock.symbol);

  // Exchange optional rakho; incorrect exchange symbol lookup fail kar sakta hai.
  if (stock.exchange) {
    url.searchParams.set("exchange", stock.exchange);
  }

  url.searchParams.set("apikey", apiKey);

  const response = await fetchImpl(url.toString());

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Invalid API response (HTTP ${response.status}).`);
  }

  if (!response.ok || data.status === "error" || data.code) {
    throw new Error(
      `Twelve Data error (${data.code ?? response.status}): ${
        data.message || "Could not fetch this symbol."
      }`
    );
  }

  // /quote generally returns close and percent_change fields.
  const price = Number(data.close);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(
      `No valid price returned for ${stock.symbol}. Check symbol coverage.`
    );
  }

  const change = Number(data.percent_change);
  const volume = Number(data.volume);

  return {
    ...stock,
    price,
    change: Number.isFinite(change) ? change : stock.change,
    volume: Number.isFinite(volume) ? volume : stock.volume,
    lastUpdated: data.datetime || new Date().toISOString(),
    dataSource: "Twelve Data",
  };
}
