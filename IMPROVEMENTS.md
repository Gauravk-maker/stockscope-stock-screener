# Improvements in this revision

- Expanded the app's in-memory dataset to 5,000 records. The additional 4,921 records are clearly synthetic (`SIMI*` / `SIMU*`), not real stock listings.
- Added 30 numeric financial/technical metric filters with minimum and maximum bounds.
- Replaced page slicing with a fixed-height virtual row window and spacer rows so only a small number of rows are in the DOM while the user scrolls the full filtered universe.
- Added full-filter-result CSV export with escaping for commas, quotes and line breaks.
- Added from-scratch SMA, EMA, Bollinger Bands, RSI and volume-profile calculation helpers.
- Updated the chart to display price overlays, a separate RSI plot and a volume-profile histogram using illustrative 60-point history.
- Added tests for synthetic data scale, 30 filter criteria, numeric bounds, CSV escaping, indicator calculations and virtual row count.
- Added `npm run benchmark` to measure Node.js filter and sort operations on the 5,000-record universe.
- Added architecture, performance and errata documentation.
- Removed the local `.env.local` file from the deliverable and replaced the API key in `.env.example` with a placeholder.

## Still required for full task compliance

- Build and run Vitest in a clean environment; measure actual coverage and reach the ≥70% target.
- Integrate TanStack Table + TanStack Virtual if the evaluator requires those exact libraries rather than a custom virtual window.
- Implement the simulated WebSocket server/client, reconnect cancellation/backoff, batched updates and 300 ms cell flash animations.
- Replace the area chart with true OHLC candlesticks and connect the indicators to permitted historical market data.
- Add missing server-side architecture, secure API proxy, error boundaries, and real authentication only if required by the final product scope.
- Run browser-level LCP, FPS, memory, and live-update latency benchmarks; do not infer them from the Node benchmark.
- Confirm the task's required Tailwind CSS design-system requirements and complete deployment/repository submission steps.
