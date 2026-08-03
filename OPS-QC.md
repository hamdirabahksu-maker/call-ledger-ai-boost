# Ops QC — finish checklist (you)

Code for Batch B/C is in this repo. Complete these before calling v1 done.

**Primary workflow:** local Cursor + this repo + **your** Supabase in `.env`. Do **not** rely on Lovable editor / agent / Publish. Lovable Cloud DB is legacy/optional only.

## Status (2026-08-02 local-first)

| Item | State |
|------|--------|
| Local Batch B/C code | Done — `npm run build` green; `/` `/demo` `/help` smoke **200** on `npm run dev` |
| Cloud DB Batch B | **Already applied** — `phone_verified_at`, `logo_url`, `demo_requests` + insert RLS. Keep using this DB from local. |
| Product URL | **Your local + your host** — abandon `*.lovable.app` as the ship target |
| Secrets / Auth SMTP / deploy | **You** — see below |

## Ship without Lovable

This is the default ship path.

### Day-to-day

```powershell
cd "C:\Users\rabah\Downloads\Succeful project\call-ledger-ai-boost"
npm run dev
```

Open `http://localhost:8080`. Edit React/TanStack files here. No sync back to Lovable.

### Your Supabase database

Local `.env` `SUPABASE_*` / `VITE_SUPABASE_*` should point at **your** project (e.g. `ojznlaarxestwwpredve`). Apply Batch B / KYC SQL there (`npm run db:kyc` or SQL editor). You are not dependent on Lovable Cloud for schema.

### Deploy (honest / simple)

`npm run build` uses Nitro with default preset **`cloudflare-module`** (writes `.output/` + `wrangler.json`).

| Host | Fit | Notes |
|------|-----|--------|
| **Cloudflare Workers** (recommended) | Best match | `npx wrangler deploy` from the build output (see `.output/nitro.json` commands). Set secrets/env in the Workers dashboard to match `.env`. |
| **Vercel** | Good | Nitro auto-detects or set `nitro: { preset: "vercel" }` in `vite.config.ts` / `NITRO_PRESET=vercel`. SSR + server functions need a Node/Edge-capable target — not a static-only site. |
| **Railway / Node VPS** | OK | Pin a Node preset, e.g. `nitro: { preset: "node-server" }`, then run the generated server. Point a public URL at it. |

After deploy:

1. Set production `APP_URL` and `VITE_APP_URL` to **your** origin (no trailing slash) — rebuild/redeploy if Vite-baked `VITE_*` must change.
2. Stripe webhook: `{APP_URL}/api/public/stripe-webhook`
3. Supabase Auth → redirect / site URL → same origin (+ keep localhost for local).
4. Confirm live `/demo` and `/help` return 200.

The old `https://call-ledger-ai-boost.lovable.app` URL can stay unused. Local + your host is the product.

## Next 15 minutes (exact click paths)

Do these in order; skip anything already done.

1. **Confirm local smoke** (already the product)
   - `npm run dev` → `/`, `/demo`, `/help` load
   - When ready for public traffic: deploy per **Ship without Lovable** above

2. **Auth email (critical — not Resend app key)**
   - Supabase / Cloud → **Auth** → **SMTP** or **Emails** custom domain
   - Auth → **Confirm email = ON**
   - Test: signup confirm + forgot password (newest link; check Spam)

