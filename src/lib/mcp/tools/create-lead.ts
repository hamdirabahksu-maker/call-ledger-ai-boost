import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, resolveBusiness, textResult } from "../supabase";

export default defineTool({
  name: "create_lead",
  title: "Create lead",
  description: "Create a new lead for the signed-in business (e.g. from a missed call or inbound message).",
  inputSchema: {
    name: z.string().describe("Caller or customer name."),
    phone: z.string().optional().describe("Phone number in E.164 form when known."),
    issue: z.string().optional().describe("What the customer needs, in one sentence."),
    urgency: z.enum(["high", "med", "low"]).optional().describe("How urgent the job is."),
    estimated_value: z.number().optional().describe("Estimated job value in your currency."),
    source: z.string().optional().describe("Where the lead came from, e.g. missed_call, sms, web."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated.");
    const { supabase, business, error } = await resolveBusiness(ctx);
    if (!business) return errorResult(error ?? "No business.");

    const { data, error: qErr } = await supabase
      .from("leads")
      .insert({
        business_id: business.id,
        name: input.name.trim().slice(0, 120),
        phone: input.phone?.trim().slice(0, 30) ?? null,
        issue: input.issue?.trim().slice(0, 500) ?? null,
        urgency: input.urgency ?? "med",
        estimated_value: input.estimated_value ?? null,
        source: input.source?.trim().slice(0, 40) ?? "mcp",
      })
      .select("id, name, phone, issue, urgency, status, created_at")
      .single();
    if (qErr) return errorResult(qErr.message);
    return textResult(`Lead created: ${data.name} (${data.id})`, { lead: data });
  },
});
