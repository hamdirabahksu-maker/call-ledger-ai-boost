import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BrandLockup } from "@/components/brand-lockup";
import { HELP_ARTICLES, HELP_CATEGORIES, type HelpCategory } from "@/lib/help-content";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help — CallLedger" },
      { name: "description", content: "Guides for CallLedger: auth, Twilio, Stripe, booking, and more." },
    ],
  }),
  component: HelpHub,
});

function HelpHub() {
  const [cat, setCat] = useState<"all" | HelpCategory>("all");
  const articles =
    cat === "all" ? HELP_ARTICLES : HELP_ARTICLES.filter((a) => a.category === cat);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <BrandLockup size="sm" href="/" showSubtitle={false} />
          <Link to="/auth" search={{ mode: "login" } as any} className="text-sm text-white/60 hover:text-white">
            Log in
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-14 animate-page-enter">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400/80">Help center</p>
        <h1 className="mt-2 font-display text-4xl">How CallLedger works</h1>
        <p className="mt-3 max-w-xl text-sm text-white/60">
          Setup guides for shops — auth, SMS, billing, booking, and marketing.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {HELP_CATEGORIES.map((c) => {
            const active = cat === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={`press rounded-full border px-3 py-1.5 text-xs transition ${
                  active
                    ? "border-amber-400/45 bg-amber-400/15 text-amber-400"
                    : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <ul className="mt-8 space-y-3">
          {articles.map((a) => (
            <li key={a.slug}>
              <Link
                to="/help/$slug"
                params={{ slug: a.slug }}
                className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:border-amber-400/40 hover:bg-white/[0.05]"
              >
                <div>
                  <p className="font-semibold text-white">{a.title}</p>
                  <p className="mt-1 text-sm text-white/50">{a.summary}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-amber-400 transition group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-center text-xs text-white/40">
          <Link to="/demo" className="text-amber-400 hover:brightness-110">Book a demo</Link>
          {" · "}
          <a href="/help" className="hover:text-white/70">Help center</a>
        </p>
      </main>
    </div>
  );
}
