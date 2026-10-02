// ─── DevFlow seed data ─────────────────────────────────────────────────────────
// Curated, realistic dataset for the demo workspace. Dates are generated relative
// to "now" so the demo always looks live.

import type {
  Activity,
  Attachment,
  Comment,
  GitHubData,
  Issue,
  Notification,
  Project,
  Sprint,
  Task,
  TaskLabel,
  User,
  Workspace,
} from '../types';
import { DAY, daysAgo, isoDate, seededRandom } from '../utils';

// ─── Users ─────────────────────────────────────────────────────────────────────

export const USERS: User[] = [
  { id: 'u_amrit', name: 'Amritanshu', handle: 'amritanshu', email: 'amritanshu@devflow.io', title: 'Full-Stack Developer', color: '#6366f1', role: 'developer', online: true },
  { id: 'u_sofia', name: 'Sofia Reyes', handle: 'sofia', email: 'sofia@devflow.io', title: 'Project Manager', color: '#f43f5e', role: 'pm', online: true },
  { id: 'u_marcus', name: 'Marcus Chen', handle: 'marcus', email: 'marcus@devflow.io', title: 'Frontend Developer', color: '#06b6d4', role: 'developer', online: true },
  { id: 'u_priya', name: 'Priya Sharma', handle: 'priya', email: 'priya@devflow.io', title: 'Backend Developer', color: '#f59e0b', role: 'developer', online: false },
  { id: 'u_jordan', name: 'Jordan Lee', handle: 'jordan', email: 'jordan@devflow.io', title: 'Platform Engineer', color: '#10b981', role: 'developer', online: true },
  { id: 'u_elena', name: 'Elena Volkov', handle: 'elena', email: 'elena@devflow.io', title: 'Product Designer', color: '#8b5cf6', role: 'admin', online: false },
  { id: 'u_david', name: 'David Okafor', handle: 'david', email: 'david@devflow.io', title: 'Backend Developer', color: '#3b82f6', role: 'developer', online: true },
  { id: 'u_lena', name: 'Lena Fischer', handle: 'lena', email: 'lena@devflow.io', title: 'Workspace Admin', color: '#ec4899', role: 'admin', online: false },
];

export const CURRENT_USER_ID = 'u_amrit';

// ─── Workspaces & projects ─────────────────────────────────────────────────────

export const WORKSPACES: Workspace[] = [
  { id: 'ws_devflow', name: 'DevFlow Labs', plan: 'Pro', initials: 'DF', color: '#6366f1', memberIds: USERS.map((u) => u.id) },
  { id: 'ws_oss', name: 'Open Source', plan: 'Free', initials: 'OS', color: '#10b981', memberIds: ['u_amrit', 'u_jordan', 'u_marcus'] },
];

export const PROJECTS: Project[] = [
  {
    id: 'p_df',
    workspaceId: 'ws_devflow',
    name: 'DevFlow App',
    key: 'DF',
    description: 'Core web platform — workspaces, Kanban boards, sprints, GitHub sync and engineering analytics.',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #a855f7)',
    memberIds: USERS.map((u) => u.id),
    githubRepo: 'devflow/devflow',
  },
  {
    id: 'p_ma',
    workspaceId: 'ws_devflow',
    name: 'Mobile App',
    key: 'MA',
    description: 'React Native companion app for on-call alerts and quick task triage.',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    memberIds: ['u_amrit', 'u_sofia', 'u_jordan', 'u_david'],
    githubRepo: 'devflow/mobile',
  },
  {
    id: 'p_ds',
    workspaceId: 'ws_devflow',
    name: 'Design System',
    key: 'DS',
    description: 'Tokens, components and accessibility guidelines shared across products.',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #f43f5e)',
    memberIds: ['u_elena', 'u_amrit', 'u_marcus'],
  },
  {
    id: 'p_cli',
    workspaceId: 'ws_oss',
    name: 'devflow-cli',
    key: 'CLI',
    description: 'Terminal client for DevFlow — create tasks, view boards and post updates from the shell.',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    memberIds: ['u_amrit', 'u_jordan', 'u_marcus'],
    githubRepo: 'devflow/devflow-cli',
  },
];

// ─── Labels ────────────────────────────────────────────────────────────────────

export const LABELS: TaskLabel[] = [
  { id: 'l_bug', name: 'bug', color: '#f43f5e' },
  { id: 'l_feature', name: 'feature', color: '#6366f1' },
  { id: 'l_improvement', name: 'improvement', color: '#06b6d4' },
  { id: 'l_design', name: 'design', color: '#a855f7' },
  { id: 'l_docs', name: 'docs', color: '#f59e0b' },
  { id: 'l_devops', name: 'devops', color: '#10b981' },
  { id: 'l_perf', name: 'performance', color: '#fb923c' },
  { id: 'l_security', name: 'security', color: '#ef4444' },
  { id: 'l_research', name: 'research', color: '#ec4899' },
];

// ─── Sprints ───────────────────────────────────────────────────────────────────

// `startOffset` is the sprint start in days relative to today; `completedThrough`
// is how many days of actual data to plot (the sprint's elapsed days so far).
function burndown(total: number, days: number, seed: string, completedThrough: number, startOffset: number) {
  const rnd = seededRandom(seed);
  const pts: { day: string; ideal: number; actual: number | null }[] = [];
  for (let i = 0; i <= days; i++) {
    const date = new Date(Date.now() + (startOffset + i) * DAY);
    pts.push({
      day: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      ideal: Math.round((total * (days - i)) / days),
      actual:
        i <= completedThrough
          ? Math.max(0, Math.round(total - (total / days) * i - rnd() * total * 0.16 + (rnd() - 0.4) * total * 0.05))
          : null,
    });
  }
  return pts;
}

export const SPRINTS: Sprint[] = [
  {
    id: 's_11',
    projectId: 'p_df',
    name: 'Sprint 11',
    goal: 'Stabilise auth flows and ship project switching',
    startDate: isoDate(-32),
    endDate: isoDate(-18),
    status: 'completed',
    velocity: 34,
    totalPoints: 38,
    burndown: burndown(38, 14, 'sprint-11', 14, -32),
  },
  {
    id: 's_12',
    projectId: 'p_df',
    name: 'Sprint 12',
    goal: 'Kanban foundations: drag & drop, filters and inline create',
    startDate: isoDate(-18),
    endDate: isoDate(-4),
    status: 'completed',
    velocity: 41,
    totalPoints: 44,
    burndown: burndown(44, 14, 'sprint-12', 14, -18),
  },
  {
    id: 's_13',
    projectId: 'p_df',
    name: 'Sprint 13',
    goal: 'Realtime collaboration layer and notification pipeline',
    startDate: isoDate(-4),
    endDate: isoDate(10),
    status: 'active',
    totalPoints: 64,
    burndown: burndown(64, 14, 'sprint-13', 4, -4),
  },
  {
    id: 's_14',
    projectId: 'p_df',
    name: 'Sprint 14',
    goal: 'GitHub deep integration — PRs, webhooks, commit intelligence',
    startDate: isoDate(10),
    endDate: isoDate(24),
    status: 'planned',
    totalPoints: 46,
    burndown: burndown(46, 14, 'sprint-14', -1, 10),
  },
];

// ─── Tasks (DevFlow App, key DF) ───────────────────────────────────────────────

let orderCounter = 0;
const nextOrder = () => ++orderCounter;

