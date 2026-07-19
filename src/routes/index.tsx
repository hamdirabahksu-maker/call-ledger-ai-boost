import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createCheckoutSession, getStripeStatus, type Plan } from "@/lib/checkout.functions";
import { PhoneMissed, MessageSquare, CalendarCheck, Star, Check, ArrowRight, Zap, AlertTriangle } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

const TRADES = ["HVAC", "Plumbing", "Electrical"] as const;

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
        className="absolute inset-0 bg-cover bg-center opacity-40 hero-mask"
        style={{ backgroundImage: `url(${heroImg})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" aria-hidden />
      <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-primary backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          AI front-office for the trades
        </p>

        <h1 className="font-display text-[clamp(2.75rem,9vw,7rem)] font-bold leading-[0.92] tracking-tight text-balance">
          CALL<span className="text-primary">LEDGER</span>
          <br />
          <span className="text-muted-foreground text-[clamp(1.5rem,4vw,3rem)] font-medium">
            answers the calls you can't.
          </span>
        </h1>

        <p className="mt-8 max-w-xl text-lg text-muted-foreground text-balance">
          You're under a sink at 6pm. The next $2,400 job is calling.
          We pick up, text them back, and book it on your calendar — before they call the next guy.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
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
  return (
    <section className="border-y border-border bg-card/30 py-24">
      <div className="mx-auto max-w-4xl px-4">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">The math</p>
        <h2 className="mt-3 font-display text-4xl md:text-5xl text-balance">
          Every missed call is an $800–$3,000 job walking to a competitor.
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Solo trades miss <span className="text-foreground font-semibold">40% of after-hours calls</span>.
          Callers don't leave voicemail. They Google the next name.
          You already know this — you've felt the difference in the deposit at month-end.
        </p>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          ServiceTitan wants $400/mo and a two-week onboarding. You want the phone answered.
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
      body: "The moment a call goes unanswered, we text the caller in your voice: 'Sorry we missed you — this is CallLedger for [Your Shop]. What's going on?'",
    },
    {
      icon: MessageSquare,
      title: "02 — SMS & voice booking",
      body: "Our AI qualifies the job (trade, urgency, address), quotes a ballpark window, and puts it on your calendar. You wake up to booked work.",
    },
    {
      icon: CalendarCheck,
      title: "03 — Estimate follow-up & review ask",
      body: "Sent an estimate three days ago? We nudge. Job just closed? We ask for the Google review — the one that fills next month's pipeline.",
    },
  ];
  return (
    <section id="how" className="py-24">
      <div className="mx-auto max-w-6xl px-4">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">How it works</p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl md:text-5xl text-balance">
          A simple AI layer that plugs into the phone you already carry.
        </h2>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="rounded-lg border border-border bg-card p-6 transition hover:border-primary/60">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers: { name: string; plan: Plan; price: number; note: string; features: string[]; cta: string; highlight?: boolean }[] = [
    {
      name: "Pilot", plan: "pilot", price: 49,
      note: "First 30 days. No contract.",
      features: ["Missed-call SMS recovery", "Up to 50 handled calls", "Basic booking calendar", "Email support"],
      cta: "Start pilot",
    },
    {
      name: "Starter", plan: "starter", price: 99,
      note: "Solo operator. Nights & weekends covered.",
      features: ["Everything in Pilot", "Unlimited missed-call recovery", "AI SMS booking", "Estimate follow-up sequence", "Review-request automation"],
      cta: "Choose Starter", highlight: true,
    },
    {
      name: "Growth", plan: "growth", price: 199,
      note: "2–10 techs. Full front-office.",
      features: ["Everything in Starter", "24/7 AI voice answering", "Dispatch calendar for team", "Custom greeting & scripts", "Priority support"],
      cta: "Choose Growth",
    },
  ];

  const navigate = useNavigate();
  const checkout = useServerFn(createCheckoutSession);
  const stripeStatus = useServerFn(getStripeStatus);
  const [stripeReady, setStripeReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<Plan | null>(null);

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
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Pricing</p>
        <h2 className="mt-3 font-display text-4xl md:text-5xl text-balance">One booked job pays for a year.</h2>
        <p className="mt-4 max-w-xl text-muted-foreground">Flat monthly. No per-call fees. Cancel anytime — we're not going to trap you.</p>

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
          {tiers.map((t) => (
            <div key={t.name} className={`relative rounded-lg border p-6 transition ${t.highlight ? "border-primary bg-card shadow-[0_0_0_1px_var(--color-primary)]" : "border-border bg-card"}`}>
              {t.highlight && (
                <span className="absolute -top-2.5 left-6 rounded-sm bg-primary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground">Most shops</span>
              )}
              <h3 className="font-display text-2xl">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.note}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl">${t.price}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => choose(t.plan)}
                disabled={busy === t.plan}
                className={`mt-7 flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                  t.highlight ? "bg-primary text-primary-foreground hover:brightness-110" : "border border-border text-foreground hover:bg-accent"
                }`}
              >
                {busy === t.plan ? "Loading…" : t.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "Do I have to switch my phone number?",
      a: "No. You keep your number. We forward missed calls to CallLedger — the caller gets an instant SMS from your business.",
    },
    {
      q: "What if the AI screws up a booking?",
      a: "Every booking hits your dashboard before it's locked in. You confirm from your phone in one tap. We show you the transcript.",
    },
    {
      q: "Is this like ServiceTitan or Housecall Pro?",
      a: "No. Those are full ops platforms starting around $400/mo. We're the missing front-office layer for shops that don't need — or can't afford — all that.",
    },
    {
      q: "Which trades work best?",
      a: "HVAC, plumbing, and electrical — where after-hours calls are urgent and jobs are worth $500+. If that's you, this pays for itself in week one.",
    },
    {
      q: "US and Canada only?",
      a: "For now, yes. We handle US and Canadian numbers, English (Spanish coming Q2).",
    },
  ];
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-4">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">FAQ</p>
        <h2 className="mt-3 font-display text-4xl md:text-5xl">Straight answers.</h2>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {items.map((it) => (
            <details key={it.q} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-lg text-foreground">
                {it.q}
                <span className="text-primary transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-muted-foreground leading-relaxed">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const [email, setEmail] = useState("");
  const [trade, setTrade] = useState<string>(TRADES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Enter a real email");
    setSubmitting(true);
    const { error } = await supabase.from("waitlist").insert({ email, trade });
    setSubmitting(false);
    if (error) return toast.error("Couldn't save — try again");
    setDone(true);
    toast.success("You're on the list. We'll be in touch this week.");
  };

  return (
    <section className="border-t border-border bg-gradient-to-b from-background to-card/40 py-24">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <Star className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-6 font-display text-4xl md:text-6xl text-balance">
          Stop losing jobs to the guy who picked up.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">
          Join the early-access list. We onboard 10 shops per week.
        </p>

        {done ? (
          <div className="mx-auto mt-10 max-w-md rounded-lg border border-primary/50 bg-card p-6">
            <p className="font-display text-xl text-primary">You're in.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Watch your inbox — we send a short questionnaire to match you with the right pilot slot.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mx-auto mt-10 grid max-w-xl gap-3 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-3 sm:col-span-2 sm:grid-cols-[1fr_150px]">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourshop.com"
                className="h-12 rounded-md border border-border bg-card px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="h-12 rounded-md border border-border bg-card px-3 text-foreground focus:border-primary focus:outline-none"
              >
                {TRADES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="h-12 rounded-md bg-primary px-6 font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50 sm:col-span-2"
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
          <span>Built for US & Canadian trades</span>
        </div>
      </div>
    </footer>
  );
}
