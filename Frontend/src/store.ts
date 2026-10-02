// ─── DevFlow global store ──────────────────────────────────────────────────────
// Zustand store acting as the client-side cache of the backend. In production
// these actions call the REST API (see lib/api/client.ts); the mock client
// stands in so the frontend is fully demoable end-to-end.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type {
  Activity,
  Attachment,
  Comment,
  GitHubData,
  ID,
  Issue,
  Notification,
  Project,
  Sprint,
  Task,
  TaskLabel,
  TaskStatus,
  Toast,
  User,
  Workspace,
} from './lib/types';
import { api } from './lib/api/client';
import { seedData } from './lib/mock/seed';
import { eventToActivity, eventToNotification, makeRealtimeEvent } from './lib/realtime';
import { DAY } from './lib/utils';

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'In Review',
  done: 'Done',
};

interface AppState {
  // session & scope
  user: User | null;
  theme: 'dark' | 'light';
  currentWorkspaceId: ID;
  currentProjectId: ID;
  // data
  users: User[];
  workspaces: Workspace[];
  projects: Project[];
  labels: TaskLabel[];
  sprints: Sprint[];
  tasks: Task[];
  issues: Issue[];
  comments: Comment[];
  attachments: Attachment[];
  activities: Activity[];
  notifications: Notification[];
  github: GitHubData;
  // ui state
  isLoading: boolean;
  hydrated: boolean;
  toasts: Toast[];
  liveSimulation: boolean;
  sidebarCollapsed: boolean;
  // actions
  init: () => Promise<void>;
  signIn: (email?: string) => void;
  signOut: () => void;
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setWorkspace: (id: ID) => void;
  setProject: (id: ID) => void;
  toggleSidebar: () => void;
  toggleLiveSimulation: () => void;
  resetDemo: () => Promise<void>;
  // tasks
  moveTask: (taskId: ID, status: TaskStatus, opts?: { silent?: boolean }) => void;
  moveTaskTo: (taskId: ID, status: TaskStatus, beforeTaskId?: ID, opts?: { silent?: boolean }) => void;
  createTask: (input: Partial<Task> & { title: string }) => Task;
  updateTask: (taskId: ID, patch: Partial<Task>) => void;
  deleteTask: (taskId: ID) => void;
  addComment: (parentId: ID, parentType: 'task' | 'issue', body: string) => void;
  addAttachment: (parentId: ID, parentType: 'task' | 'issue', name: string) => void;
  // issues
  createIssue: (input: Partial<Issue> & { title: string }) => Issue;
  updateIssue: (issueId: ID, patch: Partial<Issue>) => void;
  // notifications
  markRead: (id: ID) => void;
  markAllRead: () => void;
  // github
  connectGitHub: () => void;
  disconnectGitHub: () => void;
  syncGitHub: () => Promise<void>;
  // toasts & realtime
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: ID) => void;
  tickRealtime: () => void;
}