export const TASKS: Task[] = [
  // ── DONE ──
  {
    id: 't_1', projectId: 'p_df', key: 'DF-1', title: 'Project scaffolding: Vite + React + TypeScript + Tailwind',
    description: 'Bootstrap the DevFlow web client with Vite, React 19, TypeScript strict mode and Tailwind CSS v4. Configure ESLint, Prettier, path aliases and the design-token pipeline so every future PR starts from a consistent baseline.',
    status: 'done', priority: 'high', assigneeIds: ['u_amrit'], labelIds: ['l_devops'],
    sprintId: 's_11', points: 5, reporterId: 'u_lena', createdAt: daysAgo(26, 9), updatedAt: daysAgo(22, 16), order: nextOrder(),
  },
  {
    id: 't_2', projectId: 'p_df', key: 'DF-2', title: 'PostgreSQL schema + Prisma models for core entities',
    description: 'Model User, Workspace, WorkspaceMember, Project, ProjectMember, Task, TaskLabel, Issue, Comment, Attachment, Sprint, Notification, Activity, GitHubAccount, GitHubRepository, PullRequest and WebhookEvent. Add indexes for the hot query paths: tasks by project+status, issues by project+status, activity by project+createdAt.',
    status: 'done', priority: 'urgent', assigneeIds: ['u_david'], labelIds: ['l_feature'],
    sprintId: 's_11', points: 8, reporterId: 'u_lena', createdAt: daysAgo(26, 10), updatedAt: daysAgo(21, 11), order: nextOrder(),
  },
  {
    id: 't_3', projectId: 'p_df', key: 'DF-3', title: 'Workspace & project CRUD APIs with RBAC guards',
    description: 'Thin controllers over service layer: create/read/update/delete workspaces and projects, membership management with admin + pm roles. All responses paginated and wrapped in the standard envelope; every mutation writes an Activity row.',
    status: 'done', priority: 'high', assigneeIds: ['u_marcus'], labelIds: ['l_feature'],
    sprintId: 's_11', points: 5, reporterId: 'u_lena', createdAt: daysAgo(25, 9), updatedAt: daysAgo(20, 15), order: nextOrder(),
  },
  {
    id: 't_4', projectId: 'p_df', key: 'DF-4', title: 'Task model with status, priority, labels and ordering',
    description: 'Task entity with the full field set from the spec: title, description, status, priority, assignees, labels, due date, sprint, points, comments, attachments and activity history. Float-based ordering within a column so drag-and-drop reordering stays conflict-free.',
    status: 'done', priority: 'urgent', assigneeIds: ['u_amrit'], labelIds: ['l_feature'],
    sprintId: 's_12', points: 8, reporterId: 'u_sofia', createdAt: daysAgo(13, 9), updatedAt: daysAgo(9, 17), order: nextOrder(),
  },
  {
    id: 't_5', projectId: 'p_df', key: 'DF-5', title: 'Design tokens and dark/light theme system',
    description: 'Semantic color tokens (bg, surface, ink, accent, status hues) defined as CSS variables, switched via a .dark class on the root. Includes typography scale, elevation shadows and focus rings. Light theme is a first-class citizen, not an afterthought.',
    status: 'done', priority: 'medium', assigneeIds: ['u_elena'], labelIds: ['l_design'],
    sprintId: 's_12', points: 3, reporterId: 'u_lena', createdAt: daysAgo(12, 10), updatedAt: daysAgo(8, 14), order: nextOrder(),
  },
  {
    id: 't_6', projectId: 'p_df', key: 'DF-6', title: 'CI pipeline: lint, typecheck, unit + API tests',
    description: 'GitHub Actions workflow running on every push: eslint, tsc --noEmit, vitest unit tests and supertest API integration tests against an ephemeral Postgres container. Branch protection requires green checks before merge.',
    status: 'done', priority: 'high', assigneeIds: ['u_jordan'], labelIds: ['l_devops'],
    sprintId: 's_12', points: 5, reporterId: 'u_lena', createdAt: daysAgo(12, 11), updatedAt: daysAgo(7, 16), order: nextOrder(),
  },
  {
    id: 't_7', projectId: 'p_df', key: 'DF-7', title: 'Sprint planning UI mockups',
    description: 'Mid-fidelity mockups for sprint overview, burndown, velocity and backlog grooming. Explored three burndown variants; landed on ideal-vs-actual with point labels on hover. Shared in Figma and approved by the PM.',
    status: 'done', priority: 'medium', assigneeIds: ['u_elena'], labelIds: ['l_design'],
    sprintId: 's_11', points: 3, reporterId: 'u_sofia', createdAt: daysAgo(24, 9), updatedAt: daysAgo(19, 13), order: nextOrder(),
  },
  {
    id: 't_60', projectId: 'p_df', key: 'DF-13', title: 'Socket.IO gateway with presence channels',
    description: 'Standalone realtime gateway: one namespace per workspace, rooms per project, presence channel for online members and per-task view counters. Horizontal scaling via the Redis adapter so multiple gateway instances stay in sync.',
    status: 'done', priority: 'high', assigneeIds: ['u_jordan'], labelIds: ['l_feature'],
    sprintId: 's_13', points: 8, reporterId: 'u_sofia', createdAt: daysAgo(4, 9), updatedAt: daysAgo(1, 16), order: nextOrder(),
  },
  {
    id: 't_61', projectId: 'p_df', key: 'DF-14', title: 'Notification pipeline worker (in-app + email)',
    description: 'Fan-out worker that turns realtime events into per-user notifications, applies digest rules and quiet hours, and dispatches email through the provider with retry and dead-letter handling.',
    status: 'done', priority: 'high', assigneeIds: ['u_priya'], labelIds: ['l_feature'],
    sprintId: 's_13', points: 5, reporterId: 'u_sofia', createdAt: daysAgo(4, 10), updatedAt: daysAgo(2, 15), order: nextOrder(),
  },

  // ── REVIEW ──
  {
    id: 't_8', projectId: 'p_df', key: 'DF-9', title: 'Zod validation schemas for task endpoints',
    description: 'Shared zod schemas for create/update task payloads. Validates priority enum, due date is future-dated, assignees exist in the project, and label ids belong to the workspace. Bad requests return a 422 with a field-level error map.',
    status: 'review', priority: 'medium', assigneeIds: ['u_amrit'], labelIds: ['l_feature'],
    sprintId: 's_13', points: 3, reporterId: 'u_david', createdAt: daysAgo(4, 10), updatedAt: daysAgo(1, 9), order: nextOrder(),
  },
  {
    id: 't_9', projectId: 'p_df', key: 'DF-10', title: 'Kanban column inline add-task form',
    description: 'Quick-add input pinned to the bottom of each column. Enter creates the task with sensible defaults (reporter = current user, no assignee, priority medium) and moves focus back to the input so you can rapid-fire several cards.',
    status: 'review', priority: 'low', assigneeIds: ['u_marcus'], labelIds: ['l_improvement'],
    sprintId: 's_13', points: 2, reporterId: 'u_sofia', createdAt: daysAgo(3, 11), updatedAt: daysAgo(0, 8), order: nextOrder(),
  },
  {
    id: 't_10', projectId: 'p_df', key: 'DF-11', title: 'Activity feed aggregator service',
    description: 'Server-side service that folds task moves, assignment changes, comments, issue events, PR events and webhook deliveries into a single activity stream per project. Dedupes rapid-fire events (e.g. status flapping) into one entry with a count.',
    status: 'review', priority: 'high', assigneeIds: ['u_priya'], labelIds: ['l_feature'],
    sprintId: 's_13', points: 5, reporterId: 'u_sofia', createdAt: daysAgo(5, 9), updatedAt: daysAgo(0, 10), order: nextOrder(),
  },
  {
    id: 't_11', projectId: 'p_df', key: 'DF-12', title: 'Link DevFlow issues to GitHub pull requests',
    description: 'Bidirectional linking: a PR body containing "Closes IS-4" links the PR to the issue, and the issue detail shows the PR with its check status. Webhook handler is idempotent on PR event ids.',
    status: 'review', priority: 'medium', assigneeIds: ['u_david'], labelIds: ['l_feature'],
    sprintId: 's_13', points: 5, reporterId: 'u_jordan', createdAt: daysAgo(6, 10), updatedAt: daysAgo(1, 15), order: nextOrder(),
  },

  // ── IN PROGRESS ──
  {
    id: 't_12', projectId: 'p_df', key: 'DF-15', title: 'Implement drag-and-drop Kanban with @dnd-kit',
    description: 'Multi-column sortable board using @dnd-kit/core + sortable with a custom DragOverlay. Pointer activation distance of 6px so clicks still open the card. Cross-column drops update the task status optimistically, then persist through the API — other clients receive the change over the socket.',
    status: 'in_progress', priority: 'high', assigneeIds: ['u_amrit'], labelIds: ['l_feature'],
    dueDate: isoDate(0), sprintId: 's_13', points: 8, reporterId: 'u_sofia', createdAt: daysAgo(7, 9), updatedAt: daysAgo(0, 11), order: nextOrder(),
  },
  {
    id: 't_13', projectId: 'p_df', key: 'DF-16', title: 'Supabase auth: magic link + GitHub OAuth',
    description: 'Sign-in with email magic link (Supabase Auth) and GitHub OAuth. Session handled by a refresh-token rotation cookie; the /auth/callback route exchanges the code and redirects to the workspace the user last visited.',
    status: 'in_progress', priority: 'urgent', assigneeIds: ['u_marcus'], labelIds: ['l_feature', 'l_security'],
    dueDate: isoDate(1), sprintId: 's_13', points: 8, reporterId: 'u_lena', createdAt: daysAgo(8, 9), updatedAt: daysAgo(0, 12), order: nextOrder(),
  },
  {
    id: 't_14', projectId: 'p_df', key: 'DF-17', title: 'Task detail slide-over with comments thread',
    description: 'Right-side slide-over panel for a task: editable status/priority/assignees/labels/due date, description, attachment list and the comment thread. Deep-linkable via ?task=DF-15 so links from the activity feed land directly on the card.',
    status: 'in_progress', priority: 'medium', assigneeIds: ['u_priya'], labelIds: ['l_feature'],
    dueDate: isoDate(2), sprintId: 's_13', points: 5, reporterId: 'u_sofia', createdAt: daysAgo(6, 10), updatedAt: daysAgo(0, 9), order: nextOrder(),
  },
  {
    id: 't_15', projectId: 'p_df', key: 'DF-18', title: 'Realtime presence indicators on task cards',
    description: 'Show a small stack of avatars on cards currently being viewed by teammates, powered by the presence channel of the Socket.IO gateway. Throttled to one event per 5s per client to keep the fan-out cheap.',
    status: 'in_progress', priority: 'medium', assigneeIds: ['u_jordan'], labelIds: ['l_improvement'],
    sprintId: 's_13', points: 3, reporterId: 'u_sofia', createdAt: daysAgo(5, 9), updatedAt: daysAgo(1, 10), order: nextOrder(),
  },
  {
    id: 't_16', projectId: 'p_df', key: 'DF-20', title: 'Prisma schema for WorkspaceMember RBAC',
    description: 'WorkspaceMember and ProjectMember carry a Role enum (ADMIN, PM, DEVELOPER). Policy helpers resolve the effective role for a user on any resource; services call can(user, action, resource) before every mutation.',
    status: 'in_progress', priority: 'high', assigneeIds: ['u_david'], labelIds: ['l_feature', 'l_security'],
    sprintId: 's_13', points: 3, reporterId: 'u_lena', createdAt: daysAgo(4, 9), updatedAt: daysAgo(0, 7), order: nextOrder(),
  },

  // ── TODO ──
  {
    id: 't_17', projectId: 'p_df', key: 'DF-24', title: 'Redis cache-aside layer for project queries',
    description: 'Cache project, sprint and board reads with a cache-aside pattern: 60s TTL, stampeded prevention via short-lived locks, and explicit invalidation on writes. Track hit ratio in the analytics pipeline.',
    status: 'todo', priority: 'high', assigneeIds: ['u_priya', 'u_amrit'], labelIds: ['l_perf'],
    dueDate: isoDate(2), sprintId: 's_13', points: 5, reporterId: 'u_jordan', createdAt: daysAgo(2, 9), updatedAt: daysAgo(2, 9), order: nextOrder(),
  },
  {
    id: 't_18', projectId: 'p_df', key: 'DF-25', title: 'Burndown chart accessibility pass',
    description: 'Add keyboard-focusable data points, aria-labels for each burndown sample and a sr-only data table fallback for the chart. Verify contrast ratios for the ideal vs actual lines in both themes.',
    status: 'todo', priority: 'medium', assigneeIds: ['u_marcus'], labelIds: ['l_design', 'l_improvement'],
    sprintId: 's_13', points: 2, reporterId: 'u_elena', createdAt: daysAgo(2, 10), updatedAt: daysAgo(2, 10), order: nextOrder(),
  },
  {
    id: 't_19', projectId: 'p_df', key: 'DF-26', title: 'Design empty states for Issues page',
    description: 'Empty states for: no issues, no matching filters, and all issues closed. Use the dot-grid motif from the marketing site and a single primary action. Exports as Figma components for the design system.',
    status: 'todo', priority: 'low', assigneeIds: ['u_elena'], labelIds: ['l_design'],
    sprintId: 's_13', points: 2, reporterId: 'u_sofia', createdAt: daysAgo(1, 9), updatedAt: daysAgo(1, 9), order: nextOrder(),
  },
  {
    id: 't_20', projectId: 'p_df', key: 'DF-27', title: 'Webhook signature verification for GitHub events',
    description: 'Verify the X-Hub-Signature-256 HMAC on every inbound GitHub webhook using the per-repo secret. Reject with 401 before any parsing; retry with exponential backoff on handler failure; make delivery idempotent via the GitHub delivery id.',
    status: 'todo', priority: 'urgent', assigneeIds: ['u_david'], labelIds: ['l_security'],
    dueDate: isoDate(1), sprintId: 's_14', points: 5, reporterId: 'u_lena', createdAt: daysAgo(1, 10), updatedAt: daysAgo(1, 10), order: nextOrder(),
  },
  {
    id: 't_21', projectId: 'p_df', key: 'DF-28', title: 'Keyboard shortcut overlay (? key)',
    description: 'Press ? to open a searchable shortcut cheat-sheet. Register shortcuts on a global hotkey registry so pages can declare their own and nothing conflicts. Support vim-style j/k navigation in the board.',
    status: 'todo', priority: 'low', assigneeIds: ['u_jordan'], labelIds: ['l_improvement'],
    sprintId: 's_14', points: 3, reporterId: 'u_amrit', createdAt: daysAgo(1, 11), updatedAt: daysAgo(1, 11), order: nextOrder(),
  },
  {
    id: 't_22', projectId: 'p_df', key: 'DF-29', title: 'Sliding-window rate limiter middleware',
    description: 'Express middleware backed by a Redis sorted set: 120 req/min per user, 10 req/min per IP on auth endpoints. Returns 429 with Retry-After. Sliding window avoids the boundary burst of fixed windows.',
    status: 'todo', priority: 'high', assigneeIds: ['u_amrit'], labelIds: ['l_perf', 'l_security'],
    dueDate: isoDate(3), sprintId: 's_14', points: 5, reporterId: 'u_jordan', createdAt: daysAgo(0, 9), updatedAt: daysAgo(0, 9), order: nextOrder(),
  },

  // ── Mobile App project (lighter set) ──
  {
    id: 't_30', projectId: 'p_ma', key: 'MA-3', title: 'Push notification deep links',
    description: 'Tapping a push notification opens the exact task in the mobile app, including offline queueing when the device is unreachable.',
    status: 'in_progress', priority: 'high', assigneeIds: ['u_jordan'], labelIds: ['l_feature'],
    dueDate: isoDate(2), sprintId: undefined, points: 5, reporterId: 'u_sofia', createdAt: daysAgo(3, 9), updatedAt: daysAgo(0, 8), order: nextOrder(),
  },
  {
    id: 't_31', projectId: 'p_ma', key: 'MA-4', title: 'Offline queue for task status changes',
    description: 'Persist pending mutations in SQLite and replay when connectivity returns, with conflict resolution favouring last-write-wins on status.',
    status: 'todo', priority: 'medium', assigneeIds: ['u_david'], labelIds: ['l_feature'],
    sprintId: undefined, points: 8, reporterId: 'u_sofia', createdAt: daysAgo(2, 9), updatedAt: daysAgo(2, 9), order: nextOrder(),
  },
  {
    id: 't_32', projectId: 'p_ma', key: 'MA-1', title: 'App icon and splash screens',
    description: 'Final assets for iOS and Android in all required densities.',
    status: 'done', priority: 'medium', assigneeIds: ['u_elena'], labelIds: ['l_design'],
    sprintId: undefined, points: 2, reporterId: 'u_lena', createdAt: daysAgo(9, 9), updatedAt: daysAgo(6, 9), order: nextOrder(),
  },

  // ── Design System project ──
  {
    id: 't_40', projectId: 'p_ds', key: 'DS-7', title: 'Button variants audit',
    description: 'Consolidate the 14 button variants into a documented 6-variant API with size and tone scales.',
    status: 'in_progress', priority: 'medium', assigneeIds: ['u_elena', 'u_amrit'], labelIds: ['l_design'],
    sprintId: undefined, points: 3, reporterId: 'u_lena', createdAt: daysAgo(4, 9), updatedAt: daysAgo(1, 9), order: nextOrder(),
  },
  {
    id: 't_41', projectId: 'p_ds', key: 'DS-9', title: 'Color contrast audit (WCAG AA)',
    description: 'Automated contrast check across all token pairs in both themes; file issues for every failure.',
    status: 'todo', priority: 'high', assigneeIds: ['u_elena'], labelIds: ['l_design'],
    sprintId: undefined, points: 3, reporterId: 'u_lena', createdAt: daysAgo(1, 9), updatedAt: daysAgo(1, 9), order: nextOrder(),
  },

  // ── CLI project ──
  {
    id: 't_50', projectId: 'p_cli', key: 'CLI-12', title: 'devflow board --mine command',
    description: 'Render the current user\'s tasks as an ASCII kanban in the terminal.',
    status: 'in_progress', priority: 'medium', assigneeIds: ['u_amrit'], labelIds: ['l_feature'],
    sprintId: undefined, points: 3, reporterId: 'u_jordan', createdAt: daysAgo(3, 9), updatedAt: daysAgo(0, 6), order: nextOrder(),
  },
  {
    id: 't_51', projectId: 'p_cli', key: 'CLI-14', title: 'Shell completion for zsh and fish',
    description: 'Generate completions from the CLI command tree, including dynamic task keys.',
    status: 'todo', priority: 'low', assigneeIds: ['u_marcus'], labelIds: ['l_feature'],
    sprintId: undefined, points: 2, reporterId: 'u_amrit', createdAt: daysAgo(2, 9), updatedAt: daysAgo(2, 9), order: nextOrder(),
  },
];

