import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPublicEstimate, respondEstimate } from "@/lib/estimates.functions";
import type { LineItem } from "@/lib/estimates.functions";
import { toast } from "sonner";
import { Check, X, Zap } from "lucide-react";

export const Route = createFileRoute("/quote/$token")({
  head: ({ params }) => ({ meta: [{ title: `Estimate ${params.token.slice(0, 6)} — CallLedger` }, { name: "robots", content: "noindex" }] }),
  component: QuotePage,
});

type Estimate = {
  id: string; customer_name: string; title: string; line_items: LineItem[];
  subtotal_cents: number; tax_cents: number; total_cents: number; status: string;
  valid_until: string | null; notes: string | null; public_token: string;
};
type Biz = { name: string; trade: string; service_area: string | null; phone: string | null };

function QuotePage() {
  const { token } = Route.useParams();
  const getFn = useServerFn(getPublicEstimate);
  const respondFn = useServerFn(respondEstimate);
  const [est, setEst] = useState<Estimate | null>(null);
  const [biz, setBiz] = useState<Biz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await getFn({ data: { token } });
      setEst(r.estimate as unknown as Estimate | null);
      setBiz(r.business as Biz | null);
      setLoading(false);
    })();
  }, [getFn, token]);

  const respond = async (action: "accepted" | "declined") => {
    const r = await respondFn({ data: { token, action } });
    if (r.ok) { toast.success(action === "accepted" ? "Accepted — we'll be in touch" : "Response recorded"); setEst((e) => e ? { ...e, status: action } : e); }
    else toast.error(r.error);
  };

  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading estimate…</div>;
  if (!est || !biz) return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <h1 className="font-display text-3xl">Estimate not found</h1>
        <p className="mt-2 text-muted-foreground">This link may have expired.</p>
      </div>
    </div>
  );

  const done = est.status === "accepted" || est.status === "declined";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-4">
          <div className="grid h-8 w-8 place-items-center rounded-sm bg-primary text-primary-foreground"><Zap className="h-4 w-4" strokeWidth={2.5} /></div>
          <p className="font-display text-lg">CALL<span className="text-primary">LEDGER</span></p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Estimate</p>
        <h1 className="mt-2 font-display text-4xl">{est.title}</h1>
        <p className="mt-2 text-muted-foreground">Prepared for {est.customer_name}</p>

        <div className="mt-8 rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <p className="font-display text-lg">{biz.name}</p>
            <p className="text-sm text-muted-foreground">{biz.trade}{biz.service_area ? ` · ${biz.service_area}` : ""}</p>
          </div>
          <ul className="divide-y divide-border">
            {est.line_items.map((li, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm">{li.description}</p>
                  <p className="text-xs text-muted-foreground">Qty {li.qty} × ${(li.unit_price_cents / 100).toLocaleString()}</p>
                </div>
                <p className="font-mono text-sm">${((li.qty * li.unit_price_cents) / 100).toLocaleString()}</p>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-4">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Total</span>
            <span className="font-display text-3xl text-primary">${(est.total_cents / 100).toLocaleString()}</span>
          </div>
        </div>

        {est.notes && <p className="mt-6 whitespace-pre-wrap rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">{est.notes}</p>}
        {est.valid_until && <p className="mt-4 text-xs text-muted-foreground">Valid until {est.valid_until}</p>}

        <div className="mt-8">
          {done ? (
            <div className={`rounded-lg border p-5 text-center ${est.status === "accepted" ? "border-primary/40 bg-primary/10" : "border-destructive/40 bg-destructive/10"}`}>
              <p className="font-display text-xl">{est.status === "accepted" ? "Estimate accepted" : "Estimate declined"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{est.status === "accepted" ? "We'll reach out to schedule." : "Thanks for the reply."}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={() => respond("accepted")} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110"><Check className="h-4 w-4" /> Accept</button>
              <button onClick={() => respond("declined")} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold hover:bg-accent"><X className="h-4 w-4" /> Decline</button>
            </div>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">Powered by <Link to="/" className="text-primary hover:underline">CallLedger</Link></p>
      </main>
    </div>
  );
}
