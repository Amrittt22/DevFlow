// ─── DevFlow domain model ─────────────────────────────────────────────────────
// Mirrors the Prisma schema from the spec (§14): User, Workspace, WorkspaceMember,
// Project, ProjectMember, Task, TaskLabel, Issue, Comment, Attachment, Sprint,
// Notification, Activity, GitHubAccount, GitHubRepository, PullRequest, WebhookEvent.

export type ID = string;

export type Role = 'admin' | 'pm' | 'developer';

export interface User {
  id: ID;
  name: string;
  handle: string;
  email: string;
  title: string;
  color: string; // avatar hue seed
  role: Role;
  online?: boolean;
}

export interface Workspace {
  id: ID;
  name: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  initials: string;
  color: string;
  memberIds: ID[];
}

export interface Project {
  id: ID;
  workspaceId: ID;
  name: string;
  key: string;
  description: string;
  color: string; // hex accent
  gradient: string; // css gradient
  memberIds: ID[];
  githubRepo?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export interface TaskLabel {
  id: ID;
  name: string;
  color: string; // hex
}

export interface Task {
  id: ID;
  projectId: ID;
  key: string; // e.g. DF-15
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeIds: ID[];
  labelIds: ID[];
  dueDate?: string; // ISO date
  sprintId?: ID;
  points?: number;
  reporterId: ID;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export type IssueStatus = 'open' | 'in_progress' | 'closed';

export interface Issue {
  id: ID;
  projectId: ID;
  key: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: Priority;
  reporterId: ID;
  assigneeIds: ID[];
  labelIds: ID[];
  linkedTaskIds: ID[];
  linkedPrNumbers: number[];
  createdAt: string;
  updatedAt: string;
}

export interface BurndownPoint {
  day: string;
  ideal: number;
  actual: number | null;
}

export interface Sprint {
  id: ID;
  projectId: ID;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'planned';
  velocity?: number;
  totalPoints: number;
  burndown: BurndownPoint[];
}

export interface Comment {
  id: ID;
  parentId: ID;
  parentType: 'task' | 'issue';
  authorId: ID;
  body: string;
  createdAt: string;
}

export type AttachmentKind = 'image' | 'pdf' | 'code' | 'log' | 'design';

export interface Attachment {
  id: ID;
  parentId: ID;
  parentType: 'task' | 'issue';
  name: string;
  size: string;
  kind: AttachmentKind;
  uploadedById: ID;
  createdAt: string;
}

export type ActivityType =
  | 'task_created'
  | 'task_moved'
  | 'task_assigned'
  | 'comment'
  | 'issue_created'
  | 'issue_closed'
  | 'pr_opened'
  | 'pr_merged'
  | 'commit'
  | 'sprint_started'
  | 'sprint_completed'
  | 'member_joined'
  | 'label_added';

export interface Activity {
  id: ID;
  projectId: ID;
  type: ActivityType;
  actorId: ID;
  message: string;
  entityRef?: string; // e.g. "DF-42"
  createdAt: string;
}

export type NotificationType = 'assignment' | 'mention' | 'comment' | 'pr' | 'deadline' | 'review';

export interface Notification {
  id: ID;
  type: NotificationType;
  title: string;
  body: string;
  refId?: ID;
  refType?: 'task' | 'issue';
  projectId: ID;
  read: boolean;
  createdAt: string;
}

// ─── GitHub integration ───────────────────────────────────────────────────────

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  isPrivate: boolean;
  updatedAt: string;
}

export type PRState = 'open' | 'merged' | 'closed';

export interface PullRequest {
  id: ID;
  number: number;
  title: string;
  repo: string;
  authorId: ID;
  state: PRState;
  source: string;
  target: string;
  checks: 'success' | 'failure' | 'pending';
  additions: number;
  deletions: number;
  linkedIssueKey?: string;
  createdAt: string;
}

export interface Commit {
  id: ID;
  sha: string;
  repo: string;
  authorId: ID;
  message: string;
  createdAt: string;
}

export interface Branch {
  name: string;
  repo: string;
  isProtected: boolean;
  lastCommitMessage: string;
  committerId: ID;
  ago: string;
}

export interface GitHubData {
  connected: boolean;
  login: string;
  repos: GitHubRepo[];
  pullRequests: PullRequest[];
  commits: Commit[];
  branches: Branch[];
}

// ─── UI / runtime types ───────────────────────────────────────────────────────

export interface Toast {
  id: ID;
  title: string;
  body?: string;
  kind: 'info' | 'success' | 'realtime';
}

export const TASK_STATUSES: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'In Review' },
  { id: 'done', label: 'Done' },
];

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'urgent', label: 'Urgent' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];