// ─── Issues ────────────────────────────────────────────────────────────────────

export const ISSUES: Issue[] = [
  {
    id: 'i_1', projectId: 'p_df', key: 'IS-1', title: 'Kanban drops card in wrong column on fast drag',
    description: 'When a card is dragged quickly across two columns, the drop target is computed from the stale collision rect and the card lands one column off. Repro: drag DF-15 from "In Progress" to "Done" at speed. Suspect the measuring strategy — droppables should be measured continuously during the drag, not once at drag start.',
    status: 'open', priority: 'high', reporterId: 'u_sofia', assigneeIds: ['u_amrit'],
    labelIds: ['l_bug'], linkedTaskIds: ['t_12'], linkedPrNumbers: [214],
    createdAt: daysAgo(1, 8), updatedAt: daysAgo(0, 7),
  },
  {
    id: 'i_2', projectId: 'p_df', key: 'IS-2', title: 'OAuth callback fails when workspace slug has uppercase',
    description: 'The state parameter round-trips the workspace slug unencoded. "DevFlow%20Labs" is decoded by the provider and the slug comparison fails with a 401. Fix is to base64url-encode the whole state object instead of passing the raw slug.',
    status: 'open', priority: 'urgent', reporterId: 'u_marcus', assigneeIds: ['u_marcus'],
    labelIds: ['l_bug', 'l_security'], linkedTaskIds: ['t_13'], linkedPrNumbers: [219],
    createdAt: daysAgo(0, 6), updatedAt: daysAgo(0, 12),
  },
  {
    id: 'i_3', projectId: 'p_df', key: 'IS-3', title: 'Burndown actual line is flat on weekends',
    description: 'The burndown samples only on days with activity, so weekends render as a flat segment. Either sample daily with null-skip or interpolate. Product prefers daily sampling with a dashed weekend region.',
    status: 'open', priority: 'medium', reporterId: 'u_sofia', assigneeIds: ['u_jordan'],
    labelIds: ['l_improvement'], linkedTaskIds: [], linkedPrNumbers: [],
    createdAt: daysAgo(2, 9), updatedAt: daysAgo(2, 9),
  },
  {
    id: 'i_4', projectId: 'p_df', key: 'IS-4', title: 'Notifications duplicated on rapid status change',
    description: 'Moving a card quickly through two columns fires two task_moved events, and the notification worker enqueues one email per event before the first is delivered. Dedupe key should be (userId, entityRef, type) with a 60s window.',
    status: 'open', priority: 'high', reporterId: 'u_priya', assigneeIds: ['u_priya'],
    labelIds: ['l_bug'], linkedTaskIds: [], linkedPrNumbers: [221],
    createdAt: daysAgo(3, 10), updatedAt: daysAgo(1, 9),
  },
  {
    id: 'i_5', projectId: 'p_df', key: 'IS-5', title: 'Add sprint goal field to sprint header',
    description: 'Sprints are created with a goal but the header only shows dates. Surface the goal with an edit affordance for PMs, and show completion percentage next to it.',
    status: 'open', priority: 'low', reporterId: 'u_sofia', assigneeIds: ['u_sofia'],
    labelIds: ['l_improvement'], linkedTaskIds: [], linkedPrNumbers: [],
    createdAt: daysAgo(4, 9), updatedAt: daysAgo(4, 9),
  },
  {
    id: 'i_6', projectId: 'p_df', key: 'IS-6', title: 'File upload above 10 MB fails silently',
    description: 'Supabase Storage rejects >10 MB with a 413 that the client treats as a network error. Surface a friendly message with the size limit, and chunk uploads for files up to 100 MB.',
    status: 'in_progress', priority: 'medium', reporterId: 'u_david', assigneeIds: ['u_david'],
    labelIds: ['l_bug'], linkedTaskIds: [], linkedPrNumbers: [],
    createdAt: daysAgo(2, 11), updatedAt: daysAgo(0, 10),
  },
  {
    id: 'i_7', projectId: 'p_df', key: 'IS-7', title: 'Export board as CSV',
    description: 'One-click CSV export of the current board view, respecting active filters. Include key, title, status, priority, assignees, labels, due date, points and sprint.',
    status: 'open', priority: 'medium', reporterId: 'u_jordan', assigneeIds: ['u_jordan'],
    labelIds: ['l_feature'], linkedTaskIds: [], linkedPrNumbers: [],
    createdAt: daysAgo(5, 9), updatedAt: daysAgo(5, 9),
  },
  {
    id: 'i_8', projectId: 'p_df', key: 'IS-8', title: '500 when assigning a user who left the project',
    description: 'Assignee picker offered stale members after a removal, and the FK constraint blew up as a 500. Fixed by scoping the member query to active ProjectMembers; returns 409 with a clear message otherwise.',
    status: 'closed', priority: 'high', reporterId: 'u_amrit', assigneeIds: ['u_amrit'],
    labelIds: ['l_bug'], linkedTaskIds: [], linkedPrNumbers: [207],
    createdAt: daysAgo(8, 9), updatedAt: daysAgo(6, 15),
  },
  {
    id: 'i_9', projectId: 'p_df', key: 'IS-9', title: 'Label chip contrast in light mode',
    description: "The 'research' and 'performance' label chips fall to 3.9:1 contrast in light mode. Bump chip text to 600 weight and darken both token colors by one step.",
    status: 'open', priority: 'low', reporterId: 'u_elena', assigneeIds: ['u_elena'],
    labelIds: ['l_design'], linkedTaskIds: [], linkedPrNumbers: [],
    createdAt: daysAgo(1, 13), updatedAt: daysAgo(1, 13),
  },
  {
    id: 'i_10', projectId: 'p_df', key: 'IS-10', title: 'WebSocket reconnect storm on network flap',
    description: 'When a laptop sleeps and wakes, 40+ clients reconnect within the same second and the gateway CPU spikes. Needs jittered exponential backoff with a ceiling, and the server should broadcast a "drain" event before restarts.',
    status: 'open', priority: 'urgent', reporterId: 'u_jordan', assigneeIds: ['u_david'],
    labelIds: ['l_bug'], linkedTaskIds: [], linkedPrNumbers: [],
    createdAt: daysAgo(1, 7), updatedAt: daysAgo(0, 5),
  },
  {
    id: 'i_11', projectId: 'p_ma', key: 'MA-11', title: 'Crash on rotation during task detail load',
    description: 'Race between the image loader and the config change in React Native. Guard with a mounted ref.',
    status: 'open', priority: 'high', reporterId: 'u_jordan', assigneeIds: ['u_david'],
    labelIds: ['l_bug'], linkedTaskIds: [], linkedPrNumbers: [],
    createdAt: daysAgo(2, 8), updatedAt: daysAgo(0, 9),
  },
];

