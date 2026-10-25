import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { updateBusinessSettings } from "@/lib/business.functions";
import { getTwilioStatus } from "@/lib/sms.functions";
import { getStripeStatus, createCheckoutSession } from "@/lib/checkout.functions";
import { getVerifyStatus, startPhoneOtp, checkPhoneOtp } from "@/lib/verify.functions";
import { PillTabs } from "@/components/pill-tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Bot, Copy, CreditCard, MessageSquare, ShieldCheck } from "lucide-react";

const TABS = [
  { id: "business", label: "Business" },
  { id: "booking", label: "Booking" },
  { id: "billing", label: "Billing" },
  { id: "notifications", label: "Notifications" },
  { id: "ai", label: "AI / MCP" },
] as const;

const MCP_TOOLS = [
  "business_summary",
  "list_leads",
  "create_lead",
  "list_bookings",
  "create_booking",
  "list_customers",
  "list_missed_calls",
  "list_invoices",
  "list_estimates",
  "list_review_requests",
] as const;
type Tab = (typeof TABS)[number]["id"];

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — CallLedger" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

type Biz = {
  id: string; name: string; phone: string | null; service_area: string | null;
  google_review_url: string | null; after_hours_message: string | null;
  booking_enabled: boolean; booking_slug: string | null; logo_url: string | null;
  phone_verified_at: string | null;
  slot_minutes: number; buffer_minutes: number; timezone: string | null;
};
type Sub = { plan: string | null; status: string; current_period_end: string | null } | null;

