import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generateMarketing, listMarketing, type MarketingKind, type Channel } from "@/lib/marketing.functions";
import { isMedical } from "@/lib/industries";
import { toast } from "sonner";
import { Zap, ArrowLeft, Sparkles, MessageSquare, Mail, Share2, Globe, Copy, Loader2 } from "lucide-react";

type Draft = {
  id: string; kind: string; channel: string | null; content: string;
  prompt: string | null; created_at: string;
};

export const Route = createFileRoute("/_authenticated/marketing")({
  head: () => ({ meta: [{ title: "AI Marketing — CallLedger" }, { name: "robots", content: "noindex" }] }),
  component: Marketing,
});

function Marketing() {
  const navigate = useNavigate();
  const gen = useServerFn(generateMarketing);
  const list = useServerFn(listMarketing);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [leads, setLeads] = useState<{ id: string; name: string; issue: string | null }[]>([]);
  const [busy, setBusy] = useState<MarketingKind | null>(null);
  const [trade, setTrade] = useState<string>("");
  const [channel, setChannel] = useState<Channel>("sms");
  const [leadId, setLeadId] = useState<string>("");
  const [extra, setExtra] = useState("");

  useEffect(() => {
    (async () => {
      const { data: biz } = await supabase.from("businesses").select("id, trade").maybeSingle();
      if (!biz) { navigate({ to: "/onboarding" }); return; }
      setTrade(biz.trade);
      const [{ data: l }, ds] = await Promise.all([
        supabase.from("leads").select("id, name, issue").eq("business_id", biz.id).order("created_at", { ascending: false }).limit(20),
        list({}),
      ]);
      setLeads(l ?? []);
      setDrafts(ds as Draft[]);
    })();
  }, [list, navigate]);

  const run = async (kind: MarketingKind) => {
    setBusy(kind);
    try {
      const draft = await gen({
        data: {
          kind,
          channel: kind === "outreach" ? channel : undefined,
          leadId: kind === "outreach" ? leadId || undefined : undefined,
          extra: extra || undefined,
        },
      }) as Draft;
      setDrafts((d) => [draft, ...d]);
      toast.success("Draft ready");
    } catch (e: any) {
      const msg = e?.message ?? "";
      if (msg.includes("429")) toast.error("Rate limited — try again in a moment.");
      else if (msg.includes("402")) toast.error("AI credits exhausted — top up in Lovable settings.");
      else toast.error("Couldn't generate — " + (msg || "unknown error"));
    } finally { setBusy(null); }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const medical = isMedical(trade);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/app" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to dispatch
          </Link>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg">CALL<span className="text-primary">LEDGER</span></span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 animate-fade-in">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" /> AI Marketing
        </p>
        <h1 className="mt-2 font-display text-4xl">Write in seconds. Ship in one click.</h1>
        <p className="mt-2 text-muted-foreground">Outreach messages, social posts, and business blurbs — tuned to your shop.</p>

        {medical && (
          <div className="mt-6 rounded-md border border-primary/40 bg-primary/10 p-3 text-sm text-foreground">
            Clinic mode: copy is restricted to <span className="font-semibold">admin, scheduling, and reminders</span> only. Never medical advice.
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <Card title="Outreach message" icon={MessageSquare}>
              <div className="grid grid-cols-3 gap-2">
                {(["sms", "whatsapp", "email"] as Channel[]).map((c) => (
                  <button key={c} onClick={() => setChannel(c)}
                    className={`rounded-md border px-2 py-2 text-xs font-medium uppercase tracking-widest transition ${
                      channel === c ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}>{c}</button>
                ))}
              </div>
              <select value={leadId} onChange={(e) => setLeadId(e.target.value)}
                className="mt-3 h-10 w-full rounded-md border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none">
                <option value="">Generic (no specific lead)</option>
                {leads.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.issue ?? "no notes"}</option>)}
              </select>
              <Button onClick={() => run("outreach")} busy={busy === "outreach"} icon={MessageSquare}>Generate {channel.toUpperCase()}</Button>
            </Card>

            <Card title="Social posts (5)" icon={Share2}>
              <p className="text-xs text-muted-foreground">Mix of tips, behind-the-scenes, seasonal.</p>
              <Button onClick={() => run("social")} busy={busy === "social"} icon={Share2}>Generate 5 posts</Button>
            </Card>

            <Card title="Google / website blurb" icon={Globe}>
              <p className="text-xs text-muted-foreground">Short "About" copy for your profile.</p>
              <Button onClick={() => run("blurb")} busy={busy === "blurb"} icon={Globe}>Generate blurb</Button>
            </Card>

            <Card title="Extra context (optional)" icon={Mail}>
              <textarea rows={3} value={extra} onChange={(e) => setExtra(e.target.value)}
                placeholder="e.g. Winter furnace tune-up special, mention 20+ years experience"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </Card>
          </div>

          <div>
            <h2 className="font-display text-sm uppercase tracking-widest text-muted-foreground">Recent drafts</h2>
            <div className="mt-3 space-y-3">
              {drafts.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
                  No drafts yet — generate one to get started.
                </div>
              )}
              {drafts.map((d) => (
                <article key={d.id} className="rounded-lg border border-border bg-card p-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-sm bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary">
                        {d.kind}{d.channel ? ` · ${d.channel}` : ""}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</span>
                    </div>
                    <button onClick={() => copy(d.content)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary">
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-foreground/90">{d.content}</pre>
                </article>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Button({ onClick, busy, icon: Icon, children }: { onClick: () => void; busy: boolean; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={busy}
      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {busy ? "Writing..." : children}
    </button>
  );
}