// ─── Comments ──────────────────────────────────────────────────────────────────

export const COMMENTS: Comment[] = [
  // DF-15
  { id: 'c_1', parentId: 't_12', parentType: 'task', authorId: 'u_sofia', body: 'Reminder: this is the demo-critical path for Friday\'s investor walkthrough. If the drag feels laggy on the first paint we should lazy-measure droppables.', createdAt: daysAgo(2, 9) },
  { id: 'c_2', parentId: 't_12', parentType: 'task', authorId: 'u_amrit', body: 'Good call — switched to continuous measuring and the overlay now tracks the pointer without jank. Activation distance of 6px keeps clicks opening the card.', createdAt: daysAgo(1, 10) },
  { id: 'c_3', parentId: 't_12', parentType: 'task', authorId: 'u_marcus', body: 'Found the edge case behind IS-1 — fast cross-column drops read a stale collision rect. PR #214 has the fix, can someone review when free?', createdAt: daysAgo(0, 7) },
  // DF-16
  { id: 'c_4', parentId: 't_13', parentType: 'task', authorId: 'u_david', body: 'Magic-link flow works locally. One thing to decide: do we rotate the refresh cookie on every request or only on expiry? Every-request is safer but doubles session writes.', createdAt: daysAgo(1, 11) },
  { id: 'c_5', parentId: 't_13', parentType: 'task', authorId: 'u_amrit', body: 'Let\'s rotate on expiry plus on privilege change. Session writes are cheap compared to the risk window.', createdAt: daysAgo(1, 13) },
  { id: 'c_6', parentId: 't_13', parentType: 'task', authorId: 'u_marcus', body: 'Also blocked on IS-2 — uppercase workspace slugs break the OAuth state. Encoding the whole state blob as base64url fixes it.', createdAt: daysAgo(0, 6) },
  // DF-17
  { id: 'c_7', parentId: 't_14', parentType: 'task', authorId: 'u_priya', body: 'Slide-over renders, deep links work. Still to do: focus trap, Esc handling and restoring scroll position on close.', createdAt: daysAgo(0, 9) },
  // DF-20
  { id: 'c_8', parentId: 't_16', parentType: 'task', authorId: 'u_david', body: 'Effective-role resolution is done: workspace role is the floor, project role can elevate but never lower. can() checks now run in every service method.', createdAt: daysAgo(0, 7) },
  // DF-24
  { id: 'c_9', parentId: 't_17', parentType: 'task', authorId: 'u_priya', body: 'Cache-aside pattern sketched: TTL 60s, single-flight locks to prevent stampede, invalidate on write. I\'ll pair on it tomorrow if that\'s ok.', createdAt: daysAgo(1, 15) },
  // DF-27
  { id: 'c_10', parentId: 't_20', parentType: 'task', authorId: 'u_lena', body: 'Security review flagged this as the top priority before the next public beta. Please include the retry/backoff design in the PR description.', createdAt: daysAgo(1, 10) },
  // DF-11
  { id: 'c_11', parentId: 't_10', parentType: 'task', authorId: 'u_priya', body: 'Aggregator dedupes status flapping into one entry with a counter. Edge case: comments are never deduped since each is meaningful.', createdAt: daysAgo(0, 10) },
  // DF-12
  { id: 'c_12', parentId: 't_11', parentType: 'task', authorId: 'u_david', body: 'Webhook handler now idempotent on the GitHub delivery id — replaying a delivery twice produces one link row. Verified with the delivery replay button in the dashboard.', createdAt: daysAgo(1, 15) },
  // IS-1
  { id: 'c_13', parentId: 'i_1', parentType: 'issue', authorId: 'u_amrit', body: "Confirmed the repro. The collision cache isn't invalidated between columns when the pointer moves fast. Fix in #214 switches to continuous measurement.", createdAt: daysAgo(0, 8) },
  { id: 'c_14', parentId: 'i_1', parentType: 'issue', authorId: 'u_sofia', body: 'This is exactly the kind of polish that matters for the demo. Let\'s get it merged before Thursday.', createdAt: daysAgo(0, 9) },
  // IS-2
  { id: 'c_15', parentId: 'i_2', parentType: 'issue', authorId: 'u_marcus', body: 'Root cause found: state was the raw slug. Switching to an opaque base64url-encoded object also CSRF-hardens the flow.', createdAt: daysAgo(0, 12) },
  // IS-4
  { id: 'c_16', parentId: 'i_4', parentType: 'issue', authorId: 'u_priya', body: 'Dedupe window implemented in the worker with a Redis set keyed by (user, entity, type). Flapping now produces one notification.', createdAt: daysAgo(1, 9) },
  // IS-10
  { id: 'c_17', parentId: 'i_10', parentType: 'issue', authorId: 'u_david', body: 'Added jittered backoff with a 30s ceiling. Next: server-side drain event before rolling restarts so clients don\'t all reconnect at once.', createdAt: daysAgo(0, 5) },
  // DF-2
  { id: 'c_18', parentId: 't_2', parentType: 'task', authorId: 'u_david', body: 'Indexes added for the three hot paths. Query planner confirms the task-by-column scan is now an index-only scan.', createdAt: daysAgo(21, 11) },
  // DF-6
  { id: 'c_19', parentId: 't_6', parentType: 'task', authorId: 'u_jordan', body: 'Pipeline is green. Full run takes 3m 40s; the API test stage is the long pole — might split it later.', createdAt: daysAgo(7, 16) },
  // DF-18
  { id: 'c_20', parentId: 't_15', parentType: 'task', authorId: 'u_jordan', body: 'Presence events throttled client-side to 1/5s. Gateway fan-out stays under 2k msg/s at our concurrency targets.', createdAt: daysAgo(1, 10) },
];

