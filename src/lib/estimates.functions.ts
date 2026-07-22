import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type LineItem = { description: string; qty: number; unit_price_cents: number };

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

export const listEstimates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("estimates").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertEstimate = createServerFn({ method: "POST" })
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
    valid_until?: string | null;
    notes?: string;
    status?: "draft" | "sent" | "accepted" | "declined" | "expired";
  }) => i)
  .handler(async ({ data, context }) => {
    const t = totals(data.line_items || [], data.tax_rate ?? 0);
    const payload = {
      business_id: data.business_id,
      customer_id: data.customer_id ?? null,
      customer_name: data.customer_name.trim().slice(0, 120),
      phone: data.phone?.trim().slice(0, 30) || null,
      email: data.email?.trim().slice(0, 160) || null,
      title: data.title.trim().slice(0, 160) || "Estimate",
      line_items: data.line_items,
      ...t,
      valid_until: data.valid_until || null,
      notes: data.notes?.slice(0, 2000) || null,
      status: data.status ?? "draft",
    };
    if (data.id) {
      const { error } = await context.supabase.from("estimates").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("estimates").insert(payload).select("id, public_token").maybeSingle();
    if (error || !row) throw new Error(error?.message ?? "Insert failed");
    return { ok: true, id: row.id, public_token: row.public_token };
  });

export const deleteEstimate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("estimates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Public: fetch estimate by token
export const getPublicEstimate = createServerFn({ method: "GET" })
  .inputValidator((i: { token: string }) => i)
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    const { data: est } = await sb.from("estimates")
      .select("id, business_id, customer_name, title, line_items, subtotal_cents, tax_cents, total_cents, status, valid_until, notes, created_at, public_token")
      .eq("public_token", data.token).maybeSingle();
    if (!est) return { estimate: null, business: null };
    const { data: biz } = await sb.from("businesses")
      .select("name, trade, service_area, phone").eq("id", est.business_id).maybeSingle();
    return { estimate: est, business: biz };
  });

// Public: accept / decline
export const respondEstimate = createServerFn({ method: "POST" })
  .inputValidator((i: { token: string; action: "accepted" | "declined" }) => i)
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    const { data: est } = await sb.from("estimates").select("id, status").eq("public_token", data.token).maybeSingle();
    if (!est) return { ok: false as const, error: "Not found" };
    if (est.status === "accepted" || est.status === "declined") return { ok: false as const, error: "Already responded" };
    const { error } = await sb.from("estimates").update({ status: data.action }).eq("id", est.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// Owner: convert estimate → invoice
export const convertEstimateToInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { estimate_id: string; due_date?: string | null }) => i)
  .handler(async ({ data, context }) => {
    const { data: est, error } = await context.supabase.from("estimates").select("*").eq("id", data.estimate_id).maybeSingle();
    if (error || !est) throw new Error(error?.message ?? "Estimate not found");
    const { data: inv, error: iErr } = await context.supabase.from("invoices").insert({
      business_id: est.business_id,
      customer_id: est.customer_id,
      estimate_id: est.id,
      customer_name: est.customer_name,
      phone: est.phone,
      email: est.email,
      title: est.title.replace(/^Estimate/i, "Invoice") || "Invoice",
      line_items: est.line_items,
      subtotal_cents: est.subtotal_cents,
      tax_cents: est.tax_cents,
      total_cents: est.total_cents,
      status: "sent",
      due_date: data.due_date ?? null,
    }).select("id, public_token").maybeSingle();
    if (iErr || !inv) throw new Error(iErr?.message ?? "Convert failed");
    return { ok: true, invoice_id: inv.id, public_token: inv.public_token };
  });

// AI-generate line items from a job description (Lovable AI gateway).
export const aiSuggestLineItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { description: string; trade?: string }) => i)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI not configured" };
    const isClinic = /clinic|dental|medical|therapy|doctor/i.test(data.trade ?? "");
    const guard = isClinic
      ? "This is for a clinic/medical office — quote is for ADMIN / BOOKING SERVICES ONLY. Do not include medical procedures, diagnoses, or treatment. Keep line items to booking, admin, consult scheduling fees."
      : "";
    const prompt = `You are helping a ${data.trade ?? "service"} business build a quick estimate. From this job description, output a JSON array of 2-6 line items. Each item: {"description": string (<=80 chars), "qty": number, "unit_price_cents": integer}. ${guard}\n\nJob: ${data.description.slice(0, 800)}\n\nReturn ONLY JSON array, no prose.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `AI ${res.status}` };
    const json = await res.json() as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return { ok: false as const, error: "AI returned no items" };
    try {
      const arr = JSON.parse(match[0]) as LineItem[];
      const clean = arr.filter((x) => x && typeof x.description === "string").map((x) => ({
        description: String(x.description).slice(0, 120),
        qty: Math.max(1, Number(x.qty) || 1),
        unit_price_cents: Math.max(0, Math.round(Number(x.unit_price_cents) || 0)),
      })).slice(0, 8);
      return { ok: true as const, items: clean };
    } catch {
      return { ok: false as const, error: "Parse failed" };
    }
  });
