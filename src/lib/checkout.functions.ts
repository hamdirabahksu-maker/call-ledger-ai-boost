import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Plan = "pilot" | "starter" | "growth";

const PLAN_META: Record<Plan, { name: string; amount: number }> = {
  pilot: { name: "CallLedger Pilot", amount: 4900 },
  starter: { name: "CallLedger Starter", amount: 9900 },
  growth: { name: "CallLedger Growth", amount: 19900 },
};

/**
 * Creates a Stripe Checkout Session for a plan.
 * Returns { configured: false } if STRIPE_SECRET_KEY is missing —
 * UI shows a "Connect Stripe" banner instead of faking a payment.
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { plan: Plan; businessId?: string }) => input)
  .handler(async ({ data, context }) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return { configured: false as const };
    }

    const plan = PLAN_META[data.plan];
    if (!plan) throw new Error("Unknown plan");

    const origin = resolveAppOrigin();
    const successUrl = `${origin}/app?checkout=success`;
    const cancelUrl = `${origin}/#pricing`;

    // Create a price on the fly (recurring monthly) via Stripe REST API.
    const body = new URLSearchParams();
    body.set("mode", "subscription");
    body.set("success_url", successUrl);
    body.set("cancel_url", cancelUrl);
    body.set("customer_email", context.claims.email ?? "");
    body.set("line_items[0][quantity]", "1");
    body.set("line_items[0][price_data][currency]", "usd");
    body.set("line_items[0][price_data][product_data][name]", plan.name);
    body.set("line_items[0][price_data][unit_amount]", String(plan.amount));
    body.set("line_items[0][price_data][recurring][interval]", "month");
    body.set("metadata[user_id]", context.userId);
    body.set("metadata[plan]", data.plan);
    if (data.businessId) body.set("metadata[business_id]", data.businessId);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Stripe error", err);
      throw new Error("Stripe checkout failed");
    }
    const session = (await res.json()) as { url: string };
    return { configured: true as const, url: session.url };
  });

export const getStripeStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { configured: Boolean(process.env.STRIPE_SECRET_KEY) };
});
