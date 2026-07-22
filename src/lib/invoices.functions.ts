import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { LineItem } from "./estimates.functions";

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

function totals(items: LineItem[], taxRate = 0) {
  const subtotal = items.reduce((s, i) => s + Math.round(i.qty * i.unit_price_cents), 0);
  const tax = Math.round(subtotal * taxRate);
  return { subtotal_cents: subtotal, tax_cents: tax, total_cents: subtotal + tax };
}

export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("invoices").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: {
    id?: string;
    business_id: string;
    customer_id?: string | null;
    customer_name: string;
    phone?: string;
    email?: string;
    title: string;
    line_items: LineItem[];
    tax_rate?: number;
    due_date?: string | null;
    notes?: string;
    status?: "draft" | "sent" | "paid" | "overdue" | "void";
  }) => i)
  .handler(async ({ data, context }) => {
    const t = totals(data.line_items || [], data.tax_rate ?? 0);
    const payload = {
      business_id: data.business_id,
      customer_id: data.customer_id ?? null,
      customer_name: data.customer_name.trim().slice(0, 120),
      phone: data.phone?.trim().slice(0, 30) || null,
      email: data.email?.trim().slice(0, 160) || null,
      title: data.title.trim().slice(0, 160) || "Invoice",
      line_items: data.line_items,
      ...t,
      due_date: data.due_date || null,
      notes: data.notes?.slice(0, 2000) || null,
      status: data.status ?? "draft",
    };
    if (data.id) {
      const { error } = await context.supabase.from("invoices").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("invoices").insert(payload).select("id, public_token").maybeSingle();
    if (error || !row) throw new Error(error?.message ?? "Insert failed");
    return { ok: true, id: row.id, public_token: row.public_token };
  });

export const markInvoicePaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const { data: inv } = await context.supabase.from("invoices").select("total_cents").eq("id", data.id).maybeSingle();
    if (!inv) throw new Error("Invoice not found");
    const { error } = await context.supabase.from("invoices")
      .update({ status: "paid", amount_paid_cents: inv.total_cents }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("invoices").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getPublicInvoice = createServerFn({ method: "GET" })
  .inputValidator((i: { token: string }) => i)
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    const { data: inv } = await sb.from("invoices")
      .select("id, business_id, customer_name, title, line_items, subtotal_cents, tax_cents, total_cents, amount_paid_cents, status, due_date, notes, created_at, public_token")
      .eq("public_token", data.token).maybeSingle();
    if (!inv) return { invoice: null, business: null };
    const { data: biz } = await sb.from("businesses")
      .select("name, trade, service_area, phone").eq("id", inv.business_id).maybeSingle();
    return { invoice: inv, business: biz };
  });
