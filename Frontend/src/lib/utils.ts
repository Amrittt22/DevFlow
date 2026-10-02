import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date helpers (everything renders relative to "now" so the demo is fresh) ─

export const DAY = 86_400_000;

export function daysAgo(n: number, h = 10): string {
  const d = new Date(Date.now() - n * DAY);
  d.setHours(h, Math.floor(Math.random() * 50) + 5, 0, 0);
  return d.toISOString();
}

export function daysFromNow(n: number, h = 17): string {
  const d = new Date(Date.now() + n * DAY);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
}

export function isoDate(n: number): string {
  const d = new Date(Date.now() + n * DAY);
  return d.toISOString().slice(0, 10);
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function dueIn(iso?: string): { label: string; tone: 'overdue' | 'today' | 'soon' | 'later' | 'none' } {
  if (!iso) return { label: '', tone: 'none' };
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: 'overdue' };
  if (days === 0) return { label: 'Due today', tone: 'today' };
  if (days === 1) return { label: 'Due tomorrow', tone: 'soon' };
  if (days <= 4) return { label: `Due in ${days}d`, tone: 'soon' };
  return { label: `Due ${formatDate(iso)}`, tone: 'later' };
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Deterministic pseudo-random from a string seed (stable demo data). */
export function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
