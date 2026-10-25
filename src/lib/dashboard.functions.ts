import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Sample-data seeding is disabled (Reality Pass).
 * Kept as an explicit no-op so old callers fail clearly instead of inserting fake leads.
 */
export const seedDashboardIfEmpty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { businessId: string }) => input)
  .handler(async () => {
    throw new Error("Sample data seeding is disabled. Use real leads only.");
  });
