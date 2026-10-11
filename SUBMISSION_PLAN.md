# 7-Day Submission Plan

## Day 1 — Run and understand
- Install dependencies, start the app.
- Explore the component tree and explain each page/section.
- Replace the demo brand details if desired.

## Day 2 — UI polish and responsive checks
- Test 1440px desktop, tablet, and mobile widths.
- Verify mobile menu, table horizontal scroll, modal close, and empty state.
- Capture clean screenshots.

## Day 3 — Filters and interactions
- Test search, sectors, gainers/losers, min/max price, sorting, pagination.
- Test watchlist persistence after refresh.
- Fix any keyboard/focus issues.

## Day 4 — Data-provider setup
- Create a provider account and review current coverage, usage limits, exchange mapping, and licensing.
- Test a single supported US symbol and a single supported Indian symbol.
- Keep demo mode clearly labelled if coverage is unavailable.
- For public deployment, implement a serverless proxy rather than exposing a private API key.

## Day 5 — Testing
- Run `npm test` and `npm run build`.
- Add tests for filtering logic and API response/error mapping if time permits.
- Check console for errors and test network failures.

## Day 6 — Deploy and document
- Push to GitHub.
- Deploy to Vercel or equivalent.
- Finish README: screenshots, setup, features, data disclaimer, live URL.
- Verify deployed app on mobile and desktop.

## Day 7 — Submission rehearsal
- Practice a 2-minute project demo.
- Explain component architecture, filters, watchlist, API integration, and limitations.
- Confirm repository is public if required, links work, no secret key is committed, and the deployed app loads.
