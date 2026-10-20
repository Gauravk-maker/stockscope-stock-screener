# ERRATA — Technical corrections from the task PDF

The task PDF (Section A11.3) says it contains three deliberate technical errors and hints that they concern indicator calculation, WebSocket reconnection, and TypeScript types. The following corrections are recorded from reviewing the examples and formula reference.

## 1. RSI flat-market edge case (Appendix B4, RSI edge cases)

**Problem:** The reference says RSI is `100` when average loss is zero and `0` when average gain is zero. For a completely flat series, both averages are zero, so both rules apply and the result is ambiguous.

**Correction:** Handle the zero/zero case first and define RSI as `50` for a flat period; otherwise, if average loss is zero return `100`, and if average gain is zero return `0`. The implementation in `src/utils/indicators.js` uses this explicit ordering and includes a bounded-output test.

## 2. WebSocket reconnection after unmount (Section A4.2)

**Problem:** The example's `onclose` always schedules `setTimeout(connect, delay)`, while the effect cleanup only closes the current socket. Closing on unmount can schedule a reconnect after unmount, and the reconnect timer is not tracked/cancelled.

**Correction:** Track a reconnect permission flag and timer ref; cancel the timer and pending animation frame in cleanup; only schedule retries while reconnect is enabled. This is required for a production hook and should be applied when the WebSocket layer is added.

## 3. Inconsistent price-update types (Section A5 store example)

**Problem:** The store declares `livePrices` as `Map<string, PriceData>` but its batch updater accepts `Map<string, PriceUpdate>` and stores `{ ...update, updatedAt: Date.now() }`. Without an explicit relationship between `PriceUpdate` and `PriceData`, the state contract is inconsistent and may not type-check. Task 1.2's `Stock` shape also omits market/currency/exchange fields needed by the multi-market UI.

**Correction:** Define a shared `PriceUpdate` base payload, then define `PriceData extends PriceUpdate { updatedAt: number }`; make the store updater accept `ReadonlyMap<string, PriceUpdate>` and store a valid `PriceData`. Include explicit market, exchange, and currency fields in the application stock type.

## Verification note

The SMA verification values in Appendix B1 and EMA values in Appendix B2 were recalculated and are mathematically consistent. The source PDF's three-error hint is not accompanied by an answer key, so these are the concrete edge-case/type/lifecycle corrections found during review rather than a claim that the author's hidden answer key has been independently confirmed.
