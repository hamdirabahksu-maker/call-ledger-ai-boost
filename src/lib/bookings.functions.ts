import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type Weekday = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
const DAYS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function serverPublicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const url = process.env.SUPABASE_URL!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

// Fetch public booking page data (business + existing bookings for date range).
export const getPublicBooking = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string; from?: string; to?: string }) => input)
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    const { data: biz, error } = await sb
      .from("businesses")
      .select("id, name, trade, service_area, booking_slug, slot_minutes, buffer_minutes, availability, timezone, after_hours_message, logo_url")
      .eq("booking_slug", data.slug)
      .eq("booking_enabled", true)
      .maybeSingle();
    if (error || !biz) return { business: null as null, bookings: [] as { starts_at: string; ends_at: string | null }[] };

    let bookings: { starts_at: string; ends_at: string | null }[] = [];
    if (data.from && data.to) {
      // Only expose start/end to compute availability — no PII.
      const { data: rows } = await sb
        .from("bookings")
        .select("starts_at, ends_at")
        .eq("business_id", biz.id)
        .gte("starts_at", data.from)
        .lte("starts_at", data.to)
        .neq("status", "cancelled");
      bookings = rows ?? [];
    }
    return { business: biz, bookings };
  });

// Create a booking from the public page.
export const createPublicBooking = createServerFn({ method: "POST" })
  .inputValidator((input: {
    slug: string;
    starts_at: string;
    customer_name: string;
    phone: string;
    email?: string;
    notes?: string;
  }) => input)
  .handler(async ({ data }) => {
    if (!data.customer_name.trim() || !data.phone.trim() || !data.starts_at) {
      return { ok: false as const, error: "Missing required fields" };
    }
    const sb = serverPublicClient();
    const { data: biz } = await sb
      .from("businesses")
      .select("id, slot_minutes, availability, booking_enabled")
      .eq("booking_slug", data.slug)
      .eq("booking_enabled", true)
      .maybeSingle();
    if (!biz) return { ok: false as const, error: "Booking is not available" };

    const start = new Date(data.starts_at);
    if (isNaN(start.getTime()) || start.getTime() < Date.now() - 60_000) {
      return { ok: false as const, error: "Invalid time" };
    }
    const end = new Date(start.getTime() + biz.slot_minutes * 60_000);

    const { data: row, error } = await sb.from("bookings").insert({
      business_id: biz.id,
      customer_name: data.customer_name.trim().slice(0, 100),
      phone: data.phone.trim().slice(0, 30),
      email: data.email?.trim().slice(0, 120) || null,
      notes: data.notes?.trim().slice(0, 500) || null,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: "pending",
      source: "public",
    }).select("id, starts_at").maybeSingle();

    if (error || !row) return { ok: false as const, error: error?.message ?? "Could not book" };
    return { ok: true as const, booking: row };
  });

// Owner: update booking status.
export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "pending" | "scheduled" | "completed" | "cancelled" }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Owner: create manual booking.
export const createManualBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    business_id: string;
    customer_name: string;
    phone?: string;
    job?: string;
    starts_at: string;
    lead_id?: string;
  }) => input)
  .handler(async ({ data, context }) => {
    const { data: biz } = await context.supabase
      .from("businesses")
      .select("slot_minutes")
      .eq("id", data.business_id)
      .maybeSingle();
    const slot = biz?.slot_minutes ?? 60;
    const start = new Date(data.starts_at);
    const end = new Date(start.getTime() + slot * 60_000);
    const { error } = await context.supabase.from("bookings").insert({
      business_id: data.business_id,
      customer_name: data.customer_name.trim().slice(0, 100),
      phone: data.phone?.trim().slice(0, 30) || null,
      job: data.job?.trim().slice(0, 200) || null,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: "scheduled",
      source: "manual",
      lead_id: data.lead_id ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Compute available slots for a given date given availability + existing bookings.
export function computeSlots(
  dateISO: string,
  availability: Record<string, [string, string] | null>,
  slotMinutes: number,
  bufferMinutes: number,
  taken: { starts_at: string; ends_at: string | null }[],
): string[] {
  const d = new Date(dateISO + "T00:00:00");
  if (isNaN(d.getTime())) return [];
  const key = DAYS[d.getDay()];
  const window = availability?.[key];
  if (!window) return [];
  const [openS, closeS] = window;
  const [oh, om] = openS.split(":").map(Number);
  const [ch, cm] = closeS.split(":").map(Number);
  const open = new Date(d); open.setHours(oh, om, 0, 0);
  const close = new Date(d); close.setHours(ch, cm, 0, 0);
  const step = (slotMinutes + bufferMinutes) * 60_000;
  const now = Date.now();
  const slots: string[] = [];
  for (let t = open.getTime(); t + slotMinutes * 60_000 <= close.getTime(); t += step) {
    if (t < now) continue;
    const s = new Date(t);
    const e = new Date(t + slotMinutes * 60_000);
    const conflict = taken.some((b) => {
      const bs = new Date(b.starts_at).getTime();
      const be = b.ends_at ? new Date(b.ends_at).getTime() : bs + slotMinutes * 60_000;
      return bs < e.getTime() && be > s.getTime();
    });
    if (!conflict) slots.push(s.toISOString());
  }
  return slots;
}
