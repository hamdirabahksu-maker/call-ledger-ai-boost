import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, resolveBusiness, textResult } from "../supabase";

export default defineTool({
  name: "create_booking",
  title: "Create booking",
  description: "Book a job on the signed-in business's calendar. For clinics this is administrative scheduling only — never medical advice.",
  inputSchema: {
    customer_name: z.string().describe("Customer name."),
    starts_at: z.string().describe("Start time as an ISO 8601 timestamp, e.g. 2026-08-02T14:00:00Z."),
    phone: z.string().optional().describe("Customer phone number."),
    email: z.string().optional().describe("Customer email."),
    job: z.string().optional().describe("Short job description."),
    notes: z.string().optional().describe("Extra notes for the visit."),
    duration_minutes: z.number().int().optional().describe("Job length in minutes; defaults to the business slot length."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated.");
    const { supabase, business, error } = await resolveBusiness(ctx);
    if (!business) return errorResult(error ?? "No business.");

    const start = new Date(input.starts_at);
    if (Number.isNaN(start.getTime())) return errorResult("starts_at must be a valid ISO 8601 timestamp.");
    const minutes = input.duration_minutes ?? 60;
    const ends = new Date(start.getTime() + minutes * 60_000);

    const { data, error: qErr } = await supabase
      .from("bookings")
      .insert({
        business_id: business.id,
        customer_name: input.customer_name.trim().slice(0, 120),
        phone: input.phone?.trim().slice(0, 30) ?? null,
        email: input.email?.trim().slice(0, 200) ?? null,
        job: input.job?.trim().slice(0, 200) ?? null,
        notes: input.notes?.trim().slice(0, 1000) ?? null,
        starts_at: start.toISOString(),
        ends_at: ends.toISOString(),
        status: "pending",
        source: "manual",
      })
      .select("id, customer_name, starts_at, ends_at, status")
      .single();
    if (qErr) return errorResult(qErr.message);
    return textResult(`Booking created for ${data.customer_name} at ${data.starts_at}`, { booking: data });
  },
});
