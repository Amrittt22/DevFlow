import { ArrowDown, ArrowUp, Check, Flame, Minus } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Priority, TaskLabel, User } from '../lib/types';
import { PRIORITY_META } from '../lib/meta';
import { useAppStore } from '../store';
import { Avatar, Popover } from './ui';
import { cn } from '../lib/utils';

export function AssigneePicker({
  selected,
  onChange,
  trigger,
  projectMemberIds,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  trigger: ReactNode;
  projectMemberIds?: string[];
}) {
  const users = useAppStore((s) => s.users);
  const candidates = projectMemberIds ? users.filter((u) => projectMemberIds.includes(u.id)) : users;

  return (
    <Popover trigger={trigger} width="w-64">
      {() => (
        <div className="p-1">
          <p className="px-2.5 py-1.5 text-[10px] font-semibold tracking-widest text-ink3 uppercase">Assignees</p>
          {candidates.map((u: User) => {
            const isSel = selected.includes(u.id);
            return (
              <button
                key={u.id}
                onClick={() => onChange(isSel ? selected.filter((id) => id !== u.id) : [...selected, u.id])}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink2 transition-colors hover:bg-surface2 hover:text-ink cursor-pointer"
              >
                <Avatar name={u.name} color={u.color} size="sm" />
                <span className="min-w-0 flex-1 truncate">{u.name}</span>
                <span className="text-[10px] text-ink3">{u.handle}</span>
                {isSel && <Check className="h-3.5 w-3.5 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

export function LabelPicker({
  selected,
  onChange,
  trigger,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  trigger: ReactNode;
}) {
  const labels = useAppStore((s) => s.labels);

  return (
    <Popover trigger={trigger} width="w-60">
      {() => (
        <div className="p-1">
          <p className="px-2.5 py-1.5 text-[10px] font-semibold tracking-widest text-ink3 uppercase">Labels</p>
          {labels.map((l: TaskLabel) => {
            const isSel = selected.includes(l.id);
            return (
              <button
                key={l.id}
                onClick={() => onChange(isSel ? selected.filter((id) => id !== l.id) : [...selected, l.id])}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink2 transition-colors hover:bg-surface2 hover:text-ink cursor-pointer"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                <span className="flex-1 font-mono text-xs">{l.name}</span>
                {isSel && <Check className="h-3.5 w-3.5 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

const PRIORITY_ICONS: Record<Priority, ReactNode> = {
  urgent: <Flame className="h-3 w-3" />,
  high: <ArrowUp className="h-3 w-3" />,
  medium: <Minus className="h-3 w-3" />,
  low: <ArrowDown className="h-3 w-3" />,
};

export function PriorityChip({ priority }: { priority: Priority }) {
  const m = PRIORITY_META[priority];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold', m.chip)}>
      {PRIORITY_ICONS[priority]}
      {m.label}
    </span>
  );
}

export function AvatarGroup({ ids }: { ids: string[] }) {
  const users = useAppStore((s) => s.users);
  const list = ids.map((id) => users.find((u) => u.id === id)).filter(Boolean) as User[];
  if (list.length === 0) return null;
  return (
    <span className="flex items-center -space-x-1.5">
      {list.slice(0, 3).map((u) => (
        <Avatar key={u.id} name={u.name} color={u.color} size="xs" ring />
      ))}
      {list.length > 3 && (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface3 text-[8px] font-semibold text-ink2 ring-2 ring-surface">
          +{list.length - 3}
        </span>
      )}
    </span>
  );
}

export function LabelChips({ ids }: { ids: string[] }) {
  const labels = useAppStore((s) => s.labels);
  const list = ids.map((id) => labels.find((l) => l.id === id)).filter(Boolean) as TaskLabel[];
  if (list.length === 0) return null;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {list.slice(0, 4).map((l) => (
        <span
          key={l.id}
          className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
          style={{ background: `${l.color}1f`, color: l.color, border: `1px solid ${l.color}40` }}
        >
          {l.name}
        </span>
      ))}
      {list.length > 4 && <span className="text-[10px] text-ink3">+{list.length - 4}</span>}
    </span>
  );
}
