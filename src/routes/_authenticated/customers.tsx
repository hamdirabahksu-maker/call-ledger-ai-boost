import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listCustomers, upsertCustomer, deleteCustomer } from "@/lib/customers.functions";
import { Plus, Trash2, Pencil, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({ meta: [{ title: "Customers — CallLedger" }, { name: "robots", content: "noindex" }] }),
  component: CustomersPage,
});

type Customer = { id: string; business_id: string; name: string; phone: string | null; email: string | null; address: string | null; notes: string | null; created_at: string };

function CustomersPage() {
  const listFn = useServerFn(listCustomers);
  const saveFn = useServerFn(upsertCustomer);
  const delFn = useServerFn(deleteCustomer);
  const [rows, setRows] = useState<Customer[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Customer> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: biz } = await supabase.from("businesses").select("id").maybeSingle();
      setBusinessId(biz?.id ?? null);
      const list = await listFn().catch(() => []);
      setRows(list as Customer[]);
      setLoading(false);
    })();
  }, [listFn]);

  const save = async () => {
    if (!editing || !businessId) return;
    if (!editing.name?.trim()) { toast.error("Name required"); return; }
    try {
      await saveFn({ data: {
        id: editing.id, business_id: businessId, name: editing.name!,
        phone: editing.phone ?? undefined, email: editing.email ?? undefined,
        address: editing.address ?? undefined, notes: editing.notes ?? undefined,
      }});
      toast.success("Saved");
      setEditing(null);
      const list = await listFn();
      setRows(list as Customer[]);
    } catch { toast.error("Save failed"); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    try { await delFn({ data: { id } }); setRows((r) => r.filter((x) => x.id !== id)); toast.success("Deleted"); }
    catch { toast.error("Delete failed"); }
  };

  return (
    <AppShell subtitle="CRM" title="Customers">
      <div className="mb-4 flex justify-end">
        <button onClick={() => setEditing({})} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110">
          <Plus className="h-4 w-4" /> New customer
        </button>
      </div>

      {loading ? <p className="text-muted-foreground">Loading…</p> : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 font-display text-xl">No customers yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first customer to link jobs, estimates, and invoices.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Address</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-accent/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.address ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditing(c)} className="mr-2 rounded-md p-1.5 hover:bg-accent"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(c.id)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl">{editing.id ? "Edit customer" : "New customer"}</h2>
            <div className="mt-4 space-y-3">
              <Field label="Name" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone" value={editing.phone ?? ""} onChange={(v) => setEditing({ ...editing, phone: v })} />
                <Field label="Email" value={editing.email ?? ""} onChange={(v) => setEditing({ ...editing, email: v })} />
              </div>
              <Field label="Address" value={editing.address ?? ""} onChange={(v) => setEditing({ ...editing, address: v })} />
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
