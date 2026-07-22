import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listInvoices, upsertInvoice, deleteInvoice, markInvoicePaid } from "@/lib/invoices.functions";
import type { LineItem } from "@/lib/estimates.functions";
import { sendSms, getTwilioStatus } from "@/lib/sms.functions";
import { Plus, Trash2, Pencil, Receipt, Send, Copy, ExternalLink, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/invoices")({
  head: () => ({ meta: [{ title: "Invoices — CallLedger" }, { name: "robots", content: "noindex" }] }),
  component: InvoicesPage,
});

type Invoice = {
  id: string; business_id: string; customer_name: string; phone: string | null; email: string | null;
  title: string; line_items: LineItem[]; subtotal_cents: number; tax_cents: number; total_cents: number;
  amount_paid_cents: number; status: string; public_token: string; due_date: string | null; notes: string | null; created_at: string;
};

function InvoicesPage() {
  const listFn = useServerFn(listInvoices);
  const saveFn = useServerFn(upsertInvoice);
  const delFn = useServerFn(deleteInvoice);
  const paidFn = useServerFn(markInvoicePaid);
  const smsFn = useServerFn(sendSms);
  const twilioFn = useServerFn(getTwilioStatus);
  const [rows, setRows] = useState<Invoice[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Invoice> | null>(null);
  const [loading, setLoading] = useState(true);
  const [twilioOk, setTwilioOk] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: biz } = await supabase.from("businesses").select("id").maybeSingle();
      setBusinessId(biz?.id ?? null);
      const list = await listFn().catch(() => []);
      setRows(list as Invoice[]);
      setLoading(false);
      twilioFn().then((s) => setTwilioOk(s.twilioConfigured)).catch(() => setTwilioOk(false));
    })();
  }, [listFn, twilioFn]);

  const openNew = () => setEditing({ title: "Invoice", line_items: [{ description: "", qty: 1, unit_price_cents: 0 }], status: "draft" });

  const save = async () => {
    if (!editing || !businessId) return;
    if (!editing.customer_name?.trim()) { toast.error("Customer name required"); return; }
    try {
      await saveFn({ data: {
        id: editing.id, business_id: businessId,
        customer_name: editing.customer_name!, phone: editing.phone ?? undefined, email: editing.email ?? undefined,
        title: editing.title || "Invoice", line_items: (editing.line_items ?? []).filter((i) => i.description.trim()),
        due_date: editing.due_date ?? undefined, notes: editing.notes ?? undefined,
        status: (editing.status as "draft" | "sent" | "paid" | "overdue" | "void") ?? "draft",
      }});
      toast.success("Saved"); setEditing(null);
      const list = await listFn(); setRows(list as Invoice[]);
    } catch { toast.error("Save failed"); }
  };

  const publicUrl = (t: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/invoice/${t}`;

  const sendInvoice = async (inv: Invoice) => {
    if (!inv.phone) { toast.error("No phone"); return; }
    const url = publicUrl(inv.public_token);
    if (twilioOk === false) { navigator.clipboard.writeText(url); toast.success("Twilio not connected — link copied"); return; }
    try {
      const res = await smsFn({ data: { to: inv.phone, body: `Invoice from us: ${url}` }});
      if (!res.ok) { toast.error(res.error || "SMS failed"); return; }
      await saveFn({ data: { id: inv.id, business_id: inv.business_id, customer_name: inv.customer_name, title: inv.title, line_items: inv.line_items, status: "sent" }});
      toast.success("Invoice sent");
      const list = await listFn(); setRows(list as Invoice[]);
    } catch { toast.error("SMS failed"); }
  };

  const markPaid = async (id: string) => {
    try { await paidFn({ data: { id } }); toast.success("Marked paid"); const list = await listFn(); setRows(list as Invoice[]); }
    catch { toast.error("Failed"); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete invoice?")) return;
    try { await delFn({ data: { id } }); setRows((r) => r.filter((x) => x.id !== id)); toast.success("Deleted"); }
    catch { toast.error("Delete failed"); }
  };

  const items = editing?.line_items ?? [];
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price_cents, 0);
  const outstanding = rows.filter((r) => r.status !== "paid" && r.status !== "void").reduce((s, r) => s + r.total_cents - r.amount_paid_cents, 0);
  const collected = rows.reduce((s, r) => s + r.amount_paid_cents, 0);

  return (
    <AppShell subtitle="Billing" title="Invoices">
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Outstanding</p>
          <p className="mt-1 font-display text-3xl text-primary">${(outstanding / 100).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Collected</p>
          <p className="mt-1 font-display text-3xl">${(collected / 100).toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> New invoice</button>
      </div>

      {loading ? <p className="text-muted-foreground">Loading…</p> : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Receipt className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 font-display text-xl">No invoices yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Convert an accepted estimate or create one from scratch.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((inv) => (
            <div key={inv.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{inv.customer_name}</p>
                    <StatusPill s={inv.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{inv.title}</p>
                  {inv.due_date && <p className="text-xs text-muted-foreground/70">Due {inv.due_date}</p>}
                </div>
                <p className="font-display text-2xl text-primary">${(inv.total_cents / 100).toLocaleString()}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Btn onClick={() => sendInvoice(inv)} icon={Send}>Send SMS</Btn>
                <Btn onClick={() => { navigator.clipboard.writeText(publicUrl(inv.public_token)); toast.success("Link copied"); }} icon={Copy}>Copy link</Btn>
                <a href={publicUrl(inv.public_token)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-primary hover:text-primary"><ExternalLink className="h-3 w-3" /> Preview</a>
                {inv.status !== "paid" && <Btn onClick={() => markPaid(inv.id)} icon={Check}>Mark paid</Btn>}
                <Btn onClick={() => setEditing(inv)} icon={Pencil}>Edit</Btn>
                <Btn onClick={() => remove(inv.id)} icon={Trash2} destructive>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="mx-auto my-8 w-full max-w-2xl rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl">{editing.id ? "Edit invoice" : "New invoice"}</h2>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Customer name" value={editing.customer_name ?? ""} onChange={(v) => setEditing({ ...editing, customer_name: v })} />
                <Field label="Phone" value={editing.phone ?? ""} onChange={(v) => setEditing({ ...editing, phone: v })} />
              </div>
              <Field label="Title" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} />
              <Field label="Due date" value={editing.due_date ?? ""} onChange={(v) => setEditing({ ...editing, due_date: v })} />

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
                    <input type="number" min={0} step="0.01" value={(li.unit_price_cents / 100).toString()} onChange={(e) => {
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
    paid: "bg-primary/15 text-primary",
    overdue: "bg-destructive/15 text-destructive",
    void: "bg-muted text-muted-foreground",
  };
  return <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${tone[s] ?? "bg-muted text-muted-foreground"}`}>{s}</span>;
}
