import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "cl_cookie_consent_v1";

type Consent = {
  required: true;
  functional: boolean;
  advertising: boolean;
  ts: number;
};

export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [advertising, setAdvertising] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) setShow(true);
    } catch {
      // localStorage may be blocked; don't nag
    }
  }, []);

  const save = (consent: Consent) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(consent)); } catch {}
    setShow(false);
  };

  const acceptAll = () => save({ required: true, functional: true, advertising: true, ts: Date.now() });
  const declineAll = () => save({ required: true, functional: false, advertising: false, ts: Date.now() });
  const savePrefs = () => save({ required: true, functional, advertising, ts: Date.now() });

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 md:px-6 md:pb-6">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur">
        <div className="flex items-start gap-3 p-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
            <Cookie className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm text-white">We use cookies</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              Required cookies keep you signed in and secure. Functional and advertising cookies help us improve CallLedger. Read our{" "}
              <Link to="/privacy" className="text-primary hover:brightness-110">Privacy Policy</Link>.
            </p>

            {expanded && (
              <div className="mt-4 space-y-2 rounded-md border border-white/10 bg-white/[0.02] p-3 text-xs">
                <Row label="Required" desc="Session and security. Always on." checked disabled />
                <Row
                  label="Functional"
                  desc="Preferences and analytics that improve the product."
                  checked={functional}
                  onChange={setFunctional}
                />
                <Row
                  label="Advertising"
                  desc="Measure campaign performance. Off by default."
                  checked={advertising}
                  onChange={setAdvertising}
                />
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={acceptAll}
                className="inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Accept all
              </button>
              <button
                onClick={declineAll}
                className="inline-flex items-center rounded-md border border-white/15 bg-transparent px-3.5 py-2 text-xs font-medium text-white/80 transition hover:bg-white/5"
              >
                Decline
              </button>
              <button
                onClick={() => (expanded ? savePrefs() : setExpanded(true))}
                className="ml-auto inline-flex items-center rounded-md px-2.5 py-2 text-xs text-white/60 transition hover:text-white"
              >
                {expanded ? "Save preferences" : "Customize"}
              </button>
            </div>
          </div>
          <button
            onClick={declineAll}
            aria-label="Dismiss"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/40 hover:bg-white/5 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label, desc, checked, disabled, onChange,
}: { label: string; desc: string; checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <label className={`flex items-start justify-between gap-3 rounded-md px-2 py-1.5 ${disabled ? "opacity-70" : "cursor-pointer hover:bg-white/5"}`}>
      <div>
        <p className="text-white">{label}</p>
        <p className="text-white/50">{desc}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-primary disabled:opacity-60"
      />
    </label>
  );
}
