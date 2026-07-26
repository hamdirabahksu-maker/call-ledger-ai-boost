import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/brand-lockup";
import { Loader2, ShieldCheck } from "lucide-react";

type OAuthDetails = {
  client?: { name?: string | null } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
};
const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { mode: "login", next: location.pathname + location.searchStr } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: ConsentPage,
  errorComponent: ({ error }) => (
    <Shell>
      <h1 className="font-display text-2xl">Authorization request failed</h1>
      <p className="mt-2 text-sm text-white/60">{String((error as Error)?.message ?? error)}</p>
    </Shell>
  ),
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
        <div className="mb-8"><BrandLockup size="lg" /></div>
        {children}
      </div>
    </main>
  );
}

function ConsentPage() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "this app";

  async function decide(approve: boolean) {
    setBusy(approve ? "approve" : "deny");
    setError(null);
    const api = oauthApi();
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (err) { setBusy(null); setError(err.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(null); setError("No redirect returned by the authorization server."); return; }
    window.location.href = target;
  }

  return (
    <Shell>
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Agent access</p>
      <h1 className="mt-2 font-display text-3xl">Connect {clientName}</h1>
      <p className="mt-3 text-sm text-white/60">
        {clientName} is asking to use CallLedger as you. It will be able to read and create your leads,
        bookings, customers and missed-call records — nothing outside your own business.
      </p>
      <div className="mt-6 flex items-start gap-2 rounded-md border border-primary/25 bg-primary/5 p-3 text-xs text-white/70">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        You can revoke this access at any time from your account settings.
      </div>
      {error && <p role="alert" className="mt-4 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-200">{error}</p>}
      <div className="mt-8 flex gap-3">
        <button
          onClick={() => decide(true)}
          disabled={busy !== null}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {busy === "approve" && <Loader2 className="h-4 w-4 animate-spin" />} Approve
        </button>
        <button
          onClick={() => decide(false)}
          disabled={busy !== null}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.03] text-sm text-white hover:bg-white/[0.06] disabled:opacity-50"
        >
          {busy === "deny" && <Loader2 className="h-4 w-4 animate-spin" />} Deny
        </button>
      </div>
    </Shell>
  );
}
