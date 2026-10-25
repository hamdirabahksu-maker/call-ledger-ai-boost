import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const KYC_PASS = new Set(["submitted", "verified"]);

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    if (!data.session.user.email_confirmed_at) throw redirect({ to: "/confirm-email" });

    const path = location.pathname;
    const exempt =
      path.startsWith("/onboarding") ||
      path.startsWith("/kyc") ||
      path.startsWith("/admin");

    if (exempt) return;

    // Prefer KYC column when migration is applied; fall back to id-only if columns missing
    // so a pending SQL paste doesn't lock every shop out of the app.
    let biz: { id: string; kyc_status?: string | null } | null = null;
    {
      const withKyc = await supabase.from("businesses").select("id, kyc_status").maybeSingle();
      if (withKyc.error && /kyc_status|column .* does not exist/i.test(withKyc.error.message)) {
        const bare = await supabase.from("businesses").select("id").maybeSingle();
        biz = bare.data as { id: string } | null;
      } else {
        biz = withKyc.data as { id: string; kyc_status?: string | null } | null;
      }
    }

    if (!biz) throw redirect({ to: "/onboarding" });

    if ("kyc_status" in biz && biz.kyc_status !== undefined) {
      const status = (biz.kyc_status ?? "pending") as string;
      if (!KYC_PASS.has(status)) throw redirect({ to: "/kyc" });
    }
  },
  component: Layout,
});

function Layout() {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
      else if (!session.user.email_confirmed_at) navigate({ to: "/confirm-email" });
    });
    setReady(true);
    return () => sub.subscription.unsubscribe();
  }, [navigate]);
  if (!ready) return null;
  return <Outlet />;
}