function SettingsPage() {
  const saveFn = useServerFn(updateBusinessSettings);
  const twilioFn = useServerFn(getTwilioStatus);
  const stripeFn = useServerFn(getStripeStatus);
  const verifyStatusFn = useServerFn(getVerifyStatus);
  const startOtpFn = useServerFn(startPhoneOtp);
  const checkOtpFn = useServerFn(checkPhoneOtp);
  const checkoutFn = useServerFn(createCheckoutSession);
  const [biz, setBiz] = useState<Biz | null>(null);
  const [sub, setSub] = useState<Sub>(null);
  const [twilioOk, setTwilioOk] = useState<boolean | null>(null);
  const [stripeOk, setStripeOk] = useState<boolean | null>(null);
  const [verifyOk, setVerifyOk] = useState<boolean | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("business");

  const reload = async () => {
    const { data } = await supabase
      .from("businesses")
      .select("id, name, phone, service_area, google_review_url, after_hours_message, booking_enabled, booking_slug, logo_url, phone_verified_at, slot_minutes, buffer_minutes, timezone")
      .maybeSingle();
    setBiz(data as Biz);
    if (data?.id) {
      const { data: s } = await supabase.from("subscriptions").select("plan,status,current_period_end").eq("business_id", data.id).maybeSingle();
      setSub(s as Sub);
    }
  };

  useEffect(() => {
    (async () => {
      await reload();
      twilioFn().then((s) => setTwilioOk(s.twilioConfigured)).catch(() => setTwilioOk(false));
      stripeFn().then((s) => setStripeOk(s.configured)).catch(() => setStripeOk(false));
      verifyStatusFn().then((s) => setVerifyOk(s.verifyConfigured)).catch(() => setVerifyOk(false));
    })();
  }, [twilioFn, stripeFn, verifyStatusFn]);

  const startCheckout = async (plan: "pilot" | "starter" | "growth") => {
    if (!biz) return;
    try {
      const res = await checkoutFn({ data: { plan, businessId: biz.id } });
      if (!res.configured) { toast.error("Stripe not connected — add STRIPE_SECRET_KEY."); return; }
      window.location.href = res.url;
    } catch { toast.error("Couldn't start checkout"); }
  };

  const save = async () => {
    if (!biz) return;
    try {
      await saveFn({ data: {
        id: biz.id, name: biz.name, phone: biz.phone ?? "", service_area: biz.service_area ?? "",
        google_review_url: biz.google_review_url ?? "", after_hours_message: biz.after_hours_message ?? "",
        booking_enabled: biz.booking_enabled, booking_slug: biz.booking_slug ?? "",
        logo_url: biz.logo_url ?? "",
        slot_minutes: biz.slot_minutes, buffer_minutes: biz.buffer_minutes,
        timezone: biz.timezone ?? "",
      }});
      toast.success("Settings saved");
      await reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
  };

  const sendOtp = async () => {
    if (!biz?.phone) return toast.error("Enter a phone number first");
    setOtpBusy(true);
    try {
      const res = await startOtpFn({ data: { phone: biz.phone } });
      if (!res.configured) {
        toast.error("Connect Twilio Verify — add TWILIO_VERIFY_SERVICE_SID (and TWILIO_*).");
        return;
      }
      if (!res.ok) { toast.error(res.error ?? "Could not send code"); return; }
      toast.success("Verification code sent — check your phone.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "OTP failed"); }
    finally { setOtpBusy(false); }
  };

  const confirmOtp = async () => {
    if (!biz?.phone || !otpCode.trim()) return toast.error("Enter the code from SMS");
    setOtpBusy(true);
    try {
      const res = await checkOtpFn({ data: { phone: biz.phone, code: otpCode.trim() } });
      if (!res.configured) {
        toast.error("Connect Twilio Verify — add TWILIO_VERIFY_SERVICE_SID.");
        return;
      }
      if (!res.ok) { toast.error(res.error ?? "Invalid code"); return; }
      toast.success("Phone verified");
      setOtpCode("");
      await reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Verify failed"); }
    finally { setOtpBusy(false); }
  };

  if (!biz) return <AppShell><p className="text-muted-foreground">Loading…</p></AppShell>;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const bookingUrl = biz.booking_slug ? `${origin}/book/${biz.booking_slug}` : null;
  const mcpUrl = origin ? `${origin}/mcp` : "/mcp";
  const verified = Boolean(biz.phone_verified_at);

  return (
    <AppShell subtitle="Configuration" title="Settings">
      <div className="grid max-w-3xl gap-5">
        <PillTabs tabs={TABS} value={tab} onChange={setTab} />

        {tab === "business" && (
        <div key="business" className="grid gap-5 animate-page-enter">
        <Section title="Business">
          <Field label="Business name" value={biz.name} onChange={(v) => setBiz({ ...biz, name: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Phone" value={biz.phone ?? ""} onChange={(v) => setBiz({ ...biz, phone: v })} />
            <Field label="Timezone" value={biz.timezone ?? ""} onChange={(v) => setBiz({ ...biz, timezone: v })} />
          </div>
          <Field label="Service area" value={biz.service_area ?? ""} onChange={(v) => setBiz({ ...biz, service_area: v })} />
        </Section>

        <Section title="Branding">
          <p className="text-xs text-muted-foreground">Logo appears on /book and /quote public pages.</p>
          <Field label="Logo URL" value={biz.logo_url ?? ""} onChange={(v) => setBiz({ ...biz, logo_url: v })} placeholder="https://…/logo.png" />
          {biz.logo_url ? (
            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
              <img src={biz.logo_url} alt="" className="h-10 w-auto max-w-[120px] rounded object-contain" />
              <span className="text-xs text-muted-foreground">Preview on public book/quote</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-md border border-primary/40 bg-primary/15 font-display text-sm font-bold text-primary">
                {(biz.name || "C").charAt(0).toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground">Initial fallback until a logo URL is set</span>
            </div>
          )}
        </Section>

        <Section title="Phone verification">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${verified ? "bg-primary/15 text-primary" : "bg-yellow-500/15 text-yellow-500"}`}>
              <ShieldCheck className="h-3 w-3" />
              {verified ? "Verified" : "Unverified"}
            </span>
            <Link to="/help/$slug" params={{ slug: "twilio" }} className="text-xs text-primary hover:underline">Help: Twilio Verify</Link>
          </div>
          {verifyOk === false && (
            <p className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2 text-xs text-yellow-100/80">
              Connect Twilio Verify: add <code className="font-mono">TWILIO_VERIFY_SERVICE_SID</code> plus Twilio account secrets. We never fake OTP success.
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button type="button" disabled={otpBusy || !biz.phone} onClick={sendOtp} className="press rounded-full border border-border px-3.5 py-1.5 text-xs disabled:opacity-50">
              Send SMS code
            </button>
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={setOtpCode}
              disabled={otpBusy}
              containerClassName="gap-1.5"
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} className="h-10 w-9 rounded-md border-border" />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <button type="button" disabled={otpBusy || otpCode.length < 6} onClick={confirmOtp} className="press rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
              Confirm
            </button>
          </div>
        </Section>
        </div>
        )}

        {tab === "billing" && (
        <div key="billing" className="grid gap-5 animate-page-enter">
        <Section title="Billing">
          {(() => {
            const paid = sub?.status === "active" || sub?.status === "trialing";
            const pastDue = sub?.status === "past_due" || sub?.status === "unpaid";
            const label = paid ? `Paid · ${sub?.plan ?? "—"}` : pastDue ? "Past due" : "Unpaid";
            const cls = paid ? "bg-primary/15 text-primary" : pastDue ? "bg-yellow-500/15 text-yellow-500" : "bg-muted text-muted-foreground";
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm">
                      Current plan:{" "}
                      <span className={`ml-1 inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${cls}`}>{label}</span>
                    </p>
                    {sub?.current_period_end && (
                      <p className="mt-0.5 text-xs text-muted-foreground">Renews {new Date(sub.current_period_end).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                {stripeOk === false && (
                  <p className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2 text-xs text-yellow-100/80">
                    Stripe isn't connected. Add <code className="font-mono">STRIPE_SECRET_KEY</code>.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => startCheckout("pilot")} disabled={stripeOk === false} className="press rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">{paid ? "Switch to Pilot" : "Start pilot — $49"}</button>
                  <button onClick={() => startCheckout("starter")} disabled={stripeOk === false} className="press rounded-full border border-border px-3.5 py-1.5 text-xs text-foreground hover:bg-accent disabled:opacity-50">Starter $99</button>
                  <button onClick={() => startCheckout("growth")} disabled={stripeOk === false} className="press rounded-full border border-border px-3.5 py-1.5 text-xs text-foreground hover:bg-accent disabled:opacity-50">Growth $199</button>
                </div>
              </div>
            );
          })()}
        </Section>
        </div>
        )}

        {tab === "booking" && (
        <div key="booking" className="grid gap-5 animate-page-enter">
        <Section title="Booking">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={biz.booking_enabled} onChange={(e) => setBiz({ ...biz, booking_enabled: e.target.checked })} />
            <span className="text-sm">Booking link is public</span>
          </label>
          <Field label="Booking slug" value={biz.booking_slug ?? ""} onChange={(v) => setBiz({ ...biz, booking_slug: v })} placeholder="acme-hvac" />
          {bookingUrl && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-2.5">
              <code className="flex-1 truncate font-mono text-xs">{bookingUrl}</code>
              <button onClick={() => { navigator.clipboard.writeText(bookingUrl); toast.success("Copied"); }} className="press inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"><Copy className="h-3 w-3" /> Copy</button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Slot minutes" value={String(biz.slot_minutes)} onChange={(v) => setBiz({ ...biz, slot_minutes: Number(v) || 60 })} />
            <Field label="Buffer minutes" value={String(biz.buffer_minutes)} onChange={(v) => setBiz({ ...biz, buffer_minutes: Number(v) || 0 })} />
          </div>
        </Section>
        </div>
        )}

        {tab === "notifications" && (
        <div key="notifications" className="grid gap-5 animate-page-enter">
        <Section title="Reviews">
          <Field label="Google review URL" value={biz.google_review_url ?? ""} onChange={(v) => setBiz({ ...biz, google_review_url: v })} placeholder="https://g.page/r/…/review" />
        </Section>

        <Section title="Messaging">
          <Field label="After-hours SMS template" value={biz.after_hours_message ?? ""} onChange={(v) => setBiz({ ...biz, after_hours_message: v })} textarea />
        </Section>

        <Section title="Integrations">
          <div className="space-y-2">
            <StatusRow icon={MessageSquare} label="Twilio SMS" ok={twilioOk} help="Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER." />
            <StatusRow icon={ShieldCheck} label="Twilio Verify (OTP)" ok={verifyOk} help="Add TWILIO_VERIFY_SERVICE_SID from Twilio Console → Verify." />
            <StatusRow icon={CreditCard} label="Stripe" ok={stripeOk} help="Add STRIPE_SECRET_KEY." />
          </div>
          <p className="pt-2 text-xs text-muted-foreground">
            Guides: <Link to="/help" className="text-primary hover:underline">Help center</Link>
          </p>
        </Section>
        </div>
        )}

        {tab === "ai" && (
        <div key="ai" className="grid gap-5 animate-page-enter">
        <Section title="CallLedger MCP">
          <p className="text-sm text-muted-foreground">
            Point Cursor or any MCP client at this endpoint. Tools are scoped to your business after you sign in.
          </p>
          <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-2.5">
            <Bot className="h-4 w-4 shrink-0 text-primary" />
            <code className="flex-1 truncate font-mono text-xs">{mcpUrl}</code>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(mcpUrl); toast.success("Copied endpoint"); }}
              className="press inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
          </div>
          <div className="rounded-md border border-border bg-background/40 p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cursor mcp.json snippet</p>
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">{`{
  "mcpServers": {
    "callledger": {
      "url": "${mcpUrl}"
    }
  }
}`}</pre>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(
                  JSON.stringify({ mcpServers: { callledger: { url: mcpUrl } } }, null, 2),
                );
                toast.success("Copied MCP config");
              }}
              className="press mt-2 inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-accent"
            >
              <Copy className="h-3 w-3" /> Copy JSON
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Guide:{" "}
            <Link to="/help/$slug" params={{ slug: "connect-ai-mcp" }} className="text-primary hover:underline">
              Connect AI / MCP
            </Link>
            {" · "}
            <Link to="/help/$slug" params={{ slug: "business-kyc" }} className="text-primary hover:underline">
              Business KYC
            </Link>
          </p>
        </Section>
        <Section title="Tools">
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {MCP_TOOLS.map((name) => (
              <li key={name} className="rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground">
                {name}
              </li>
            ))}
          </ul>
          <p className="pt-1 text-xs text-muted-foreground">
            Clinics: administrative scheduling only — agents must not give medical advice. Never invent SMS/OTP success.
          </p>
        </Section>
        </div>
        )}

        {tab !== "ai" && (
        <div className="flex justify-end">
          <button onClick={save} className="press rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Save changes</button>
        </div>
        )}
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
