import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  GitCommit,
  GitMerge,
  GitPullRequest,
  MessageSquare,
  Plus,
  Rocket,
  Tag,
  Trophy,
  UserPlus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityType } from '../lib/types';
import { useAppStore, useCurrentProject, useProjectActivity } from '../store';
import { timeAgo } from '../lib/utils';
import { Avatar, Card, EmptyState, Eyebrow } from '../components/ui';
import { cn } from '../lib/utils';

const TYPE_META: Record<ActivityType, { icon: React.ReactNode; tint: string }> = {
  task_created: { icon: <Plus className="h-3.5 w-3.5" />, tint: 'bg-indigo-500/10 text-indigo-500' },
  task_moved: { icon: <ArrowRight className="h-3.5 w-3.5" />, tint: 'bg-sky-500/10 text-sky-500' },
  task_assigned: { icon: <UserPlus className="h-3.5 w-3.5" />, tint: 'bg-violet-500/10 text-violet-500' },
  comment: { icon: <MessageSquare className="h-3.5 w-3.5" />, tint: 'bg-cyan-500/10 text-cyan-500' },
  issue_created: { icon: <AlertCircle className="h-3.5 w-3.5" />, tint: 'bg-rose-500/10 text-rose-500' },
  issue_closed: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, tint: 'bg-emerald-500/10 text-emerald-500' },
  pr_opened: { icon: <GitPullRequest className="h-3.5 w-3.5" />, tint: 'bg-orange-500/10 text-orange-500' },
  pr_merged: { icon: <GitMerge className="h-3.5 w-3.5" />, tint: 'bg-violet-500/10 text-violet-500' },
  commit: { icon: <GitCommit className="h-3.5 w-3.5" />, tint: 'bg-slate-500/10 text-slate-400' },
  sprint_started: { icon: <Rocket className="h-3.5 w-3.5" />, tint: 'bg-indigo-500/10 text-indigo-500' },
  sprint_completed: { icon: <Trophy className="h-3.5 w-3.5" />, tint: 'bg-amber-500/10 text-amber-500' },
  member_joined: { icon: <UserPlus className="h-3.5 w-3.5" />, tint: 'bg-emerald-500/10 text-emerald-500' },
  label_added: { icon: <Tag className="h-3.5 w-3.5" />, tint: 'bg-pink-500/10 text-pink-500' },
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'task', label: 'Tasks' },
  { id: 'issue', label: 'Issues' },
  { id: 'pr', label: 'Pull requests' },
  { id: 'sprint', label: 'Sprints' },
  { id: 'social', label: 'Comments & people' },
] as const;

export function Activity() {
  const project = useCurrentProject();
  const activities = useProjectActivity();
  const users = useAppStore((s) => s.users);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [actorFilter, setActorFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (actorFilter && a.actorId !== actorFilter) return false;
      if (filter === 'all') return true;
      if (filter === 'task') return ['task_created', 'task_moved', 'task_assigned'].includes(a.type);
      if (filter === 'issue') return ['issue_created', 'issue_closed'].includes(a.type);
      if (filter === 'pr') return ['pr_opened', 'pr_merged'].includes(a.type);
      if (filter === 'sprint') return ['sprint_started', 'sprint_completed'].includes(a.type);
      if (filter === 'social') return ['comment', 'member_joined', 'label_added'].includes(a.type);
      return true;
    });
  }, [activities, filter, actorFilter]);

  const contributors = useMemo(() => {
    const seen = new Map<string, number>();
    for (const a of activities) seen.set(a.actorId, (seen.get(a.actorId) ?? 0) + 1);
    return [...seen.entries()]
      .map(([id, count]) => ({ user: users.find((u) => u.id === id), count }))
      .filter((x) => x.user)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [activities, users]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-250 px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="text-accent">Audit trail</Eyebrow>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-ink">Activity</h1>
          <p className="mt-1 text-sm text-ink3">
            Everything happening in {project?.name} — assignments, status changes, PR events and more.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              filter === f.id
                ? 'border-accent/50 bg-accent/15 text-accent'
                : 'border-border bg-surface text-ink2 hover:bg-surface2',
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
        <div className="flex flex-wrap items-center gap-1.5">
          {contributors.map(({ user, count }) =>
            user ? (
              <button
                key={user.id}
                onClick={() => setActorFilter(actorFilter === user.id ? null : user.id)}
                title={`${user.name} — ${count} events`}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-1 text-[11px] font-medium transition-all cursor-pointer',
                  actorFilter === user.id
                    ? 'border-accent/50 bg-accent/15 text-accent'
                    : 'border-border bg-surface text-ink2 hover:bg-surface2',
                )}
              >
                <Avatar name={user.name} color={user.color} size="xs" />
                {user.name.split(' ')[0]}
                <span className="font-mono text-[9px] text-ink3">{count}</span>
              </button>
            ) : null,
          )}
        </div>
      </div>

      {/* Feed */}
      <Card className="mt-4 p-5">
        {filtered.length === 0 ? (
          <EmptyState icon={<CircleDot className="h-5 w-5" />} title="Nothing here yet" body="Try a different filter — activity appears here as your team works." />
        ) : (
          <div className="relative space-y-5 pl-1">
            <span className="absolute top-2 bottom-2 left-4.25 w-px bg-border" />
            {filtered.map((a, i) => {
              const actor = users.find((u) => u.id === a.actorId);
              const meta = TYPE_META[a.type];
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.25 }}
                  className="relative flex gap-3.5"
                >
                  <span className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-surface', meta.tint)}>
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] leading-relaxed text-ink2">
                      <span className="font-semibold text-ink">{actor?.name}</span> {a.message}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-ink3">{timeAgo(a.createdAt)}</p>
                  </div>
                  {a.entityRef && (
                    <button
                      onClick={() => navigate(`/app/board?task=${a.entityRef}`)}
                      className="h-fit rounded-md border border-border bg-surface2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent transition-colors hover:bg-accent/10 cursor-pointer"
                    >
                      {a.entityRef}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
