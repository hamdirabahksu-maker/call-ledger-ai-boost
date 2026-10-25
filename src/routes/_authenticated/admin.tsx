import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { loadAdminData } from "@/lib/admin.functions";
import { adminSetKycStatus } from "@/lib/kyc.functions";
import { toast } from "sonner";
import { Zap, ShieldAlert, Users, Building2, CreditCard, ArrowLeft, Sparkles, Download, Mail } from "lucide-react";

type Row = Record<string, any>;
type AdminData = {
  waitlist: Row[]; businesses: Row[]; subscriptions: Row[]; leads: Row[]; demos: Row[];
  stats: { waitlist: number; businesses: number; paying: number; drafts: number; demos: number };
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
  const setKyc = useServerFn(adminSetKycStatus);

  const reload = async () => {
    try { setData(await load({}) as AdminData); }
    catch (e: any) { setError(e.message ?? "Failed to load"); }
  };

  useEffect(() => {
    (async () => {
      // Client-side guard for UX; server also enforces
      const { data: u } = await supabase.auth.getUser();
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u?.user?.id ?? "");
      const admin = roles?.some((r) => r.role === "admin");

      if (!admin) { navigate({ to: "/app" }); return; }
      await reload();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, navigate]);

  const onKyc = async (businessId: string, status: "verified" | "rejected") => {
    try {
      await setKyc({ data: { businessId, status } });
      toast.success(status === "verified" ? "KYC verified" : "KYC rejected");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "KYC update failed");
    }
  };

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

      <main className="mx-auto max-w-7xl px-4 py-8 animate-fade-in">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Operations</p>
        <h1 className="mt-2 font-display text-4xl">Control room</h1>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Users} label="Waitlist" value={data.stats.waitlist} />
          <Stat icon={Building2} label="Shops onboarded" value={data.stats.businesses} />
          <Stat icon={CreditCard} label="Paying customers" value={data.stats.paying} tone="amber" />
          <Stat icon={Sparkles} label="Marketing drafts" value={data.stats.drafts} />
          <Stat icon={Mail} label="Demo requests" value={data.stats.demos ?? data.demos?.length ?? 0} />
        </div>

        {!data.integrations.resend && (
          <div className="mt-6 flex items-start gap-3 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">Connect Resend to send waitlist confirmations</p>
              <p className="text-yellow-100/80">Add <code className="font-mono text-xs">RESEND_API_KEY</code> in Project Settings → Secrets. Waitlist signups will start emailing automatically.</p>
            </div>
          </div>
        )}

        <Section
          title="Waitlist"
          sub={`${data.waitlist.length} entries`}
          action={
            <button
              onClick={() => exportCsv(data.waitlist, ["email", "trade", "country", "created_at"], "waitlist.csv")}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
            >
              <Download className="h-3 w-3" /> Export CSV
            </button>
          }
        >
          <Table
            cols={["email", "trade", "country", "created_at"]}
            rows={data.waitlist}
            format={{ created_at: (v) => new Date(v).toLocaleString() }}
          />
        </Section>


        <Section title="Demo requests" sub={`${(data.demos ?? []).length} entries`}>
          <Table
            cols={["name", "email", "phone", "business_name", "trade", "created_at"]}
            rows={data.demos ?? []}
            format={{ created_at: (v) => new Date(v).toLocaleString() }}
          />
        </Section>

        <Section title="Businesses" sub={`${data.businesses.length} shops`}>
          <BusinessesTable businesses={data.businesses} subscriptions={data.subscriptions} onKyc={onKyc} />
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

function Section({ title, sub, action, children }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-10 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-sm uppercase tracking-widest">{title}</h2>
        <div className="flex items-center gap-3">
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
          {action}
        </div>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function exportCsv(rows: Row[], cols: string[], filename: string) {
  const escape = (v: any) => {
    if (v == null) return "";
    const s = typeof v === "string" ? v : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => escape(r[c])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

function BusinessesTable({
  businesses,
  subscriptions,
  onKyc,
}: {
  businesses: Row[];
  subscriptions: Row[];
  onKyc: (businessId: string, status: "verified" | "rejected") => void;
}) {
  const subMap = new Map<string, Row>();
  for (const s of subscriptions) if (!subMap.has(s.business_id)) subMap.set(s.business_id, s);
  const labelFor = (s?: Row) => {
    if (!s) return { text: "Unpaid", cls: "bg-muted text-muted-foreground" };
    if (s.status === "active" || s.status === "trialing") return { text: `Paid · ${s.plan ?? "—"}`, cls: "bg-primary/15 text-primary" };
    if (s.status === "past_due" || s.status === "unpaid") return { text: "Past due", cls: "bg-yellow-500/15 text-yellow-500" };
    if (s.status === "canceled" || s.status === "cancelled") return { text: "Cancelled", cls: "bg-destructive/15 text-destructive" };
    return { text: s.status, cls: "bg-muted text-muted-foreground" };
  };
  if (businesses.length === 0) return <p className="p-6 text-center text-sm text-muted-foreground">No rows.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left">
          {["name", "trade", "kyc", "billing", "created_at", "actions"].map((c) => (
            <th key={c} className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {businesses.map((r) => {
          const badge = labelFor(subMap.get(r.id));
          const kyc = (r.kyc_status as string) || "pending";
          return (
            <tr key={r.id} className="border-b border-border/60">
              <td className="px-4 py-2.5 text-foreground/90">
                <div>{r.name ?? "—"}</div>
                {r.kyc_legal_name && <div className="text-xs text-muted-foreground">{r.kyc_legal_name}</div>}
              </td>
              <td className="px-4 py-2.5 text-foreground/90">{r.trade ?? "—"}</td>
              <td className="px-4 py-2.5">
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {kyc}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <span className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${badge.cls}`}>{badge.text}</span>
              </td>
              <td className="px-4 py-2.5 text-foreground/90">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
              <td className="px-4 py-2.5">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onKyc(r.id, "verified")}
                    className="rounded border border-primary/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary hover:bg-primary/10"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => onKyc(r.id, "rejected")}
                    className="rounded border border-destructive/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-destructive hover:bg-destructive/10"
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
