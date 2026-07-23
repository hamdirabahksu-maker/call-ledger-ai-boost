import { Link } from "@tanstack/react-router";
import { BrandMark } from "./brand-mark";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, { mark: number; word: string; sub: string; gap: string }> = {
  sm: { mark: 20, word: "text-base", sub: "text-[9px]", gap: "gap-2" },
  md: { mark: 26, word: "text-lg",   sub: "text-[10px]", gap: "gap-2.5" },
  lg: { mark: 34, word: "text-2xl",  sub: "text-[11px]", gap: "gap-3" },
};

export function BrandLockup({
  size = "md",
  showSubtitle = true,
  href = "/",
  className = "",
}: { size?: Size; showSubtitle?: boolean; href?: string | null; className?: string }) {
  const s = sizes[size];
  const inner = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <BrandMark size={s.mark} />
      <span className="flex flex-col leading-none">
        <span className={`font-display font-bold tracking-tight text-white ${s.word}`}>
          CallLedger
        </span>
        {showSubtitle && (
          <span className={`mt-1 font-mono uppercase tracking-[0.24em] text-white/40 ${s.sub}`}>
            AI Front Office
          </span>
        )}
      </span>
    </span>
  );
  if (!href) return inner;
  return <Link to={href as any} className="inline-flex items-center">{inner}</Link>;
}
