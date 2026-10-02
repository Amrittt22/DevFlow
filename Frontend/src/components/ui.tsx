// ─── DevFlow UI primitives ─────────────────────────────────────────────────────

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

// ─── Buttons ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:bg-accentstrong shadow-[0_4px_14px_-4px_var(--ring)] disabled:opacity-50',
  secondary: 'bg-surface2 text-ink hover:bg-surface3 border border-border',
  ghost: 'text-ink2 hover:text-ink hover:bg-surface2',
  danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
  outline: 'border border-borderstrong text-ink hover:border-accent hover:text-accent',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150 focus-ring cursor-pointer disabled:cursor-not-allowed whitespace-nowrap',
        size === 'sm' && 'h-7 px-2.5 text-xs',
        size === 'md' && 'h-9 px-3.5 text-sm',
        size === 'lg' && 'h-11 px-5 text-sm',
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({
  className,
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink3 transition-colors hover:bg-surface2 hover:text-ink focus-ring cursor-pointer',
        className,
      )}
      {...props}
    />
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-surface shadow-card', className)}>{children}</div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink3">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Typography helpers ────────────────────────────────────────────────────────

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-[11px] font-semibold tracking-[0.14em] text-ink3 uppercase', className)}>{children}</p>
  );
}

// ─── Badges & chips ────────────────────────────────────────────────────────────

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span className={cn('inline-block h-1.5 w-1.5 rounded-full', className)} />;
}

// ─── Avatars ───────────────────────────────────────────────────────────────────

export function Avatar({
  name,
  color,
  size = 'md',
  className,
  ring = false,
}: {
  name: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
}) {
  const sizes = { xs: 'h-5 w-5 text-[8px]', sm: 'h-6 w-6 text-[9px]', md: 'h-7 w-7 text-[10px]', lg: 'h-9 w-9 text-xs', xl: 'h-12 w-12 text-sm' };
  const init = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      title={name}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white',
        sizes[size],
        ring && 'ring-2 ring-surface',
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
    >
      {init}
    </span>
  );
}

export function AvatarStack({
  users,
  size = 'sm',
  max = 3,
}: {
  users: { id: string; name: string; color: string }[];
  size?: 'xs' | 'sm' | 'md' | 'lg';
  max?: number;
}) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <span className="flex items-center -space-x-1.5">
      {shown.map((u) => (
        <Avatar key={u.id} name={u.name} color={u.color} size={size} ring />
      ))}
      {extra > 0 && (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface3 text-[9px] font-semibold text-ink2 ring-2 ring-surface">
          +{extra}
        </span>
      )}
    </span>
  );
}

// ─── Form controls ─────────────────────────────────────────────────────────────

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-lg border border-border bg-surface2 px-3 text-sm text-ink placeholder:text-ink3 transition-colors focus:border-accent focus:outline-none',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm text-ink placeholder:text-ink3 transition-colors focus:border-accent focus:outline-none resize-y min-h-20',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-9 rounded-lg border border-border bg-surface2 px-2.5 text-sm text-ink transition-colors focus:border-accent focus:outline-none cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink3">{hint}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 cursor-pointer"
    >
      <span
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors duration-200',
          checked ? 'bg-accent' : 'bg-surface3',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200',
            checked ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </span>
      {label && <span className="text-sm text-ink2">{label}</span>}
    </button>
  );
}

// ─── Progress ──────────────────────────────────────────────────────────────────

export function Progress({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface3', className)}>
      <div
        className={cn('h-full rounded-full bg-accent transition-all duration-500', barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────

export function Tabs({
  tabs,
  value,
  onChange,
  counts,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  counts?: Record<string, number>;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'relative px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
            value === t.id ? 'text-ink' : 'text-ink3 hover:text-ink2',
          )}
        >
          {t.label}
          {counts && counts[t.id] !== undefined && (
            <span className={cn('ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold', value === t.id ? 'bg-accent/15 text-accent' : 'bg-surface3 text-ink3')}>
              {counts[t.id]}
            </span>
          )}
          {value === t.id && (
            <motion.span layoutId="tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Popover / Dropdown ────────────────────────────────────────────────────────

export function Popover({
  trigger,
  children,
  align = 'left',
  width,
}: {
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className={cn(
              'absolute z-50 mt-1.5 rounded-xl border border-border bg-surface p-1.5 shadow-pop',
              align === 'right' ? 'right-0' : 'left-0',
              width ?? 'w-56',
            )}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MenuItem({
  icon,
  label,
  hint,
  onClick,
  danger,
  active,
}: {
  icon?: ReactNode;
  label: string;
  hint?: string;
  onClick?: () => void;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors cursor-pointer',
        danger ? 'text-danger hover:bg-danger/10' : 'text-ink2 hover:bg-surface2 hover:text-ink',
        active && 'bg-surface2 text-ink',
      )}
    >
      {icon && <span className={cn('shrink-0', danger ? 'text-danger' : 'text-ink3')}>{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {hint && <span className="text-[10px] text-ink3">{hint}</span>}
    </button>
  );
}

// ─── Modal & Slide-over ────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  children,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-90 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className={cn('w-full rounded-2xl border border-border bg-surface shadow-pop', width)}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SlideOver({
  open,
  onClose,
  children,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-80 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-85 flex w-full flex-col border-l border-border bg-surface shadow-pop"
            style={{ maxWidth: width }}
          >
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function SlideOverHeader({ title, subtitle, onClose, children }: { title: ReactNode; subtitle?: string; onClose: () => void; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {children}
          <h2 className="truncate text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
        </div>
        {subtitle && <p className="mt-0.5 text-xs text-ink3">{subtitle}</p>}
      </div>
      <IconButton label="Close panel" onClick={onClose}>
        <X className="h-4 w-4" />
      </IconButton>
    </div>
  );
}

// ─── Empty state / skeleton / spinner ─────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="dot-grid flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-8 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface2 text-ink3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {body && <p className="max-w-sm text-xs leading-relaxed text-ink3">{body}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4 animate-spin', className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Stat ──────────────────────────────────────────────────────────────────────

export function Stat({
  label,
  value,
  delta,
  deltaTone = 'neutral',
  icon,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <Eyebrow>{label}</Eyebrow>
        {icon && <span className="text-ink3">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold tracking-tight text-ink">{value}</span>
        {delta && (
          <span
            className={cn(
              'text-xs font-medium',
              deltaTone === 'up' && 'text-emerald-500',
              deltaTone === 'down' && 'text-rose-500',
              deltaTone === 'neutral' && 'text-ink3',
            )}
          >
            {delta}
          </span>
        )}
      </div>
    </Card>
  );
}
