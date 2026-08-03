import { BrandMark } from "@/components/brand-mark";

/** Shared header for public /book, /quote, /invoice — business logo + CallLedger BrandLockup. */
export function PublicChrome({
  logoUrl,
  businessName,
  maxWidthClass = "max-w-4xl",
}: {
  logoUrl?: string | null;
  businessName?: string | null;
  maxWidthClass?: string;
}) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur">
      <div className={`mx-auto flex h-14 ${maxWidthClass} items-center justify-between gap-3 px-4`}>
        <div className="flex min-w-0 items-center gap-2.5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName ?? ""}
              className="h-8 w-auto max-w-[120px] shrink-0 rounded object-contain"
            />
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-primary/40 bg-primary/15 font-display text-sm font-bold text-primary">
              {(businessName ?? "C").charAt(0).toUpperCase()}
            </span>
          )}
          {businessName ? (
            <span className="truncate font-display text-lg text-foreground">{businessName}</span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:inline">
            Powered by
          </span>
          <BrandMark size={16} />
          <span className="font-display text-sm font-semibold tracking-tight text-foreground">
            CallLedger
          </span>
        </div>
      </div>
    </header>
  );
}
