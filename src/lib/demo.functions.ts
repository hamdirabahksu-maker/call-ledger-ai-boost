import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertRateLimit } from "@/lib/rate-limit";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const url = process.env.SUPABASE_URL!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const submitDemoRequest = createServerFn({ method: "POST" })
  .inputValidator((input: {
    name: string;
    email: string;
    phone?: string;
    business_name?: string;
    trade?: string;
    message?: string;
  }) => input)
  .handler(async ({ data }) => {
    assertRateLimit(`demo:${data.email?.toLowerCase() ?? "anon"}`, { limit: 3, windowMs: 3600_000 });
    const name = data.name?.trim().slice(0, 120);
    const email = data.email?.trim().toLowerCase().slice(0, 200);
    if (!name || !email || !email.includes("@")) {
      return { ok: false as const, error: "Name and valid email required" };
    }
    const row = {
      name,
      email,
      phone: data.phone?.trim().slice(0, 40) || null,
      business_name: data.business_name?.trim().slice(0, 120) || null,
      trade: data.trade?.trim().slice(0, 80) || null,
      message: data.message?.trim().slice(0, 2000) || null,
    };
    const sb = publicClient();
    const { error } = await (sb as any).from("demo_requests").insert(row);
    if (error) {
      console.error("demo_requests insert failed", error.message);
      return { ok: false as const, error: "Could not save request. Apply the Batch B migration if this persists." };
    }

    // Optional notify owner via Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "CallLedger <onboarding@resend.dev>",
            to: ["hamdi.rabahksu@gmail.com"],
            subject: `Demo request: ${name}`,
            text: [
              `Name: ${name}`,
              `Email: ${email}`,
              `Phone: ${row.phone ?? "—"}`,
              `Business: ${row.business_name ?? "—"}`,
              `Trade: ${row.trade ?? "—"}`,
              "",
              row.message ?? "",
            ].join("\n"),
          }),
        });
      } catch (e) {
        console.error("demo notify email failed");
      }
    }
    return { ok: true as const };
  });

export const listDemoRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (context.claims.email !== "hamdi.rabahksu@gmail.com") {
      const { data: roles } = await context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId);
      if (!roles?.some((r: { role: string }) => r.role === "admin")) {
        throw new Error("Forbidden");
      }
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("demo_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
