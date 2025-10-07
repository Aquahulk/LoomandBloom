export default function LeafSway({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <svg width="120" height="120" viewBox="0 0 120 120" className="leaf-sway">
        <defs>
          <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>
        </defs>
        <path d="M60 12 C84 32 102 56 60 110 C18 56 36 32 60 12 Z" fill="url(#leafGrad)" opacity="0.85" />
      </svg>
    </div>
  );
}