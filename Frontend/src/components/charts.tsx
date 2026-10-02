import type { ReactNode } from 'react';
import { useAppStore } from '../store';

export const CHART_COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6'];

export function ChartTooltip({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> }[];
  label?: string | number;
  suffix?: string;
}) {
  const theme = useAppStore((s) => s.theme);
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border px-3 py-2 shadow-pop"
      style={{
        background: theme === 'dark' ? '#151926' : '#ffffff',
        borderColor: theme === 'dark' ? '#2c3448' : '#e2e5ee',
      }}
    >
      {label !== undefined && <p className="mb-1 text-[10px] font-semibold tracking-wide text-[#8b93a7] uppercase">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-xs font-medium" style={{ color: p.color ?? '#e9ecf4' }}>
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#8b93a7]">{p.name}:</span>
          <span className="font-mono">
            {p.value}
            {suffix}
          </span>
        </p>
      ))}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 shadow-card ${className ?? ''}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink3">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/** Accessible axis props for the current theme. */
export function useAxisTheme() {
  const theme = useAppStore((s) => s.theme);
  return {
    tick: { fill: theme === 'dark' ? '#69738a' : '#8b93a7', fontSize: 10, fontFamily: 'JetBrains Mono' },
    axisLine: { stroke: theme === 'dark' ? '#1e2432' : '#e2e5ee' },
    grid: { stroke: theme === 'dark' ? '#1e2432' : '#e9edf4', strokeDasharray: '3 3' },
  };
}
