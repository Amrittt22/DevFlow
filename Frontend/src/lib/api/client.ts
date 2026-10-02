// ─── Mock REST client ──────────────────────────────────────────────────────────
// Mirrors the Express API from the spec (§13): Request → Route → Middleware →
// Controller → Service → Repository/Prisma → PostgreSQL.
//
// In production each method below maps to an HTTP call:
//   bootstrap()        → GET  /api/bootstrap            (workspace scope)
//   moveTask()         → PATCH /api/tasks/:id           { status, order }
//   createTask()       → POST  /api/tasks
//   addComment()       → POST  /api/tasks/:id/comments
// Persistence is simulated with localStorage so the demo survives reloads.

import type { Task, TaskStatus } from '../types';
import { seedData, type SeedData } from '../mock/seed';

const delay = (ms = 120 + Math.random() * 240) => new Promise<void>((r) => setTimeout(r, ms));

export const api = {
  /** Initial payload for the current workspace. ~400-700ms to show skeletons. */
  async bootstrap(): Promise<SeedData> {
    await delay(500 + Math.random() * 300);
    return seedData();
  },

  async moveTask(taskId: string, status: TaskStatus): Promise<{ ok: true }> {
    await delay(90);
    void taskId;
    void status;
    return { ok: true };
  },

  async createTask(task: Task): Promise<{ ok: true }> {
    await delay(90);
    void task;
    return { ok: true };
  },

  async addComment(parentId: string, body: string): Promise<{ ok: true }> {
    await delay(90);
    void parentId;
    void body;
    return { ok: true };
  },
};
