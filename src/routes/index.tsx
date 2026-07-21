import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createCheckoutSession, getStripeStatus, type Plan } from "@/lib/checkout.functions";
import { notifyWaitlist } from "@/lib/waitlist.functions";
import { INDUSTRIES, COUNTRIES } from "@/lib/industries";
import { PhoneMissed, MessageSquare, CalendarCheck, Star, Check, ArrowRight, Zap, AlertTriangle } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Problem />
      <Solution />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

// Fade-up on scroll
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

function Nav() {
  return (
    <header className="fixed top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg tracking-tight">
            CALL<span className="text-primary">LEDGER</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#industries" className="hover:text-foreground">Industries</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">
            Log in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Start pilot
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-14">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 hero-mask animate-hero-drift"
        style={{ backgroundImage: `url(${heroImg})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" aria-hidden />
      <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
        <p className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-primary backdrop-blur" style={{ animationDelay: "0ms" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          AI front-office · service businesses worldwide
        </p>

        <h1 className="animate-fade-in font-display text-[clamp(2.75rem,9vw,7rem)] font-bold leading-[0.92] tracking-tight text-balance" style={{ animationDelay: "80ms" }}>
          CALL<span className="text-primary">LEDGER</span>
          <br />
          <span className="text-muted-foreground text-[clamp(1.5rem,4vw,3rem)] font-medium">
            answers the calls you can't.
          </span>
        </h1>

        <p className="mt-8 max-w-xl animate-fade-in text-lg text-muted-foreground text-balance" style={{ animationDelay: "180ms" }}>
          Your best customer is calling at 6pm. You're on the job. We pick up, message them back, and put them on your calendar — before they call the next name on the list.
        </p>

        <div className="mt-10 flex animate-fade-in flex-col gap-3 sm:flex-row sm:items-center" style={{ animationDelay: "280ms" }}>
          <Link
            to="/auth"
            search={{ mode: "signup", plan: "pilot" } as any}
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Start 30-day pilot — $49
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center justify-center rounded-md border border-border bg-card/40 px-6 py-3.5 text-base font-medium text-foreground backdrop-blur transition hover:bg-card"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="border-y border-border bg-card/30 py-24">
      <div ref={ref} className="reveal mx-auto max-w-4xl px-4">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">The math</p>
        <h2 className="mt-3 font-display text-4xl md:text-5xl text-balance">
          Every missed call is a paying customer walking to a competitor.
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Service businesses miss <span className="text-foreground font-semibold">30–40% of after-hours calls</span>.
          Most callers don't leave voicemail — they search for the next name.
          You already know this. You feel it in the deposit at month-end.
        </p>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Enterprise software wants hundreds a month and a two-week onboarding. You just want the phone answered.
          That's what we do.
        </p>
      </div>
    </section>
  );
}

function Solution() {
  const steps = [
    {
      icon: PhoneMissed,
      title: "01 — Missed-call recovery",
      body: "The moment a call goes unanswered, we message the caller in your voice: 'Sorry we missed you — this is [Your Business]. What do you need?'",
    },
    {
      icon: MessageSquare,
      title: "02 — SMS, WhatsApp & voice booking",
      body: "Our AI qualifies the request, offers a booking window, and adds it to your calendar. You wake up to booked work.",
    },
    {
      icon: CalendarCheck,
      title: "03 — Follow-up & review ask",
      body: "Sent an estimate three days ago? We nudge. Job just closed? We ask for the Google review that fills next month's pipeline.",
    },
  ];
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="how" className="py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div ref={ref} className="reveal">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">How it works</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl md:text-5xl text-balance">
            A simple AI layer that plugs into the phone you already carry.
          </h2>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <RevealCard key={s.title} delay={i * 120}>
              <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </RevealCard>
          ))}
        </div>

        <div id="industries" className="mt-20">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Who uses CallLedger</p>
          <h3 className="mt-3 max-w-2xl font-display text-3xl md:text-4xl text-balance">
            Any service business that lives on the phone.
          </h3>
          <div className="mt-8 flex flex-wrap gap-2">
            {INDUSTRIES.map((ind) => (
              <span key={ind} className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground/90">
                {ind}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Clinics and medical offices: CallLedger handles booking, reminders, and admin only — never medical advice.
          </p>
        </div>
      </div>
    </section>
  );
}

function RevealCard({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="reveal rounded-lg border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_0_0_1px_var(--color-primary)]" style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

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
      features: ["Everything in Pilot", "Unlimited missed-call recovery", "AI SMS/WhatsApp booking", "Estimate follow-up sequence", "Review-request automation"],
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
    if (!data.session) {
      navigate({ to: "/auth", search: { mode: "signup", plan } as any });
      return;
    }
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
    <section id="pricing" className="border-t border-border bg-card/30 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div ref={ref} className="reveal">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Pricing</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl text-balance">One booked job pays for a year.</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">Flat monthly. No per-call fees. Cancel anytime.</p>
        </div>

        {stripeReady === false && (
          <div className="mt-6 flex items-start gap-3 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
            <div>
              <p className="font-semibold">Payments not live yet</p>
              <p className="text-yellow-100/80">Add <code className="font-mono text-xs">STRIPE_SECRET_KEY</code> in Project Settings → Secrets to accept live payments. Signups still work — pilots can onboard now.</p>
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
      className={`reveal relative rounded-lg border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_0_1px_var(--color-primary)] ${tier.highlight ? "border-primary bg-card shadow-[0_0_0_1px_var(--color-primary)]" : "border-border bg-card hover:border-primary/60"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {tier.highlight && (
        <span className="absolute -top-2.5 left-6 rounded-sm bg-primary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground">Most popular</span>
      )}
      <h3 className="font-display text-2xl">{tier.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{tier.note}</p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-5xl">${tier.price}</span>
        <span className="text-muted-foreground">/mo</span>
      </div>
      <ul className="mt-6 space-y-2.5">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-foreground/90">{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onChoose}
        disabled={busy}
        className={`mt-7 flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
          tier.highlight ? "bg-primary text-primary-foreground hover:brightness-110" : "border border-border text-foreground hover:bg-accent"
        }`}
      >
        {busy ? "Loading…" : tier.cta}
      </button>
    </div>
  );
}

function FAQ() {
  const items = [
    {
      q: "Do I have to switch my phone number?",
      a: "No. You keep your number. We forward missed calls to CallLedger — the caller gets an instant message from your business.",
    },
    {
      q: "What if the AI misbooks something?",
      a: "Every booking hits your dashboard before it's locked in. You confirm from your phone in one tap. Full transcript included.",
    },
    {
      q: "How is this different from ServiceTitan / Housecall Pro?",
      a: "Those are full ops platforms starting around $400/mo. We're the missing front-office layer for businesses that don't need — or can't afford — all that.",
    },
    {
      q: "Which industries work best?",
      a: "Any service business that lives on the phone: HVAC, plumbing, electrical, clinics/dental, auto repair, cleaning, salons/spas, legal, real estate, and general SMBs worldwide.",
    },
    {
      q: "What about clinics or medical offices?",
      a: "Clinic mode is strictly admin: booking, reschedules, reminders, intake logistics. CallLedger never provides medical advice, triage, or diagnoses.",
    },
    {
      q: "Which countries and languages do you support?",
      a: "CallLedger is available worldwide. SMS, WhatsApp, and phone availability vary by country. Product is English-first; more languages rolling out.",
    },
  ];
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-4">
        <div ref={ref} className="reveal">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">FAQ</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Straight answers.</h2>
        </div>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {items.map((it) => (
            <details key={it.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg text-foreground">
                {it.q}
                <span className="text-primary transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <div className="grid grid-rows-[0fr] transition-all duration-300 group-open:grid-rows-[1fr]">
                <p className="overflow-hidden text-muted-foreground leading-relaxed group-open:pt-3">{it.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

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
    <section className="border-t border-border bg-gradient-to-b from-background to-card/40 py-24">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <Star className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-6 font-display text-4xl md:text-6xl text-balance">
          Stop losing customers to whoever picks up first.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">
          Join the early-access list. We onboard 10 businesses per week.
        </p>

        {done ? (
          <div className="mx-auto mt-10 max-w-md animate-scale-in rounded-lg border border-primary/50 bg-card p-6">
            <p className="font-display text-xl text-primary">You're in.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Watch your inbox — we'll send a short questionnaire to match you with the right pilot slot.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mx-auto mt-10 grid max-w-2xl gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
              className="h-12 rounded-md border border-border bg-card px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="h-12 rounded-md border border-border bg-card px-3 text-foreground focus:border-primary focus:outline-none"
              >
                {INDUSTRIES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-12 rounded-md border border-border bg-card px-3 text-foreground focus:border-primary focus:outline-none"
              >
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="h-12 rounded-md bg-primary px-6 font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Get early access"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-sm bg-primary text-primary-foreground">
            <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
          </div>
          <span className="font-display">CALLLEDGER AI</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="mailto:hamdi.rabahksu@gmail.com" className="hover:text-foreground">hamdi.rabahksu@gmail.com</a>
          <span className="opacity-40">·</span>
          <span>Built for service businesses worldwide</span>
        </div>
      </div>
    </footer>
  );
}
