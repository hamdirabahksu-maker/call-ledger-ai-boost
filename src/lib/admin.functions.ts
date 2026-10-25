import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const isAdmin = data?.some((r: { role: string }) => r.role === "admin");
  if (!isAdmin) throw new Error("Forbidden");
}

export const loadAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [waitlist, businesses, subs, leads, drafts, demos, resendCfg] = await Promise.all([
      supabaseAdmin.from("waitlist").select("*").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("businesses").select("*").order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("leads").select("id,name,issue,estimated_value,urgency,business_id,created_at").order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("marketing_drafts").select("id", { count: "exact", head: true }),
      (supabaseAdmin as any).from("demo_requests").select("*").order("created_at", { ascending: false }).limit(200).then(
        (r: any) => r,
        () => ({ data: [] as any[] }),
      ),
      Promise.resolve({ configured: !!process.env.RESEND_API_KEY }),
    ]);

    const paying = (subs.data ?? []).filter((s) => s.status === "active" || s.status === "trialing").length;
    const demoRows = Array.isArray(demos?.data) ? demos.data : [];

    return {
      waitlist: waitlist.data ?? [],
      businesses: businesses.data ?? [],
      subscriptions: subs.data ?? [],
      leads: leads.data ?? [],
      demos: demoRows,
      stats: {
        waitlist: waitlist.data?.length ?? 0,
        businesses: businesses.data?.length ?? 0,
        paying,
        drafts: drafts.count ?? 0,
        demos: demoRows.length,
      },
      integrations: {
        resend: resendCfg.configured,
      },
    };
  });

