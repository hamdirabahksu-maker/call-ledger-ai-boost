# Operations and release checklist

Use this checklist before deploying the CallLedger application or distributing Seller Ops Desk.

## Before release

- [ ] Review the full diff and dependency changes.
- [ ] Confirm no .env, credentials, local paths, personal contact details, production URLs, or real customer records are tracked.
- [ ] Run the static checks and build for the main application.
- [ ] In tools/seller-ops-desk/, run npm test and npm run check.
- [ ] Validate authorization with at least one ordinary user and one explicitly assigned administrator.
- [ ] Review Supabase RLS policies and service-role usage.
- [ ] Verify authentication confirmation and password-reset flows with a development project.
- [ ] Verify payment and messaging integrations only with provider test credentials.
- [ ] Confirm logs do not include tokens, message bodies, customer contact data, or payment secrets.
- [ ] Inspect public-facing privacy and terms content and configure operator support details before operating a production service.

## Secrets

The tracked .env.example is for variable names and placeholders only. Real values belong in a local ignored .env or a deployment secret manager. If any credential has ever been committed, rotate it with the provider; history cleanup alone is not enough.

## Seller Ops Desk privacy check

- [ ] Confirm the imported report stays in the browser.
- [ ] Confirm buyer email, phone, and address fields are not retained by the parser.
- [ ] Use only synthetic fixtures in tests.
- [ ] Confirm the UI states clearly that live SP-API OAuth is not implemented.
- [ ] Follow applicable marketplace policies and laws when recording or contacting business leads.

## Deployment

Set production secrets with your hosting provider and use the least-privileged keys possible. Do not deploy from this repository until all environment-specific URLs, administrator assignment, provider webhooks, backups, monitoring, and legal operator information have been configured and independently checked.
