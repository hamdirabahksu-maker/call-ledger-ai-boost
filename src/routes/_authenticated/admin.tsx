import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { loadAdminData } from "@/lib/admin.functions";
import { Zap, ShieldAlert, Users, Building2, CreditCard, ArrowLeft, Sparkles, Download, Mail } from "lucide-react";

type Row = Record<string, any>;
type AdminData = {
  waitlist: Row[]; businesses: Row[]; subscriptions: Row[]; leads: Row[];
  stats: { waitlist: number; businesses: number; paying: number; drafts: number };
  integrations: { resend: boolean };
};


export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — CallLedger" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const load = useServerFn(loadAdminData);

  useEffect(() => {
    (async () => {
      // Client-side guard for UX; server also enforces
      const { data: u } = await supabase.auth.getUser();
      const email = u?.user?.email;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u?.user?.id ?? "");
      const admin = roles?.some((r) => r.role === "admin") || email === "hamdi.rabahksu@gmail.com";
      if (!admin) { navigate({ to: "/app" }); return; }
      try { setData(await load({}) as AdminData); }
      catch (e: any) { setError(e.message ?? "Failed to load"); }
    })();
  }, [load, navigate]);

  if (error) return <div className="grid min-h-screen place-items-center text-destructive">{error}</div>;
  if (!data) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading admin…</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link to="/app" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to app
          </Link>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg">CALL<span className="text-primary">LEDGER</span></span>
            <span className="ml-2 inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-primary">
              <ShieldAlert className="h-3 w-3" /> Admin
            </span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Operations</p>
        <h1 className="mt-2 font-display text-4xl">Control room</h1>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat icon={Users} label="Waitlist" value={data.stats.waitlist} />
          <Stat icon={Building2} label="Shops onboarded" value={data.stats.businesses} />
          <Stat icon={CreditCard} label="Paying customers" value={data.stats.paying} tone="amber" />
        </div>

        <Section title="Waitlist" sub={`${data.waitlist.length} entries`}>
          <Table
            cols={["email", "trade", "created_at"]}
            rows={data.waitlist}
            format={{ created_at: (v) => new Date(v).toLocaleString() }}
          />
        </Section>

        <Section title="Businesses" sub={`${data.businesses.length} shops`}>
          <Table
            cols={["name", "trade", "phone", "service_area", "created_at"]}
            rows={data.businesses}
            format={{ created_at: (v) => new Date(v).toLocaleDateString() }}
          />
        </Section>

        <Section title="Subscriptions">
          <Table
            cols={["business_id", "plan", "status", "current_period_end"]}
            rows={data.subscriptions}
            format={{
              business_id: (v) => String(v).slice(0, 8) + "…",
              current_period_end: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
            }}
          />
        </Section>

        <Section title="Recent leads across all shops">
          <Table
            cols={["name", "issue", "estimated_value", "urgency", "created_at"]}
            rows={data.leads}
            format={{
              estimated_value: (v) => `$${(v ?? 0).toLocaleString()}`,
              created_at: (v) => new Date(v).toLocaleString(),
            }}
          />
        </Section>
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone?: "amber" }) {
  return (
    <div className={`rounded-lg border p-5 ${tone === "amber" ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${tone === "amber" ? "text-primary" : "text-muted-foreground"}`} />
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 font-display text-4xl">{value}</p>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-sm uppercase tracking-widest">{title}</h2>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function Table({ cols, rows, format }: { cols: string[]; rows: Row[]; format?: Record<string, (v: any) => string> }) {
  if (rows.length === 0) return <p className="p-6 text-center text-sm text-muted-foreground">No rows.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left">
          {cols.map((c) => (
            <th key={c} className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id ?? i} className="border-b border-border/60">
            {cols.map((c) => (
              <td key={c} className="px-4 py-2.5 text-foreground/90">
                {format?.[c] ? format[c](r[c]) : (r[c] ?? "—")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
