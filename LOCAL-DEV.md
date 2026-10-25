# Local development

This repository contains the CallLedger application and the independent Seller Ops Desk utility.

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project for the authenticated CallLedger application
- Optional provider accounts only if you explicitly enable the corresponding integration

## Set up CallLedger

1. Install dependencies with npm install.
2. Copy .env.example to .env.
3. Fill in only the environment values for services you control. Use development projects and test-mode provider credentials locally.
4. Run npm run check-env to verify configuration status. The command is designed not to print secret values.
5. Start the app with npm run dev and run npm run build before submitting changes.

Never commit a real .env, access token, service-role key, webhook secret, customer export, or database dump. If a credential was committed or shared, rotate it with its provider; deleting the latest copy does not erase older Git history.

## Set up Seller Ops Desk

    cd tools/seller-ops-desk
    npm test
    npm run check
    npm start

The tool uses manually exported Seller Central CSV/TSV reports and browser-local storage. Report data is not uploaded. Use synthetic sample data when debugging or opening issues.

## Database migrations

SQL files are under supabase/migrations/; supabase/ALL_MIGRATIONS.sql is the consolidated schema reference. Review migrations and your target database before applying them. Never run destructive migrations against production without a verified backup and a reviewed rollback plan.

## Provider integrations

Stripe, Twilio, Resend, and Supabase must be configured through your environment or deployment secret manager. For email sending, configure RESEND_FROM_EMAIL; optional demo notifications also require DEMO_NOTIFICATION_EMAIL. Keep these addresses deployment-specific rather than hard-coded in source.

Amazon SP-API is not connected in this version. A project-local CSV import is not the same as an authorized live API integration.
