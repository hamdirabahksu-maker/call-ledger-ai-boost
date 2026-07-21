import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isMedical } from "./industries";

export type MarketingKind = "outreach" | "social" | "blurb";
export type Channel = "sms" | "whatsapp" | "email";

type GenInput = {
  kind: MarketingKind;
  channel?: Channel;
  leadId?: string;
  extra?: string;
};

const SYSTEM_BASE = `You write concise, direct marketing copy for small service businesses worldwide.
Tone: warm, professional, respectful of tradespeople. No hype-bro language. No emojis unless natural.
Never invent prices, credentials, licenses, insurance, or specific guarantees.`;

const MEDICAL_GUARD = `\n\nCRITICAL — This is a medical/dental/clinic office. NEVER give medical advice, diagnoses, or treatment recommendations. Copy must focus ONLY on booking, rescheduling, reminders, and administrative logistics. If a symptom is mentioned, direct the person to contact the clinic or seek qualified care — never suggest what condition it is or how to treat it.`;

async function callAi(system: string, user: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

export const generateMarketing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: GenInput) => input)
  .handler(async ({ data, context }) => {
    const { data: biz } = await context.supabase
      .from("businesses")
      .select("id, name, trade, service_area, phone, country")
      .maybeSingle();
    if (!biz) throw new Error("No business profile");

    const medical = isMedical(biz.trade);
    const system = SYSTEM_BASE + (medical ? MEDICAL_GUARD : "");

    let userPrompt = "";
    let channel: Channel | undefined = data.channel;

    if (data.kind === "outreach") {
      channel = data.channel ?? "sms";
      let leadCtx = "a customer who recently contacted the business";
      if (data.leadId) {
        const { data: lead } = await context.supabase
          .from("leads")
          .select("name, issue, estimated_value, urgency")
          .eq("id", data.leadId)
          .maybeSingle();
        if (lead) {
          leadCtx = `Customer: ${lead.name}. Reason: ${lead.issue ?? "unspecified"}. Urgency: ${lead.urgency ?? "med"}.`;
        }
      }
      const lengthHint =
        channel === "email"
          ? "Write a short email (subject line on first line as 'Subject: ...', then 3–5 sentences body). Sign off from the business."
          : "Write ONE message, under 320 characters. No links unless natural.";
      userPrompt = `Business: ${biz.name} (${biz.trade}${biz.service_area ? `, ${biz.service_area}` : ""}${biz.country ? `, ${biz.country}` : ""}).
Channel: ${channel.toUpperCase()}.
${leadCtx}
${data.extra ? `Extra notes: ${data.extra}` : ""}
Task: Write a follow-up ${channel} to get them booked or answer their question and move to booking.
${lengthHint}`;
    } else if (data.kind === "social") {
      userPrompt = `Business: ${biz.name} (${biz.trade}${biz.service_area ? `, ${biz.service_area}` : ""}).
${data.extra ? `Focus: ${data.extra}` : ""}
Task: Write 5 short social media posts (LinkedIn/Facebook/Instagram friendly). Number them 1-5. Each 1–3 sentences. Mix of: useful tip, behind-the-scenes, customer-focus, service reminder, and seasonal/timely angle. No hashtag spam — max 3 relevant tags per post.`;
    } else {
      userPrompt = `Business: ${biz.name} (${biz.trade}${biz.service_area ? `, ${biz.service_area}` : ""}${biz.country ? `, ${biz.country}` : ""}).
${data.extra ? `Notes: ${data.extra}` : ""}
Task: Write a Google Business Profile / website "About" blurb. 2 short paragraphs (~90 words total). Warm, specific, no clichés like "your trusted partner".`;
    }

    const content = await callAi(system, userPrompt);

    const { data: saved, error } = await context.supabase
      .from("marketing_drafts")
      .insert({
        business_id: biz.id,
        owner_id: context.userId,
        kind: data.kind,
        channel: channel ?? null,
        prompt: data.extra ?? null,
        content,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const listMarketing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("marketing_drafts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });
