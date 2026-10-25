import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Mail, Lock, Loader2 } from "lucide-react";
import { BrandLockup } from "@/components/brand-lockup";

const searchSchema = z.object({
  mode: z.enum(["signup", "login", "forgot"]).catch("login"),
  plan: z.enum(["pilot", "starter", "growth"]).optional(),
  next: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — CallLedger" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signup" | "login" | "forgot";
type Provider = "google" | "azure" | "github";

const PROVIDERS: { id: Provider; label: string; icon: string }[] = [
  { id: "google", label: "Google", icon: "G" },
  { id: "azure", label: "Microsoft", icon: "▦" },
  { id: "github", label: "GitHub", icon: "⌘" },
];

function AuthPage() {
  const { mode: initialMode, plan, next } = Route.useSearch();
  // Only same-origin relative paths may be used as a post-auth return target.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const returnUrl = safeNext ? window.location.origin + safeNext : window.location.origin + "/app";
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<Provider | null>(null);
  const [unavailable, setUnavailable] = useState<Record<Provider, boolean>>({
    google: false, azure: false, github: false,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        if (safeNext) { window.location.href = safeNext; return; }
        navigate(plan ? { to: "/app", search: { plan } } as any : { to: "/app" });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const afterAuthRedirect = async () => {
    if (safeNext) { window.location.href = safeNext; return; }
    // Detect if onboarding is needed
    const { data: biz } = await supabase.from("businesses").select("id").maybeSingle();
    if (!biz) {
      navigate(plan ? { to: "/onboarding", search: { plan } } as any : { to: "/onboarding" });
    } else {
      navigate(plan ? { to: "/app", search: { plan } } as any : { to: "/app" });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "forgot") {
      if (!email) return;
      setBusy(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Reset email sent. Check your inbox and spam — use the newest link, it expires fast.");
        setMode("login");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to send reset email");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (password.length < 8) return toast.error("Password must be 8+ characters");
    if (mode === "signup" && !agreed) return toast.error("You must agree to the Terms and Privacy Policy");

    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: returnUrl },
        });
        if (error) throw error;
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          toast.success("Account created");
          await afterAuthRedirect();
        } else {
          toast.info("Check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        await afterAuthRedirect();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const signInOAuth = async (provider: Provider) => {
    if (unavailable[provider]) return;
    setOauthBusy(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: returnUrl },
      });
      if (error) {
        const msg = `${error.message ?? ""} ${(error as { msg?: string }).msg ?? ""}`.toLowerCase();
        if (
          msg.includes("provider is not enabled")
          || msg.includes("unsupported provider")
          || msg.includes("not enabled")
        ) {
          setUnavailable((u) => ({ ...u, [provider]: true }));
          const label = provider === "azure" ? "Microsoft" : provider[0].toUpperCase() + provider.slice(1);
          toast.error(`${label} sign-in is not enabled on this Supabase project. Use email/password, or enable it under Authentication → Providers.`);
        } else {
          throw error;
        }
      }
      // On success the browser is redirected away.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "OAuth failed");
    } finally {
      setOauthBusy(null);
    }
  };

  const titleCopy: Record<Mode, string> = {
    signup: "Start your pilot",
    login: "Log in",
    forgot: "Reset password",
  };
  const subCopy: Record<Mode, string> = {
    signup: "30-day pilot for $49. No card required to create your account.",
    login: "Welcome back. Let's check your bookings.",
    forgot: "Enter your email and we'll send a reset link. Check spam, and use the newest link — they expire quickly.",
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
        <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mb-8">
          <BrandLockup size="lg" />
        </div>

        <h1 className="font-display text-3xl">{titleCopy[mode]}</h1>
        <p className="mt-2 text-sm text-white/60">{subCopy[mode]}</p>

        {mode !== "forgot" && (
          <div className="mt-8 space-y-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => signInOAuth(p.id)}
                disabled={oauthBusy !== null || unavailable[p.id]}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.03] text-sm font-medium text-white transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {oauthBusy === p.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="grid h-5 w-5 place-items-center rounded-sm bg-white/10 font-mono text-[11px]">{p.icon}</span>
                )}
                <span>
                  {unavailable[p.id]
                    ? `${p.label} — provider not connected`
                    : `Continue with ${p.label}`}
                </span>
              </button>
            ))}
            <p className="pt-1 text-[11px] text-white/40">
              Providers must be enabled in the Cloud auth settings. If a button is disabled, that provider hasn't been connected yet.
            </p>
          </div>
        )}

        {mode !== "forgot" && (
          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-white/30">
            <div className="h-px flex-1 bg-white/10" />
            or use email
            <div className="h-px flex-1 bg-white/10" />
          </div>
        )}

        <form onSubmit={submit} className={mode === "forgot" ? "mt-8 space-y-4" : "space-y-4"}>
          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-[0.2em] text-white/50">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] pl-9 pr-3 text-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          {mode !== "forgot" && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block font-mono text-xs uppercase tracking-[0.2em] text-white/50">Password</label>
                {mode === "login" && (
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:brightness-110">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] pl-9 pr-3 text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {mode === "signup" && (
            <label className="flex cursor-pointer items-start gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent accent-primary"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="text-primary hover:brightness-110">Terms of Service</Link>
                {" "}and{" "}
                <Link to="/privacy" className="text-primary hover:brightness-110">Privacy Policy</Link>.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={busy || (mode === "signup" && !agreed)}
            className="h-11 w-full rounded-md bg-primary font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "…" : mode === "signup" ? "Create account" : mode === "login" ? "Log in" : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/60">
          {mode === "signup" ? (
            <>Already have an account?{" "}
              <button onClick={() => setMode("login")} className="text-primary hover:brightness-110">Log in</button>
            </>
          ) : mode === "login" ? (
            <>New to CallLedger?{" "}
              <button onClick={() => setMode("signup")} className="text-primary hover:brightness-110">Create account</button>
            </>
          ) : (
            <button onClick={() => setMode("login")} className="text-primary hover:brightness-110">Back to log in</button>
          )}
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
