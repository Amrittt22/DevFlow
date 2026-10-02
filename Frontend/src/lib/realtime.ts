// ─── Simulated realtime layer ──────────────────────────────────────────────────
// Stands in for the Socket.IO gateway from spec §10. Emits realistic teammate
// events (task moves, comments, PR activity) on an interval so the UI demo
// showcases live collaboration: toasts, activity entries, notification badges.

import type { Activity, Notification, TaskStatus } from '\./types';
import { daysAgo } from '\./utils';

export interface RealtimeEvent {
  kind: 'task_moved' | 'comment' | 'pr_opened' | 'mention';
  actorId: string;
  message: string;
  entityRef?: string;
  refId?: string;
  refType?: 'task' | 'issue';
  notification?: { title: string; body: string };
  statusChange?: { taskId: string; status: TaskStatus };
}

const ACTORS = ['u_marcus', 'u_priya', 'u_jordan', 'u_david', 'u_sofia'];

const TASK_IDS = ['t_17', 't_18', 't_19', 't_21', 't_22', 't_14', 't_15'];

const COMMENT_SNIPPETS = [
  'Pushed an update — can someone take a look when free?',
  'Reproduced on my end. Narrowing down the collision math.',
  'Updated the test coverage for the happy path.',
  'Quick question: should this also invalidate the cache?',
  'LGTM apart from one naming nit. Left a comment on the diff.',
  'This unblocks the sprint goal, nice work.',
];

const PR_TITLES = [
  'feat(board): column collapse toggle',
  'fix(api): pagination cursor off-by-one',
  'chore(deps): bump prisma to 6.x',
  'feat(sprint): velocity trend sparkline',
];

let seq = 0;

export function makeRealtimeEvent(): RealtimeEvent {
  const rnd = Math.random();
  const actor = ACTORS[Math.floor(Math.random() * ACTORS.length)];
  seq += 1;

  if (rnd < 0.34) {
    // A teammate moves a task between columns.
    const taskId = TASK_IDS[Math.floor(Math.random() * TASK_IDS.length)];
    const status: TaskStatus = Math.random() < 0.5 ? 'in_progress' : 'review';
    return {
      kind: 'task_moved',
      actorId: actor,
      message: `moved a task to ${status === 'in_progress' ? 'In Progress' : 'In Review'}`,
      entityRef: undefined,
      statusChange: { taskId, status },
      notification: { title: 'Board updated', body: 'A task was moved on the board.' },
    };
  }
  if (rnd < 0.68) {
    const taskId = TASK_IDS[Math.floor(Math.random() * TASK_IDS.length)];
    return {
      kind: 'comment',
      actorId: actor,
      message: 'commented on a task',
      refId: taskId,
      refType: 'task',
      notification: {
        title: 'New comment',
        body: COMMENT_SNIPPETS[Math.floor(Math.random() * COMMENT_SNIPPETS.length)],
      },
    };
  }
  if (rnd < 0.9) {
    const title = PR_TITLES[Math.floor(Math.random() * PR_TITLES.length)];
    return {
      kind: 'pr_opened',
      actorId: actor,
      message: `opened PR ${222 + seq} ${title}`,
      notification: { title: 'New pull request', body: `${title}` },
    };
  }
  return {
    kind: 'mention',
    actorId: 'u_sofia',
    message: 'mentioned you in a comment',
    refId: 't_12',
    refType: 'task',
    notification: {
      title: 'Sofia Reyes mentioned you',
      body: '@amritanshu got a sec to review the burndown data?',
    },
  };
}

export function eventToActivity(e: RealtimeEvent, projectId: string): Activity {
  return {
    id: `rt_${Date.now()}_${seq}`,
    projectId,
    type: e.kind === 'task_moved' ? 'task_moved' : e.kind === 'comment' ? 'comment' : e.kind === 'pr_opened' ? 'pr_opened' : 'comment',
    actorId: e.actorId,
    message: e.message,
    entityRef: e.entityRef,
    createdAt: new Date().toISOString(),
  };
}

export function eventToNotification(e: RealtimeEvent, projectId: string): Notification | null {
  if (!e.notification) return null;
  return {
    id: `rt_n_${Date.now()}_${seq}`,
    type: e.kind === 'mention' ? 'mention' : e.kind === 'pr_opened' ? 'pr' : e.kind === 'comment' ? 'comment' : 'assignment',
    title: e.notification.title,
    body: e.notification.body,
    refId: e.refId,
    refType: e.refType,
    projectId,
    read: false,
    createdAt: daysAgo(0, new Date().getHours()),
  };
}