// ─── Attachments ───────────────────────────────────────────────────────────────

export const ATTACHMENTS: Attachment[] = [
  { id: 'a_1', parentId: 't_12', parentType: 'task', name: 'dnd-overlay-frames.png', size: '1.2 MB', kind: 'image', uploadedById: 'u_amrit', createdAt: daysAgo(1, 10) },
  { id: 'a_2', parentId: 't_12', parentType: 'task', name: 'drag-perf-trace.json', size: '840 KB', kind: 'log', uploadedById: 'u_amrit', createdAt: daysAgo(1, 11) },
  { id: 'a_3', parentId: 't_13', parentType: 'task', name: 'oauth-state-flow.pdf', size: '340 KB', kind: 'pdf', uploadedById: 'u_lena', createdAt: daysAgo(3, 9) },
  { id: 'a_4', parentId: 't_7', parentType: 'task', name: 'sprint-mockups-v3.fig', size: '4.8 MB', kind: 'design', uploadedById: 'u_elena', createdAt: daysAgo(19, 13) },
  { id: 'a_5', parentId: 't_2', parentType: 'task', name: 'schema.sql', size: '12 KB', kind: 'code', uploadedById: 'u_david', createdAt: daysAgo(21, 11) },
  { id: 'a_6', parentId: 'i_6', parentType: 'issue', name: 'upload-413-error.log', size: '96 KB', kind: 'log', uploadedById: 'u_david', createdAt: daysAgo(2, 11) },
  { id: 'a_7', parentId: 't_16', parentType: 'task', name: 'rbac-policy.ts', size: '8 KB', kind: 'code', uploadedById: 'u_david', createdAt: daysAgo(0, 7) },
];

