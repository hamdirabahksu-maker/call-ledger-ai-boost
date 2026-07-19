import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Zap, PhoneMissed, Phone, MessageSquare, Star, Calendar, DollarSign,
  Clock, MapPin, Send, LogOut, Settings, TrendingUp,
} from "lucide-react";

type Business = {
  id: string;
  name: string;
  trade: string;
  phone: string | null;
  service_area: string | null;
};

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Dashboard — CallLedger AI" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

const MOCK_LEADS = [
  { id: 1, name: "Marcus Delaney", issue: "No hot water — needs today", value: 850, source: "Missed call · 6:42 PM", urgency: "high", phone: "(415) 555-0132" },
  { id: 2, name: "Priya Ramanathan", issue: "AC blowing warm, upstairs unit", value: 1400, source: "SMS booking · 7:18 PM", urgency: "high", phone: "(415) 555-0198" },
  { id: 3, name: "Dave Ostrowski", issue: "Panel upgrade quote follow-up", value: 3200, source: "Estimate reply", urgency: "med", phone: "(510) 555-0117" },
  { id: 4, name: "Cheryl Wu", issue: "Toilet running, no rush", value: 220, source: "Web form", urgency: "low", phone: "(650) 555-0144" },
];

const MOCK_CALLS = [
  { id: 1, from: "(415) 555-0132", time: "6:42 PM", recovered: true, note: "AI texted back in 12s. Booked for 8 AM." },
  { id: 2, from: "(415) 555-0198", time: "7:18 PM", recovered: true, note: "Confirmed AC service — Tuesday 10 AM." },
  { id: 3, from: "(650) 555-0201", time: "8:03 PM", recovered: false, note: "No response after 2 nudges. Marked cold." },
  { id: 4, from: "(415) 555-0221", time: "9:14 PM", recovered: true, note: "Quote sent for water heater replacement." },
];

const MOCK_SCHEDULE = [
  { time: "8:00 AM", customer: "M. Delaney", job: "Water heater diag", value: "$850" },
  { time: "10:30 AM", customer: "T. Nguyen", job: "Furnace tune-up", value: "$189" },
  { time: "1:00 PM", customer: "S. Alvarez", job: "Leak repair — kitchen", value: "$420" },
  { time: "3:30 PM", customer: "P. Ramanathan", job: "AC service call", value: "$1,400" },
];

function Dashboard() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("businesses").select("*").maybeSingle();
      if (!data) {
        navigate({ to: "/onboarding" });
        return;
      }
      setBusiness(data as Business);
      setLoading(false);
    })();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading dispatch...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
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
            <Link to="/onboarding" className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <Settings className="h-4 w-4" />
            </Link>
            <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Greeting strip */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Today · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p>
            <h1 className="mt-2 font-display text-4xl">4 new leads. 3 booked overnight.</h1>
            <p className="mt-1 text-muted-foreground">Nice — you slept while CallLedger worked.</p>
          </div>
          <div className="flex gap-2">
            <StatPill icon={DollarSign} label="Recovered value" value="$5,670" tone="amber" />
            <StatPill icon={TrendingUp} label="Response rate" value="94%" />
          </div>
        </div>

        {/* Grid */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {/* Today's leads (spans 2) */}
          <section className="lg:col-span-2 rounded-lg border border-border bg-card">
            <SectionHeader icon={PhoneMissed} title="Today's leads" sub="Auto-captured overnight" />
            <ul className="divide-y divide-border">
              {MOCK_LEADS.map((l) => (
                <li key={l.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 rounded-full ${
                      l.urgency === "high" ? "bg-primary" : l.urgency === "med" ? "bg-yellow-500/70" : "bg-muted-foreground/40"
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{l.name}</p>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{l.source}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{l.issue}</p>
                      <p className="mt-1 text-xs text-muted-foreground/80">{l.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <p className="font-display text-lg text-primary">${l.value.toLocaleString()}</p>
                    <div className="flex gap-1.5">
                      <ActionButton icon={Phone} onClick={() => toast.success(`Calling ${l.name}...`)}>Call</ActionButton>
                      <ActionButton icon={MessageSquare} onClick={() => toast.success("SMS thread opened")}>SMS</ActionButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Quick actions */}
          <section className="rounded-lg border border-border bg-card">
            <SectionHeader icon={Send} title="Quick actions" />
            <div className="space-y-2 p-4">
              <QuickAction
                icon={Send}
                title="Send estimate SMS"
                body="Send a follow-up nudge on an open quote."
                onClick={() => toast.success("Estimate SMS sent to 2 open quotes")}
              />
              <QuickAction
                icon={Star}
                title="Ask for a review"
                body="Text a Google review link to closed jobs from last week."
                onClick={() => toast.success("Review ask sent to 6 recent customers")}
              />
              <QuickAction
                icon={MessageSquare}
                title="Broadcast a message"
                body="Notify booked customers of a schedule change."
                onClick={() => toast.info("Broadcast composer — coming soon")}
              />
            </div>
          </section>

          {/* Missed calls log */}
          <section className="lg:col-span-2 rounded-lg border border-border bg-card">
            <SectionHeader icon={PhoneMissed} title="Missed calls · handled" sub="Last 12 hours" />
            <ul className="divide-y divide-border">
              {MOCK_CALLS.map((c) => (
                <li key={c.id} className="flex items-center gap-4 p-4">
                  <div className={`grid h-9 w-9 place-items-center rounded-md ${c.recovered ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">{c.from}</p>
                      <span className="text-xs text-muted-foreground"><Clock className="mr-1 inline h-3 w-3" />{c.time}</span>
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

          {/* Today's schedule */}
          <section className="rounded-lg border border-border bg-card">
            <SectionHeader icon={Calendar} title="Today's schedule" sub={business?.service_area || "Your route"} />
            <ul className="divide-y divide-border">
              {MOCK_SCHEDULE.map((s, i) => (
                <li key={i} className="p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm text-primary">{s.time}</span>
                    <span className="text-sm text-muted-foreground">{s.value}</span>
                  </div>
                  <p className="mt-1 font-semibold">{s.customer}</p>
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
