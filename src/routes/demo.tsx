import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BrandLockup } from "@/components/brand-lockup";
import { submitDemoRequest } from "@/lib/demo.functions";
import { INDUSTRIES, type Industry } from "@/lib/industries";
import { toast } from "sonner";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Book a demo — CallLedger" },
      { name: "description", content: "Book a CallLedger demo for your service business." },
    ],
  }),
  component: DemoPage,
});

function DemoPage() {
  const submit = useServerFn(submitDemoRequest);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [business, setBusiness] = useState("");
  const [trade, setTrade] = useState<Industry>(INDUSTRIES[0]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await submit({
        data: {
          name,
          email,
          phone: phone || undefined,
          business_name: business || undefined,
          trade,
          message: message || undefined,
        },
      });
      if (!res.ok) {
        toast.error(res.error ?? "Could not submit");
        setBusy(false);
        return;
      }
      setDone(true);
      toast.success("Demo request received — we'll be in touch.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <BrandLockup size="sm" href="/" />
          <Link to="/" className="text-sm text-white/50 hover:text-white">Home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-14 animate-page-enter">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400/80">Demo</p>
        <h1 className="mt-2 font-display text-4xl">Book a CallLedger demo</h1>
        <p className="mt-3 text-sm text-white/55">
          Tell us about your shop — we&apos;ll walk through missed-call recovery, booking, and billing.
        </p>

        {done ? (
          <div className="mt-10 rounded-lg border border-amber-400/30 bg-amber-400/10 p-6 animate-page-enter">
            <h2 className="font-display text-xl">Thanks — request received</h2>
            <p className="mt-2 text-sm text-white/70">We&apos;ll email you shortly to schedule a call.</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link to="/" className="text-amber-400 hover:brightness-110">Back to home</Link>
              <Link to="/help" className="text-white/50 hover:text-white">Browse help</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 space-y-4">
            <Field label="Your name" value={name} onChange={setName} required />
            <Field label="Work email" value={email} onChange={setEmail} type="email" required />
            <Field label="Phone" value={phone} onChange={setPhone} />
            <Field label="Business name" value={business} onChange={setBusiness} />
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-white/40">Industry</span>
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value as Industry)}
                className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-white focus:border-amber-400/50 focus:outline-none"
              >
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i} className="bg-[#111]">{i}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-white/40">Message</span>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                placeholder="What do you want to see?"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="press h-11 w-full rounded-full bg-amber-400 text-sm font-semibold text-black hover:bg-amber-300 disabled:opacity-50"
            >
              {busy ? "…" : "Request demo"}
            </button>
            <p className="text-center text-[11px] text-white/35">~20 minutes · no card required</p>
          </form>
        )}
      </main>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-white/40">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-white focus:border-amber-400/50 focus:outline-none"
      />
    </label>
  );
}
