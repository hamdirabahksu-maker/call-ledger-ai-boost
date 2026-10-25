import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, resolveBusiness, textResult } from "../supabase";

export default defineTool({
  name: "list_leads",
  title: "List leads",
  description: "List the signed-in business's leads, newest first. Optionally filter by status.",
  inputSchema: {
    status: z.string().optional().describe("Filter by lead status, e.g. new, contacted, booked, lost."),
    limit: z.number().int().optional().describe("Maximum number of leads to return (default 20, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated.");
    const { supabase, business, error } = await resolveBusiness(ctx);
    if (!business) return errorResult(error ?? "No business.");

    let query = supabase
      .from("leads")
      .select("id, name, phone, issue, urgency, status, estimated_value, source, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (status) query = query.eq("status", status);

    const { data, error: qErr } = await query;
    if (qErr) return errorResult(qErr.message);
    return textResult(JSON.stringify(data ?? []), { leads: data ?? [] });
  },
});
