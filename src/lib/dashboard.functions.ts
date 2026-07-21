import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Seed sample rows for a business if it has none yet.
export const seedDashboardIfEmpty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { businessId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // Verify ownership via RLS (SELECT will filter to owned rows)
    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id, service_area")
      .eq("id", data.businessId)
      .maybeSingle();
    if (bizErr || !biz) throw new Error("Business not found");

    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("business_id", biz.id);
    if ((count ?? 0) > 0) return { seeded: false };

    const now = new Date();
    const today = (h: number, m = 0) => {
      const d = new Date(now);
      d.setHours(h, m, 0, 0);
      return d.toISOString();
    };

    await supabase.from("leads").insert([
      { business_id: biz.id, name: "Marcus Delaney", phone: "(415) 555-0132", issue: "No hot water — needs today", estimated_value: 850, source: "Missed call · 6:42 PM", urgency: "high", status: "new" },
      { business_id: biz.id, name: "Priya Ramanathan", phone: "(415) 555-0198", issue: "AC blowing warm, upstairs unit", estimated_value: 1400, source: "SMS booking · 7:18 PM", urgency: "high", status: "new" },
      { business_id: biz.id, name: "Dave Ostrowski", phone: "(510) 555-0117", issue: "Panel upgrade quote follow-up", estimated_value: 3200, source: "Estimate reply", urgency: "med", status: "new" },
      { business_id: biz.id, name: "Cheryl Wu", phone: "(650) 555-0144", issue: "Toilet running, no rush", estimated_value: 220, source: "Web form", urgency: "low", status: "new" },
    ]);

    await supabase.from("calls").insert([
      { business_id: biz.id, from_number: "(415) 555-0132", recovered: true, note: "AI texted back in 12s. Booked for 8 AM." },
      { business_id: biz.id, from_number: "(415) 555-0198", recovered: true, note: "Confirmed AC service — Tuesday 10 AM." },
      { business_id: biz.id, from_number: "(650) 555-0201", recovered: false, note: "No response after 2 nudges. Marked cold." },
      { business_id: biz.id, from_number: "(415) 555-0221", recovered: true, note: "Quote sent for water heater replacement." },
    ]);

    await supabase.from("bookings").insert([
      { business_id: biz.id, customer_name: "M. Delaney", job: "Water heater diag", starts_at: today(8), value_cents: 85000, status: "scheduled", source: "manual" },
      { business_id: biz.id, customer_name: "T. Nguyen", job: "Furnace tune-up", starts_at: today(10, 30), value_cents: 18900, status: "scheduled", source: "manual" },
      { business_id: biz.id, customer_name: "S. Alvarez", job: "Leak repair — kitchen", starts_at: today(13), value_cents: 42000, status: "scheduled", source: "manual" },
      { business_id: biz.id, customer_name: "P. Ramanathan", job: "AC service call", starts_at: today(15, 30), value_cents: 140000, status: "scheduled", source: "manual" },
    ]);

    return { seeded: true };
  });
