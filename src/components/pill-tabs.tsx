export type PillTab<T extends string> = { id: T; label: string };

export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
  className = "",
}: {
  tabs: readonly PillTab<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={`flex flex-wrap gap-2 ${className}`}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`press rounded-full border px-3.5 py-1.5 text-sm ${
              active
                ? "border-primary/50 bg-primary/15 font-semibold text-primary"
                : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