let idSeq = 1000;
const nid = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${idSeq++}`;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      theme: 'dark',
      currentWorkspaceId: 'ws_devflow',
      currentProjectId: 'p_df',
      users: [],
      workspaces: [],
      projects: [],
      labels: [],
      sprints: [],
      tasks: [],
      issues: [],
      comments: [],
      attachments: [],
      activities: [],
      notifications: [],
      github: { connected: false, login: '', repos: [], pullRequests: [], commits: [], branches: [] },
      isLoading: true,
      hydrated: false,
      toasts: [],
      liveSimulation: true,
      sidebarCollapsed: false,

      init: async () => {
        const state = get();
        if (state.tasks.length > 0) {
          // Persisted data — brief skeleton so the app shell feels intentional.
          await new Promise((r) => setTimeout(r, 350));
          set({ isLoading: false, hydrated: true });
          return;
        }
        const seed = await api.bootstrap();
        const me = seed.users.find((u) => u.id === seed.currentUserId) ?? seed.users[0];
        const firstProject = seed.projects.find((p) => p.workspaceId === 'ws_devflow') ?? seed.projects[0];
        set({
          ...seed,
          user: me,
          currentProjectId: firstProject.id,
          currentWorkspaceId: firstProject.workspaceId,
          isLoading: false,
          hydrated: true,
        });
      },
      signIn: (email) => {
        const { users } = get();
        const found = email ? users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) : undefined;
        set({ user: found ?? users.find((u) => u.id === 'u_amrit') ?? users[0] });
        get().pushToast({ title: 'Signed in', body: found ? `Welcome back, ${found.name.split(' ')[0]}.` : 'Signed in as Amritanshu (demo user).', kind: 'success' });
      },

      signOut: () => set({ user: null }),

      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },

      toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),

      setWorkspace: (id) => {
        const { projects } = get();
        const first = projects.find((p) => p.workspaceId === id);
        set({
          currentWorkspaceId: id,
          currentProjectId: first ? first.id : get().currentProjectId,
        });
      },

      setProject: (id) => {
        const { projects } = get();
        const p = projects.find((x) => x.id === id);
        if (p) set({ currentProjectId: id, currentWorkspaceId: p.workspaceId });
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleLiveSimulation: () => set((s) => ({ liveSimulation: !s.liveSimulation })),

      resetDemo: async () => {
        const seed = await api.bootstrap();
        set({ ...seed, isLoading: false });
        get().pushToast({ title: 'Demo data reset', body: 'Workspace restored to its seeded state.', kind: 'success' });
      },

      // ─── Tasks ───────────────────────────────────────────────────────────

      moveTaskTo: (taskId, status, beforeTaskId, opts) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        const siblings = state.tasks
          .filter((t) => t.id !== taskId && t.status === status)
          .sort((a, b) => a.order - b.order);

        let order: number;
        if (!beforeTaskId) {
          order = siblings.length ? siblings[siblings.length - 1].order + 1 : 1;
        } else {
          const idx = siblings.findIndex((t) => t.id === beforeTaskId);
          const prev = idx > 0 ? siblings[idx - 1].order : 0;
          const next = idx >= 0 ? siblings[idx].order : (siblings[siblings.length - 1]?.order ?? 0) + 1;
          order = (prev + next) / 2;
        }

        const sameStatus = task.status === status;
        if (sameStatus && Math.abs(task.order - order) < 0.001) return;

        const moved: Task = { ...task, status, order, updatedAt: new Date().toISOString() };
        const patch: Partial<AppState> = { tasks: state.tasks.map((t) => (t.id === taskId ? moved : t)) };

        if (!sameStatus) {
          const activity: Activity = {
            id: nid('ac'),
            projectId: task.projectId,
            type: 'task_moved',
            actorId: state.user?.id ?? 'u_amrit',
            message: `moved ${task.key} from ${STATUS_LABEL[task.status]} to ${STATUS_LABEL[status]}`,
            entityRef: task.key,
            createdAt: new Date().toISOString(),
          };
          patch.activities = [activity, ...state.activities];
        }
        set(patch);
        void api.moveTask(taskId, status);
        if (!opts?.silent && status === 'done' && !sameStatus) {
          get().pushToast({ title: `${task.key} completed`, body: 'Nice — one step closer to the sprint goal.', kind: 'success' });
        }
      },

      moveTask: (taskId, status, opts) => get().moveTaskTo(taskId, status, undefined, opts),

      createTask: (input) => {
        const state = get();
        const project = state.projects.find((p) => p.id === input.projectId) ?? state.projects.find((p) => p.id === state.currentProjectId)!;
        const columnTasks = state.tasks
          .filter((t) => t.projectId === project.id && t.status === (input.status ?? 'todo'))
          .sort((a, b) => a.order - b.order);
        const keyNum = state.tasks.filter((t) => t.projectId === project.id).length + 1;
        const task: Task = {
          id: nid('t'),
          projectId: project.id,
          key: `${project.key}-${keyNum}`,
          title: input.title,
          description: input.description ?? '',
          status: input.status ?? 'todo',
          priority: input.priority ?? 'medium',
          assigneeIds: input.assigneeIds ?? [],
          labelIds: input.labelIds ?? [],
          dueDate: input.dueDate,
          sprintId: input.sprintId,
          points: input.points,
          reporterId: state.user?.id ?? 'u_amrit',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: columnTasks.length ? columnTasks[columnTasks.length - 1].order + 1 : 1,
        };
        const activity: Activity = {
          id: nid('ac'),
          projectId: project.id,
          type: 'task_created',
          actorId: task.reporterId,
          message: `created ${task.key} ${task.title}`,
          entityRef: task.key,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ tasks: [...s.tasks, task], activities: [activity, ...s.activities] }));
        void api.createTask(task);
        get().pushToast({ title: `Task ${task.key} created`, kind: 'success' });
        return task;
      },

      updateTask: (taskId, patch) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)),
        }));
      },

      deleteTask: (taskId) => {
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== taskId),
          comments: s.comments.filter((c) => c.parentId !== taskId),
          attachments: s.attachments.filter((a) => a.parentId !== taskId),
        }));
        get().pushToast({ title: 'Task deleted', kind: 'info' });
      },

      addComment: (parentId, parentType, body) => {
        const state = get();
        const authorId = state.user?.id ?? 'u_amrit';
        const comment: Comment = { id: nid('c'), parentId, parentType, authorId, body, createdAt: new Date().toISOString() };
        const parent = parentType === 'task' ? state.tasks.find((t) => t.id === parentId) : state.issues.find((i) => i.id === parentId);
        const activity: Activity = {
          id: nid('ac'),
          projectId: parent?.projectId ?? state.currentProjectId,
          type: 'comment',
          actorId: authorId,
          message: `commented on ${parent?.key ?? 'a card'}`,
          entityRef: parent?.key,
          createdAt: new Date().toISOString(),
        };
        // Notify assignees other than the author.
        const assigneeIds = parentType === 'task' ? state.tasks.find((t) => t.id === parentId)?.assigneeIds : state.issues.find((i) => i.id === parentId)?.assigneeIds;
        const newNotifications = (assigneeIds ?? [])
          .filter((aid) => aid !== authorId)
          .map((aid) => {
            const assignee = state.users.find((u) => u.id === aid);
            return {
              id: nid('n'),
              type: 'comment' as const,
              title: `${state.user?.name ?? 'Someone'} commented on ${parent?.key}`,
              body: body.slice(0, 90) + (body.length > 90 ? '…' : ''),
              refId: parentId,
              refType: parentType,
              projectId: parent?.projectId ?? state.currentProjectId,
              read: false,
              createdAt: new Date().toISOString(),
              _mention: assignee,
            };
          });
        set((s) => ({
          comments: [...s.comments, comment],
          activities: [activity, ...s.activities],
          notifications: [...newNotifications.map(({ _mention, ...n }) => n), ...s.notifications],
        }));
        void api.addComment(parentId, body);
      },

      addAttachment: (parentId, parentType, name) => {
        const state = get();
        const parent = parentType === 'task' ? state.tasks.find((t) => t.id === parentId) : state.issues.find((i) => i.id === parentId);
        const attachment: Attachment = {
          id: nid('a'),
          parentId,
          parentType,
          name,
          size: `${(Math.random() * 4 + 0.2).toFixed(1)} MB`,
          kind: name.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? 'image' : name.match(/\.pdf$/i) ? 'pdf' : name.match(/\.(log|txt|json)$/i) ? 'log' : name.match(/\.(fig|sketch)$/i) ? 'design' : 'code',
          uploadedById: state.user?.id ?? 'u_amrit',
          createdAt: new Date().toISOString(),
        };
        const activity: Activity = {
          id: nid('ac'),
          projectId: parent?.projectId ?? state.currentProjectId,
          type: 'comment',
          actorId: attachment.uploadedById,
          message: `attached ${name} to ${parent?.key ?? 'a card'}`,
          entityRef: parent?.key,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ attachments: [...s.attachments, attachment], activities: [activity, ...s.activities] }));
        get().pushToast({ title: 'File uploaded', body: name, kind: 'success' });
      },

      // ─── Issues ──────────────────────────────────────────────────────────

      createIssue: (input) => {
        const state = get();
        const project = state.projects.find((p) => p.id === input.projectId) ?? state.projects.find((p) => p.id === state.currentProjectId)!;
        const keyNum = state.issues.filter((i) => i.projectId === project.id).length + 1;
        const issue: Issue = {
          id: nid('i'),
          projectId: project.id,
          key: `IS-${keyNum}`,
          title: input.title,
          description: input.description ?? '',
          status: input.status ?? 'open',
          priority: input.priority ?? 'medium',
          reporterId: state.user?.id ?? 'u_amrit',
          assigneeIds: input.assigneeIds ?? [],
          labelIds: input.labelIds ?? input.labelIds ?? [],
          linkedTaskIds: input.linkedTaskIds ?? [],
          linkedPrNumbers: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const activity: Activity = {
          id: nid('ac'),
          projectId: project.id,
          type: 'issue_created',
          actorId: issue.reporterId,
          message: `opened ${issue.key} ${issue.title}`,
          entityRef: issue.key,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ issues: [...s.issues, issue], activities: [activity, ...s.activities] }));
        get().pushToast({ title: `Issue ${issue.key} created`, kind: 'success' });
        return issue;
      },

      updateIssue: (issueId, patch) => {
        set((s) => ({
          issues: s.issues.map((i) => (i.id === issueId ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i)),
        }));
      },

      // ─── Notifications ───────────────────────────────────────────────────

      markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      // ─── GitHub ──────────────────────────────────────────────────────────

      connectGitHub: () => {
        const seed = seedData();
        set({ github: seed.github });
        get().pushToast({ title: 'GitHub connected', body: 'Repositories, PRs and webhooks are now syncing.', kind: 'success' });
      },

      disconnectGitHub: () => {
        set({ github: { connected: false, login: '', repos: [], pullRequests: [], commits: [], branches: [] } });
        get().pushToast({ title: 'GitHub disconnected', kind: 'info' });
      },

      syncGitHub: async () => {
        await new Promise((r) => setTimeout(r, 900));
        get().pushToast({ title: 'GitHub synced', body: 'Repositories, pull requests and commits are up to date.', kind: 'success' });
      },

      // ─── Toasts & realtime ───────────────────────────────────────────────

      pushToast: (t) => {
        const id = nid('toast');
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
        setTimeout(() => get().dismissToast(id), 5200);
      },

      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      tickRealtime: () => {
        const state = get();
        if (!state.liveSimulation || !state.user) return;
        const event = makeRealtimeEvent();

        if (event.statusChange) {
          const task = state.tasks.find((t) => t.id === event.statusChange!.taskId);
          if (task && task.status !== event.statusChange.status) {
            const siblings = state.tasks
              .filter((t) => t.id !== task.id && t.status === event.statusChange!.status)
              .sort((a, b) => a.order - b.order);
            const moved: Task = { ...task, status: event.statusChange.status, order: siblings.length ? siblings[siblings.length - 1].order + 1 : 1, updatedAt: new Date().toISOString() };
            set((s) => ({ tasks: s.tasks.map((t) => (t.id === task.id ? moved : t)) }));
          }
        }
        const activity = eventToActivity(event, state.currentProjectId);
        const notification = eventToNotification(event, state.currentProjectId);
        set((s) => ({
          activities: [activity, ...s.activities],
          notifications: notification ? [notification, ...s.notifications] : s.notifications,
        }));
        const actor = state.users.find((u) => u.id === event.actorId);
        get().pushToast({
          title: event.notification?.title ?? 'Activity',
          body: `${actor?.name ?? 'Teammate'} — ${event.notification?.body ?? event.message}`,
          kind: 'realtime',
        });
      },
    }),
    {
      name: 'devflow-store-v1',
      partialize: (s) => ({
        user: s.user,
        theme: s.theme,
        currentWorkspaceId: s.currentWorkspaceId,
        currentProjectId: s.currentProjectId,
        users: s.users,
        workspaces: s.workspaces,
        projects: s.projects,
        labels: s.labels,
        sprints: s.sprints,
        tasks: s.tasks,
        issues: s.issues,
        comments: s.comments,
        attachments: s.attachments,
        activities: s.activities,
        notifications: s.notifications,
        github: s.github,
        liveSimulation: s.liveSimulation,
      }),
    },
  ),
);

// ─── Derived selectors ─────────────────────────────────────────────────────────

export const useCurrentProject = () => useAppStore((s) => s.projects.find((p) => p.id === s.currentProjectId));
export const useCurrentWorkspace = () => useAppStore((s) => s.workspaces.find((w) => w.id === s.currentWorkspaceId));
// NOTE: these selectors derive new arrays, so they must be wrapped in useShallow —
// otherwise useSyncExternalStore sees a fresh snapshot on every render and loops.
export const useProjectTasks = () => useAppStore(useShallow((s) => s.tasks.filter((t) => t.projectId === s.currentProjectId)));
export const useProjectIssues = () => useAppStore(useShallow((s) => s.issues.filter((i) => i.projectId === s.currentProjectId)));
export const useProjectSprints = () => useAppStore(useShallow((s) => s.sprints.filter((sp) => sp.projectId === s.currentProjectId)));
export const useProjectActivity = () => useAppStore(useShallow((s) => s.activities.filter((a) => a.projectId === s.currentProjectId)));
export const useUnreadCount = () => useAppStore((s) => s.notifications.filter((n) => !n.read).length);
export const useUserById = (id: ID) => useAppStore((s) => s.users.find((u) => u.id === id));
export const useLabelById = (id: ID) => useAppStore((s) => s.labels.find((l) => l.id === id));

export { DAY };