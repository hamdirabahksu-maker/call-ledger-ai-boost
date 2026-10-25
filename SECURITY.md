# Security policy

## Supported versions

Security reports are accepted for the latest default-branch version.

## Reporting a vulnerability

Please do not publish secrets, customer data, exploit details, or credentials in a public issue. Use GitHub's **Report a vulnerability** / private vulnerability reporting feature for this repository if it is enabled. If private reporting is unavailable, contact a repository maintainer through a private GitHub channel and share only the minimum information needed to reproduce the issue.

Do not include access tokens, buyer data, phone numbers, email addresses, database dumps, or production URLs in a report.

## Secret exposure

If a credential has been committed or disclosed, revoke or rotate it with its provider immediately. Removing it from the current tree or rewriting Git history does not make an exposed credential safe to reuse.

## Privacy-sensitive components

Seller Ops Desk is designed to parse report files locally and retain only whitelisted fields. A security report involving buyer data, file import, formula injection, local storage, or export behavior should include a synthetic test case instead of real marketplace data.
