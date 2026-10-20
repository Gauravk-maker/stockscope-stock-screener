
export async function fetchQuote(stock, fetchImpl = fetch) {
  const params = new URLSearchParams({
    symbol: stock.symbol,
  });

  if (stock.exchange) {
    params.set("exchange", stock.exchange);
  }

  const response = await fetchImpl(
    `/api/quote?${params.toString()}`,
    {
      cache: "no-store",
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Invalid API response (HTTP ${response.status}).`
    );
  }

  if (!response.ok || data.error) {
    throw new Error(
      data.error || "Unable to fetch stock quote."
    );
  }

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
    change: Number.isFinite(change)
      ? change
      : stock.change,
    volume: Number.isFinite(volume)
      ? volume
      : stock.volume,
    lastUpdated:
      data.datetime || new Date().toISOString(),
    dataSource: "Twelve Data",
  };
}
