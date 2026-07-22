import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPublicInvoice } from "@/lib/invoices.functions";
import type { LineItem } from "@/lib/estimates.functions";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/invoice/$token")({
  head: ({ params }) => ({ meta: [{ title: `Invoice ${params.token.slice(0, 6)} — CallLedger` }, { name: "robots", content: "noindex" }] }),
  component: InvoicePage,
});

type Invoice = {
  id: string; customer_name: string; title: string; line_items: LineItem[];
  subtotal_cents: number; tax_cents: number; total_cents: number; amount_paid_cents: number;
  status: string; due_date: string | null; notes: string | null; public_token: string;
};
type Biz = { name: string; trade: string; service_area: string | null; phone: string | null };

function InvoicePage() {
  const { token } = Route.useParams();
  const getFn = useServerFn(getPublicInvoice);
  const [inv, setInv] = useState<Invoice | null>(null);
  const [biz, setBiz] = useState<Biz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    const r = await getFn({ data: { token } });
    setInv(r.invoice as unknown as Invoice | null); setBiz(r.business as Biz | null); setLoading(false);
  })(); }, [getFn, token]);

  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading invoice…</div>;
  if (!inv || !biz) return <div className="grid min-h-screen place-items-center"><h1 className="font-display text-3xl">Invoice not found</h1></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-4">
          <div className="grid h-8 w-8 place-items-center rounded-sm bg-primary text-primary-foreground"><Zap className="h-4 w-4" strokeWidth={2.5} /></div>
          <p className="font-display text-lg">CALL<span className="text-primary">LEDGER</span></p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Invoice</p>
            <h1 className="mt-2 font-display text-4xl">{inv.title}</h1>
          </div>
          <span className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-widest ${inv.status === "paid" ? "bg-primary/15 text-primary" : inv.status === "overdue" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{inv.status}</span>
        </div>
        <p className="mt-2 text-muted-foreground">Billed to {inv.customer_name}</p>

        <div className="mt-8 rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <p className="font-display text-lg">{biz.name}</p>
            <p className="text-sm text-muted-foreground">{biz.trade}{biz.service_area ? ` · ${biz.service_area}` : ""}</p>
          </div>
          <ul className="divide-y divide-border">
            {inv.line_items.map((li, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm">{li.description}</p>
                  <p className="text-xs text-muted-foreground">Qty {li.qty} × ${(li.unit_price_cents / 100).toLocaleString()}</p>
                </div>
                <p className="font-mono text-sm">${((li.qty * li.unit_price_cents) / 100).toLocaleString()}</p>
              </li>
            ))}
          </ul>
          <div className="border-t border-border bg-muted/20 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Total</span>
              <span className="font-display text-3xl text-primary">${(inv.total_cents / 100).toLocaleString()}</span>
            </div>
            {inv.amount_paid_cents > 0 && (
              <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                <span>Paid</span><span>${(inv.amount_paid_cents / 100).toLocaleString()}</span>
              </div>
            )}
            {inv.due_date && <p className="mt-2 text-xs text-muted-foreground">Due {inv.due_date}</p>}
          </div>
        </div>

        {inv.notes && <p className="mt-6 whitespace-pre-wrap rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">{inv.notes}</p>}

        <p className="mt-10 text-center text-xs text-muted-foreground">Powered by <Link to="/" className="text-primary hover:underline">CallLedger</Link></p>
      </main>
    </div>
  );
}
