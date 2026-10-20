# StockScope — Multi-Market Stock Screener

A responsive React dashboard prototype for exploring Indian and US equities. This revision adds a repeatable 5,000-record demo universe, 30 numeric filter criteria, CSV export, locally calculated technical indicators, and a Node.js data-operation benchmark.

> **Important data disclaimer:** This is not a live market-data terminal. The bundled seed quotes and chart history are illustrative, and the generated `SIMI*` / `SIMU*` records are synthetic test data—not real listed securities. Fundamental and technical metrics on synthetic rows are generated values. Do not use them for investment decisions.

## Features

- Market selector: All markets, India, United States
- Search by ticker, company, or sector
- Sector, gain/loss, price range and 30-metric advanced numeric filters
- Sortable table with custom fixed-height virtual scrolling across the full result set
- Watchlist saved in `localStorage`
- Stock details modal and technical chart overlays: SMA 20, EMA 12, Bollinger Bands, RSI 14 and volume profile
- CSV export of the full filtered result set (not only the current page)
- Responsive layout and Violet / Teal / Amber accent themes
- Optional Twelve Data quote adapter for a small number of supported seed symbols
- Vitest + React Testing Library tests for table, data scale, filters, CSV and indicator math
- Node.js benchmark for 5,000-record filter and sort operations

## Tech stack

- React 18 + Vite
- Recharts + Lucide React
- Vitest + React Testing Library + jsdom

## Run locally

Use a supported Node.js release, then run:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Tests, build and benchmark

```bash
npm test
npm run build
npm run benchmark
npm run preview
```

The benchmark prints median and p95 JavaScript data-operation timings for the 5,000-record demo universe. It does **not** measure browser rendering, scroll FPS, memory use, or WebSocket latency. Record those separately in `PERFORMANCE_REPORT.md` before claiming task targets are met.

## Optional Twelve Data refresh

1. Review provider symbol coverage, plan limits, market-data delay and licensing at [Twelve Data](https://twelvedata.com/).
2. Copy `.env.example` to `.env.local`.
3. Add your own local demo key:

```dotenv
VITE_TWELVE_DATA_API_KEY=your_key_here
```

4. Restart Vite and click **Refresh quotes**.

The app refreshes only a small subset of seed symbols. Synthetic `SIMI*` / `SIMU*` rows are not valid provider symbols. **Vite exposes `VITE_` values in browser bundles**; for public production, proxy provider requests through a backend/serverless function and keep secrets server-side. Never commit `.env.local`.

## Architecture and known gaps

See [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`PERFORMANCE_REPORT.md`](./PERFORMANCE_REPORT.md), and [`ERRATA.md`](./ERRATA.md).

The table uses a lightweight custom virtual-row window; it is not yet built on the task-specified TanStack Table/Virtual libraries. The chart is an illustrative area chart with indicator overlays, not a full OHLC candlestick chart. A simulated WebSocket server/client, reconnect lifecycle, update batching/cell flashes, TanStack Table/Virtual integration, real historical data, real authentication, and verified ≥70% test coverage remain to be implemented before this can be described as task-complete or production-grade.

## Deployment

Build command: `npm run build` · Output directory: `dist`.

Configure environment variables in the hosting provider only for demo use. For a public app, use a server-side API proxy and document the data provider's delay, coverage and redistribution restrictions.

## Disclaimer

Educational and portfolio demonstration only. Not investment advice. Verify all market data independently.
