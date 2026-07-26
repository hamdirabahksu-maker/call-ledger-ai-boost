import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, resolveBusiness, textResult } from "../supabase";

export default defineTool({
  name: "business_summary",
  title: "Business summary",
  description: "Return the signed-in business profile plus counts of leads, missed calls and upcoming bookings.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated.");
    const { supabase, business, error } = await resolveBusiness(ctx);
    if (!business) return errorResult(error ?? "No business.");

    const nowIso = new Date().toISOString();
    const [leads, calls, upcoming] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("business_id", business.id),
      supabase.from("calls").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("recovered", false),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("business_id", business.id).gte("starts_at", nowIso),
    ]);

    const summary = {
      business,
      leads_total: leads.count ?? 0,
      missed_calls_unrecovered: calls.count ?? 0,
      upcoming_bookings: upcoming.count ?? 0,
    };
    return textResult(JSON.stringify(summary), summary);
  },
});