// ─── Activity ──────────────────────────────────────────────────────────────────

export const ACTIVITIES: Activity[] = [
  { id: 'ac_1', projectId: 'p_df', type: 'task_moved', actorId: 'u_amrit', message: 'moved DF-15 from To Do to In Progress', entityRef: 'DF-15', createdAt: daysAgo(0, 6) },
  { id: 'ac_2', projectId: 'p_df', type: 'pr_opened', actorId: 'u_marcus', message: 'opened PR #214 fix: kanban drop-target calculation', entityRef: 'IS-1', createdAt: daysAgo(0, 7) },
  { id: 'ac_3', projectId: 'p_df', type: 'comment', actorId: 'u_amrit', message: 'commented on DF-15', entityRef: 'DF-15', createdAt: daysAgo(0, 8) },
  { id: 'ac_4', projectId: 'p_df', type: 'task_assigned', actorId: 'u_sofia', message: 'assigned DF-27 to David Okafor', entityRef: 'DF-27', createdAt: daysAgo(0, 9) },
  { id: 'ac_5', projectId: 'p_df', type: 'task_created', actorId: 'u_amrit', message: 'created DF-29 Sliding-window rate limiter middleware', entityRef: 'DF-29', createdAt: daysAgo(0, 9) },
  { id: 'ac_6', projectId: 'p_df', type: 'commit', actorId: 'u_jordan', message: 'pushed 3 commits to feature/realtime-presence', createdAt: daysAgo(0, 10) },
  { id: 'ac_7', projectId: 'p_df', type: 'issue_created', actorId: 'u_marcus', message: 'opened IS-2 OAuth callback fails when workspace slug has uppercase', entityRef: 'IS-2', createdAt: daysAgo(0, 12) },
  { id: 'ac_8', projectId: 'p_df', type: 'task_moved', actorId: 'u_priya', message: 'moved DF-11 from In Progress to In Review', entityRef: 'DF-11', createdAt: daysAgo(0, 14) },
  { id: 'ac_9', projectId: 'p_df', type: 'comment', actorId: 'u_david', message: 'commented on DF-20', entityRef: 'DF-20', createdAt: daysAgo(0, 16) },
  { id: 'ac_10', projectId: 'p_df', type: 'task_moved', actorId: 'u_marcus', message: 'moved DF-10 from In Progress to In Review', entityRef: 'DF-10', createdAt: daysAgo(1, 8) },
  { id: 'ac_11', projectId: 'p_df', type: 'label_added', actorId: 'u_elena', message: 'added label design to DF-25', entityRef: 'DF-25', createdAt: daysAgo(1, 9) },
  { id: 'ac_12', projectId: 'p_df', type: 'task_assigned', actorId: 'u_sofia', message: 'assigned IS-4 to Priya Sharma', entityRef: 'IS-4', createdAt: daysAgo(1, 9) },
  { id: 'ac_13', projectId: 'p_df', type: 'pr_merged', actorId: 'u_lena', message: 'merged PR #207 fix: 409 on assigning removed members', entityRef: 'IS-8', createdAt: daysAgo(1, 11) },
  { id: 'ac_14', projectId: 'p_df', type: 'sprint_started', actorId: 'u_sofia', message: 'started Sprint 13 — Realtime collaboration layer', entityRef: 'Sprint 13', createdAt: daysAgo(1, 12) },
  { id: 'ac_15', projectId: 'p_df', type: 'commit', actorId: 'u_amrit', message: 'pushed 7 commits to feature/kanban-dnd', createdAt: daysAgo(1, 14) },
  { id: 'ac_16', projectId: 'p_df', type: 'task_created', actorId: 'u_sofia', message: 'created DF-17 Task detail slide-over with comments thread', entityRef: 'DF-17', createdAt: daysAgo(2, 9) },
  { id: 'ac_17', projectId: 'p_df', type: 'issue_created', actorId: 'u_sofia', message: 'opened IS-3 Burndown actual line is flat on weekends', entityRef: 'IS-3', createdAt: daysAgo(2, 9) },
  { id: 'ac_18', projectId: 'p_df', type: 'task_moved', actorId: 'u_amrit', message: 'moved DF-4 from In Review to Done', entityRef: 'DF-4', createdAt: daysAgo(2, 15) },
  { id: 'ac_19', projectId: 'p_df', type: 'pr_opened', actorId: 'u_david', message: 'opened PR #219 fix: opaque OAuth state parameter', entityRef: 'IS-2', createdAt: daysAgo(1, 16) },
  { id: 'ac_20', projectId: 'p_df', type: 'commit', actorId: 'u_david', message: 'pushed 2 commits to fix/oauth-state', createdAt: daysAgo(1, 17) },
  { id: 'ac_21', projectId: 'p_df', type: 'task_created', actorId: 'u_priya', message: 'created DF-24 Redis cache-aside layer for project queries', entityRef: 'DF-24', createdAt: daysAgo(2, 10) },
  { id: 'ac_22', projectId: 'p_df', type: 'task_assigned', actorId: 'u_jordan', message: 'assigned DF-18 to Jordan Lee', entityRef: 'DF-18', createdAt: daysAgo(3, 9) },
  { id: 'ac_23', projectId: 'p_df', type: 'issue_created', actorId: 'u_jordan', message: 'opened IS-10 WebSocket reconnect storm on network flap', entityRef: 'IS-10', createdAt: daysAgo(3, 10) },
  { id: 'ac_24', projectId: 'p_df', type: 'sprint_completed', actorId: 'u_sofia', message: 'completed Sprint 12 — velocity 41 points', entityRef: 'Sprint 12', createdAt: daysAgo(4, 17) },
  { id: 'ac_25', projectId: 'p_df', type: 'pr_merged', actorId: 'u_sofia', message: 'merged PR #198 feat: inline column add-task form', createdAt: daysAgo(4, 15) },
  { id: 'ac_26', projectId: 'p_df', type: 'member_joined', actorId: 'u_lena', message: 'invited Priya Sharma to DevFlow Labs', createdAt: daysAgo(5, 10) },
  { id: 'ac_27', projectId: 'p_df', type: 'commit', actorId: 'u_priya', message: 'pushed 4 commits to feature/activity-aggregator', createdAt: daysAgo(5, 12) },
  { id: 'ac_28', projectId: 'p_df', type: 'task_moved', actorId: 'u_david', message: 'moved DF-2 from In Progress to Done', entityRef: 'DF-2', createdAt: daysAgo(6, 11) },
  { id: 'ac_29', projectId: 'p_df', type: 'pr_opened', actorId: 'u_priya', message: 'opened PR #221 fix: notification dedupe window', entityRef: 'IS-4', createdAt: daysAgo(5, 14) },
  { id: 'ac_30', projectId: 'p_df', type: 'task_created', actorId: 'u_lena', message: 'created DF-6 CI pipeline: lint, typecheck, unit + API tests', entityRef: 'DF-6', createdAt: daysAgo(7, 9) },
];

