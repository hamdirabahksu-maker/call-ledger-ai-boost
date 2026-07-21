import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { seedDashboardIfEmpty } from "@/lib/dashboard.functions";
import { createCheckoutSession } from "@/lib/checkout.functions";
import { getTwilioStatus, sendSms } from "@/lib/sms.functions";
import {
  Zap, PhoneMissed, Phone, MessageSquare, Star, Calendar, DollarSign,
  Clock, MapPin, Send, LogOut, Settings, TrendingUp, Lock, ShieldAlert, Sparkles,
} from "lucide-react";


type Business = { id: string; name: string; trade: string; phone: string | null; service_area: string | null };
type Lead = { id: string; name: string; phone: string | null; issue: string | null; estimated_value: number | null; source: string | null; urgency: string };
type Call = { id: string; from_number: string; recovered: boolean; note: string | null; created_at: string };
type Booking = { id: string; customer_name: string; job: string | null; scheduled_at: string; value_cents: number };
type Sub = { plan: string | null; status: string } | null;

export const Route = createFileRoute("/_authenticated/app")({
  validateSearch: z.object({
    plan: z.enum(["pilot", "starter", "growth"]).optional(),
    checkout: z.enum(["success"]).optional(),
  }),
  head: () => ({ meta: [{ title: "Dashboard — CallLedger AI" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sub, setSub] = useState<Sub>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { plan: resumePlan, checkout: checkoutStatus } = Route.useSearch();
  const seed = useServerFn(seedDashboardIfEmpty);
  const checkout = useServerFn(createCheckoutSession);
  const resumeRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { data: biz } = await supabase.from("businesses").select("*").maybeSingle();
      if (!biz) { navigate({ to: "/onboarding" }); return; }
      setBusiness(biz as Business);

      await seed({ data: { businessId: biz.id } }).catch(() => {});

      const [{ data: l }, { data: c }, { data: b }, { data: s }, { data: u }] = await Promise.all([
        supabase.from("leads").select("*").eq("business_id", biz.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("calls").select("*").eq("business_id", biz.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("bookings").select("*").eq("business_id", biz.id).order("scheduled_at", { ascending: true }).limit(10),
        supabase.from("subscriptions").select("plan,status").eq("business_id", biz.id).maybeSingle(),
        supabase.auth.getUser(),
      ]);
      setLeads((l ?? []) as Lead[]);
      setCalls((c ?? []) as Call[]);
      setBookings((b ?? []) as Booking[]);
      setSub(s as Sub);

      if (u?.user) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
        const admin = roles?.some((r) => r.role === "admin") || u.user.email === "hamdi.rabahksu@gmail.com";
        setIsAdmin(!!admin);
      }
      setLoading(false);
    })();
  }, [navigate, seed]);

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  const startCheckout = async (plan: "pilot" | "starter" | "growth") => {
    if (!business) return;
    try {
      const res = await checkout({ data: { plan, businessId: business.id } });
      if (!res.configured) {
        toast.error("Stripe not connected yet — ask an admin to add STRIPE_SECRET_KEY.");
        return;
      }
      window.location.href = res.url;
    } catch (e) {
      toast.error("Couldn't start checkout");
    }
  };

  useEffect(() => {
    if (checkoutStatus === "success") toast.success("Payment received — you're live.");
  }, [checkoutStatus]);

  useEffect(() => {
    if (!business || !resumePlan || resumeRef.current) return;
    resumeRef.current = true;
    (async () => {
      try {
        const res = await checkout({ data: { plan: resumePlan, businessId: business.id } });
        if (res.configured) window.location.href = res.url;
        else toast.error("Stripe not connected yet — ask an admin to add STRIPE_SECRET_KEY.");
      } catch { toast.error("Couldn't start checkout"); }
    })();
  }, [business, resumePlan, checkout]);

  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading dispatch...</div>;

  const isPaid = sub?.status === "active" || sub?.status === "trialing";
  const recovered = leads.reduce((sum, l) => sum + (l.estimated_value ?? 0), 0);
  const totalCalls = calls.length || 1;
  const responseRate = Math.round((calls.filter((c) => c.recovered).length / totalCalls) * 100);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg">CALL<span className="text-primary">LEDGER</span></span>
            <span className="ml-3 hidden text-xs text-muted-foreground sm:inline">/ {business?.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/marketing" className="hidden items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" /> AI Marketing
            </Link>
            {isAdmin && (
              <Link to="/admin" className="hidden items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:inline-flex">
                <ShieldAlert className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
            <Link to="/onboarding" className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <Settings className="h-4 w-4" />
            </Link>
            <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>

        </div>
      </header>

      {!isPaid && (
        <div className="border-b border-primary/30 bg-primary/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-foreground"><span className="font-semibold">Preview mode.</span> Start the $49 pilot to unlock live SMS recovery.</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startCheckout("pilot")} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110">Start pilot — $49</button>
              <button onClick={() => startCheckout("starter")} className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent">Starter $99</button>
              <button onClick={() => startCheckout("growth")} className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent">Growth $199</button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Today · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p>
            <h1 className="mt-2 font-display text-4xl">{leads.length} new leads. {calls.filter((c) => c.recovered).length} recovered overnight.</h1>
            <p className="mt-1 text-muted-foreground">Nice — you slept while CallLedger worked.</p>
          </div>
          <div className="flex gap-2">
            <StatPill icon={DollarSign} label="Pipeline value" value={`$${recovered.toLocaleString()}`} tone="amber" />
            <StatPill icon={TrendingUp} label="Response rate" value={`${responseRate}%`} />
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-lg border border-border bg-card">
            <SectionHeader icon={PhoneMissed} title="Today's leads" sub="Auto-captured overnight" />
            <ul className="divide-y divide-border">
              {leads.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No leads yet.</li>}
              {leads.map((l) => (
                <li key={l.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 rounded-full ${
                      l.urgency === "high" ? "bg-primary" : l.urgency === "med" ? "bg-yellow-500/70" : "bg-muted-foreground/40"
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{l.name}</p>
                        {l.source && <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{l.source}</span>}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{l.issue}</p>
                      {l.phone && <p className="mt-1 text-xs text-muted-foreground/80">{l.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <p className="font-display text-lg text-primary">${(l.estimated_value ?? 0).toLocaleString()}</p>
                    <div className="flex gap-1.5">
                      <ActionButton icon={Phone} onClick={() => toast.success(`Calling ${l.name}...`)}>Call</ActionButton>
                      <ActionButton icon={MessageSquare} onClick={() => toast.success("SMS thread opened")}>SMS</ActionButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-border bg-card">
            <SectionHeader icon={Send} title="Quick actions" />
            <div className="space-y-2 p-4">
              <QuickAction icon={Send} title="Send estimate SMS" body="Follow up on open quotes." onClick={() => toast.success("Estimate SMS queued")} />
              <QuickAction icon={Star} title="Ask for a review" body="Text a Google review link to recent jobs." onClick={() => toast.success("Review asks queued")} />
              <QuickAction icon={MessageSquare} title="Broadcast a message" body="Notify booked customers of schedule changes." onClick={() => toast.info("Broadcast composer — coming soon")} />
            </div>
          </section>

          <section className="lg:col-span-2 rounded-lg border border-border bg-card">
            <SectionHeader icon={PhoneMissed} title="Missed calls · handled" sub="Last 12 hours" />
            <ul className="divide-y divide-border">
              {calls.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No calls yet.</li>}
              {calls.map((c) => (
                <li key={c.id} className="flex items-center gap-4 p-4">
                  <div className={`grid h-9 w-9 place-items-center rounded-md ${c.recovered ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">{c.from_number}</p>
                      <span className="text-xs text-muted-foreground"><Clock className="mr-1 inline h-3 w-3" />{new Date(c.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{c.note}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                    c.recovered ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {c.recovered ? "Booked" : "Cold"}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-border bg-card">
            <SectionHeader icon={Calendar} title="Today's schedule" sub={business?.service_area || "Your route"} />
            <ul className="divide-y divide-border">
              {bookings.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Nothing booked.</li>}
              {bookings.map((s) => (
                <li key={s.id} className="p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm text-primary">{new Date(s.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                    <span className="text-sm text-muted-foreground">${(s.value_cents / 100).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 font-semibold">{s.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{s.job}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-3">
              <button className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                <MapPin className="h-3.5 w-3.5" /> Open route in Maps
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, sub }: { icon: React.ComponentType<{ className?: string }>; title: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-display text-sm uppercase tracking-widest">{title}</h2>
      </div>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function StatPill({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: "amber" }) {
  return (
    <div className={`flex items-center gap-3 rounded-md border px-4 py-2.5 ${tone === "amber" ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <Icon className={`h-4 w-4 ${tone === "amber" ? "text-primary" : "text-muted-foreground"}`} />
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-display text-lg leading-none">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, children, onClick }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary">
      <Icon className="h-3 w-3" /> {children}
    </button>
  );
}

function QuickAction({ icon: Icon, title, body, onClick }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex w-full items-start gap-3 rounded-md border border-border bg-background/30 p-3 text-left transition hover:border-primary/60 hover:bg-primary/5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      </div>
    </button>
  );
}
