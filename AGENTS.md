# Repository guidance

- Keep secrets, deployment URLs, account identifiers, customer exports, and personal contact details out of version control.
- Use `.env.example` only for variable names and obvious placeholders.
- Prefer explicit server-side authorization checks; never grant privileges based on an email address alone.
- Keep Seller Ops Desk self-contained under `tools/seller-ops-desk/` and preserve its offline-first privacy model.
- Never describe the Amazon Selling Partner API as connected until a compliant OAuth integration has been configured and tested.
- Run `npm test` and `npm run check` inside `tools/seller-ops-desk/` before submitting changes there.
