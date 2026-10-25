# CallLedger + Seller Ops Desk

Open-source tools for organizing service-business operations and marketplace selling workflows.

- **CallLedger** is a business operations app for leads, missed-call follow-ups, bookings, estimates, invoices, and review requests.
- **Seller Ops Desk** is a local-first browser tool for importing Amazon Seller Central report exports, summarizing sales, estimating contribution margin, and tracking internal supplier/partner follow-ups.
- **CallLedger Seller Ops Core** is a dependency-free JavaScript package for privacy-conscious CSV/TSV parsing, sales summaries, unit economics, and safe workspace backups.

## Seller Ops Desk

Seller Ops Desk imports manually exported CSV/TSV files. It runs in the browser and stores its workspace in that browser's local storage. It intentionally ignores unknown report columns, including buyer email, phone, and address columns.

The live Selling Partner API (SP-API) and OAuth authorization are **not implemented**. Do not enter API credentials or claim live Amazon connectivity. The tool does not send messages to buyers or upload report data.

### Run locally

```sh
cd tools/seller-ops-desk
npm test
npm run check
npm start
```

The server binds to `127.0.0.1` and prints the local URL. The app has no third-party runtime dependencies.

### Try the static demo

The repository includes a GitHub Pages workflow that publishes only the four front-end files of Seller Ops Desk (not server code, tests, or repository documentation). To enable it, open **Settings → Pages**, choose **GitHub Actions** as the deployment source, and then run **Publish Seller Ops Desk demo** from the Actions tab. Once the workflow succeeds, the deployment URL appears in the workflow run.

## Reusable JavaScript package

Package source: [`packages/seller-ops-core`](./packages/seller-ops-core/).

The package is prepared for publication as `callledger-seller-ops-core`; it is **not published to npm yet**. It offers:
- CSV, TSV, and semicolon-separated parsing with quoted field handling;
- explicit allowlists for saved order data and backup restore;
- sales summaries grouped by currency;
- safe spreadsheet CSV output;
- caller-supplied unit economics calculations;
- versioned backup helpers.

To test it locally:

```sh
cd packages/seller-ops-core
npm test
npm run check
```

Publishing instructions are in [`packages/seller-ops-core/README.md`](./packages/seller-ops-core/README.md). Publishing requires an npm account that controls the package name and an explicitly configured release credential.

## Status and external impact

This is an early open-source project. We do not claim specific external user, download, or dependency counts unless they can be verified from public evidence. User surveys and expressions of interest are not the same as actual product usage.

## CallLedger application

The root project also contains the broader CallLedger business operations application, built with React, TanStack Start, TypeScript, Supabase, and optional provider integrations. Its production deployment is not configured by this repository's Seller Ops Desk demo workflow.

## Trademark

Amazon and Seller Central are trademarks of Amazon.com, Inc. or its affiliates. These projects are independent and are not affiliated with, endorsed by, or sponsored by Amazon.

## Privacy and security

- Never commit `.env`, keys, tokens, production exports, database dumps, or real customer records.
- Copy `.env.example` to `.env` and supply values for your own environment. The example contains placeholders only.
- Use synthetic names and reserved example domains in tests.
- If an actual credential was ever committed, rotate it with its provider; removing the current copy does not invalidate the credential or erase old pull-request refs.
- Report vulnerabilities privately using [`SECURITY.md`](./SECURITY.md).

## License

MIT License. See [`LICENSE`](./LICENSE).
