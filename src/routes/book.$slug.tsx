import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPublicBooking, createPublicBooking, computeSlots } from "@/lib/bookings.functions";
import { Zap, Calendar, Check, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/book/$slug")({
  loader: async ({ params }) => {
    const res = await getPublicBooking({ data: { slug: params.slug } });
    if (!res.business) throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.business?.name ?? "Book an appointment";
    return {
      meta: [
        { title: `Book with ${name} — CallLedger` },
        { name: "description", content: `Pick a time that works for you and book with ${name}.` },
        { property: "og:title", content: `Book with ${name}` },
        { property: "og:description", content: `Instant online booking powered by CallLedger.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: NotFound,
  errorComponent: ({ error }) => <ErrorState message={error.message} />,
  component: BookingPage,
});

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function BookingPage() {
  const { business } = Route.useLoaderData();
  const load = useServerFn(getPublicBooking);
  const submit = useServerFn(createPublicBooking);

  const [date, setDate] = useState(todayISO());
  const [taken, setTaken] = useState<{ starts_at: string; ends_at: string | null }[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const availability = (business!.availability ?? {}) as Record<string, [string, string] | null>;

  useEffect(() => {
    const from = new Date(date + "T00:00:00").toISOString();
    const toD = new Date(date + "T00:00:00");
    toD.setDate(toD.getDate() + 1);
    load({ data: { slug: business!.booking_slug!, from, to: toD.toISOString() } })
      .then((r) => setTaken(r.bookings))
      .catch(() => setTaken([]));
    setSlot(null);
  }, [date, business, load]);

  const slots = useMemo(
    () => computeSlots(date, availability, business!.slot_minutes ?? 60, business!.buffer_minutes ?? 15, taken),
    [date, taken, availability, business],
  );

  const isClinic = /clinic|dental|medical/i.test(business!.trade ?? "");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot) return toast.error("Pick a time first");
    if (!name.trim() || !phone.trim()) return toast.error("Name and phone required");
    setBusy(true);
    try {
      const res = await submit({ data: { slug: business!.booking_slug!, starts_at: slot, customer_name: name, phone, email: email || undefined, notes: notes || undefined } });
      if (!res.ok) { toast.error(res.error); setBusy(false); return; }
      setDone(slot);
    } catch { toast.error("Could not book"); }
    setBusy(false);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-16 text-center animate-fade-in">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="mt-6 font-display text-3xl">You're booked.</h1>
          <p className="mt-2 text-muted-foreground">
            {business!.name} will see you on{" "}
            <span className="text-foreground">{new Date(done).toLocaleString([], { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">A confirmation will be sent to {phone}.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto grid max-w-4xl gap-8 px-4 py-10 animate-fade-in lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Book online</p>
          <h1 className="mt-2 font-display text-4xl">{business!.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {business!.trade}
            {business!.service_area ? <> · <MapPin className="inline h-3 w-3" /> {business!.service_area}</> : null}
          </p>
          {isClinic && (
            <p className="mt-4 rounded-md border border-primary/40 bg-primary/10 p-3 text-xs text-foreground">
              Admin & booking only. This page does not provide medical advice. For urgent concerns, contact your provider or emergency services.
            </p>
          )}
          <div className="mt-6">
            <label className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Pick a date</label>
            <div className="mt-2 flex gap-1 overflow-x-auto pb-2">
              {Array.from({ length: 14 }).map((_, i) => {
                const d = todayISO(i);
                const dd = new Date(d + "T00:00:00");
                const active = d === date;
                return (
                  <button
                    key={d}
                    onClick={() => setDate(d)}
                    className={`shrink-0 rounded-md border px-3 py-2 text-center text-xs transition ${
                      active ? "border-primary bg-primary/15 text-primary" : "border-border bg-card hover:border-primary/60"
                    }`}
                  >
                    <div className="font-mono uppercase tracking-widest text-[10px]">{dd.toLocaleDateString([], { weekday: "short" })}</div>
                    <div className="font-display text-lg leading-tight">{dd.getDate()}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-6">
            <label className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Available slots</label>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.length === 0 && (
                <p className="col-span-full rounded-md border border-border bg-card p-4 text-center text-sm text-muted-foreground">
                  No slots on this day. Try another date.
                </p>
              )}
              {slots.map((s) => (
                <button
                  key={s}
                  onClick={() => setSlot(s)}
                  className={`rounded-md border px-2 py-2 text-sm transition ${
                    slot === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60 hover:text-primary"
                  }`}
                >
                  {new Date(s).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </button>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border bg-card p-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Your details</p>
            <h2 className="mt-1 font-display text-2xl">
              {slot ? new Date(slot).toLocaleString([], { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Select a time →"}
            </h2>
          </div>
          <Field label="Full name">
            <input required value={name} onChange={(e) => setName(e.target.value)} maxLength={100}
              className="h-11 w-full rounded-md border border-border bg-background px-3 focus:border-primary focus:outline-none" />
          </Field>
          <Field label="Phone">
            <input required value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" maxLength={30}
              className="h-11 w-full rounded-md border border-border bg-background px-3 focus:border-primary focus:outline-none" />
          </Field>
          <Field label="Email (optional)">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" maxLength={120}
              className="h-11 w-full rounded-md border border-border bg-background px-3 focus:border-primary focus:outline-none" />
          </Field>
          <Field label={isClinic ? "Reason for visit (admin only, no medical detail)" : "What do you need?"}>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={500}
              className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none" />
          </Field>
          <button type="submit" disabled={busy || !slot}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50">
            <Calendar className="h-4 w-4" /> {busy ? "Booking..." : "Confirm booking"}
          </button>
          <p className="text-center text-[11px] text-muted-foreground">
            Powered by <span className="text-foreground">CALLLEDGER</span>
          </p>
        </form>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-4xl items-center px-4">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg">CALL<span className="text-primary">LEDGER</span></span>
        </div>
      </div>
    </header>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">404</p>
        <h1 className="mt-3 font-display text-3xl">Booking link not found</h1>
        <p className="mt-2 text-muted-foreground">This business isn't accepting online bookings.</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
      <div>
        <h1 className="font-display text-3xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
