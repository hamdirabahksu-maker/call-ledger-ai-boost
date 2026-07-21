import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createCheckoutSession } from "@/lib/checkout.functions";
import { INDUSTRIES, COUNTRIES } from "@/lib/industries";
import { Zap, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: z.object({ plan: z.enum(["pilot", "starter", "growth"]).optional() }),
  head: () => ({ meta: [{ title: "Set up your business — CallLedger AI" }, { name: "robots", content: "noindex" }] }),
  component: Onboarding,
});


function Onboarding() {
  const navigate = useNavigate();
  const { plan } = Route.useSearch();
  const checkout = useServerFn(createCheckoutSession);
  const [name, setName] = useState("");
  const [trade, setTrade] = useState<string>(INDUSTRIES[0]);
  const [country, setCountry] = useState<string>(COUNTRIES[0]);
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [msg, setMsg] = useState("Hi, this is [Business] — sorry we missed you. Text us what you need and we'll be right back to you.");
  const [busy, setBusy] = useState(false);


  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("businesses").select("*").maybeSingle();
      if (data) {
        setName(data.name); setTrade(data.trade);
        setPhone(data.phone || ""); setArea(data.service_area || "");
        setMsg(data.after_hours_message || msg);
        if ((data as any).country) setCountry((data as any).country);
      }

    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setBusy(false); return; }
    const { data: biz, error } = await supabase.from("businesses").upsert(
      { owner_id: u.user.id, name, trade, phone, service_area: area, after_hours_message: msg, country } as any,
      { onConflict: "owner_id" }
    ).select("id").maybeSingle();
    if (error) { setBusy(false); return toast.error(error.message); }
    toast.success("You're all set — welcome aboard.");


    if (plan && biz?.id) {
      try {
        const res = await checkout({ data: { plan, businessId: biz.id } });
        if (res.configured) { window.location.href = res.url; return; }
        toast.error("Stripe not connected yet — going to dashboard.");
      } catch { toast.error("Couldn't start checkout"); }
    }
    setBusy(false);
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg">CALL<span className="text-primary">LEDGER</span></span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Setup · takes 90 seconds</p>
        <h1 className="mt-3 font-display text-4xl">Tell us about the shop.</h1>
      <main className="mx-auto max-w-2xl px-4 py-12 animate-fade-in">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Setup · takes 90 seconds</p>
        <h1 className="mt-3 font-display text-4xl">Tell us about your business.</h1>
        <p className="mt-2 text-muted-foreground">We use this to answer callers in your voice.</p>

        <form onSubmit={save} className="mt-10 space-y-6">
          <Field label="Business name">
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Delaney Plumbing & Heating"
              className="h-11 w-full rounded-md border border-border bg-card px-3.5 focus:border-primary focus:outline-none" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Industry">
              <select value={trade} onChange={(e) => setTrade(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-card px-3 focus:border-primary focus:outline-none">
                {INDUSTRIES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Country">
              <select value={country} onChange={(e) => setCountry(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-card px-3 focus:border-primary focus:outline-none">
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          {trade.toLowerCase().includes("clinic") && (
            <p className="rounded-md border border-primary/40 bg-primary/10 p-3 text-xs text-foreground">
              Clinic mode: CallLedger handles booking, reminders, and admin messages only. It will never provide medical advice or triage.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business phone">
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" type="tel"
                className="h-11 w-full rounded-md border border-border bg-card px-3.5 focus:border-primary focus:outline-none" />
            </Field>
            <Field label="Service area">
              <input required value={area} onChange={(e) => setArea(e.target.value)} placeholder="East Bay, CA · 25 mi"
                className="h-11 w-full rounded-md border border-border bg-card px-3.5 focus:border-primary focus:outline-none" />
            </Field>
          </div>

          <Field label="After-hours SMS auto-reply" hint="What callers hear when you can't pick up.">
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4}
              className="w-full rounded-md border border-border bg-card px-3.5 py-3 focus:border-primary focus:outline-none" />
          </Field>


          <button type="submit" disabled={busy}
            className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50">
            {busy ? "Saving..." : "Save & go to dashboard"} <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground/70">{hint}</span>}
    </label>
  );
}
