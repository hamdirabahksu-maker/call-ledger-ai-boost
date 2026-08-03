import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, resolveBusiness, textResult } from "../supabase";

export default defineTool({
  name: "list_estimates",
  title: "List estimates",
  description: "List estimates / quotes for the signed-in CallLedger business.",
  inputSchema: {
    status: z.string().optional().describe("Filter by status (draft, sent, accepted, …)."),
    limit: z.number().int().optional().describe("Max rows (default 20, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated.");
    const { supabase, business, error } = await resolveBusiness(ctx);
    if (!business) return errorResult(error ?? "No business.");

    let query = supabase
      .from("estimates")
      .select("id, title, customer_name, status, total_cents, public_token, valid_until, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (status) query = query.eq("status", status);

    const { data, error: qErr } = await query;
    if (qErr) return errorResult(qErr.message);
    return textResult(JSON.stringify(data ?? []), { estimates: data ?? [] });
  },
});
