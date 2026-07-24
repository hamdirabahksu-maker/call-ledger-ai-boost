import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createCheckoutSession, getStripeStatus, type Plan } from "@/lib/checkout.functions";
import { notifyWaitlist } from "@/lib/waitlist.functions";
import { INDUSTRIES, COUNTRIES } from "@/lib/industries";
import {
  PhoneMissed, MessageSquare, CalendarCheck, Star, Check, ArrowRight,
  AlertTriangle, FileText, Receipt, Sparkles, Globe2, ShieldCheck,
} from "lucide-react";
import { BrandLockup } from "@/components/brand-lockup";
import { BrandMark } from "@/components/brand-mark";
import { ClientOnly } from "@/components/client-only";

const Hero3D = lazy(() => import("@/components/hero-3d"));

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Nav />
      <Hero />
      <Story />
      <Solution />
      <Industries />
      <Proof />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-visible")),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ---------------- NAV ---------------- */
function Nav() {
  return (
    <header className="pointer-events-none fixed top-4 z-50 w-full px-4">
      <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-3">
        {/* Left pill: logo + links */}
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 py-1.5 pl-3 pr-2 backdrop-blur-xl">
          <BrandLockup size="sm" showSubtitle={false} />
          <nav className="ml-4 hidden items-center gap-1 text-sm text-white/60 md:flex">
            {[
              ["Product", "#how"],
              ["Industries", "#industries"],
              ["Pricing", "#pricing"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="rounded-full px-3 py-1.5 transition hover:bg-white/5 hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right pill: auth CTAs */}
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-xl">
          <Link
            to="/auth"
            className="hidden rounded-full px-4 py-1.5 text-sm text-white/70 transition hover:text-white sm:block"
          >
            Log in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-amber-300"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- HERO ---------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background: 3D scene, only when hydrated + motion allowed */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(245,165,36,0.16),transparent_70%)]" />
        <ClientOnly fallback={<div className="absolute inset-0 bg-black" />}>
          <div className="absolute inset-0 motion-reduce:hidden">
            <Hero3D />
          </div>
        </ClientOnly>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[#050505]" />
        {/* soft amber orbs */}
        <div className="absolute -left-32 top-1/3 h-72 w-72 rounded-full bg-amber-500/20 blur-[100px]" />
        <div className="absolute -right-24 bottom-1/4 h-64 w-64 rounded-full bg-orange-500/15 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col items-center justify-center px-4 pb-24 pt-40 text-center">
        <p
          className="mb-8 inline-flex animate-fade-in items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-amber-300 backdrop-blur"
          style={{ animationDelay: "0ms" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_2px_rgba(245,165,36,0.6)]" />
          Your AI front office
        </p>

        <h1
          className="animate-fade-in font-display text-[clamp(2.8rem,8vw,6.5rem)] font-bold leading-[0.95] tracking-tight text-balance"
          style={{ animationDelay: "80ms" }}
        >
          Never miss the call
          <br />
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            that pays your month.
          </span>
        </h1>

        <p
          className="mx-auto mt-8 max-w-xl animate-fade-in text-lg leading-relaxed text-white/60 text-balance"
          style={{ animationDelay: "180ms" }}
        >
          CallLedger picks up missed calls, books jobs by SMS, sends estimates and invoices,
          and asks for the review — while you're on the tools.
        </p>

        <div
          className="mt-10 flex animate-fade-in flex-col items-center gap-3 sm:flex-row"
          style={{ animationDelay: "280ms" }}
        >
          <Link
            to="/auth"
            search={{ mode: "signup", plan: "pilot" } as any}
            className="group inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-300"
          >
            Start 30-day pilot · $49
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 text-sm text-white/80 backdrop-blur transition hover:bg-white/[0.06] hover:text-white"
          >
            Book a demo
          </a>
        </div>

        <p
          className="mt-14 animate-fade-in font-mono text-[10px] uppercase tracking-[0.3em] text-white/30"
          style={{ animationDelay: "380ms" }}
        >
          Trusted by service operators in 20+ countries · English-first
        </p>
      </div>
    </section>
  );
}

/* ---------------- STORY ---------------- */
function Story() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="border-t border-white/5 bg-[#070707] py-28">
      <div ref={ref} className="reveal mx-auto max-w-4xl px-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber-400">The math</p>
        <h2 className="mt-4 font-display text-4xl leading-[1.05] md:text-6xl text-balance">
          A missed call is a customer <span className="text-white/40">walking to a competitor.</span>
        </h2>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/60">
          Service businesses miss <span className="text-white">30–40% of after-hours calls</span>.
          Most callers don't leave voicemail — they dial the next name on the list.
          You feel it at month-end.
        </p>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
          ServiceTitan-class software wants hundreds a month and a two-week onboarding.
          You want the phone answered. That's the whole product.
        </p>
      </div>
    </section>
  );
}

/* ---------------- SOLUTION ---------------- */
function Solution() {
  const steps = [
    { icon: PhoneMissed,   title: "Missed-call recovery",  body: "The moment a call is missed, we message the caller in your voice — with your business name and a booking link." },
    { icon: MessageSquare, title: "SMS · WhatsApp · voice", body: "Our AI qualifies the request, offers a window, and drops the booking on your calendar. You wake up to booked work." },
    { icon: CalendarCheck, title: "Estimate & review loop", body: "Estimates nudge on day 3. Jobs closed get a review ask. Your pipeline compounds without you touching it." },
  ];
  const features = [
    { icon: PhoneMissed,   label: "Missed-call AI" },
    { icon: CalendarCheck, label: "Instant booking link" },
    { icon: FileText,      label: "Estimates" },
    { icon: Receipt,       label: "Invoices" },
    { icon: Star,          label: "Reviews on autopilot" },
    { icon: Sparkles,      label: "Marketing AI" },
    { icon: Globe2,        label: "Worldwide industries" },
    { icon: ShieldCheck,   label: "Owner-approved bookings" },
  ];
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="how" className="py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div ref={ref} className="reveal">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber-400">How it works</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] md:text-6xl text-balance">
            A front office that fits in your phone.
          </h2>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <RevealCard key={s.title} delay={i * 120}>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/30">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-2 font-display text-xl text-white">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{s.body}</p>
            </RevealCard>
          ))}
        </div>

        <div className="mt-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber-400">Everything, focused</p>
          <h3 className="mt-4 max-w-2xl font-display text-3xl leading-tight md:text-4xl text-balance">
            The tools QuoteIQ bolts on — built as one clean product.
          </h3>
          <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {features.map((f) => (
              <div key={f.label} className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-amber-400/30 hover:bg-white/[0.04]">
                <f.icon className="h-4 w-4 text-amber-400" />
                <span className="text-sm text-white/85">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RevealCard({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="reveal group rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-7 transition duration-300 hover:-translate-y-1 hover:border-amber-400/40"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------------- INDUSTRIES ---------------- */
function Industries() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="industries" className="border-t border-white/5 bg-[#070707] py-28">
      <div ref={ref} className="reveal mx-auto max-w-6xl px-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber-400">Worldwide</p>
        <h2 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] md:text-6xl text-balance">
          Any service business that lives on the phone.
        </h2>
        <div className="mt-10 flex flex-wrap gap-2">
          {INDUSTRIES.map((ind) => (
            <span
              key={ind}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-sm text-white/80 transition hover:border-amber-400/40 hover:text-white"
            >
              {ind}
            </span>
          ))}
        </div>
        <p className="mt-6 text-sm text-white/45">
          Clinics & medical offices: admin, booking, reminders only — CallLedger never provides medical advice.
        </p>
      </div>
    </section>
  );
}

/* ---------------- PROOF ---------------- */
function Proof() {
  const stats = [
    { k: "30–40%", v: "of after-hours calls go unanswered — most don't leave voicemail." },
    { k: "$800–$3k", v: "typical value of a single HVAC / plumbing / electrical job." },
    { k: "< 60s", v: "response time from CallLedger the moment a call is missed." },
  ];
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="py-28">
      <div ref={ref} className="reveal mx-auto max-w-6xl px-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber-400">Signal</p>
        <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] md:text-5xl text-balance">
          One recovered call pays for a year of CallLedger.
        </h2>
        <div className="mt-14 grid gap-6 border-y border-white/5 py-12 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.k}>
              <div className="font-display text-5xl text-amber-400">{s.k}</div>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- PRICING ---------------- */
function Pricing() {
  const tiers: { name: string; plan: Plan; price: number; note: string; features: string[]; cta: string; highlight?: boolean }[] = [
    {
      name: "Pilot", plan: "pilot", price: 49,
      note: "First 30 days. No contract.",
      features: ["Missed-call SMS recovery", "Up to 50 handled contacts", "Basic booking calendar", "Email support"],
      cta: "Start pilot",
    },
    {
      name: "Starter", plan: "starter", price: 99,
      note: "Solo operator. Nights & weekends covered.",
      features: ["Everything in Pilot", "Unlimited missed-call recovery", "AI SMS / WhatsApp booking", "Estimate follow-up sequence", "Review-request automation"],
      cta: "Choose Starter", highlight: true,
    },
    {
      name: "Growth", plan: "growth", price: 199,
      note: "2–10 people. Full front-office.",
      features: ["Everything in Starter", "24/7 AI voice answering", "Dispatch calendar for team", "Custom greeting & scripts", "Priority support"],
      cta: "Choose Growth",
    },
  ];

  const navigate = useNavigate();
  const checkout = useServerFn(createCheckoutSession);
  const stripeStatus = useServerFn(getStripeStatus);
  const [stripeReady, setStripeReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<Plan | null>(null);
  const ref = useReveal<HTMLDivElement>();

  useEffect(() => { stripeStatus({}).then((r) => setStripeReady(r.configured)).catch(() => setStripeReady(false)); }, [stripeStatus]);

  const choose = async (plan: Plan) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) { navigate({ to: "/auth", search: { mode: "signup", plan } as any }); return; }
    const { data: biz } = await supabase.from("businesses").select("id").maybeSingle();
    if (!biz) { navigate({ to: "/onboarding", search: { plan } as any }); return; }
    setBusy(plan);
    try {
      const res = await checkout({ data: { plan, businessId: biz.id } });
      if (!res.configured) { toast.error("Stripe not connected yet."); return; }
      window.location.href = res.url;
    } catch { toast.error("Couldn't start checkout"); }
    finally { setBusy(null); }
  };

  return (
    <section id="pricing" className="border-t border-white/5 bg-[#070707] py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div ref={ref} className="reveal">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber-400">Pricing</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] md:text-6xl text-balance">Flat monthly. No per-call fees.</h2>
          <p className="mt-5 max-w-xl text-white/55">Cancel anytime. One booked job usually covers a year.</p>
        </div>

        {stripeReady === false && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              <p className="font-semibold">Payments not live yet</p>
              <p className="text-amber-100/80">Add <code className="font-mono text-xs">STRIPE_SECRET_KEY</code> in Project Settings → Secrets to accept live payments. Pilots can still onboard now.</p>
            </div>
          </div>
        )}

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {tiers.map((t, i) => (
            <PricingCard key={t.name} tier={t} busy={busy === t.plan} onChoose={() => choose(t.plan)} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ tier, busy, onChoose, delay }: {
  tier: { name: string; plan: Plan; price: number; note: string; features: string[]; cta: string; highlight?: boolean };
  busy: boolean; onChoose: () => void; delay: number;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal relative rounded-2xl border p-7 transition duration-300 hover:-translate-y-1 ${
        tier.highlight
          ? "border-amber-400/60 bg-gradient-to-b from-amber-400/[0.08] to-transparent shadow-[0_0_60px_-20px_rgba(245,165,36,0.5)]"
          : "border-white/10 bg-white/[0.02] hover:border-amber-400/40"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {tier.highlight && (
        <span className="absolute -top-3 left-6 rounded-full bg-amber-400 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-black">
          Most popular
        </span>
      )}
      <h3 className="font-display text-2xl text-white">{tier.name}</h3>
      <p className="mt-1 text-sm text-white/50">{tier.note}</p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-5xl text-white">${tier.price}</span>
        <span className="text-white/40">/mo</span>
      </div>
      <ul className="mt-6 space-y-2.5">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <span className="text-white/80">{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onChoose}
        disabled={busy}
        className={`mt-7 flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
          tier.highlight
            ? "bg-amber-400 text-black hover:bg-amber-300"
            : "border border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.06]"
        }`}
      >
        {busy ? "Loading…" : tier.cta}
      </button>
    </div>
  );
}

/* ---------------- FAQ ---------------- */
function FAQ() {
  const items = [
    { q: "Do I have to switch my phone number?", a: "No. You keep your number. We forward missed calls to CallLedger — the caller gets an instant message from your business." },
    { q: "What if the AI misbooks something?", a: "Every booking hits your dashboard before it's locked in. You confirm from your phone in one tap. Full transcript included." },
    { q: "How is this different from ServiceTitan or Housecall Pro?", a: "Those are full ops platforms starting around $400/mo. CallLedger is the missing front-office layer for businesses that don't need — or can't afford — all that." },
    { q: "Which industries work best?", a: "Any service business that lives on the phone: HVAC, plumbing, electrical, clinics/dental, auto repair, cleaning, salons/spas, legal, real estate, and general SMBs worldwide." },
    { q: "What about clinics or medical offices?", a: "Clinic mode is strictly admin: booking, reschedules, reminders, intake logistics. CallLedger never provides medical advice, triage, or diagnoses." },
    { q: "Which countries and languages do you support?", a: "CallLedger is available worldwide. SMS, WhatsApp, and phone availability vary by country. Product is English-first; more languages rolling out." },
  ];
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="faq" className="py-28">
      <div className="mx-auto max-w-3xl px-4">
        <div ref={ref} className="reveal">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber-400">FAQ</p>
          <h2 className="mt-4 font-display text-4xl md:text-5xl">Straight answers.</h2>
        </div>
        <div className="mt-12 divide-y divide-white/5 border-y border-white/5">
          {items.map((it) => (
            <details key={it.q} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg text-white">
                {it.q}
                <span className="text-amber-400 transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <div className="grid grid-rows-[0fr] transition-all duration-300 group-open:grid-rows-[1fr]">
                <p className="overflow-hidden text-white/55 leading-relaxed group-open:pt-3">{it.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FINAL CTA ---------------- */
function FinalCTA() {
  const [email, setEmail] = useState("");
  const [trade, setTrade] = useState<string>(INDUSTRIES[0]);
  const [country, setCountry] = useState<string>(COUNTRIES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const notify = useServerFn(notifyWaitlist);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Enter a real email");
    setSubmitting(true);
    const { error } = await supabase.from("waitlist").insert({ email, trade, country } as any);
    if (error) { setSubmitting(false); return toast.error("Couldn't save — try again"); }
    notify({ data: { email, trade, country } }).catch(() => {});
    setSubmitting(false);
    setDone(true);
    toast.success("You're on the list.");
  };

  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-[#070707] py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,rgba(245,165,36,0.12),transparent_70%)]" />
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <BrandMark size={44} className="mx-auto" />
        <h2 className="mt-8 font-display text-4xl leading-[1.05] md:text-6xl text-balance">
          Stop losing customers to whoever picks up first.
        </h2>
        <p className="mt-6 text-lg text-white/55">
          Join the early-access list. We onboard 10 businesses a week.
        </p>

        {done ? (
          <div className="mx-auto mt-10 max-w-md animate-scale-in rounded-2xl border border-amber-400/50 bg-white/[0.03] p-8">
            <p className="font-display text-2xl text-amber-400">You're in.</p>
            <p className="mt-2 text-sm text-white/60">
              Watch your inbox — we'll send a short questionnaire to match you with the right pilot slot.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mx-auto mt-10 grid max-w-2xl gap-3">
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
              className="h-12 rounded-full border border-white/10 bg-white/[0.03] px-5 text-white placeholder:text-white/30 focus:border-amber-400/60 focus:outline-none"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={trade} onChange={(e) => setTrade(e.target.value)}
                className="h-12 rounded-full border border-white/10 bg-white/[0.03] px-4 text-white focus:border-amber-400/60 focus:outline-none">
                {INDUSTRIES.map((t) => <option key={t} value={t} className="bg-[#0a0a0a]">{t}</option>)}
              </select>
              <select value={country} onChange={(e) => setCountry(e.target.value)}
                className="h-12 rounded-full border border-white/10 bg-white/[0.03] px-4 text-white focus:border-amber-400/60 focus:outline-none">
                {COUNTRIES.map((c) => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)}
              </select>
            </div>
            <button type="submit" disabled={submitting}
              className="h-12 rounded-full bg-amber-400 px-6 font-semibold text-black transition hover:bg-amber-300 disabled:opacity-50">
              {submitting ? "Saving..." : "Get early access"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */
function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-sm text-white/40 md:flex-row">
        <BrandLockup size="sm" />
        <div className="flex flex-wrap items-center justify-center gap-5">
          <a href="mailto:hamdi.rabahksu@gmail.com" className="hover:text-white">hamdi.rabahksu@gmail.com</a>
          <span className="opacity-40">·</span>
          <Link to="/privacy" className="hover:text-white">Privacy</Link>
          <Link to="/terms" className="hover:text-white">Terms</Link>
          <span className="opacity-40">·</span>
          <span>Built for service businesses worldwide</span>
          <span className="opacity-40">·</span>
          <span>© {new Date().getFullYear()} CallLedger</span>
        </div>
      </div>
    </footer>
  );
}
