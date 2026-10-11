# StockScope — Multi-Market Stock Screener

A responsive React dashboard concept for screening Indian and US equities. Built as a front-end internship portfolio project with reusable components, search, sorting, filters, watchlist persistence, stock details, charts, and an optional quote-refresh adapter.

> **Data honesty:** The bundled stock prices, market changes, volume, and chart history are illustrative demo values. The UI intentionally labels them as sample/demo data. Do not present them as live prices. Connect a permitted data provider and replace the sample chart history before claiming a live market-data experience.

## Features

- Market selector: All markets, India, United States
- Search by ticker, company, or sector
- Sector, gain/loss, minimum-price, and maximum-price filters
- Sortable stock table with pagination
- Watchlist saved in `localStorage`
- Stock detail modal and Recharts area chart
- Responsive sidebar and layouts for desktop/tablet/mobile
- Empty states, API status messaging, and refresh loading state
- Optional Twelve Data quote adapter
- Vitest + React Testing Library tests for the stock table

## Stack

- React + Vite
- JavaScript
- Recharts
- Lucide React
- Vitest, React Testing Library, jsdom

## Requirements

Use a supported Node.js version for your installed Vite release. Check the [Vite guide](https://vite.dev/guide/).

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal.

## Test and production build

```bash
npm test
npm run build
npm run preview
```

## Optional API refresh (Twelve Data)

1. Create an account and review your plan, supported exchanges/symbols, credits, and market-data permissions at [Twelve Data](https://twelvedata.com/).
2. Copy `.env.example` to `.env.local`.
3. Add your key:

```dotenv
VITE_TWELVE_DATA_API_KEY=your_key_here
```

4. Restart the Vite server, then select a market and click **Refresh quotes**.

The sample app refreshes only a small subset of the currently visible market universe to reduce API usage. Symbol availability and exchange mapping must be checked with your provider. API plans can differ in quote coverage, request limits, delays, and WebSocket access.

**Security warning:** Vite embeds `VITE_` variables in client-side code. This setting is suitable only for a local/demo portfolio key that you are willing to expose. For a public deployment, route quote requests through a serverless function/backend and keep the provider secret server-side. Never commit `.env.local`.

## Before describing it as "real-time"

- Confirm the selected plan grants the market and exchange coverage you need.
- Check whether quotes are real-time or delayed and disclose this in the UI.
- Replace sample history with provider historical time-series data.
- Implement exchange-specific market-hours/status logic rather than showing one universal market status.
- Follow the provider's data licensing, attribution, caching, and redistribution requirements.

## Suggested project structure

```text
src/
├── components/
│   ├── PriceChart.jsx
│   ├── StockDetails.jsx
│   └── StockTable.jsx
├── data/stocks.js
├── hooks/useWatchlist.js
├── services/stockApi.js
├── test/
│   ├── setup.js
│   └── StockTable.test.jsx
├── App.jsx
├── main.jsx
└── styles.css
```

## Deployment

Deploy the repository to Vercel or another static hosting provider with:
- Build command: `npm run build`
- Output directory: `dist`

For a public API-backed deployment, configure a backend/serverless proxy and do not put a private market-data key in a `VITE_` variable.

## Interview talking points

1. Why stock data is isolated in a service module.
2. How `useMemo` avoids recalculating the filtered/sorted table on every render.
3. Why watchlist state persists in local storage.
4. How loading, error, empty, and success states affect UX.
5. Why multi-market apps need currency, exchange, market-hours, and data-freshness awareness.
6. Why a frontend environment variable cannot keep an API key secret.

## Disclaimer

For educational and portfolio demonstration only. Not investment advice. Verify all quotes independently before making financial decisions.
