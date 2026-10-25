import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { BrandLockup } from "@/components/brand-lockup";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — CallLedger" },
      { name: "description", content: "Set a new password for your CallLedger account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

type Phase = "verifying" | "ready" | "failed";

function readLinkError(): string | null {
  if (typeof window === "undefined") return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const search = new URLSearchParams(window.location.search);
  const get = (k: string) => hash.get(k) ?? search.get(k);
  const error = get("error");
  const code = get("error_code");
  const desc = get("error_description");
  if (!error && !code && !desc) return null;
  if (code === "otp_expired") return "This reset link is invalid or has expired.";
  if (error === "access_denied") return "This reset link is invalid or has expired.";
  return desc ? decodeURIComponent(desc.replace(/\+/g, " ")) : "This reset link is invalid or has expired.";
}

function ResetPassword() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [failMessage, setFailMessage] = useState("This reset link is invalid or has expired.");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const linkError = readLinkError();
    if (linkError) {
      setFailMessage(linkError);
      setPhase("failed");
      return;
    }

    let done = false;
    const succeed = () => {
      if (done) return;
      done = true;
      setPhase("ready");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") succeed();
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) succeed();
    });

    const timer = window.setTimeout(() => {
      if (!done) {
        done = true;
        setFailMessage("This reset link is invalid or has expired.");
        setPhase("failed");
      }
    }, 5000);

    return () => {
      window.clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be 8+ characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
        <Link to="/auth" className="mb-10 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <div className="mb-8"><BrandLockup size="lg" /></div>

        {phase === "verifying" && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3 text-sm text-white/70">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Verifying your reset link…
            </div>
          </div>
        )}

        {phase === "failed" && (
          <div>
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl">Link expired</h1>
            <p className="mt-2 text-sm text-white/60">{failMessage}</p>
            <p className="mt-2 text-sm text-white/40">
              Reset links can only be used once and expire quickly. Request a new one and open the newest email.
            </p>
            <Link
              to="/auth"
              search={{ mode: "forgot" } as any}
              className="mt-8 flex h-11 w-full items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Request a new reset link
            </Link>
            <Link
              to="/auth"
              className="mt-3 flex h-11 w-full items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-sm font-medium text-white transition hover:bg-white/[0.06]"
            >
              Back to log in
            </Link>
          </div>
        )}

        {phase === "ready" && (
          <>
            <h1 className="font-display text-3xl">Set a new password</h1>
            <p className="mt-2 text-sm text-white/60">Choose a new password for your account.</p>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block font-mono text-xs uppercase tracking-[0.2em] text-white/50">New password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input type="password" required minLength={8} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] pl-9 pr-3 text-white focus:border-primary focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-xs uppercase tracking-[0.2em] text-white/50">Confirm password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input type="password" required minLength={8} value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] pl-9 pr-3 text-white focus:border-primary focus:outline-none" />
                </div>
              </div>
              <button type="submit" disabled={busy}
                className="h-11 w-full rounded-md bg-primary font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50">
                {busy ? "…" : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
