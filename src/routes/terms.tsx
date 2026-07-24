import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLockup } from "@/components/brand-lockup";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — CallLedger" },
      { name: "description", content: "The terms governing use of CallLedger." },
      { property: "og:title", content: "Terms of Service — CallLedger" },
      { property: "og:description", content: "The terms governing use of CallLedger." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

const UPDATED = "July 24, 2026";

function TermsPage() {
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
        <h1 className="mt-3 font-display text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-white/50">Last updated: {UPDATED}</p>

        <div className="prose prose-invert mt-10 max-w-none space-y-8 text-white/75">
          <section>
            <h2 className="font-display text-xl text-white">1. Acceptance</h2>
            <p>By creating a CallLedger account or using the service, you agree to these Terms and to the <Link to="/privacy" className="text-primary hover:brightness-110">Privacy Policy</Link>. If you're accepting on behalf of a business, you represent that you have authority to bind that business.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">2. The service</h2>
            <p>CallLedger is an AI front-office platform for service businesses: missed-call recovery, booking links, estimates, invoices, review requests, and marketing content generation. Feature availability may depend on your plan and any integrations you connect (e.g., Twilio, Stripe).</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">3. Accounts</h2>
            <p>You must provide accurate information and keep your credentials confidential. You are responsible for all activity under your account. We may suspend or terminate access for violation of these Terms or for abusive behavior.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">4. Plans, billing, and refunds</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Plans: Pilot $49/month, Starter $99/month, Growth $199/month, billed monthly in USD via Stripe.</li>
              <li>Subscriptions renew automatically until cancelled. Cancel any time from your billing portal; access continues through the end of the current period.</li>
              <li>Fees are non-refundable except where required by law.</li>
              <li>Taxes are your responsibility unless we collect them at checkout.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">5. Acceptable use</h2>
            <p>You may not use CallLedger to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Send unlawful, deceptive, harassing, or unsolicited messages.</li>
              <li>Violate telecom or anti-spam laws (TCPA, CAN-SPAM, CASL, GDPR/e-Privacy, TRAI, etc.). You are responsible for having proper consent to contact your customers.</li>
              <li>Provide medical, legal, or financial advice through CallLedger's AI. Clinical and medical use is limited to administrative booking only — never patient care or diagnosis.</li>
              <li>Reverse engineer, resell, or scrape the service without our written permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">6. Your content and customers</h2>
            <p>You retain all rights to the data you and your customers submit ("Customer Data"). You grant CallLedger a limited license to host, process, and transmit that data solely to operate the service. You are the controller of your customers' personal data; CallLedger acts as your processor.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">7. Third-party integrations</h2>
            <p>Integrations (Twilio, Stripe, Resend, Google, etc.) are governed by their own terms. You are responsible for costs and compliance on those platforms.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">8. AI-generated content</h2>
            <p>CallLedger uses AI to draft marketing content, estimate line items, and messages. Review AI output before sending or publishing it. CallLedger is not liable for AI-generated content you choose to send.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">9. Disclaimers</h2>
            <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE SMS DELIVERY, EMAIL DELIVERABILITY, OR THIRD-PARTY UPTIME.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">10. Limitation of liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, CALLLEDGER'S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THE SERVICE WILL NOT EXCEED THE FEES YOU PAID IN THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM. IN NO EVENT WILL WE BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">11. Termination</h2>
            <p>You may close your account at any time. We may suspend or terminate your access for breach of these Terms. On termination we will make your data available for export for a reasonable period, then delete it.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">12. Changes</h2>
            <p>We may update these Terms. Material changes will be announced by email or in-app before they take effect. Continued use after changes take effect constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-white">13. Contact</h2>
            <p>CallLedger — <a className="text-primary hover:brightness-110" href="mailto:hamdi.rabahksu@gmail.com">hamdi.rabahksu@gmail.com</a></p>
          </section>
        </div>
      </main>
    </div>
  );
}