// ─── Notifications ─────────────────────────────────────────────────────────────

export const NOTIFICATIONS: Notification[] = [
  { id: 'n_1', type: 'mention', title: 'Sofia Reyes mentioned you', body: '@amritanshu can you sanity-check the drag overlay frames before the walkthrough?', refId: 't_12', refType: 'task', projectId: 'p_df', read: false, createdAt: daysAgo(0, 3) },
  { id: 'n_2', type: 'review', title: 'PR #214 needs your review', body: 'marcus requested review on fix: kanban drop-target calculation', refId: 'i_1', refType: 'issue', projectId: 'p_df', read: false, createdAt: daysAgo(0, 7) },
  { id: 'n_3', type: 'assignment', title: 'You were assigned DF-15', body: 'Implement drag-and-drop Kanban with @dnd-kit — due today', refId: 't_12', refType: 'task', projectId: 'p_df', read: false, createdAt: daysAgo(0, 9) },
  { id: 'n_4', type: 'comment', title: 'Priya Sharma commented on DF-24', body: 'Cache-aside pattern sketched: TTL 60s, single-flight locks to prevent stampede…', refId: 't_17', refType: 'task', projectId: 'p_df', read: false, createdAt: daysAgo(1, 15) },
  { id: 'n_5', type: 'deadline', title: 'DF-27 is due tomorrow', body: 'Webhook signature verification for GitHub events', refId: 't_20', refType: 'task', projectId: 'p_df', read: false, createdAt: daysAgo(1, 17) },
  { id: 'n_6', type: 'pr', title: 'PR #221 was opened', body: 'priya: fix: notification dedupe window (closes IS-4)', refId: 'i_4', refType: 'issue', projectId: 'p_df', read: true, createdAt: daysAgo(2, 14) },
  { id: 'n_7', type: 'comment', title: 'Marcus Chen commented on DF-16', body: 'Also blocked on IS-2 — uppercase workspace slugs break the OAuth state.', refId: 't_13', refType: 'task', projectId: 'p_df', read: true, createdAt: daysAgo(0, 6) },
  { id: 'n_8', type: 'assignment', title: 'You were assigned IS-1', body: 'Kanban drops card in wrong column on fast drag', refId: 'i_1', refType: 'issue', projectId: 'p_df', read: true, createdAt: daysAgo(1, 8) },
  { id: 'n_9', type: 'mention', title: 'Lena Fischer mentioned you', body: '@amritanshu security review flagged DF-27 as top priority for the beta', refId: 't_20', refType: 'task', projectId: 'p_df', read: true, createdAt: daysAgo(2, 10) },
];

// ─── GitHub ────────────────────────────────────────────────────────────────────

