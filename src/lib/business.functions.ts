import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const updateBusinessSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: {
    id: string;
    name?: string;
    phone?: string;
    service_area?: string;
    google_review_url?: string;
    after_hours_message?: string;
    booking_enabled?: boolean;
    booking_slug?: string;
    logo_url?: string;
    slot_minutes?: number;
    buffer_minutes?: number;
    timezone?: string;
  }) => i)
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name.trim().slice(0, 120);
    if (data.phone !== undefined) {
      const next = data.phone.trim().slice(0, 30) || null;
      patch.phone = next;
      // Changing phone clears verification until OTP again
      const { data: cur } = await context.supabase
        .from("businesses")
        .select("phone")
        .eq("id", data.id)
        .maybeSingle();
      if (cur && cur.phone !== next) patch.phone_verified_at = null;
    }
    if (data.service_area !== undefined) patch.service_area = data.service_area.trim().slice(0, 200) || null;
    if (data.google_review_url !== undefined) patch.google_review_url = data.google_review_url.trim().slice(0, 500) || null;
    if (data.after_hours_message !== undefined) patch.after_hours_message = data.after_hours_message.trim().slice(0, 500) || null;
    if (data.booking_enabled !== undefined) patch.booking_enabled = data.booking_enabled;
    if (data.booking_slug !== undefined) {
      const slug = data.booking_slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
      patch.booking_slug = slug || null;
    }
    if (data.logo_url !== undefined) {
      const u = data.logo_url.trim().slice(0, 800);
      patch.logo_url = u || null;
    }
    if (data.slot_minutes !== undefined) patch.slot_minutes = data.slot_minutes;
    if (data.buffer_minutes !== undefined) patch.buffer_minutes = data.buffer_minutes;
    if (data.timezone !== undefined) patch.timezone = data.timezone.trim().slice(0, 60) || null;
    const { error } = await context.supabase.from("businesses").update(patch as any).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
