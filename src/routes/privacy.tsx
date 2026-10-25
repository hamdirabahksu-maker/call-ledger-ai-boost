import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLockup } from "@/components/brand-lockup";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — CallLedger" },
      { name: "description", content: "How CallLedger collects, uses, and protects your data." },
      { property: "og:title", content: "Privacy Policy — CallLedger" },
      { property: "og:description", content: "How CallLedger collects, uses, and protects your data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

const UPDATED = "July 24, 2026";

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6">
          <BrandLockup size="sm" />
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Legal</p>
        <h1 className="mt-3 font-display text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-white/50">Last updated: {UPDATED}</p>

        <div className="prose prose-invert mt-10 max-w-none space-y-8 text-white/75">
          <section>
            <h2 className="font-display text-xl text-white">1. Who we are</h2>
            <p>CallLedger ("CallLedger", "we", "us") provides an AI front-office platform that helps service businesses recover missed calls, book jobs, send estimates and invoices, and request reviews. This page explains what we collect and how we handle it. For questions, use the help center.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">2. Data we collect</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong className="text-white">Account data:</strong> email, password hash, name (optional), authentication provider identifiers.</li>
              <li><strong className="text-white">Business profile:</strong> business name, industry, country, service area, phone, timezone, booking availability, review URL, after-hours message.</li>
              <li><strong className="text-white">Operational data:</strong> leads, calls, bookings, customers, estimates, invoices, review requests, marketing drafts you create in CallLedger.</li>
              <li><strong className="text-white">Contact data from your customers:</strong> the name, phone, email and job notes your customers submit through your booking link or that you enter manually.</li>
              <li><strong className="text-white">Payment data:</strong> when you subscribe, Stripe processes your card on our behalf. We store subscription status, plan and billing period — never full card numbers.</li>
              <li><strong className="text-white">Technical data:</strong> IP address, browser, device, error logs, and basic usage events needed to run and secure the service.</li>
              <li><strong className="text-white">Cookies:</strong> a required session cookie plus any functional or advertising cookies you accept in our cookie banner.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">3. How we use it</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Operate CallLedger — authenticate you, run your dashboard, store your business data.</li>
              <li>Deliver features you trigger — send SMS via Twilio, generate marketing/estimate content via AI, send transactional email, process subscriptions via Stripe.</li>
              <li>Support, security, fraud prevention, and service improvement.</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <p className="mt-3">We do not sell your data. We do not use your business or customer data to train third-party AI models.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">4. Sub-processors</h2>
            <p>We rely on a small set of providers to run CallLedger:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Supabase — database, authentication, storage.</li>
              <li>Cloudflare — hosting and edge delivery.</li>
              <li>Stripe — subscription billing.</li>
              <li>Twilio — SMS delivery (when you configure it).</li>
              <li>Resend — transactional email (when configured).</li>
              <li>Google AI / Lovable AI Gateway — AI generation for marketing and estimate drafts you request.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">5. Data location and retention</h2>
            <p>Data is stored on infrastructure hosted primarily in the United States and European Union. We retain your account and business data for as long as your account is active, and for a limited period afterward for legal and accounting purposes. You may request deletion at any time.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">6. Your rights</h2>
            <p>Depending on your jurisdiction (including GDPR and CCPA/CPRA), you have the right to access, correct, export, or delete your personal data, and to object to certain processing. Use the Help page to submit privacy requests; the operator will respond within a reasonable timeframe.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">7. Security</h2>
            <p>We use TLS in transit, encryption at rest for managed database storage, row-level security to isolate each business's data, and least-privilege service credentials. No system is perfectly secure — please use a strong, unique password and keep your account credentials safe.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">8. Customers of CallLedger customers</h2>
            <p>If you booked a job or received an estimate through a CallLedger link, the business you're contacting is the controller of that data. CallLedger acts as their processor. Please contact them directly for access or deletion requests.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">9. Changes</h2>
            <p>We may update this policy. Material changes will be announced by email or in-app before they take effect.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">10. Contact</h2>
            <p>Use the support channel published by the operator for account and privacy requests.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
