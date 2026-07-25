import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { updateBusinessSettings } from "@/lib/business.functions";
import { getTwilioStatus } from "@/lib/sms.functions";
import { getStripeStatus, createCheckoutSession } from "@/lib/checkout.functions";
import { Copy, CreditCard, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — CallLedger" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

type Biz = {
  id: string; name: string; phone: string | null; service_area: string | null;
  google_review_url: string | null; after_hours_message: string | null;
  booking_enabled: boolean; booking_slug: string | null; slot_minutes: number; buffer_minutes: number; timezone: string | null;
};
type Sub = { plan: string | null; status: string; current_period_end: string | null } | null;

function SettingsPage() {
  const saveFn = useServerFn(updateBusinessSettings);
  const twilioFn = useServerFn(getTwilioStatus);
  const stripeFn = useServerFn(getStripeStatus);
  const [biz, setBiz] = useState<Biz | null>(null);
  const [twilioOk, setTwilioOk] = useState<boolean | null>(null);
  const [stripeOk, setStripeOk] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("businesses").select("id, name, phone, service_area, google_review_url, after_hours_message, booking_enabled, booking_slug, slot_minutes, buffer_minutes, timezone").maybeSingle();
      setBiz(data as Biz);
      twilioFn().then((s) => setTwilioOk(s.twilioConfigured)).catch(() => setTwilioOk(false));
      stripeFn().then((s) => setStripeOk(s.configured)).catch(() => setStripeOk(false));
    })();
  }, [twilioFn, stripeFn]);

  const save = async () => {
    if (!biz) return;
    try {
      await saveFn({ data: {
        id: biz.id, name: biz.name, phone: biz.phone ?? "", service_area: biz.service_area ?? "",
        google_review_url: biz.google_review_url ?? "", after_hours_message: biz.after_hours_message ?? "",
        booking_enabled: biz.booking_enabled, slot_minutes: biz.slot_minutes, buffer_minutes: biz.buffer_minutes,
        timezone: biz.timezone ?? "",
      }});
      toast.success("Settings saved");
    } catch { toast.error("Save failed"); }
  };

  if (!biz) return <AppShell><p className="text-muted-foreground">Loading…</p></AppShell>;

  const bookingUrl = biz.booking_slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${biz.booking_slug}` : null;

  return (
    <AppShell subtitle="Configuration" title="Settings">
      <div className="grid gap-6 max-w-3xl">
        <Section title="Business">
          <Field label="Business name" value={biz.name} onChange={(v) => setBiz({ ...biz, name: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Phone" value={biz.phone ?? ""} onChange={(v) => setBiz({ ...biz, phone: v })} />
            <Field label="Timezone" value={biz.timezone ?? ""} onChange={(v) => setBiz({ ...biz, timezone: v })} />
          </div>
          <Field label="Service area" value={biz.service_area ?? ""} onChange={(v) => setBiz({ ...biz, service_area: v })} />
        </Section>

        <Section title="Booking">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={biz.booking_enabled} onChange={(e) => setBiz({ ...biz, booking_enabled: e.target.checked })} />
            <span className="text-sm">Booking link is public</span>
          </label>
          {bookingUrl && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-2.5">
              <code className="flex-1 truncate font-mono text-xs">{bookingUrl}</code>
              <button onClick={() => { navigator.clipboard.writeText(bookingUrl); toast.success("Copied"); }} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary"><Copy className="h-3 w-3" /> Copy</button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Slot minutes" value={String(biz.slot_minutes)} onChange={(v) => setBiz({ ...biz, slot_minutes: Number(v) || 60 })} />
            <Field label="Buffer minutes" value={String(biz.buffer_minutes)} onChange={(v) => setBiz({ ...biz, buffer_minutes: Number(v) || 0 })} />
          </div>
        </Section>

        <Section title="Reviews">
          <Field label="Google review URL" value={biz.google_review_url ?? ""} onChange={(v) => setBiz({ ...biz, google_review_url: v })} placeholder="https://g.page/r/…/review" />
        </Section>

        <Section title="Messaging">
          <Field label="After-hours SMS template" value={biz.after_hours_message ?? ""} onChange={(v) => setBiz({ ...biz, after_hours_message: v })} textarea />
        </Section>

        <Section title="Integrations">
          <div className="space-y-2">
            <StatusRow icon={MessageSquare} label="Twilio SMS" ok={twilioOk} help="Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in Project Settings → Secrets." />
            <StatusRow icon={CreditCard} label="Stripe" ok={stripeOk} help="Add STRIPE_SECRET_KEY in Project Settings → Secrets." />
          </div>
        </Section>

        <div className="flex justify-end">
          <button onClick={save} className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110">Save changes</button>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-5 py-3 font-display text-sm uppercase tracking-widest">{title}</h2>
      <div className="space-y-3 p-5">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, textarea, placeholder }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {textarea
        ? <textarea rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        : <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />}
    </label>
  );
}

function StatusRow({ icon: Icon, label, ok, help }: { icon: React.ComponentType<{ className?: string }>; label: string; ok: boolean | null; help: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-md border p-3 ${ok ? "border-primary/30 bg-primary/5" : "border-yellow-500/30 bg-yellow-500/5"}`}>
      <Icon className={`mt-0.5 h-4 w-4 ${ok ? "text-primary" : "text-yellow-500"}`} />
      <div className="flex-1">
        <p className="text-sm font-semibold">{label} <span className={`ml-2 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${ok ? "bg-primary/15 text-primary" : "bg-yellow-500/15 text-yellow-500"}`}>{ok === null ? "…" : ok ? "connected" : "not connected"}</span></p>
        {!ok && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
      </div>
    </div>
  );
}
