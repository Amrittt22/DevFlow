CREATE TYPE "TaskActivityType" AS ENUM (
  'TASK_CREATED',
  'TASK_UPDATED',
  'STATUS_CHANGED',
  'LABELS_CHANGED',
  'ASSIGNEES_CHANGED',
  'TASK_DELETED'
);

CREATE TABLE "TaskActivity" (
  "id" TEXT NOT NULL,
  "taskId" TEXT,
  "projectId" TEXT NOT NULL,
  "actorId" TEXT,
  "type" "TaskActivityType" NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskActivity_taskId_createdAt_idx"
  ON "TaskActivity"("taskId", "createdAt");

CREATE INDEX "TaskActivity_projectId_createdAt_idx"
  ON "TaskActivity"("projectId", "createdAt");

CREATE INDEX "TaskActivity_actorId_idx"
  ON "TaskActivity"("actorId");

ALTER TABLE "TaskActivity"
  ADD CONSTRAINT "TaskActivity_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TaskActivity"
  ADD CONSTRAINT "TaskActivity_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskActivity"
  ADD CONSTRAINT "TaskActivity_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;