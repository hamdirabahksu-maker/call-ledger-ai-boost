import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { submitBusinessKyc } from "@/lib/kyc.functions";
import { startPhoneOtp, checkPhoneOtp, getVerifyStatus } from "@/lib/verify.functions";
import { BrandLockup } from "@/components/brand-lockup";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/kyc")({
  head: () => ({
    meta: [
      { title: "Verify your business — CallLedger" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });

    const withKyc = await supabase.from("businesses").select("id, kyc_status").maybeSingle();
    if (withKyc.error && /kyc_status|column .* does not exist/i.test(withKyc.error.message)) {
      // Migration not applied yet — send shops to dashboard instead of a broken KYC form.
      throw redirect({ to: "/app" });
    }
    const biz = withKyc.data;
    if (!biz) throw redirect({ to: "/onboarding" });
    const status = (biz as { kyc_status?: string }).kyc_status ?? "pending";
    if (status === "submitted" || status === "verified") throw redirect({ to: "/app" });
  },
  component: KycPage,
});

function KycPage() {
  const navigate = useNavigate();
  const submit = useServerFn(submitBusinessKyc);
  const startOtp = useServerFn(startPhoneOtp);
  const checkOtp = useServerFn(checkPhoneOtp);
  const verifyStatus = useServerFn(getVerifyStatus);

  const [legalName, setLegalName] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifyConfigured, setVerifyConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [rejectedNote, setRejectedNote] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: biz }, vs] = await Promise.all([
        supabase.from("businesses").select("name, phone, phone_verified_at, kyc_status, kyc_legal_name, kyc_registration_id, kyc_doc_url, kyc_notes").maybeSingle(),
        verifyStatus({}),
      ]);
      setVerifyConfigured(Boolean((vs as { configured?: boolean })?.configured));
      if (biz) {
        setLegalName((biz as any).kyc_legal_name || biz.name || "");
        setRegistrationId((biz as any).kyc_registration_id || "");
        setDocUrl((biz as any).kyc_doc_url || "");
        setPhone(biz.phone || "");
        setPhoneVerified(Boolean(biz.phone_verified_at));
        if ((biz as any).kyc_status === "rejected") {
          setRejectedNote((biz as any).kyc_notes || "Please update your details and resubmit.");
        }
      }
    })();
  }, [verifyStatus]);

  const sendCode = async () => {
    if (!phone.trim()) return toast.error("Add a business phone first.");
    setOtpBusy(true);
    try {
      // Persist phone on business via OTP start (updates businesses.phone)
      await startOtp({ data: { phone: phone.trim() } });
      toast.success("Code sent.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setOtpBusy(false);
    }
  };

  const confirmCode = async () => {
    if (otp.length < 6) return toast.error("Enter the 6-digit code.");
    setOtpBusy(true);
    try {
      await checkOtp({ data: { code: otp } });
      setPhoneVerified(true);
      toast.success("Phone verified.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setOtpBusy(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyConfigured && !phoneVerified) {
      return toast.error("Verify your business phone before submitting.");
    }
    setBusy(true);
    try {
      await submit({
        data: {
          legalName,
          registrationId: registrationId || undefined,
          docUrl: docUrl || undefined,
        },
      });
      toast.success("Identity submitted — you can use CallLedger while we review.");
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-lg px-4 py-12">
        <BrandLockup size="lg" />
        <p className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-amber-400">Identity · business KYC</p>
        <h1 className="mt-3 font-display text-3xl">Verify your business</h1>
        <p className="mt-2 text-sm text-white/60">
          CallLedger is for real service operators. Tell us who owns the shop — we review submissions manually.
        </p>

        {rejectedNote && (
          <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
            Previous submission was rejected. {rejectedNote}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <label className="block text-xs uppercase tracking-widest text-white/50">
            Legal name / owner name
            <input
              required
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-white focus:border-amber-400 focus:outline-none"
            />
          </label>
          <label className="block text-xs uppercase tracking-widest text-white/50">
            Registration / tax ID (optional)
            <input
              value={registrationId}
              onChange={(e) => setRegistrationId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-white focus:border-amber-400 focus:outline-none"
            />
          </label>
          <label className="block text-xs uppercase tracking-widest text-white/50">
            Document URL (optional)
            <input
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1.5 h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-white focus:border-amber-400 focus:outline-none"
            />
          </label>

          <div className="rounded-md border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              Business phone
              {phoneVerified && <span className="text-xs text-emerald-400">Verified</span>}
            </div>
            {!verifyConfigured ? (
              <p className="mt-2 text-xs text-white/45">
                Twilio Verify not connected — phone OTP skipped for now. Add TWILIO_VERIFY_SERVICE_SID later.
              </p>
            ) : (
              <>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+15551234567"
                  className="mt-3 h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm focus:border-amber-400 focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={otpBusy}
                    onClick={sendCode}
                    className="rounded-md border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5 disabled:opacity-50"
                  >
                    Send code
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  <button
                    type="button"
                    disabled={otpBusy}
                    onClick={confirmCode}
                    className="rounded-md bg-amber-400 px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-amber-400 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit for review
          </button>
          <p className="text-center text-xs text-white/40">
            After you submit, you can use the dashboard while we review.
          </p>
        </form>
      </div>
    </div>
  );
}
