import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type KycStatus = "pending" | "submitted" | "verified" | "rejected";

export const submitBusinessKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    legalName: string;
    registrationId?: string;
    docUrl?: string;
  }) => input)
  .handler(async ({ data, context }) => {
    const legalName = data.legalName?.trim().slice(0, 200);
    if (!legalName || legalName.length < 2) throw new Error("Legal name is required.");

    const { data: biz, error: findErr } = await context.supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (findErr) throw new Error(findErr.message);
    if (!biz) throw new Error("Complete business setup first.");

    const patch = {
      kyc_legal_name: legalName,
      kyc_registration_id: data.registrationId?.trim().slice(0, 120) || null,
      kyc_doc_url: data.docUrl?.trim().slice(0, 800) || null,
      kyc_status: "submitted" as const,
      kyc_submitted_at: new Date().toISOString(),
      kyc_notes: null,
    };

    const { error } = await context.supabase
      .from("businesses")
      .update(patch as any)
      .eq("id", biz.id);
    if (error) throw new Error(error.message);
    return { ok: true as const, status: "submitted" as KycStatus };
  });

export const adminSetKycStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { businessId: string; status: "verified" | "rejected"; notes?: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = roles?.some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("businesses")
      .update({
        kyc_status: data.status,
        kyc_reviewed_at: new Date().toISOString(),
        kyc_notes: data.notes?.trim().slice(0, 500) || null,
      } as any)
      .eq("id", data.businessId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
