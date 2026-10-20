# StockScope Performance Report

## 1. Test Environment

- Application: StockScope – Real-Time Stock Screener
- Framework: Next.js / React
- Dataset: 5,000 stocks displayed in the screener
- Table virtualization: TanStack Virtual
- Estimated row height: 36px
- Overscan: 10 rows
- Live price updates: Simulated WebSocket feed

## 2. Data Operation Benchmark

Command: `npm run benchmark`

| Operation | Median | P95 |
|---|---:|---:|
| Metric filtering | 1.85 ms | 3.79 ms |
| Numeric volume sorting | 0.34 ms | 0.60 ms |
| Search + metric filtering | 1.91 ms | 2.98 ms |

These measurements come from the local Node.js benchmark and do not represent browser rendering performance.

## 3. Virtualization Check

The dashboard footer reported 5,000 stocks.

Observed DOM row counts at different scroll positions:

- Top: 23 rows
- Middle: 34 rows
- Bottom: 12 rows

These observations are consistent with virtualized rendering. Further testing is required to verify the exact number of rendered data rows under repeatable conditions.

## 4. Browser Performance Recording

A Chrome DevTools Performance recording was captured for approximately 30 seconds.

Observed recording:

- Duration: 30.13 seconds
- Scripting: 828 ms
- Rendering: 43 ms
- Painting: 20 ms
- Main-thread time shown in the selected summary: 981.9 ms

These values are specific to the selected recording range. The average FPS, dropped-frame count, and memory usage have not yet been established.

## 5. WebSocket Test

The simulated WebSocket feed was tested for connection, price updates, disconnection, and reconnection.

The feed uses simulated prices and should not be described as a real exchange market-data feed.

## 6. Pending Performance Verification

- Measure scrolling FPS and dropped frames.
- Verify the 55+ FPS target under a repeatable test.
- Measure memory usage during extended scrolling.
- Record browser and device details.
- Repeat tests after significant rendering changes.

## 7. Conclusion

The local filtering and sorting benchmarks show low processing times for the tested dataset. The table's observed DOM row counts are consistent with virtualization, and a browser performance recording has been captured. More measurements are required before claiming that all performance targets have passed.