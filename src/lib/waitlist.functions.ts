import { createServerFn } from "@tanstack/react-start";

type Input = { email: string; trade?: string; country?: string };

export const notifyWaitlist = createServerFn({ method: "POST" })
  .inputValidator((input: Input) => input)
  .handler(async ({ data }) => {
    const key = process.env.RESEND_API_KEY;
    if (!key) return { sent: false as const, reason: "resend_not_configured" };
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          from: "CallLedger <onboarding@resend.dev>",
          to: [data.email],
          subject: "You're on the CallLedger early-access list",
          html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;line-height:1.5">
            <h2 style="margin:0 0 12px">You're in.</h2>
            <p>Thanks for joining the CallLedger early-access list${data.trade ? ` (${data.trade})` : ""}.</p>
            <p>We onboard 10 businesses per week. You'll get a short questionnaire from us shortly so we can match you with the right pilot slot.</p>
            <p style="margin-top:24px;color:#666;font-size:13px">Questions? Reply to this email or reach us at hamdi.rabahksu@gmail.com.</p>
            <p style="color:#666;font-size:13px">— CallLedger AI</p>
          </div>`,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("Resend failed", res.status, body);
        return { sent: false as const, reason: "resend_error" };
      }
      return { sent: true as const };
    } catch (e) {
      console.error("Resend threw", e);
      return { sent: false as const, reason: "network_error" };
    }
  });

export const getResendStatus = createServerFn({ method: "GET" }).handler(async () => ({
  configured: !!process.env.RESEND_API_KEY,
}));
