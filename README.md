# CallLedger AI

AI front office for service businesses — missed-call SMS recovery, booking, estimates, invoices, reviews.

**Local-first:** this repo + your Supabase (`.env`) + Cloudflare (or other) deploy. **Lovable is not required** for day-to-day or shipping.

```powershell
npm install
npm run dev
```

→ http://localhost:8080  

See [LOCAL-DEV.md](./LOCAL-DEV.md) for env vars and backend options. Finish checklist: [OPS-QC.md](./OPS-QC.md) · human tasks: `../cursor-team/HUMAN-TASKS.md`.

## Stack

- TanStack Start + React + Tailwind
- Supabase Auth / Postgres (**your** project via `.env`)
- Stripe checkout + webhook
- Twilio SMS + Verify OTP

## Key routes

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/auth` | Sign in / sign up / forgot |
| `/app` | Dashboard |
| `/kyc` | Business KYC soft-gate |
| `/settings` | Business, booking slug, logo, phone OTP, billing |
| `/help` | Help center |
| `/demo` | Book a product demo |
| `/book/$slug` | Public booking |
| `/quote/$token` | Public estimate |
| `/admin` | Ops (admin role) |

## Reality Pass

- **Batch A:** email confirm gate, AppShell, real actions, Stripe/Twilio wiring
- **Batch B:** phone OTP, `/help`, `/demo`, logo + booking slug on public pages
- **Batch C:** rate limits on SMS/OTP/demo/confirm-email resend; RLS notes in `supabase/migrations/`
- **KYC / Connect AI / MCP:** soft KYC gate + Connect AI + MCP settings polish (`feature/kyc-connect-ai-mcp`)
- **Cleanup:** sample seed disabled; no mass SMS broadcast (use **Marketing** drafts); see [OPS-QC.md](./OPS-QC.md)

Apply migrations on **your** Supabase (see LOCAL-DEV.md). KYC:

```powershell
npm run db:probe-kyc
npm run db:kyc   # needs SUPABASE_ACCESS_TOKEN, or paste SQL in dashboard
```

## Ship without Lovable

1. `npm run dev` locally; fill `.env` from **your** Supabase (see `.env.example`).
2. `npm run build` — Nitro defaults to **Cloudflare Workers** (`.output/` + wrangler).
3. Deploy to Cloudflare (simplest), or Vercel / Node host with the matching Nitro preset.
4. Point `APP_URL` / `VITE_APP_URL` at **your** host. Keep `SUPABASE_*` on your project.

Details: [OPS-QC.md — Ship without Lovable](./OPS-QC.md#ship-without-lovable). The live `*.lovable.app` URL can be abandoned; local + your host is the product.
