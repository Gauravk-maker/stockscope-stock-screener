# StockScope Architecture

## Current application shape

- `src/App.jsx` owns page-level view state, market selection, search, filters, sorting, pagination, quote-refresh messaging, theme selection and CSV export.
- `src/data/stocks.js` contains a small seed set plus generated synthetic rows to create a repeatable 5,000-record performance-test universe. Generated records use `SIMI`/`SIMU` symbols and are not real securities.
- `src/utils/screener.js` contains the 30-metric filter catalog, numeric bound matching, and CSV escaping/export serialization.
- `src/utils/indicators.js` implements SMA, EMA, Bollinger Bands, RSI, and price-bucket volume profile calculations from scratch.
- `src/components/StockTable.jsx` renders a small window of sorted/filtered rows with top/bottom spacer rows, so the DOM stays bounded while scrolling through the full result set.
- `src/components/PriceChart.jsx` renders an illustrative 60-point area series, SMA/EMA/Bollinger overlays, a separate RSI plot, and a volume-profile histogram through Recharts. It is not an OHLC candlestick/historical-feed chart yet.
- `src/services/stockApi.js` isolates the optional Twelve Data quote adapter. API calls are currently made from the browser and should be moved behind a server-side proxy before public production use.
- `src/hooks/useWatchlist.js` stores watchlist symbols in local storage.

## Data flow

1. Seed and synthetic demo records are loaded at startup.
2. Market and watchlist selections narrow the universe.
3. Search, sector, performance, price bounds and any enabled metric bounds filter records.
4. Sorting is applied to the filtered copy, then the virtual row window bounds rendered rows.
5. CSV export serializes the entire filtered result set, not just the visible page.
6. Optional quote refresh requests a small number of provider quotes and merges successful results into React state.

## Explicit limitations

- The 5,000-record universe is synthetic test data, not 5,000 verified listings.
- The table uses a lightweight custom virtual-row window. TanStack Table/Virtual integration remains a task-specific implementation detail to complete.
- There is no WebSocket server/client simulation in this revision.
- The chart uses sample area data; candlesticks and the five required indicator calculations remain outstanding.
- Account actions are local demo UI, not real authentication.
