import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertRateLimit } from "@/lib/rate-limit";

export const getTwilioStatus = createServerFn({ method: "GET" }).handler(async () => {
  return {
    twilioConfigured: Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER,
    ),
  };
});

/**
 * Send an SMS via Twilio. Returns { configured: false } if any secret is
 * missing so the UI can show a "Connect Twilio" banner instead of faking.
 */
export const sendSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { to: string; body: string; leadId?: string }) => input)
  .handler(async ({ data, context }) => {
    assertRateLimit(`sms:${context.userId}`, { limit: 20, windowMs: 60_000 });
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !token || !from) {
      return { configured: false as const };
    }

    const to = data.to?.trim();
    if (!to) throw new Error("Missing destination phone");
    const bodyText = (data.body || "").slice(0, 1600);
    if (!bodyText) throw new Error("Empty message");
    // Never echo full phone/body in client-facing errors — Twilio message only.

    const form = new URLSearchParams();
    form.set("To", to);
    form.set("From", from);
    form.set("Body", bodyText);

    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
      },
    );
    const payload = (await res.json().catch(() => ({}))) as {
      sid?: string;
      status?: string;
      message?: string;
      code?: number;
    };
    if (!res.ok) {
      console.error(`Twilio send failed [${res.status}]: ${payload.message ?? "unknown"}`);
      // Never return raw Twilio text (may include phone/PII) to the client toast path
      return {
        configured: true as const,
        ok: false as const,
        error: "SMS failed. Check Twilio credentials and destination number.",
      };
    }

    // Log the attempt into calls table (best-effort, RLS as the user).
    try {
      const { data: biz } = await context.supabase
        .from("businesses")
        .select("id")
        .maybeSingle();
      if (biz?.id) {
        await context.supabase.from("calls").insert({
          business_id: biz.id,
          from_number: to,
          recovered: true,
          note: `SMS sent: ${bodyText.slice(0, 140)}`,
        });
      }
    } catch (e) {
      console.error("calls log failed", e);
    }

    return {
      configured: true as const,
      ok: true as const,
      sid: payload.sid,
      status: payload.status,
    };
  });
