# CallLedger Seller Ops Core

A dependency-free JavaScript library for building privacy-conscious seller-operations tools.

## What it provides

- CSV, TSV, and semicolon-separated report parsing, including quoted fields and escaped quotes.
- Whitelisted order field extraction: unknown columns are discarded rather than copied into the retained order objects.
- Sales summaries by currency and cancellation status.
- Deduplication for repeat imports.
- Unit economics estimates using caller-provided inputs (not fetched/current marketplace fees).
- Follow-up due-date classification.
- Safe CSV cell output that protects against common spreadsheet formula injection.
- Versioned backup export/restore with explicit field allowlists.

## Install

```sh
npm install callledger-seller-ops-core
```

## Example

```js
import { parseSellerReport, summarizeOrders, calculateUnitEconomics } from 'callledger-seller-ops-core';

const report = `order-id,sku,quantity,item-price,currency,order-status
EXAMPLE-1,SKU-A,2,29.98,USD,Shipped
EXAMPLE-2,SKU-B,1,14.99,USD,Cancelled`;

const { orders, warnings } = parseSellerReport(report);
console.log(warnings);
console.log(summarizeOrders(orders));

const economics = calculateUnitEconomics({
  sellingPrice: 30,
  unitCost: 10,
  referralRatePct: 15,
  fulfillmentCost: 5,
  shippingCost: 1,
  adCost: 2
});
console.log(economics);
```

## Privacy model and limits

The parser retains only the documented order fields: order ID, date, SKU, ASIN, title, quantity, item price, currency, status, and marketplace. It does not preserve unknown source columns, including buyer name, email, phone, or address columns. The caller is responsible for how inputs and returned objects are persisted.

This package parses reports exported manually by the operator. It does not connect to Amazon Selling Partner API (SP-API), authorize seller accounts, fetch live fee schedules, or interact with Seller Central. Do not pass passwords, access tokens, or API credentials to it.

The library does not upload data. It is pure JavaScript and has no third-party runtime dependencies.

## Publication status

This package is prepared for npm publication but has **not yet been published**. Verify that `callledger-seller-ops-core` is available in the npm registry before publishing.

### First publication

The first release requires an npm account that can claim the package name. After reviewing the package contents and tests, a maintainer must either:
- publish the first release from a local machine with npm login; or
- add a short-lived/limited `NPM_TOKEN` GitHub Actions secret for the initial release.

Do not put a token in the repository or in an issue.

### Configure trusted publishing for subsequent releases

The workflow at `.github/workflows/publish-seller-ops-core.yml` uses GitHub Actions OIDC (Node.js 24; npm CLI 11.5.1+). After the package exists, open its npm settings and add a **GitHub Actions Trusted Publisher** with:
- GitHub owner: `hamdirabahksu-maker`
- Repository: `call-ledger-ai-boost`
- Workflow filename: `publish-seller-ops-core.yml`
- No GitHub Environment is configured in the workflow.

Then run the workflow with `confirm_publish=true` when intentionally publishing a new version. npm Trusted Publishing requires this npm-side configuration; a green GitHub test run alone does not publish the package.

Download counts and dependent packages will only be reported after the registry provides real data.

## Development

```sh
npm test
npm run check
```

## Trademark

Amazon and Seller Central are trademarks of Amazon.com, Inc. or its affiliates. This independent package is not affiliated with, endorsed by, or sponsored by Amazon.
