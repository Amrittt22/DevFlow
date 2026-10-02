import { motion } from 'framer-motion';
import {
  AlertCircle,
  AtSign,
  Bell,
  Check,
  CheckCheck,
  Clock,
  GitPullRequest,
  MessageSquare,
  UserPlus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Notification, NotificationType } from '../lib/types';
import { useAppStore } from '../store';
import { timeAgo } from '../lib/utils';
import { Button, Card, EmptyState, Eyebrow } from '../components/ui';
import { cn } from '../lib/utils';

const TYPE_ICON: Record<NotificationType, { icon: React.ReactNode; tint: string }> = {
  assignment: { icon: <UserPlus className="h-4 w-4" />, tint: 'bg-indigo-500/15 text-indigo-500' },
  mention: { icon: <AtSign className="h-4 w-4" />, tint: 'bg-violet-500/15 text-violet-500' },
  comment: { icon: <MessageSquare className="h-4 w-4" />, tint: 'bg-cyan-500/15 text-cyan-500' },
  pr: { icon: <GitPullRequest className="h-4 w-4" />, tint: 'bg-orange-500/15 text-orange-500' },
  deadline: { icon: <Clock className="h-4 w-4" />, tint: 'bg-amber-500/15 text-amber-500' },
  review: { icon: <AlertCircle className="h-4 w-4" />, tint: 'bg-rose-500/15 text-rose-500' },
};

export function Notifications() {
  const { notifications, markRead, markAllRead, tasks, issues } = useAppStore();
  const navigate = useNavigate();
  const [show, setShow] = useState<'all' | 'unread'>('all');

  const unread = notifications.filter((n) => !n.read).length;
  const filtered = useMemo(
    () => notifications.filter((n) => (show === 'unread' ? !n.read : true)),
    [notifications, show],
  );

  const openRef = (n: (typeof notifications)[number]) => {
    markRead(n.id);
    if (n.refType === 'task' && n.refId) {
      const task = tasks.find((t) => t.id === n.refId);
      if (task) return navigate(`/app/board?task=${task.key}`);
    }
    if (n.refType === 'issue' && n.refId) {
      const issue = issues.find((i) => i.id === n.refId);
      if (issue) return navigate(`/app/issues?issue=${issue.key}`);
    }
  };

  const groups = useMemo(() => {
    const today = filtered.filter((n) => Date.now() - new Date(n.createdAt).getTime() < 86400000);
    const earlier = filtered.filter((n) => Date.now() - new Date(n.createdAt).getTime() >= 86400000);
    return { today, earlier };
  }, [filtered]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[800px] px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="text-accent">Inbox</Eyebrow>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-ink">Notifications</h1>
          <p className="mt-1 text-sm text-ink3">Assignments, mentions, comments, PRs and deadlines.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border">
            {(['all', 'unread'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setShow(mode)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer',
                  show === mode ? 'bg-accent/15 text-accent' : 'text-ink3 hover:text-ink2',
                )}
              >
                {mode}
                {mode === 'unread' && unread > 0 && <span className="ml-1 font-mono text-[10px]">{unread}</span>}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="md" onClick={markAllRead} disabled={unread === 0}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      <div className="mt-5 space-y-6">
        {filtered.length === 0 && (
          <Card className="p-6">
            <EmptyState
              icon={<Bell className="h-5 w-5" />}
              title={show === 'unread' ? 'Inbox zero' : 'No notifications yet'}
              body="Mentions, assignments and PR events will land here in real time."
            />
          </Card>
        )}

        {groups.today.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold tracking-widest text-ink3 uppercase">Today</p>
            <Card className="divide-y divide-border overflow-hidden">
              {groups.today.map((n, i) => (
                <NotificationRow key={n.id} n={n} index={i} onOpen={() => openRef(n)} onMarkRead={() => markRead(n.id)} />
              ))}
            </Card>
          </div>
        )}

        {groups.earlier.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold tracking-widest text-ink3 uppercase">Earlier</p>
            <Card className="divide-y divide-border overflow-hidden">
              {groups.earlier.map((n, i) => (
                <NotificationRow key={n.id} n={n} index={i} onOpen={() => openRef(n)} onMarkRead={() => markRead(n.id)} />
              ))}
            </Card>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function NotificationRow({
  n,
  index,
  onOpen,
  onMarkRead,
}: {
  n: Notification;
  index: number;
  onOpen: () => void;
  onMarkRead: () => void;
}) {
  const meta = TYPE_ICON[n.type];
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.2), duration: 0.25 }}
      onClick={onOpen}
      className={cn(
        'group flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors cursor-pointer',
        !n.read ? 'bg-accent/[0.04] hover:bg-accent/[0.08]' : 'hover:bg-surface2/50',
      )}
    >
      <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', meta.tint)}>
        {meta.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn('truncate text-[13px]', n.read ? 'font-medium text-ink2' : 'font-semibold text-ink')}>
            {n.title}
          </span>
          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink2">{n.body}</span>
        <span className="mt-1 block font-mono text-[10px] text-ink3">{timeAgo(n.createdAt)}</span>
      </span>
      {n.read ? (
        <Check className="mt-2 h-3.5 w-3.5 shrink-0 text-ink3 opacity-0 transition-opacity group-hover:opacity-100" />
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead();
          }}
          title="Mark as read"
          className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border text-ink3 transition-colors hover:border-accent hover:text-accent cursor-pointer"
        >
          <Check className="h-3 w-3" />
        </button>
      )}
    </motion.button>
  );
}
