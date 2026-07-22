import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { updateBookingStatus, createManualBooking } from "@/lib/bookings.functions";
import { sendSms, getTwilioStatus } from "@/lib/sms.functions";
import { Calendar, Copy, Check, X, Star, Plus, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({ meta: [{ title: "Bookings — CallLedger" }, { name: "robots", content: "noindex" }] }),
  component: BookingsPage,
});

type Booking = { id: string; customer_name: string; job: string | null; starts_at: string; ends_at: string | null; phone: string | null; status: string; source: string; notes: string | null };

function BookingsPage() {
  const updateFn = useServerFn(updateBookingStatus);
  const createFn = useServerFn(createManualBooking);
  const smsFn = useServerFn(sendSms);
  const twilioFn = useServerFn(getTwilioStatus);
  const [biz, setBiz] = useState<{ id: string; booking_slug: string | null; name: string } | null>(null);
  const [rows, setRows] = useState<Booking[]>([]);
  const [twilioOk, setTwilioOk] = useState<boolean | null>(null);
  const [adding, setAdding] = useState<{ customer_name: string; phone: string; job: string; starts_at: string } | null>(null);

  const reload = async (bizId: string) => {
    const { data } = await supabase.from("bookings").select("*").eq("business_id", bizId).order("starts_at", { ascending: true });
    setRows((data ?? []) as Booking[]);
  };

  useEffect(() => {
    (async () => {
      const { data: b } = await supabase.from("businesses").select("id, booking_slug, name").maybeSingle();
      setBiz(b);
      if (b) reload(b.id);
      twilioFn().then((s) => setTwilioOk(s.twilioConfigured)).catch(() => setTwilioOk(false));
    })();
  }, [twilioFn]);

  const url = biz?.booking_slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${biz.booking_slug}` : null;

  // Week view
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const week: Date[] = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + i); return d; });
  const dayKey = (d: Date) => d.toDateString();
  const grouped: Record<string, Booking[]> = {};
  rows.forEach((r) => { const k = dayKey(new Date(r.starts_at)); (grouped[k] ??= []).push(r); });

  const setStatus = async (id: string, status: "scheduled" | "completed" | "cancelled") => {
    try { await updateFn({ data: { id, status } }); if (biz) await reload(biz.id); toast.success(status); }
    catch { toast.error("Failed"); }
  };

  const sendReminder = async (b: Booking) => {
    if (!b.phone) { toast.error("No phone"); return; }
    if (twilioOk === false) { toast.error("Twilio not connected"); return; }
    const when = new Date(b.starts_at).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    try {
      const res = await smsFn({ data: { to: b.phone, body: `Reminder: ${biz?.name} — your appointment is ${when}. Reply anytime.` }});
      if (!res.ok) { toast.error(res.error || "SMS failed"); return; }
      toast.success("Reminder sent");
    } catch { toast.error("Failed"); }
  };

  const addBooking = async () => {
    if (!adding || !biz) return;
    if (!adding.customer_name.trim() || !adding.starts_at) { toast.error("Name and time required"); return; }
    try {
      await createFn({ data: {
        business_id: biz.id, customer_name: adding.customer_name, phone: adding.phone,
        job: adding.job, starts_at: new Date(adding.starts_at).toISOString(),
      }});
      toast.success("Added");
      setAdding(null);
      reload(biz.id);
    } catch { toast.error("Failed"); }
  };

  return (
    <AppShell subtitle="Schedule" title="Bookings">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {url && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
            <code className="max-w-xs truncate font-mono text-xs text-muted-foreground">{url}</code>
            <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Copied"); }} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary"><Copy className="h-3 w-3" /> Copy link</button>
          </div>
        )}
        <button onClick={() => setAdding({ customer_name: "", phone: "", job: "", starts_at: "" })} className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> New booking</button>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {week.map((d) => {
          const list = grouped[dayKey(d)] ?? [];
          return (
            <div key={dayKey(d)} className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{d.toLocaleDateString([], { weekday: "short" })}</p>
                <p className="font-display text-lg">{d.getDate()}</p>
              </div>
              <div className="min-h-[100px] space-y-1.5 p-2">
                {list.length === 0 && <p className="mt-3 text-center text-[11px] text-muted-foreground/60">—</p>}
                {list.map((b) => (
                  <div key={b.id} className={`rounded border-l-2 bg-background/70 p-2 text-xs ${b.status === "completed" ? "border-primary/60 opacity-60" : b.status === "cancelled" ? "border-destructive/60 opacity-40 line-through" : "border-primary"}`}>
                    <p className="font-mono text-[10px] text-primary">{new Date(b.starts_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                    <p className="mt-0.5 truncate font-semibold">{b.customer_name}</p>
                    {b.job && <p className="truncate text-muted-foreground">{b.job}</p>}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {b.status !== "completed" && b.status !== "cancelled" && <IconBtn onClick={() => setStatus(b.id, "scheduled")} icon={Check} title="Confirm" />}
                      {b.status !== "completed" && b.status !== "cancelled" && <IconBtn onClick={() => sendReminder(b)} icon={Bell} title="Remind" />}
                      {b.status !== "completed" && <IconBtn onClick={() => setStatus(b.id, "completed")} icon={Star} title="Complete" />}
                      {b.status !== "cancelled" && <IconBtn onClick={() => setStatus(b.id, "cancelled")} icon={X} title="Cancel" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {rows.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center">
          <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 font-display text-xl">Nothing booked</p>
          <p className="mt-1 text-sm text-muted-foreground">Share your booking link to fill your week.</p>
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setAdding(null)}>
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg">New booking</h2>
            <div className="mt-4 space-y-3">
              <input placeholder="Customer name" value={adding.customer_name} onChange={(e) => setAdding({ ...adding, customer_name: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input placeholder="Phone" value={adding.phone} onChange={(e) => setAdding({ ...adding, phone: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input placeholder="Job description" value={adding.job} onChange={(e) => setAdding({ ...adding, job: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input type="datetime-local" value={adding.starts_at} onChange={(e) => setAdding({ ...adding, starts_at: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setAdding(null)} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button>
              <button onClick={addBooking} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Add</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function IconBtn({ onClick, icon: Icon, title }: { onClick: () => void; icon: React.ComponentType<{ className?: string }>; title: string }) {
  return <button onClick={onClick} title={title} className="grid h-6 w-6 place-items-center rounded border border-border/60 hover:border-primary hover:text-primary"><Icon className="h-3 w-3" /></button>;
}
