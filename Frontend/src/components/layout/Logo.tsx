export function Logo({ size = 'md', withWordmark = true }: { size?: 'sm' | 'md' | 'lg'; withWordmark?: boolean }) {
  const box = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-11 w-11' : 'h-8 w-8';
  const path = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-4.5 w-4.5';
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`relative inline-flex ${box} items-center justify-center rounded-[10px] bg-gradient-to-br from-accent to-accent2 shadow-[0_4px_16px_-4px_var(--ring)]`}>
        <svg viewBox="0 0 24 24" fill="none" className={path}>
          <path
            d="M7 18v-4.5a3 3 0 0 1 3-3h4.5"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="7" cy="7.5" r="2.4" fill="white" />
          <circle cx="17" cy="12" r="2.4" fill="white" />
          <path d="M12 12h2.6" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      {withWordmark && (
        <span className="text-[15px] font-bold tracking-tight text-ink">
          Dev<span className="text-gradient">Flow</span>
        </span>
      )}
    </span>
  );
}
