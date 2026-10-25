# Seller Ops Desk

Seller Ops Desk is a small, local-first workspace for marketplace operators. It helps review manually exported seller reports, track internal supplier/partner calls and follow-ups, manage tasks, and estimate product contribution margin.

## Features

- Import a manually exported Seller Central CSV or TSV report.
- Parse only a whitelist of order fields; unknown columns—including buyer contact fields—are discarded.
- View distinct non-cancelled orders, units, sales by currency, and report warnings.
- Search/filter imported line items and deduplicate re-imported rows.
- Record internal supplier/partner calls, next actions, dates, priorities, and completion.
- Track operational tasks by category, due date, and status.
- Estimate per-unit contribution and break-even price from your own cost assumptions and selected currency.
- Export a sanitized order CSV or versioned local backup.
- Restore a backup through an explicit allowlist so arbitrary imported properties are discarded.

## What it does not do

- It does **not** currently connect to Amazon Selling Partner API (SP-API).
- It does **not** authorize seller accounts, fetch current marketplace fees, or make purchases/changes in Seller Central.
- It does **not** send SMS, emails, or messages to buyers.
- It does **not** upload report data to a backend. Imports and workspace records stay in this browser's local storage unless you intentionally download/export them.

A future SP-API integration would require the relevant Amazon developer registration, seller authorization/OAuth, security review, and compliant data handling. Do not enter Amazon passwords, access tokens, or API credentials into this tool.

## Requirements and start

Node.js 20+ is required for the tiny local static server and tests. The app itself has no third-party runtime dependencies.

    npm test
    npm run check
    npm start

The server binds only to `127.0.0.1` by default and prints the local URL. It is not intended to be exposed directly to the public internet.

You can also open `index.html` directly in a browser, but using the local server is the recommended way to run it consistently.

## Report handling

The current parser expects at least an order ID column and recognizes common aliases for date, SKU, ASIN, product title, quantity, item price, currency, status, and marketplace. Amazon changes report schemas over time; if a column is not recognized, the tool displays warnings or leaves that field empty rather than guessing.

Only the fields explicitly listed in `core.js` are retained. Raw input text is not stored or sent elsewhere. The tool ignores buyer name, email, phone, street address, and unknown columns.

## Backup caution

The workspace is stored in the browser's local storage. It is not encrypted and it is not synchronized between devices. Anyone using the same browser profile may be able to access it. Exported backups and CSVs can contain order/product details and internal follow-up notes, so store them securely and do not attach real reports to public issues.

## Tests

The unit tests cover delimiter/quote parsing, report field allowlisting, summary metrics, margin calculations, date state, deduplication, spreadsheet formula-injection protection, and safe backup restore.

## Trademark

Amazon and Seller Central are trademarks of Amazon.com, Inc. or its affiliates. Seller Ops Desk is an independent community project and is not affiliated with, endorsed by, or sponsored by Amazon.
