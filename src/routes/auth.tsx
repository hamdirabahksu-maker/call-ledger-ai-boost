import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/brand-lockup";

const searchSchema = z.object({
  mode: z.enum(["signup", "login"]).catch("login"),
  plan: z.enum(["pilot", "starter", "growth"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — CallLedger AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode, plan } = Route.useSearch();
  const nextTo = plan ? { to: "/app" as const, search: { plan } } : { to: "/app" as const };
  const [mode, setMode] = useState<"signup" | "login">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(nextTo as any);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be 8+ characters");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/app" },
        });
        if (error) throw error;
        toast.success("Account created");
        // check if session (auto-confirm on) or needs email
        const { data } = await supabase.auth.getSession();
        if (data.session) navigate(plan ? { to: "/onboarding", search: { plan } } as any : { to: "/onboarding" });
        else toast.info("Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate(nextTo as any);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
        <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mb-8">
          <BrandLockup size="lg" />
        </div>

        <h1 className="font-display text-3xl">
          {mode === "signup" ? "Start your pilot" : "Log in"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup"
            ? "30-day pilot for $49. No card required to create your account."
            : "Welcome back. Let's check your bookings."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourshop.com"
              className="h-11 w-full rounded-md border border-border bg-card px-3.5 text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="h-11 w-full rounded-md border border-border bg-card px-3.5 text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-md bg-primary font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "..." : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "New to CallLedger?"}{" "}
          <button
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            className="text-primary hover:brightness-110"
          >
            {mode === "signup" ? "Log in" : "Create account"}
          </button>
        </p>
      </div>
    </div>
  );
}
