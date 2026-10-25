import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listReviewRequests, createReviewRequest, markReviewSent } from "@/lib/reviews.functions";
import { sendSms, getTwilioStatus } from "@/lib/sms.functions";
import { Star, Send, Check, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => ({ meta: [{ title: "Reviews — CallLedger" }, { name: "robots", content: "noindex" }] }),
  component: ReviewsPage,
});

type Row = { id: string; business_id: string; customer_name: string; phone: string | null; google_review_url: string | null; status: string; sent_at: string | null; created_at: string };

function ReviewsPage() {
  const listFn = useServerFn(listReviewRequests);
  const createFn = useServerFn(createReviewRequest);
  const markFn = useServerFn(markReviewSent);
  const smsFn = useServerFn(sendSms);
  const twilioFn = useServerFn(getTwilioStatus);
  const [rows, setRows] = useState<Row[]>([]);
  const [biz, setBiz] = useState<{ id: string; name: string; google_review_url: string | null } | null>(null);
  const [adding, setAdding] = useState<{ name: string; phone: string } | null>(null);
  const [twilioOk, setTwilioOk] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("businesses").select("id, name, google_review_url").maybeSingle();
      setBiz(data);
      const list = await listFn().catch(() => []);
      setRows(list as Row[]);
      twilioFn().then((s) => setTwilioOk(s.twilioConfigured)).catch(() => setTwilioOk(false));
    })();
  }, [listFn, twilioFn]);

  const add = async () => {
    if (!adding || !biz) return;
    if (!adding.name.trim()) { toast.error("Name required"); return; }
    try {
      await createFn({ data: { business_id: biz.id, customer_name: adding.name, phone: adding.phone, google_review_url: biz.google_review_url ?? undefined }});
      toast.success("Added");
      setAdding(null);
      const list = await listFn(); setRows(list as Row[]);
    } catch { toast.error("Failed"); }
  };

  const send = async (r: Row) => {
    if (!r.phone) { toast.error("No phone"); return; }
    const url = r.google_review_url || biz?.google_review_url;
    if (!url) { toast.error("Set your Google review URL in Settings"); return; }
    if (twilioOk === false) { toast.error("Twilio not connected"); return; }
    try {
      const res = await smsFn({ data: { to: r.phone, body: `Hi ${r.customer_name.split(" ")[0]}, thanks for choosing ${biz?.name}! Would you leave us a quick review? ${url}` }});
      if (!res.ok) { toast.error(res.error || "SMS failed"); return; }
      await markFn({ data: { id: r.id, status: "sent" } });
      toast.success("Review request sent");
      const list = await listFn(); setRows(list as Row[]);
    } catch { toast.error("Failed"); }
  };

  return (
    <AppShell subtitle="Reputation" title="Review requests">
      {!biz?.google_review_url && (
        <div className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm">
          Add your Google review URL in <a href="/settings" className="font-semibold text-primary underline">Settings</a> to send review asks.
        </div>
      )}
      <div className="mb-4 flex justify-end">
        <button onClick={() => setAdding({ name: "", phone: "" })} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> New request</button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Star className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 font-display text-xl">No review requests yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Ask happy customers after every completed job.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div>
                <p className="font-semibold">{r.customer_name}</p>
                <p className="text-xs text-muted-foreground">{r.phone ?? "—"} · {r.status}</p>
              </div>
              <div className="flex gap-2">
                {r.status !== "sent" && r.status !== "done" && (
                  <button onClick={() => send(r)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-primary hover:text-primary"><Send className="h-3 w-3" /> Send</button>
                )}
                {r.status === "sent" && (
                  <button onClick={async () => { await markFn({ data: { id: r.id, status: "done" }}); const list = await listFn(); setRows(list as Row[]); }} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-primary hover:text-primary"><Check className="h-3 w-3" /> Mark done</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setAdding(null)}>
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg">New review request</h2>
            <div className="mt-4 space-y-3">
              <input placeholder="Customer name" value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input placeholder="Phone" value={adding.phone} onChange={(e) => setAdding({ ...adding, phone: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setAdding(null)} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button>
              <button onClick={add} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Add</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
