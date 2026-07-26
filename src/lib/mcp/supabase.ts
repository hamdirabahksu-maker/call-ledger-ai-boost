import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import type { Database } from "@/integrations/supabase/types";

/** Supabase client scoped to the OAuth caller — RLS runs as that user. */
export function supabaseForUser(ctx: ToolContext) {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        headers.set("Authorization", `Bearer ${ctx.getToken()}`);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export function textResult(text: string, structured?: Record<string, unknown>) {
  return { content: [{ type: "text" as const, text }], structuredContent: structured };
}

export function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

/** Resolve the caller's business (RLS already limits rows to the owner). */
export async function resolveBusiness(ctx: ToolContext) {
  const supabase = supabaseForUser(ctx);
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, trade, country, service_area, phone, booking_slug, booking_enabled, timezone")
    .limit(1)
    .maybeSingle();
  if (error) return { supabase, business: null, error: error.message };
  if (!data) return { supabase, business: null, error: "No business found for this account. Complete onboarding in CallLedger first." };
  return { supabase, business: data, error: null };
}
