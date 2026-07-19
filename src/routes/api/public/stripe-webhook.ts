import { createFileRoute } from "@tanstack/react-router";

// Stripe webhook — updates the subscriptions table.
// Configure endpoint URL in Stripe dashboard and paste STRIPE_WEBHOOK_SECRET
// into project secrets to enable signature verification.
export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const rawBody = await request.text();

        // Verify signature if secret is configured.
        if (secret) {
          const sig = request.headers.get("stripe-signature") ?? "";
          const parts = Object.fromEntries(
            sig.split(",").map((p) => p.split("=") as [string, string]),
          );
          const timestamp = parts.t;
          const v1 = parts.v1;
          if (!timestamp || !v1) return new Response("Bad signature", { status: 400 });

          const enc = new TextEncoder();
          const key = await crypto.subtle.importKey(
            "raw",
            enc.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"],
          );
          const macBuf = await crypto.subtle.sign(
            "HMAC",
            key,
            enc.encode(`${timestamp}.${rawBody}`),
          );
          const expected = Array.from(new Uint8Array(macBuf))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          if (expected !== v1) return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(rawBody);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        try {
          if (event.type === "checkout.session.completed") {
            const s = event.data.object;
            const businessId = s.metadata?.business_id;
            const plan = s.metadata?.plan;
            if (businessId) {
              await supabaseAdmin.from("subscriptions").upsert({
                business_id: businessId,
                stripe_customer_id: s.customer,
                stripe_subscription_id: s.subscription,
                plan,
                status: "active",
              }, { onConflict: "business_id" });
            }
          } else if (
            event.type === "customer.subscription.updated" ||
            event.type === "customer.subscription.deleted"
          ) {
            const s = event.data.object;
            await supabaseAdmin
              .from("subscriptions")
              .update({
                status: s.status,
                current_period_end: s.current_period_end
                  ? new Date(s.current_period_end * 1000).toISOString()
                  : null,
              })
              .eq("stripe_subscription_id", s.id);
          }
        } catch (e) {
          console.error("Webhook processing error", e);
          return new Response("processing error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
