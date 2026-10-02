// Static Tailwind class maps for domain concepts.
// Classes are literal strings so Tailwind's scanner picks them up.

import type { ActivityType, IssueStatus, NotificationType, Priority, TaskStatus } from './types';

export const PRIORITY_META: Record<Priority, { label: string; chip: string; dot: string; bar: string; text: string }> = {
  urgent: { label: 'Urgent', chip: 'bg-rose-500/10 text-rose-500 border-rose-500/30', dot: 'bg-rose-500', bar: 'bg-rose-500', text: 'text-rose-500' },
  high: { label: 'High', chip: 'bg-orange-500/10 text-orange-500 border-orange-500/30', dot: 'bg-orange-500', bar: 'bg-orange-500', text: 'text-orange-500' },
  medium: { label: 'Medium', chip: 'bg-sky-500/10 text-sky-500 border-sky-500/30', dot: 'bg-sky-500', bar: 'bg-sky-500', text: 'text-sky-500' },
  low: { label: 'Low', chip: 'bg-slate-500/10 text-slate-400 border-slate-500/30', dot: 'bg-slate-400', bar: 'bg-slate-400', text: 'text-slate-400' },
};

export const STATUS_META: Record<TaskStatus, { label: string; dot: string; text: string; columnAccent: string }> = {
  todo: { label: 'To Do', dot: 'bg-slate-400', text: 'text-slate-400', columnAccent: 'bg-slate-400' },
  in_progress: { label: 'In Progress', dot: 'bg-indigo-500', text: 'text-indigo-500', columnAccent: 'bg-indigo-500' },
  review: { label: 'In Review', dot: 'bg-amber-500', text: 'text-amber-500', columnAccent: 'bg-amber-500' },
  done: { label: 'Done', dot: 'bg-emerald-500', text: 'text-emerald-500', columnAccent: 'bg-emerald-500' },
};

export const ISSUE_STATUS_META: Record<IssueStatus, { label: string; chip: string }> = {
  open: { label: 'Open', chip: 'bg-rose-500/10 text-rose-500 border-rose-500/30' },
  in_progress: { label: 'In Progress', chip: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  closed: { label: 'Closed', chip: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
};

export const NOTIFICATION_META: Record<NotificationType, { label: string }> = {
  assignment: { label: 'Assignment' },
  mention: { label: 'Mention' },
  comment: { label: 'Comment' },
  pr: { label: 'Pull request' },
  deadline: { label: 'Deadline' },
  review: { label: 'Review requested' },
};

export const ACTIVITY_ICON: Record<ActivityType, string> = {
  task_created: 'Plus',
  task_moved: 'ArrowRight',
  task_assigned: 'UserPlus',
  comment: 'MessageSquare',
  issue_created: 'AlertCircle',
  issue_closed: 'CheckCircle',
  pr_opened: 'GitPullRequest',
  pr_merged: 'GitMerge',
  commit: 'GitCommit',
  sprint_started: 'Rocket',
  sprint_completed: 'Trophy',
  member_joined: 'UserPlus',
  label_added: 'Tag',
};
