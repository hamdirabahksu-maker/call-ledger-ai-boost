import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import {
  listEstimates, upsertEstimate, deleteEstimate, convertEstimateToInvoice, aiSuggestLineItems,
  type LineItem,
} from "@/lib/estimates.functions";
import { sendSms, getTwilioStatus } from "@/lib/sms.functions";
import { Plus, Trash2, Pencil, FileText, Send, Sparkles, ArrowRightCircle, Copy, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/estimates")({
  head: () => ({ meta: [{ title: "Estimates — CallLedger" }, { name: "robots", content: "noindex" }] }),
  component: EstimatesPage,
});

type Estimate = {
  id: string; business_id: string; customer_name: string; phone: string | null; email: string | null;
  title: string; line_items: LineItem[]; subtotal_cents: number; tax_cents: number; total_cents: number;
  status: string; public_token: string; valid_until: string | null; notes: string | null; created_at: string;
};

function EstimatesPage() {
  const listFn = useServerFn(listEstimates);
  const saveFn = useServerFn(upsertEstimate);
  const delFn = useServerFn(deleteEstimate);
  const convertFn = useServerFn(convertEstimateToInvoice);
  const aiFn = useServerFn(aiSuggestLineItems);
  const smsFn = useServerFn(sendSms);
  const twilioFn = useServerFn(getTwilioStatus);
  const [rows, setRows] = useState<Estimate[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [trade, setTrade] = useState<string>("");
  const [editing, setEditing] = useState<Partial<Estimate> & { tax_rate?: number; aiPrompt?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [twilioOk, setTwilioOk] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: biz } = await supabase.from("businesses").select("id, trade").maybeSingle();
      setBusinessId(biz?.id ?? null);
      setTrade(biz?.trade ?? "");
      const list = await listFn().catch(() => []);
      setRows(list as Estimate[]);
      setLoading(false);
      twilioFn().then((s) => setTwilioOk(s.twilioConfigured)).catch(() => setTwilioOk(false));
    })();
  }, [listFn, twilioFn]);

  const openNew = () => setEditing({ title: "Estimate", line_items: [{ description: "", qty: 1, unit_price_cents: 0 }], status: "draft" });
  const openEdit = (e: Estimate) => setEditing({ ...e });

  const items = editing?.line_items ?? [];
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price_cents, 0);

  const save = async () => {
    if (!editing || !businessId) return;
    if (!editing.customer_name?.trim()) { toast.error("Customer name required"); return; }
    try {
      const res = await saveFn({ data: {
        id: editing.id, business_id: businessId,
        customer_name: editing.customer_name!, phone: editing.phone ?? undefined, email: editing.email ?? undefined,
        title: editing.title || "Estimate", line_items: (editing.line_items ?? []).filter((i) => i.description.trim()),
        tax_rate: editing.tax_rate ?? 0, valid_until: editing.valid_until ?? undefined,
        notes: editing.notes ?? undefined, status: (editing.status as "draft" | "sent" | "accepted" | "declined" | "expired") ?? "draft",
      }});
      toast.success("Saved");
      setEditing(null);
      const list = await listFn();
      setRows(list as Estimate[]);
      return res;
    } catch { toast.error("Save failed"); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete estimate?")) return;
    try { await delFn({ data: { id } }); setRows((r) => r.filter((x) => x.id !== id)); toast.success("Deleted"); }
    catch { toast.error("Delete failed"); }
  };

  const publicUrl = (t: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/quote/${t}`;

  const sendEstimate = async (e: Estimate) => {
    if (!e.phone) { toast.error("No phone on estimate"); return; }
    const url = publicUrl(e.public_token);
    if (twilioOk === false) {
      navigator.clipboard.writeText(url);
      toast.success("Twilio not connected — link copied");
      return;
    }
    try {
      const res = await smsFn({ data: { to: e.phone, body: `Your estimate from us: ${url}` }});
      if (!res.ok) { toast.error(res.error || "SMS failed"); return; }
      await saveFn({ data: { id: e.id, business_id: e.business_id, customer_name: e.customer_name, title: e.title, line_items: e.line_items as LineItem[], status: "sent" }});
      toast.success("SMS sent");
      const list = await listFn(); setRows(list as Estimate[]);
    } catch { toast.error("SMS failed"); }
  };

  const convert = async (e: Estimate) => {
    try {
      const r = await convertFn({ data: { estimate_id: e.id } });
      toast.success("Invoice created");
      window.location.href = "/invoices";
      return r;
    } catch { toast.error("Convert failed"); }
  };

  const aiFill = async () => {
    if (!editing?.aiPrompt) return;
    toast.loading("Generating…", { id: "ai" });
    const r = await aiFn({ data: { description: editing.aiPrompt, trade } });
    toast.dismiss("ai");
    if (!r.ok) { toast.error(r.error); return; }
    setEditing({ ...editing, line_items: r.items });
    toast.success("Line items filled");
  };

  return (
    <AppShell subtitle="Quotes" title="Estimates">
      <div className="mb-4 flex justify-end">
        <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> New estimate
        </button>
      </div>

      {loading ? <p className="text-muted-foreground">Loading…</p> : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 font-display text-xl">No estimates yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Build a quote in seconds. Send by SMS. Get it signed.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((e) => (
            <div key={e.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{e.customer_name}</p>
                    <StatusPill s={e.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{e.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">{new Date(e.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-2xl text-primary">${(e.total_cents / 100).toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Btn onClick={() => sendEstimate(e)} icon={Send}>Send SMS</Btn>
                <Btn onClick={() => { navigator.clipboard.writeText(publicUrl(e.public_token)); toast.success("Link copied"); }} icon={Copy}>Copy link</Btn>
                <a href={publicUrl(e.public_token)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-primary hover:text-primary"><ExternalLink className="h-3 w-3" /> Preview</a>
                {e.status === "accepted" && <Btn onClick={() => convert(e)} icon={ArrowRightCircle}>To invoice</Btn>}
                <Btn onClick={() => openEdit(e)} icon={Pencil}>Edit</Btn>
                <Btn onClick={() => remove(e.id)} icon={Trash2} destructive>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="mx-auto my-8 w-full max-w-2xl rounded-lg border border-border bg-card p-6" onClick={(evt) => evt.stopPropagation()}>
            <h2 className="font-display text-xl">{editing.id ? "Edit estimate" : "New estimate"}</h2>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Customer name" value={editing.customer_name ?? ""} onChange={(v) => setEditing({ ...editing, customer_name: v })} />
                <Field label="Phone" value={editing.phone ?? ""} onChange={(v) => setEditing({ ...editing, phone: v })} />
              </div>
              <Field label="Title" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} />

              <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 p-3">
                <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-primary"><Sparkles className="h-3 w-3" /> AI-fill from job description</p>
                <div className="flex gap-2">
                  <input placeholder="e.g. Replace 40-gal water heater, permit, haul-away" value={editing.aiPrompt ?? ""} onChange={(e) => setEditing({ ...editing, aiPrompt: e.target.value })} className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" />
                  <button onClick={aiFill} className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Generate</button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Line items</p>
                {(editing.line_items ?? []).map((li, i) => (
                  <div key={i} className="flex gap-2">
                    <input placeholder="Description" value={li.description} onChange={(e) => {
                      const items = [...(editing.line_items ?? [])]; items[i] = { ...li, description: e.target.value }; setEditing({ ...editing, line_items: items });
                    }} className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" />
                    <input type="number" min={1} value={li.qty} onChange={(e) => {
                      const items = [...(editing.line_items ?? [])]; items[i] = { ...li, qty: Number(e.target.value) || 1 }; setEditing({ ...editing, line_items: items });
                    }} className="w-16 rounded-md border border-border bg-background px-2 py-2 text-sm" />
                    <input type="number" min={0} step="0.01" placeholder="Price" value={(li.unit_price_cents / 100).toString()} onChange={(e) => {
                      const items = [...(editing.line_items ?? [])]; items[i] = { ...li, unit_price_cents: Math.round((Number(e.target.value) || 0) * 100) }; setEditing({ ...editing, line_items: items });
                    }} className="w-24 rounded-md border border-border bg-background px-2 py-2 text-sm" />
                    <button onClick={() => setEditing({ ...editing, line_items: (editing.line_items ?? []).filter((_, ix) => ix !== i) })} className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <button onClick={() => setEditing({ ...editing, line_items: [...(editing.line_items ?? []), { description: "", qty: 1, unit_price_cents: 0 }] })} className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary">+ Add line</button>
              </div>

              <div className="flex items-center justify-between rounded-md bg-muted/30 px-4 py-3">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Subtotal</span>
                <span className="font-display text-xl">${(subtotal / 100).toLocaleString()}</span>
              </div>

              <Field label="Notes" value={editing.notes ?? ""} onChange={(v) => setEditing({ ...editing, notes: v })} textarea />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button>
              <button onClick={save} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {textarea
        ? <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        : <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />}
    </label>
  );
}

function Btn({ onClick, icon: Icon, children, destructive }: { onClick: () => void; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; destructive?: boolean }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium ${destructive ? "border-destructive/30 text-destructive hover:bg-destructive/10" : "border-border hover:border-primary hover:text-primary"}`}>
      <Icon className="h-3 w-3" /> {children}
    </button>
  );
}

function StatusPill({ s }: { s: string }) {
  const tone: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-500/15 text-blue-400",
    accepted: "bg-primary/15 text-primary",
    declined: "bg-destructive/15 text-destructive",
    expired: "bg-muted text-muted-foreground",
    paid: "bg-primary/15 text-primary",
    overdue: "bg-destructive/15 text-destructive",
    void: "bg-muted text-muted-foreground",
  };
  return <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${tone[s] ?? "bg-muted text-muted-foreground"}`}>{s}</span>;
}
