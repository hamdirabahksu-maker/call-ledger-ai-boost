# Contributing

Thanks for helping improve CallLedger or Seller Ops Desk.

## Before opening a change

- Open an issue first for large features so scope and security implications can be discussed.
- Keep each pull request focused and explain the behavior change.
- Add tests for parsers, calculations, permissions, and data-handling behavior.
- Use synthetic records only. Never attach customer exports, emails, phone numbers, tokens, or production screenshots.
- Do not add live credentials, project-specific deployment identifiers, or private design links.
- Run the checks described in the root README and the relevant subproject instructions.
- State clearly which integrations were tested and which remain unconfigured.

## Seller Ops Desk principles

- Report import must run in the browser and only retain explicitly allowlisted non-contact fields.
- Keep buyer names, emails, phone numbers, street addresses, and other personal data out of persisted state and exports.
- Do not add mass messaging or automated buyer contact. Use the tool for internal follow-ups.
- No feature may claim to connect to SP-API until OAuth authorization, permissions, data handling, and end-to-end tests are implemented.
- Preserve local-first behavior unless a change is explicitly reviewed for privacy.

## Review checklist

- [ ] Tests added or updated
- [ ] No secrets or private data in diffs or fixtures
- [ ] Authorization checked on the server
- [ ] Accessibility and keyboard behavior considered
- [ ] Documentation accurately describes live vs. stubbed functionality
- [ ] No unrelated or generated-file churn
