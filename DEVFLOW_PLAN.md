# DevFlow — Implementation Plan

## Product goal

DevFlow is a full-stack collaboration platform where software teams can plan projects, organize tasks, track issues, coordinate sprints, and see how work progresses.

## Current progress

The foundation is complete and the project is approximately **50% complete** against this expanded plan.

### Completed

- Supabase email authentication and protected frontend routes.
- Express API with server-side Supabase token verification.
- PostgreSQL database with Prisma migrations.
- Workspace creation and workspace membership checks.
- Project creation, loading, selection, and browser persistence.
- Task creation, loading, editing, deletion, priorities, and due dates.
- Todo, In Progress, and Done task board.
- Drag-and-drop task status changes that persist in the database.
- Task List view.
- Calendar view with due-date navigation and task editing.
- Task search and filters for status, priority, and due dates.
- Reusable workspace labels with custom names and colors.
- Create labels from task forms and assign or remove labels from tasks.
- Labels displayed in Board, List, and Calendar views.
- Task-label authorization checks ensure labels belong to the task workspace.
- Workspace, project, and active-tab persistence after browser refresh.
- Frontend refactor: separated app types, data hooks, task views, and modal components.
- Frontend and backend production builds pass after the refactor.
- Responsive Tailwind interface with light and dark modes.

## Core user journey

```text
Sign in
→ Create or select a workspace
→ Create or select a project
→ Create, label, prioritize, schedule, edit, delete, and complete tasks
→ Collaborate through comments and activity
→ Plan work in sprints and track progress
```

## Technology stack

| Area | Choice |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, REST API |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| ORM | Prisma 7 Client with PostgreSQL driver adapter |
| Validation | Zod |
| Caching and background jobs | Redis |
| Future local environment | Docker and Docker Compose |
| Future continuous integration | GitHub Actions |

## Phase 1 — Complete task management

### Completed

- [x] Add a Calendar view for tasks with due dates.
- [x] Add task search and filters for status, priority, and due date.
- [x] Add reusable workspace labels with custom colors.
- [x] Allow labels to be assigned and removed from tasks.
- [x] Improve task loading, empty, error, and confirmation states.
- [x] Preserve the selected workspace, project, and view after refresh.

### Remaining

- [ ] Add sorting by status, priority, due date, label, and assignee.
- [ ] Add task assignment to workspace members.
- [ ] Improve task-form keyboard and accessibility behavior.

### Exit check

A team can create, find, assign, prioritize, schedule, edit, delete, and complete work in a project.

## Phase 2 — Workspace collaboration

### Goals

- Show workspace members in the interface.
- Invite members by email.
- Manage Owner, Admin, and Member roles.
- Add project membership where it improves access control.
- Add task comments.
- Record activity for task creation, edits, status changes, assignments, comments, and deletion.
- Add in-app notifications for assignments, comments, and approaching due dates.

### Exit check

Multiple users can collaborate in the same workspace with clear ownership, role checks, and a visible history of changes.

## Phase 3 — Planning views and sprints

### Goals

- Finish the Calendar view.
- Build a Timeline view.
- Create sprints with start and end dates.
- Add tasks to sprints.
- Show sprint progress: Todo, In Progress, Done, and remaining work.
- Build a project overview with open, completed, overdue, and recent work.

### Exit check

A team can plan a sprint and understand project progress from the dashboard.

## Phase 4 — Issue tracking

### Goals

- Add issues separately from regular tasks.
- Support issue title, description, status, priority, labels, reporter, and assignee.
- Add issue comments and activity history.
- Link related issues and tasks.

### Exit check

A user can report, discuss, assign, and resolve an issue with a complete audit trail.

## Phase 5 — Reliability and product quality

### Goals

- Standardize API error responses.
- Add validation and authorization checks for every protected route.
- Add task pagination, filtering, and sorting on the server where needed.
- Improve keyboard navigation, labels, focus states, and mobile layouts.
- Add frontend empty, loading, retry, and error states.
- Add unit tests for validation and service rules.
- Add API integration tests for authentication and workspace permissions.
- Add browser flow tests for the main user journey.

### Exit check

The main user journey is reliable, accessible, tested, and easy to demonstrate.

## Phase 6 — Docker, GitHub Actions, and deployment

### Docker goals

- Learn containers, images, ports, volumes, and environment variables.
- Create a Dockerfile for the frontend.
- Create a Dockerfile for the backend.
- Add Docker Compose for reproducible local development with frontend, backend, and Redis services.

### Redis goals

- Learn Redis keys, expiry times, and in-memory data storage.
- Add API rate limiting for sensitive and frequently used endpoints.
- Add a background-job queue for assignment, comment, and due-date notifications.
- Keep notification work out of the main API request so users receive faster responses.
- Add dashboard caching only after measuring a slow or frequently repeated query.

### GitHub Actions goals

- Learn continuous integration workflows.
- Run frontend and backend builds automatically for every push and pull request.
- Run tests automatically after they are added.
- Learn how to read and fix failed workflow logs.

### Deployment goals

- Deploy the frontend and backend.
- Configure production environment variables and database migrations.
- Add health checks and basic monitoring.
- Publish setup instructions, screenshots, and a project walkthrough.

### Exit check

A reviewer can clone, build, test, and run DevFlow consistently, then access a deployed demo.

## Later milestones

These are not part of the core plan until the application is stable.

- GitHub repository and pull request integration.
- Real-time task updates and notifications.
- AI task suggestions, issue breakdowns, pull request summaries, and release-note drafts.

## Working rules

- Every workspace-scoped operation must verify membership on the backend.
- Never expose Supabase secrets or database credentials in the frontend or Git history.
- Use Prisma migrations as the source of truth for database changes.
- Add database indexes for frequently queried relationships and filters.
- Build and verify frontend and backend after each completed feature.
- Update the README whenever user-facing functionality or setup steps change.
