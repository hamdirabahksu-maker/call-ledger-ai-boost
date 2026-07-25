import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandLockup } from "@/components/brand-lockup";
import { Mail, Loader2, RefreshCw, LogOut } from "lucide-react";

export const Route = createFileRoute("/confirm-email")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    if (data.session.user.email_confirmed_at) throw redirect({ to: "/app" });
  },
  head: () => ({
    meta: [
      { title: "Confirm your email — CallLedger" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmEmail,
});

function ConfirmEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user.email_confirmed_at) navigate({ to: "/app" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const resend = async () => {
    if (!email) return;
    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin + "/app" },
      });
      if (error) throw error;
      toast.success("Confirmation email sent. Check your inbox.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send email");
    } finally {
      setSending(false);
    }
  };

  const recheck = async () => {
    setChecking(true);
    const { data } = await supabase.auth.refreshSession();
    setChecking(false);
    if (data.session?.user.email_confirmed_at) {
      toast.success("Email confirmed.");
      navigate({ to: "/app" });
    } else {
      toast.info("Still pending — click the link in your inbox.");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
        <div className="mb-10">
          <BrandLockup size="lg" />
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-full border border-primary/40 bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mt-6 font-display text-3xl">Confirm your email</h1>
        <p className="mt-3 text-sm text-white/60">
          We sent a confirmation link to <span className="font-medium text-white">{email || "your inbox"}</span>. Click it to unlock your dashboard.
        </p>

        <div className="mt-8 space-y-2">
          <button
            onClick={recheck}
            disabled={checking}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            I've confirmed — check again
          </button>
          <button
            onClick={resend}
            disabled={sending || !email}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.03] text-sm font-medium text-white transition hover:bg-white/[0.06] disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Resend confirmation email
          </button>
        </div>

        <p className="mt-8 text-xs text-white/40">
          Wrong address? <button onClick={signOut} className="inline-flex items-center gap-1 text-primary hover:brightness-110"><LogOut className="h-3 w-3" /> Sign out</button> and start over.
        </p>

        <p className="mt-10 text-center text-[11px] text-white/30">
          <Link to="/privacy" className="hover:text-white/60">Privacy</Link>
          <span className="mx-2">·</span>
          <Link to="/terms" className="hover:text-white/60">Terms</Link>
        </p>
      </div>
    </div>
  );
}
