import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, resolveBusiness, textResult } from "../supabase";

export default defineTool({
  name: "list_missed_calls",
  title: "List missed calls",
  description: "List logged missed calls for the signed-in business, newest first, with recovery status.",
  inputSchema: {
    recovered: z.boolean().optional().describe("Filter to recovered (true) or not-yet-recovered (false) calls."),
    limit: z.number().int().optional().describe("Maximum calls to return (default 20, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ recovered, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated.");
    const { supabase, business, error } = await resolveBusiness(ctx);
    if (!business) return errorResult(error ?? "No business.");

    let query = supabase
      .from("calls")
      .select("id, from_number, recovered, note, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (recovered !== undefined) query = query.eq("recovered", recovered);

    const { data, error: qErr } = await query;
    if (qErr) return errorResult(qErr.message);
    return textResult(JSON.stringify(data ?? []), { calls: data ?? [] });
  },
});
