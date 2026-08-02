# Call Recovery Hub

Build CallLedger AI — a serious B2B SaaS (not a template site).

PRODUCT: AI front-office for solo HVAC, plumbing, and electrical businesses (1–10 person shops in US/Canada). They miss after-hours calls and lose $800–$3000 jobs. ServiceTitan is too expensive. We are the simple AI layer: missed-call recovery → SMS/voice booking → estimate follow-up → review ask.

DESIGN: Bold industrial-clean. Dark charcoal + amber accent. No purple SaaS clichés. No generic Inter look — distinctive typography. Mobile-first (owners are on phones). Full-bleed hero with real trade-atmosphere imagery vibe (gradient/atmosphere OK if no photo). Brand name CALLLEDGER must dominate the first viewport. One headline, one subline, one CTA group only in hero — no stats strips or card grids in hero.

PAGES TO BUILD NOW:
1) Marketing landing (/) — hero, problem (missed calls), solution (3 steps), pricing ($49 pilot / $99 Starter / $199 Growth monthly), FAQ, final CTA. Support email: hamdi.rabahksu@gmail.com
2) Auth stub — Sign up / Log in (email magic link or email+password via Lovable cloud auth if available)
3) App dashboard (/app) — protected: Today’s leads, Missed calls list (mock data), Bookings calendar strip, Quick actions (Send estimate SMS, Ask for review). Make it feel like a real product, not Lorem ipsum.
4) Onboarding (/onboarding) — business name, trade type (HVAC/Plumbing/Electrical), phone, service area, after-hours message.

TECH: Production-quality React + Tailwind + shadcn. Use Lovable Cloud/database if needed for waitlist + businesses table. Waitlist/early access capture on landing that stores email + trade type.

COPY TONE: Direct, money-aware, respect tradespeople. No hype-bro language. No medical content.

Ship a polished MVP preview in this first build.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://call-ledger-ai-boost.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7dfb742a-c971-49ff-8acd-2eca08b85c86).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
