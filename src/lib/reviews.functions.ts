import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listReviewRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("review_requests").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createReviewRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: {
    business_id: string;
    booking_id?: string;
    customer_name: string;
    phone?: string;
    google_review_url?: string;
  }) => i)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("review_requests").insert({
      business_id: data.business_id,
      booking_id: data.booking_id ?? null,
      customer_name: data.customer_name.trim().slice(0, 120),
      phone: data.phone?.trim().slice(0, 30) || null,
      google_review_url: data.google_review_url?.trim().slice(0, 500) || null,
      status: "pending",
    }).select("id").maybeSingle();
    if (error || !row) throw new Error(error?.message ?? "Insert failed");
    return { ok: true, id: row.id };
  });

export const markReviewSent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; status: "sent" | "done" | "pending" }) => i)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("review_requests")
      .update({ status: data.status, sent_at: data.status === "sent" ? new Date().toISOString() : null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
