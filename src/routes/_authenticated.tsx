import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    if (!data.session.user.email_confirmed_at) throw redirect({ to: "/confirm-email" });
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
