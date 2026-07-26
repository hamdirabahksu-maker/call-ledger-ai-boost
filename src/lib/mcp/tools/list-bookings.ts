import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, resolveBusiness, textResult } from "../supabase";

export default defineTool({
  name: "list_bookings",
  title: "List bookings",
  description: "List the signed-in business's bookings, soonest first. Defaults to upcoming bookings only.",
  inputSchema: {
    include_past: z.boolean().optional().describe("Include bookings that already started."),
    status: z.string().optional().describe("Filter by status, e.g. pending, confirmed, completed, cancelled."),
    limit: z.number().int().optional().describe("Maximum bookings to return (default 20, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ include_past, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated.");
    const { supabase, business, error } = await resolveBusiness(ctx);
    if (!business) return errorResult(error ?? "No business.");

    let query = supabase
      .from("bookings")
      .select("id, customer_name, phone, email, job, notes, starts_at, ends_at, status, source, value_cents")
      .eq("business_id", business.id)
      .order("starts_at", { ascending: true })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (!include_past) query = query.gte("starts_at", new Date().toISOString());
    if (status) query = query.eq("status", status);

    const { data, error: qErr } = await query;
    if (qErr) return errorResult(qErr.message);
    return textResult(JSON.stringify(data ?? []), { bookings: data ?? [] });
  },
});
