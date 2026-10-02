// ─── Seed assembly ─────────────────────────────────────────────────────────────
// Bundles the curated dataset from data.ts into a single bootstrap payload.

import {
  ACTIVITIES,
  ATTACHMENTS,
  COMMENTS,
  CURRENT_USER_ID,
  GITHUB,
  ISSUES,
  LABELS,
  NOTIFICATIONS,
  PROJECTS,
  SPRINTS,
  TASKS,
  USERS,
  WORKSPACES,
} from './data';

export function seedData() {
  return {
    users: USERS,
    workspaces: WORKSPACES,
    projects: PROJECTS,
    labels: LABELS,
    sprints: SPRINTS,
    tasks: TASKS,
    issues: ISSUES,
    comments: COMMENTS,
    attachments: ATTACHMENTS,
    activities: ACTIVITIES,
    notifications: NOTIFICATIONS,
    github: GITHUB,
    currentUserId: CURRENT_USER_ID,
  };
}

export type SeedData = ReturnType<typeof seedData>;
