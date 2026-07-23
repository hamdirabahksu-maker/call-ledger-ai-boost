// Vertical signal / equalizer bars — calls & SMS metaphor.
// Center bar amber, outer bars fade white -> grey. Crisp at 16px and 128px.
export function BrandMark({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      role="img"
    >
      {/* 5 bars, varying heights, rounded caps. Center = amber. */}
      <rect x="2"  y="9"  width="2.6" height="6"  rx="1.3" fill="#e5e7eb" opacity="0.55" />
      <rect x="6.5"  y="6"  width="2.6" height="12" rx="1.3" fill="#f3f4f6" opacity="0.8" />
      <rect x="11" y="3"  width="2.6" height="18" rx="1.3" fill="var(--brand-mark-accent, #f5a524)" />
      <rect x="15.5" y="6"  width="2.6" height="12" rx="1.3" fill="#f3f4f6" opacity="0.8" />
      <rect x="20" y="9"  width="2.6" height="6"  rx="1.3" fill="#e5e7eb" opacity="0.55" />
    </svg>
  );
}

// App-mark: rounded-square amber gradient tile with white bars inside. Favicon / PWA only.
export function BrandTile({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bm-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="64" height="64" rx="14" fill="url(#bm-tile)" />
      <g fill="#0a0a0a">
        <rect x="10" y="26" width="6" height="12" rx="3" opacity="0.55" />
        <rect x="20" y="20" width="6" height="24" rx="3" opacity="0.8" />
        <rect x="30" y="12" width="6" height="40" rx="3" />
        <rect x="40" y="20" width="6" height="24" rx="3" opacity="0.8" />
        <rect x="50" y="26" width="6" height="12" rx="3" opacity="0.55" />
      </g>
    </svg>
  );
}
