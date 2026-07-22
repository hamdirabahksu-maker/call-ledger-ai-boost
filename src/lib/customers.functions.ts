import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: {
    id?: string;
    business_id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  }) => i)
  .handler(async ({ data, context }) => {
    const payload = {
      business_id: data.business_id,
      name: data.name.trim().slice(0, 120),
      phone: data.phone?.trim().slice(0, 30) || null,
      email: data.email?.trim().slice(0, 160) || null,
      address: data.address?.trim().slice(0, 300) || null,
      notes: data.notes?.trim().slice(0, 1000) || null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("customers").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("customers").insert(payload).select("id").maybeSingle();
    if (error || !row) throw new Error(error?.message ?? "Insert failed");
    return { ok: true, id: row.id };
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("customers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