3. **Twilio Verify SID (OTP)**
   - [Twilio Console](https://console.twilio.com/) → **Verify** → **Services** → create/select → copy **Service SID** (`VA…`)
   - Local `.env`: `TWILIO_VERIFY_SERVICE_SID`, plus `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
   - Settings in app → send OTP → enter real SMS code (never fake success)

4. **Service role + Stripe (as needed)**
   - Paste `SUPABASE_SERVICE_ROLE_KEY` into local `.env` (and host secrets) — required for Admin → Demo requests list
   - When ready for paid unlock: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; webhook `{APP_URL}/api/public/stripe-webhook`
   - Production `APP_URL` / `VITE_APP_URL` = **your host** (not localhost, not lovable.app unless you still publish there)

5. **Quick product smoke on your URL**
   - Landing **Book a demo** → `/demo` → submit → Admin → Demo requests
   - `/help` + `/help/getting-started`
   - Logo URL + booking slug on `/book/...`

## 1) Database migration

**Batch B already applied on the cloud DB.** Re-run only if a **new** empty environment.

If you ever need to re-apply (Supabase SQL editor), paste in order:

1. `supabase/migrations/20260802140000_batch_b_otp_demo_logo.sql`
2. Review notes in `supabase/migrations/20260802141000_batch_c_rls_notes.sql` (no required DDL; RLS sanity checklist)

Confirms: `businesses.phone_verified_at`, `businesses.logo_url`, table `demo_requests` (insert-only for public; no public SELECT).

## 2) Secrets (names)

Local `.env` audit (**SET / EMPTY / MISSING only** — no values printed):

| Secret | Purpose | Local status |
|--------|---------|--------------|
| `APP_URL` / `VITE_APP_URL` | Origin, no trailing slash | SET (use **your host** in prod) |
| `SUPABASE_URL` / `VITE_SUPABASE_*` / project ids / publishable keys | Auth + DB | SET |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin / demo_requests SELECT | **EMPTY** — paste from Supabase API → service_role |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Paid unlock | EMPTY |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | SMS | EMPTY |
| `TWILIO_VERIFY_SERVICE_SID` | Phone OTP | **EMPTY** — must set from Verify → Services |
| `RESEND_API_KEY` | Demo notify / waitlist | EMPTY (**not** Auth mail) |
| `LOVABLE_API_KEY` | Optional AI helpers | EMPTY (skip if unused) |

Re-check anytime (prints SET/EMPTY only, never values):

```powershell
npm run check-env
```

**Do not commit `.env`.** If keys came from a zip (`.env.from-archive`), **rotate** them in Supabase/Stripe/Twilio before production.

### Local env gaps to fill

1. Add `SUPABASE_SERVICE_ROLE_KEY` (Admin demo list / server admin client).
2. Paste Twilio + Verify SID when doing OTP/SMS QC; Stripe when doing checkout QC.
3. Leave empty rather than guessing — especially `TWILIO_VERIFY_SERVICE_SID`.

## 3) Auth email deliverability (critical)

**`RESEND_API_KEY` alone ≠ Auth mail.** Signup confirm and password reset use **Supabase Auth email**.

Do one of:

- Auth → custom email domain, **or**
- Auth **SMTP** (e.g. Resend SMTP credentials in Auth settings)

Also:

- Confirm email = **ON**
- Test: signup confirm + forgot password (newest link, check Spam)

## 4) Product smoke

- [ ] Paid login → `/app` Preview gone
- [ ] Settings → send OTP → confirm code (or clear **Connect Twilio Verify** banner — never fake success)
- [ ] `/help` + `/help/getting-started` load
- [ ] `/demo` submits; row in Admin → Demo requests
- [ ] Landing **Book a demo** → `/demo` (not `#how`)
- [ ] Logo URL + booking slug on `/book/...` and quote page
- [ ] SMS to Twilio-verified number (when `TWILIO_*` set)

## 5) Deploy (no Lovable Publish)

See **[Ship without Lovable](#ship-without-lovable)** above.

- Prefer Cloudflare Workers (matches default Nitro preset), or Vercel / Node host
- Set production `APP_URL` / `VITE_APP_URL` to that origin
- Webhook: `{APP_URL}/api/public/stripe-webhook`

## 6) Twilio Verify SID (OTP)

1. Twilio Console → **Verify** → Services → create/select a service
2. Copy Service SID → set `TWILIO_VERIFY_SERVICE_SID` in local `.env` and host secrets
3. Also need `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN`
4. Settings → Phone verification should send a real SMS code; unverified badge clears only after approve

## 7) Out of scope (v1)

Mobile app, voice AI, Instagram DMs, mass SMS broadcast (use **Marketing** drafts instead), client MCP.
