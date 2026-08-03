import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BrandLockup } from "@/components/brand-lockup";
import { getHelpArticle, HELP_ARTICLES } from "@/lib/help-content";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/help/$slug")({
  loader: ({ params }) => {
    const article = getHelpArticle(params.slug);
    if (!article) throw notFound();
    return article;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Help"} — CallLedger` },
      { name: "description", content: loaderData?.summary ?? "" },
    ],
  }),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-[#050505] text-white">
      <div className="text-center">
        <h1 className="font-display text-2xl">Article not found</h1>
        <Link to="/help" className="mt-4 inline-block text-amber-400">Back to help</Link>
      </div>
    </div>
  ),
  component: HelpArticlePage,
});

function HelpArticlePage() {
  const article = Route.useLoaderData();
  const others = HELP_ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 4);
  const paragraphs = article.body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <BrandLockup size="sm" href="/" showSubtitle={false} />
          <Link to="/help" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> All guides
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-14 animate-page-enter">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400/80">Guide</p>
        <h1 className="mt-2 font-display text-4xl">{article.title}</h1>
        <p className="mt-3 text-sm text-white/55">{article.summary}</p>

        <article className="mt-10 space-y-5">
          {paragraphs.map((block, i) => {
            const numbered = /^(\d+)\.\s+/.test(block) || /^(\d+)\s*·/.test(block);
            if (numbered || block.includes("\n")) {
              const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
              return (
                <div
                  key={i}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4"
                >
                  {lines.map((line, j) => (
                    <p
                      key={j}
                      className={`text-[15px] leading-relaxed ${
                        j === 0 && numbered
                          ? "font-semibold text-white"
                          : "mt-1.5 text-white/75 first:mt-0"
                      }`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              );
            }
            return (
              <p key={i} className="text-[15px] leading-relaxed text-white/80 whitespace-pre-wrap">
                {block}
              </p>
            );
          })}
        </article>

        <div className="mt-14 border-t border-white/10 pt-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">More guides</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((a) => (
              <li key={a.slug}>
                <Link
                  to="/help/$slug"
                  params={{ slug: a.slug }}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:border-amber-400/40 hover:text-white"
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-xs text-white/40">
            <Link to="/demo" className="text-amber-400 hover:brightness-110">Book a demo</Link>
            {" · "}
            <Link to="/help" className="hover:text-white/70">Help hub</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
