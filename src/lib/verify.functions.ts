import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertRateLimit } from "@/lib/rate-limit";

function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  return { sid, token, serviceSid };
}

export const getVerifyStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { sid, token, serviceSid } = twilioAuth();
  return {
    verifyConfigured: Boolean(sid && token && serviceSid),
  };
});

export const startPhoneOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phone: string }) => input)
  .handler(async ({ data, context }) => {
    assertRateLimit(`otp-start:${context.userId}`, { limit: 5, windowMs: 60_000 });
    const { sid, token, serviceSid } = twilioAuth();
    if (!sid || !token || !serviceSid) {
      return { configured: false as const };
    }
    const phone = data.phone?.trim();
    if (!phone || phone.length < 8) throw new Error("Enter a valid phone number (E.164 preferred)");

    const form = new URLSearchParams();
    form.set("To", phone);
    form.set("Channel", "sms");
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
      },
    );
    const payload = (await res.json().catch(() => ({}))) as { status?: string; message?: string };
    if (!res.ok) {
      console.error(`Twilio Verify start failed [${res.status}]`, payload.message);
      return {
        configured: true as const,
        ok: false as const,
        error: "Could not send verification code. Check Twilio Verify setup.",
      };
    }
    // Persist phone (not verified yet)
    await context.supabase
      .from("businesses")
      .update({ phone, phone_verified_at: null } as any)
      .eq("owner_id", context.userId);
    return { configured: true as const, ok: true as const, status: payload.status };
  });

export const checkPhoneOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phone: string; code: string }) => input)
  .handler(async ({ data, context }) => {
    assertRateLimit(`otp-check:${context.userId}`, { limit: 10, windowMs: 60_000 });
    const { sid, token, serviceSid } = twilioAuth();
    if (!sid || !token || !serviceSid) {
      return { configured: false as const };
    }
    const phone = data.phone?.trim();
    const code = data.code?.trim();
    if (!phone || !code) throw new Error("Phone and code required");

    const form = new URLSearchParams();
    form.set("To", phone);
    form.set("Code", code);
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`,
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
      status?: string;
      message?: string;
    };
    if (!res.ok) {
      console.error(`Twilio Verify check failed [${res.status}]`, payload.message);
      return {
        configured: true as const,
        ok: false as const,
        error: "Could not verify code. Try again or request a new code.",
      };
    }
    if (payload.status !== "approved") {
      return { configured: true as const, ok: false as const, error: "Invalid or expired code" };
    }
    const { error } = await context.supabase
      .from("businesses")
      .update({
        phone,
        phone_verified_at: new Date().toISOString(),
      } as any)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { configured: true as const, ok: true as const };
  });
