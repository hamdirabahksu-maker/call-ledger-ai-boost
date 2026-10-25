export type HelpCategory = "setup" | "sms" | "billing" | "booking" | "marketing" | "ai";

export type HelpArticle = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: HelpCategory;
};

export const HELP_CATEGORIES: { id: "all" | HelpCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "setup", label: "Setup" },
  { id: "sms", label: "SMS" },
  { id: "billing", label: "Billing" },
  { id: "booking", label: "Booking" },
  { id: "marketing", label: "Marketing" },
  { id: "ai", label: "AI / MCP" },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    summary: "Sign up, verify your business, onboard, and share your booking link.",
    category: "setup",
    body: `1. Open the app (http://localhost:8080 locally, or your deployed host URL).
2. Start pilot / Sign up — accept Terms & Privacy.
3. Confirm your email, then complete onboarding (business name, industry, country, phone, SMS template).
4. Complete business KYC at /kyc (legal name, registration/tax id, phone OTP when Twilio Verify is set). See the Business KYC guide.
5. Open Settings → Booking — set your slug, enable the public link, copy /book/your-slug.
6. Share the link with clients; bookings appear under Bookings.
7. Create an Estimate → share /quote/...
8. Connect Twilio for real SMS and Stripe for paid unlock.
9. Optional: connect AI tools via CallLedger MCP — Settings → AI / MCP, or read Connect AI / MCP.
Support: use Admin or the contact on your account.`,
  },
  {
    slug: "auth-email",
    title: "Auth & email",
    summary: "Confirm email, password reset, and spam tips.",
    category: "setup",
    body: `Confirm email must be ON in Cloud Auth.
Password reset and signup confirmation use Cloud Auth email — RESEND_API_KEY alone does not send Auth mail. Configure Cloud → Emails custom domain or Auth SMTP (e.g. Resend SMTP).
If mail lands in Spam: mark Not spam, then fix domain/SMTP.
Reset links expire quickly — use the newest email and open within a few minutes.`,
  },
  {
    slug: "twilio",
    title: "Twilio SMS",
    summary: "Send real recovery SMS and phone OTP verification.",
    category: "sms",
    body: `Docs: https://www.twilio.com/docs/sms
Add in secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (E.164).
For phone OTP also add TWILIO_VERIFY_SERVICE_SID (Twilio Console → Verify → Services).
Trial accounts can only SMS verified numbers until upgraded.
Unpaid accounts stay in Preview mode — SMS send is gated until subscription is active.
We never fake “SMS sent” or OTP success when Twilio/Verify is missing.`,
  },
  {
    slug: "stripe-billing",
    title: "Stripe & billing",
    summary: "Pilot / Starter / Growth checkout and webhooks.",
    category: "billing",
    body: `Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, APP_URL = live origin (no localhost in production).
Webhook URL: {APP_URL}/api/public/stripe-webhook
After pay, /app Preview banner should disappear when status is active or trialing.
Use a new checkout session after APP_URL fixes — old sessions keep old success URLs.`,
  },
  {
    slug: "booking",
    title: "Public booking",
    summary: "Your /book/$slug page for clients — logo included.",
    category: "booking",
    body: `Enable booking in Settings, set a unique booking slug, copy the live URL.
Clients pick a slot; bookings appear under Bookings.
Upload a logo URL in Settings so it shows on the public page.`,
  },
  {
    slug: "quotes",
    title: "Estimates & quotes",
    summary: "Share /quote/$token links customers can accept.",
    category: "booking",
    body: `Create an estimate in Estimates, share the public token link.
Customers can accept or decline.
Your business name and logo (if set) appear on the quote page.`,
  },
  {
    slug: "reviews",
    title: "Reviews",
    summary: "Ask for Google reviews after jobs.",
    category: "booking",
    body: `Set your Google review URL in Settings → Notifications.
Use Reviews to send SMS asks when Twilio is connected and the account is paid.`,
  },
  {
    slug: "marketing",
    title: "AI Marketing",
    summary: "Draft SMS, social, and blurbs for your shop.",
    category: "marketing",
    body: `Open Marketing from the sidebar.
Tabs: SMS / Social / Blurb — generate drafts (requires AI gateway credits when configured).
Copy and send via your channels; one-to-one SMS still uses Twilio when paid.
v1 has no mass SMS broadcast — use Marketing drafts instead of a blast tool.`,
  },
  {
    slug: "instagram",
    title: "Instagram (later)",
    summary: "Out of scope for v1 — planned after Twilio + Stripe + Help.",
    category: "marketing",
    body: `Instagram publishing and DMs are not in v1.
When built: Meta Business/Creator account, Facebook Page, App Review, then connectors.
Finish Twilio + Stripe + Auth email first.`,
  },
  {
    slug: "oauth",
    title: "OAuth providers",
    summary: "Google, Microsoft, GitHub sign-in.",
    category: "setup",
    body: `Enable providers in Cloud → Auth → Providers.
Buttons show “provider not connected” honestly until Client ID/Secret are set.
Google is enough for most shops; Azure/GitHub are optional.`,
  },
  {
    slug: "business-kyc",
    title: "Business KYC",
    summary: "Verify your shop identity after signup — legal name, registration id, phone OTP.",
    category: "setup",
    body: `CallLedger separates contact checks from business identity.

Contact verification
- Confirm email (required before the app).
- Phone OTP via Twilio Verify when TWILIO_VERIFY_SERVICE_SID is configured (Settings and /kyc).

Business KYC (/kyc)
1. After onboarding you are sent to /kyc if status is still pending or rejected.
2. Enter legal business name, registration or tax id, and optional document URL.
3. Complete phone OTP when Verify is connected — we never fake OTP success.
4. Submit → status becomes submitted. You can use the app while an admin reviews.
5. Admin marks verified or rejected. Rejected shops return to /kyc to resubmit.

Statuses: pending → submitted → verified | rejected.
Support: Admin list for manual approve until automation is added.`,
  },
  {
    slug: "connect-ai-mcp",
    title: "Connect AI / MCP",
    summary: "Point Cursor (or any MCP client) at your CallLedger business endpoint.",
    category: "ai",
    body: `CallLedger exposes a business MCP server so your AI tools can read and act on your shop data — leads, bookings, customers, invoices, estimates, reviews, and missed calls.

Endpoint
- Production: https://YOUR_APP_URL/mcp
- Local: http://localhost:8080/mcp (or your Vite/Nitro port)
- Copy the live URL from Settings → AI / MCP.

Auth
- Sign in with your CallLedger account (Supabase OAuth / session). Tools are scoped to your business via RLS — never invent data for another shop.

Tools (v0.2)
- business_summary, list_leads, create_lead, list_bookings, create_booking, list_customers, list_missed_calls, list_invoices, list_estimates, list_review_requests

Cursor plugin
- Install callledger-cursor-plugin (see its README). Replace APP_URL with your deployed origin, then smoke-test one tool.

Rules for agents
- For clinics: scheduling is administrative only — never give medical advice.
- Never invent SMS or OTP success when Twilio is not connected.`,
  },
];

export function getHelpArticle(slug: string) {
  return HELP_ARTICLES.find((a) => a.slug === slug) ?? null;
}