export const GITHUB: GitHubData = {
  connected: true,
  login: 'amritanshu',
  repos: [
    { id: 1, name: 'devflow', fullName: 'devflow/devflow', description: 'DevFlow web platform — React, TypeScript, Tailwind', language: 'TypeScript', stars: 284, forks: 31, isPrivate: true, updatedAt: daysAgo(0, 2) },
    { id: 2, name: 'devflow-cli', fullName: 'devflow/devflow-cli', description: 'Terminal client for DevFlow', language: 'Rust', stars: 152, forks: 12, isPrivate: false, updatedAt: daysAgo(0, 9) },
    { id: 3, name: 'api-gateway', fullName: 'devflow/api-gateway', description: 'Edge gateway: auth, rate limiting, websocket fan-out', language: 'Go', stars: 96, forks: 8, isPrivate: true, updatedAt: daysAgo(1, 4) },
    { id: 4, name: 'devflow-mobile', fullName: 'devflow/mobile', description: 'React Native companion app', language: 'TypeScript', stars: 41, forks: 5, isPrivate: true, updatedAt: daysAgo(2, 6) },
  ],
  pullRequests: [
    { id: 'pr_1', number: 221, title: 'fix: notification dedupe window', repo: 'devflow/devflow', authorId: 'u_priya', state: 'open', source: 'fix/notification-dedupe', target: 'main', checks: 'success', additions: 84, deletions: 21, linkedIssueKey: 'IS-4', createdAt: daysAgo(1, 14) },
    { id: 'pr_2', number: 219, title: 'fix: opaque OAuth state parameter', repo: 'devflow/devflow', authorId: 'u_marcus', state: 'open', source: 'fix/oauth-state', target: 'main', checks: 'pending', additions: 132, deletions: 47, linkedIssueKey: 'IS-2', createdAt: daysAgo(1, 16) },
    { id: 'pr_3', number: 214, title: 'fix: kanban drop-target calculation', repo: 'devflow/devflow', authorId: 'u_marcus', state: 'open', source: 'fix/kanban-droptarget', target: 'main', checks: 'failure', additions: 96, deletions: 38, linkedIssueKey: 'IS-1', createdAt: daysAgo(0, 7) },
    { id: 'pr_4', number: 218, title: 'feat: realtime presence channel', repo: 'devflow/devflow', authorId: 'u_jordan', state: 'open', source: 'feature/realtime-presence', target: 'main', checks: 'pending', additions: 214, deletions: 61, createdAt: daysAgo(0, 10) },
    { id: 'pr_5', number: 212, title: 'feat: task detail slide-over', repo: 'devflow/devflow', authorId: 'u_priya', state: 'open', source: 'feature/task-detail', target: 'main', checks: 'success', additions: 402, deletions: 19, createdAt: daysAgo(0, 12) },
    { id: 'pr_6', number: 207, title: 'fix: 409 on assigning removed members', repo: 'devflow/devflow', authorId: 'u_amrit', state: 'merged', source: 'fix/assignee-409', target: 'main', checks: 'success', additions: 45, deletions: 12, linkedIssueKey: 'IS-8', createdAt: daysAgo(2, 9) },
    { id: 'pr_7', number: 198, title: 'feat: inline column add-task form', repo: 'devflow/devflow', authorId: 'u_marcus', state: 'merged', source: 'feat/inline-add', target: 'main', checks: 'success', additions: 178, deletions: 22, createdAt: daysAgo(5, 10) },
    { id: 'pr_8', number: 209, title: 'chore: bump vite to 8.x', repo: 'devflow/devflow', authorId: 'u_jordan', state: 'closed', source: 'chore/vite-8', target: 'main', checks: 'failure', additions: 12, deletions: 9, createdAt: daysAgo(3, 11) },
  ],
  commits: [
    { id: 'cm_1', sha: '9f4c2a1', repo: 'devflow/devflow', authorId: 'u_amrit', message: 'feat(board): continuous droppable measurement during drag', createdAt: daysAgo(0, 2) },
    { id: 'cm_2', sha: 'b7e83d2', repo: 'devflow/devflow', authorId: 'u_amrit', message: 'perf(board): memoize card layout to skip re-renders', createdAt: daysAgo(0, 3) },
    { id: 'cm_3', sha: 'c1a9f07', repo: 'devflow/devflow', authorId: 'u_marcus', message: 'fix(kanban): recompute collision rects on pointermove', createdAt: daysAgo(0, 7) },
    { id: 'cm_4', sha: 'd4b2c88', repo: 'devflow/devflow', authorId: 'u_jordan', message: 'feat(realtime): presence channel with 5s client throttle', createdAt: daysAgo(0, 10) },
    { id: 'cm_5', sha: 'e8f1a34', repo: 'devflow/devflow', authorId: 'u_priya', message: 'feat(task): slide-over panel with deep links', createdAt: daysAgo(0, 12) },
    { id: 'cm_6', sha: 'a2c7e91', repo: 'devflow/devflow', authorId: 'u_priya', message: 'fix(notifications): dedupe window with redis set', createdAt: daysAgo(1, 14) },
    { id: 'cm_7', sha: 'f3d8b45', repo: 'devflow/devflow', authorId: 'u_david', message: 'fix(auth): base64url-encode OAuth state object', createdAt: daysAgo(1, 16) },
    { id: 'cm_8', sha: 'g9h2j67', repo: 'devflow/devflow', authorId: 'u_amrit', message: 'refactor(kanban): extract column drop logic to hook', createdAt: daysAgo(1, 14) },
    { id: 'cm_9', sha: 'h5k1l89', repo: 'devflow/devflow', authorId: 'u_marcus', message: 'feat(board): quick-add task in column footer', createdAt: daysAgo(1, 15) },
    { id: 'cm_10', sha: 'i6m4n23', repo: 'devflow/devflow', authorId: 'u_david', message: 'feat(webhooks): idempotent delivery handling', createdAt: daysAgo(1, 17) },
    { id: 'cm_11', sha: 'j7n8o56', repo: 'devflow/devflow', authorId: 'u_jordan', message: 'chore(ci): split api test stage', createdAt: daysAgo(2, 9) },
    { id: 'cm_12', sha: 'k8p9q12', repo: 'devflow/devflow', authorId: 'u_amrit', message: 'feat(board): drag overlay with tilt effect', createdAt: daysAgo(2, 11) },
    { id: 'cm_13', sha: 'l9q0r45', repo: 'devflow/devflow', authorId: 'u_priya', message: 'feat(activity): event dedup for status flapping', createdAt: daysAgo(3, 10) },
    { id: 'cm_14', sha: 'm0r1s78', repo: 'devflow/devflow', authorId: 'u_david', message: 'feat(rbac): effective role resolution', createdAt: daysAgo(3, 14) },
    { id: 'cm_15', sha: 'n1s2t01', repo: 'devflow/devflow-cli', authorId: 'u_amrit', message: 'feat(cli): board --mine ascii rendering', createdAt: daysAgo(0, 6) },
    { id: 'cm_16', sha: 'o2t3u34', repo: 'devflow/devflow-cli', authorId: 'u_marcus', message: 'feat(cli): task create from stdin', createdAt: daysAgo(1, 8) },
    { id: 'cm_17', sha: 'p3u4v67', repo: 'devflow/api-gateway', authorId: 'u_david', message: 'fix(gateway): jittered reconnect backoff', createdAt: daysAgo(0, 5) },
    { id: 'cm_18', sha: 'q4v5w90', repo: 'devflow/api-gateway', authorId: 'u_jordan', message: 'feat(gateway): ws fan-out across instances', createdAt: daysAgo(1, 11) },
    { id: 'cm_19', sha: 'r5w6x23', repo: 'devflow/devflow', authorId: 'u_elena', message: 'style(tokens): label chip contrast bump', createdAt: daysAgo(2, 13) },
    { id: 'cm_20', sha: 's6x7y56', repo: 'devflow/devflow', authorId: 'u_amrit', message: 'feat(api): zod schemas for task payloads', createdAt: daysAgo(2, 15) },
  ],
  branches: [
    { name: 'main', repo: 'devflow/devflow', isProtected: true, lastCommitMessage: 'fix: notification dedupe window', committerId: 'u_priya', ago: '2h' },
    { name: 'develop', repo: 'devflow/devflow', isProtected: true, lastCommitMessage: 'feat: task detail slide-over', committerId: 'u_priya', ago: '1d' },
    { name: 'feature/realtime-presence', repo: 'devflow/devflow', isProtected: false, lastCommitMessage: 'feat(realtime): presence channel', committerId: 'u_jordan', ago: '5h' },
    { name: 'fix/kanban-droptarget', repo: 'devflow/devflow', isProtected: false, lastCommitMessage: 'fix(kanban): collision rects on pointermove', committerId: 'u_marcus', ago: '7h' },
    { name: 'fix/oauth-state', repo: 'devflow/devflow', isProtected: false, lastCommitMessage: 'fix(auth): opaque state parameter', committerId: 'u_marcus', ago: '1d' },
    { name: 'release/1.4.0', repo: 'devflow/devflow', isProtected: true, lastCommitMessage: 'chore: version 1.4.0-rc.2', committerId: 'u_lena', ago: '2d' },
  ],
};

// ─── Commit activity for analytics (last 14 days) ─────────────────────────────

export function commitActivity(): { day: string; commits: number; prs: number }[] {
  const rnd = seededRandom('commit-activity');
  const out: { day: string; commits: number; prs: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    out.push({
      day: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      commits: weekend ? Math.floor(rnd() * 3) : 4 + Math.floor(rnd() * 9),
      prs: weekend ? Math.floor(rnd() * 2) : 1 + Math.floor(rnd() * 4),
    });
  }
  return out;
}
