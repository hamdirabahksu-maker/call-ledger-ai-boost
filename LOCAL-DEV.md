# CallLedger — local-first development

This folder is the **product source of truth**. Edit and run it in Cursor. Do **not** use the Lovable editor, agent, or **Publish** for day-to-day work or shipping.

**Backend source of truth:** your own Supabase project via `.env` (expected ref: `ojznlaarxestwwpredve`). Lovable Cloud is optional/legacy only — not required for schema, auth, or day-to-day.

## Quick start

```powershell
cd "C:\Users\rabah\Downloads\Succeful project\call-ledger-ai-boost"
npm install
npm run dev
```

- **Local URL:** `http://localhost:8080` (update `APP_URL` / `VITE_APP_URL` if the terminal prints another port).
- Lockfile in the export is `bun.lock`. `npm install` works with Node. Optional: Bun → `bun install` / `bun run dev`.
- **Windows note:** `@lovable.dev/mcp-js` Vite plugin crashes on path separators. It is **off by default** in `vite.config.ts`. Only set `LOVABLE_MCP=1` if you specifically need that plugin (legacy).

Smoke check: open `/`, `/demo`, `/help` — all should load (200).

## Secrets / env

1. Copy `.env.example` → `.env` (if not already).
2. Fill real values from **your Supabase project** (Dashboard → Project Settings → API).
3. Verify without printing secrets: `npm run check-env` (SET / EMPTY only).
4. **No quotes** around values in `.env` — use `SUPABASE_URL=https://….supabase.co` not `"https://…"`. Quotes break the URL and auth looks “dead.” If needed: `node scripts/fix-env-quotes.mjs`
5. **Do not commit** `.env` or `.env.from-archive`. After editing `.env`, restart `npm run dev`.

### Required for Auth + DB

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase API URL |
| `SUPABASE_PUBLISHABLE_KEY` | Anon / publishable key (server) |
| `VITE_SUPABASE_URL` | Same URL for the browser client |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same key for the browser client |
| `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` | Project ref |
| `APP_URL` / `VITE_APP_URL` | Local: `http://localhost:8080`. Prod: your host origin (no trailing slash) |

### Optional (features degrade if missing)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Admin / server reads (demo requests) |
| `SUPABASE_ACCESS_TOKEN` | Personal access token — lets `npm run db:migrate` / `npm run db:kyc` apply SQL from this PC |
| `TWILIO_*` / `TWILIO_VERIFY_SERVICE_SID` | SMS + phone OTP |
| `STRIPE_*` | Checkout / webhooks |
| `RESEND_API_KEY` | Demo notify (not Auth mail) |
| `LOVABLE_API_KEY` | Legacy AI gateway only — leave empty unless you intentionally use it |

### Apply database schema (your Supabase project)

**Option A (easiest once):** open  
https://supabase.com/dashboard/project/ojznlaarxestwwpredve/sql/new  
→ paste entire file `supabase/ALL_MIGRATIONS.sql` → **Run**.

**Option B (from Cursor):** add `SUPABASE_ACCESS_TOKEN` from  
https://supabase.com/dashboard/account/tokens  
then:

```powershell
npm run db:migrate
```

**KYC only** (if core schema already exists):

```powershell
npm run db:probe-kyc   # EXISTS vs MISSING
npm run db:kyc         # needs SUPABASE_ACCESS_TOKEN
```

Or paste `supabase/migrations/20260803200000_business_kyc.sql` in the SQL editor.

Then Auth → URL config: Site URL `http://localhost:8080`, redirect `http://localhost:8080/**`.

If a zip shipped a real `.env`, it was renamed to **`.env.from-archive`** (gitignored). Treat those keys as exposed — **rotate** them before production. Prefer dashboard → `.env`.

## Backend: your Supabase (primary)

| Path | What you do |
|------|-------------|
| **Primary — your Supabase** | `.env` points at `ojznlaarxestwwpredve`. Apply migrations / KYC SQL here. |
| **Legacy — old Lovable Cloud DB** | Only if you still need historical data from that project — not the day-to-day path. |

Auth confirmation / password-reset email is **Supabase Auth SMTP / custom domain**, not `RESEND_API_KEY`. Configure that in the Supabase Auth settings for your project.

## Design → code

1. Figma: https://www.figma.com/design/PMiAmsigk53HN12SuETxgZ — node index in `../cursor-team/FIGMA-CALLLEDGER.md`
2. Implement here with `BrandLockup` / `PublicChrome` / existing tokens — not Lovable agent.
3. See `.cursor/rules/local-first-figma.mdc`

## Ship (no Lovable required)

See **[OPS-QC.md → Ship without Lovable](./OPS-QC.md#ship-without-lovable)** for the full checklist.

Short version:

1. Develop with `npm run dev` here.
2. `npm run build` → Nitro output under `.output/` (default preset: **Cloudflare Workers**). Stub: `wrangler.toml`. Prefer the emitted `.output/wrangler.json` after build.
3. **Only after you approve deploy:** `npm run deploy:cf` (build + `npx wrangler deploy`), or set `nitro: { preset: "vercel" }` / `NITRO_PRESET` for Vercel, or a Node preset for Railway-style hosts.
4. Set production `APP_URL` / `VITE_APP_URL` to **your** origin.
5. Keep `SUPABASE_*` on **your** project. Abandon `*.lovable.app` as the product URL.

## Related

| Item | Value |
|------|--------|
| Workspace pointer | `Succeful project\cursor-team\LOCAL-CALLLEDGER.md` |
| Figma index | `Succeful project\cursor-team\FIGMA-CALLLEDGER.md` |
| Ops checklist | [OPS-QC.md](./OPS-QC.md) |
| Human tasks | `Succeful project\cursor-team\HUMAN-TASKS.md` |
| Legacy Lovable project id (reference only) | `7dfb742a-c971-49ff-8acd-2eca08b85c86` |
| Legacy live URL (optional to abandon) | https://call-ledger-ai-boost.lovable.app |

## Stack

TanStack Start + Vite + React + Tailwind + shadcn + Supabase (`package.json` name: `tanstack_start_ts`).
