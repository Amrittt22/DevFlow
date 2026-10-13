# DevFlow — Project Plan Sheet

**Project:** DevFlow  
**Positioning:** A full-stack collaboration platform for software teams to plan work, track issues and sprints, and connect delivery activity to GitHub.  
**Audience:** Hiring teams evaluating full-stack engineering, product thinking, API design, data modeling, and delivery skills.

## Product goal

Help a small engineering team understand what is planned, what is in progress, who owns it, and how work is moving from task to pull request to completion.

## Product principles

- Ship a cohesive, usable core before adding infrastructure for its own sake.
- Enforce workspace and project permissions on the server for every protected operation.
- Make work visible through clear status, ownership, history, and activity.
- Keep integrations and advanced services optional until the core workflow is reliable.

## Target users and roles

- **Workspace admin:** manages workspace settings, members, and access.
- **Project manager:** creates projects, plans sprints, and organizes work.
- **Developer:** updates assigned work, collaborates, and links code activity.

## Proposed stack

| Area | Choice |
|---|---|
| Web app | React + TypeScript |
| Styling | Tailwind CSS |
| API | Node.js + Express + TypeScript, REST under `/api/v1` |
| Data store | PostgreSQL |
| Data access | Prisma |
| Authentication | Supabase Auth, with server-verified identity |
| File storage | Supabase Storage, added when attachments are in scope |
| Validation | Zod |
| Cache / rate limiting | Redis, introduced when a measured use case exists |
| Tests | Vitest or Jest, Supertest, and browser-level flow tests |
| Local environment | Start with the simplest reproducible local setup; add Docker Compose after learning Docker |
| Deployment | Vercel for web; a suitable container host for API and workers |
| CI | GitHub Actions |

## MVP scope

The first complete release should support:

1. Sign in and a user profile.
2. Workspaces with membership and roles.
3. Projects scoped to a workspace.
4. Tasks with description, assignee, status, priority, labels, due date, comments, and activity history.
5. A Kanban board, list view, and useful filters.
6. Issues with reporter, assignee, status, labels, comments, related tasks, and activity history.
7. Basic sprint planning and progress tracking.
8. A workspace/project activity feed for important events such as assignments, status changes, issue creation, and comments.
9. Responsive layouts, empty/loading/error states, and a demo path.

Keep GitHub integration, Redis, real-time collaboration, and AI out of the critical MVP path. Add them as separate, demonstrable milestones after the core workflow works end to end.

## Data model starting point

```text
User ──< WorkspaceMember >── Workspace ──< Project
User ──< ProjectMember >── Project
Project ──< Task >── User (assignee)
Project ──< Issue >── User (reporter / assignee)
Project ──< Sprint ──< SprintTask >── Task
Task ──< Comment
Issue ──< Comment
Task / Issue ──< AttachmentMetadata
Task / Issue ──< ActivityEvent
User ──< Notification
Workspace ──< GitHubAccount / GitHubRepository / PullRequest / WebhookEvent
```

Core entities include `User`, `Workspace`, `WorkspaceMember`, `Project`, `ProjectMember`, `Task`, `TaskLabel`, `Issue`, `Comment`, `Attachment`, `Sprint`, `Notification`, `Activity`, `GitHubAccount`, `GitHubRepository`, `PullRequest`, and `WebhookEvent`. Every workspace-owned record should be traceable to its workspace or project. Store attachment metadata and ownership in PostgreSQL and file bytes in object storage. Add database constraints and indexes for common access paths, including workspace/project membership, project task status, assignee, and sprint membership. Use migrations as the source of truth for schema changes.

## Roadmap and deliverables

### Phase 1 — Product definition and foundation

- Confirm the core user journey and MVP boundaries.
- Sketch dashboard, project, board, issue, sprint, and settings screens.
- Create repository, README outline, environment variable example, and ignore rules.
- Set up client and server TypeScript applications, formatting, linting, and local scripts.
- Define API conventions, error response shape, and initial Prisma schema.

**Exit check:** a fresh clone can start locally, and the architecture and MVP are documented.

### Phase 2 — Identity, workspace, and authorization

- Implement sign-in, sign-out, profile retrieval, and protected routes.
- Verify Supabase identity on the server; never trust a client-supplied user ID or role.
- Add workspace creation, invitations or member addition, and role assignment.
- Add project membership and project-scoped permissions in addition to workspace membership.
- Centralize authorization checks and test access boundaries between workspaces.

**Exit check:** users can only read or change data in workspaces they belong to, at the role allowed.

### Phase 3 — Projects and task workflow

- Create, update, archive, and list projects.
- Implement task creation, editing, assignment, status, priority, labels, and due dates.
- Add board and list views with filtering, sorting, and pagination.
- Record task activity for meaningful changes.

**Exit check:** a team can create a project and move tasks through `TODO → IN_PROGRESS → REVIEW → DONE`.

Task drag-and-drop must persist the status/order change through the API. Add real-time propagation in Phase 8.

### Phase 4 — Issues and collaboration

- Add issue reporting, assignment, labels, priority, status, and comments.
- Show activity history and link issues to tasks where useful.
- Add optional file attachments with storage access policies and file-size/type limits.
- Store attachment metadata and ownership in PostgreSQL while storing file bytes in Supabase Storage; validate type, size, and authorization.
- Add notifications for assignments, mentions, comments, and deadlines as the notification flow is introduced.

**Exit check:** users can report, discuss, assign, and resolve an issue with an auditable history.

### Phase 5 — Sprints and dashboards

- Create sprints with start/end dates and planned tasks.
- Show sprint progress using clear completed, in-progress, and remaining counts.
- Add a project dashboard for open work, overdue items, and recent activity.
- Add project overview, members, tasks, issues, sprints, and activity as dashboard sections; show PRs and commits after GitHub integration.
- Defer velocity and burndown charts until there is enough consistent history to make them meaningful.
- Present analytics as project delivery signals; do not turn them into simplistic individual productivity scores.

**Exit check:** a team can plan a sprint and understand its current state from the dashboard.

### Phase 6 — Reliability and API hardening

- Add request validation, centralized error handling, pagination, filtering, and sorting.
- Configure CORS, secure headers, rate limits, structured logs, and health endpoints.
- Add transactions for multi-record changes and indexes based on query patterns.
- Define behavior for database, storage, and external service failures.

**Exit check:** errors are predictable, sensitive values stay out of logs, and common queries are bounded.

### Phase 7 — GitHub integration

- Connect a GitHub account using least-privilege authorization.
- Let users associate a repository with a project.
- Display pull requests and repository activity; link PRs to DevFlow issues/tasks.
- Include repository, commit, and branch views where supported by the GitHub API and granted scopes.
- Verify webhook signatures, handle retries and duplicate delivery safely (idempotency), and retain integration status.
- Update linked work when a PR is merged, with clear rules and an activity record.

**Exit check:** a demo shows a linked issue moving through a real repository workflow.

### Phase 8 — Real-time updates and notifications

- Add Socket.IO or another WebSocket layer for task, comment, and notification updates.
- Authorize each connection and room against workspace membership.
- Persist important notifications; treat online presence as temporary state.
- Add selected presence or typing indicators only if they improve collaboration, and design event delivery so it can later work across multiple API instances.
- Keep ordinary page refresh and API behavior usable if sockets disconnect.

**Exit check:** a second user sees key changes without refreshing, with permission checks preserved.

### Phase 9 — Redis, only for clear needs

- Begin with rate limiting or caching a measured, frequently requested read.
- Set TTLs and invalidation behavior; avoid caching authorization decisions carelessly.
- Learn and document cache-aside behavior, cache misses, TTLs, and invalidation for the chosen cached path.
- Consider queues for webhook or notification processing if response work becomes slow.
- Make the application degrade safely if Redis is unavailable.

**Exit check:** document the before/after behavior and why Redis improves a real path.

### Phase 10 — Testing, deployment, and portfolio finish

- Unit-test domain rules and validation.
- Integration-test authentication, authorization, API behavior, and database interactions.
- Cover key user journeys in browser tests: create workspace, create project, move task, plan sprint.
- Add CI checks for formatting, linting, type checking, and the test suite.
- After learning Docker, containerize the API and supporting services; provide Docker Compose for reproducible local development, health checks, and environment-specific configuration.
- Deploy HTTPS app and API, configure secrets, migrations, health checks, backups, and basic monitoring.
- Publish screenshots, architecture diagram, setup instructions, demo credentials or demo mode, and a short walkthrough.

**Exit check:** a reviewer can open the live app, understand its purpose, and reproduce the development setup.

### Later — AI features

Only add these after the core product and GitHub integration are reliable. Keep AI behind a service boundary with usage limits, logging, cost controls, and output evaluation:

- Break an issue into suggested implementation tasks.
- Summarize a pull request using repository context.
- Draft release notes from merged pull requests.
- Answer repository questions with citations to relevant files.

Require user review before AI-generated content changes project data. Show sources and handle unavailable or unauthorized repository context clearly.

## API outline

```text
/api/v1/users/me
/api/v1/workspaces
/api/v1/workspaces/:workspaceId/members
/api/v1/projects
/api/v1/projects/:projectId/tasks
/api/v1/projects/:projectId/issues
/api/v1/projects/:projectId/sprints
/api/v1/github/connections
/api/v1/github/webhooks
```

Use consistent status codes, validation errors, cursor or page pagination, and server-side authorization for every workspace-scoped endpoint.

## Suggested repository layout

```text
devflow/
├── client/
│   └── src/{components,features,hooks,services,types,utils}/
├── server/
│   ├── src/{routes,controllers,services,repositories,middleware,validators,config}/
│   └── prisma/{schema.prisma,migrations}/
├── docs/
│   ├── architecture.md
│   └── product-plan.md
├── docker-compose.yml
├── .env.example
└── README.md
```

Keep the request flow understandable: route → middleware → controller → service → repository/Prisma → PostgreSQL. Keep controllers thin and business rules in services/domain modules rather than embedding them in route handlers or UI components. Use consistent API response shapes.

## Quality and security checklist

- Validate all external input and escape/render user content safely.
- Check workspace membership and role on the server for every protected operation.
- Store secrets only in environment configuration; commit `.env.example`, never real credentials.
- Use least-privilege OAuth scopes and verify GitHub webhook signatures.
- Enforce upload limits and storage policies if attachments are enabled.
- Add rate limits, secure headers, HTTPS, and structured logs without tokens or private payloads.
- Use migrations, backups, and health checks for production data.
- Provide accessible labels, keyboard navigation, responsive behavior, and clear failure states.

## Success measures

Measure these after implementation and report only observed results:

- Number of complete user flows demonstrated.
- API response time for representative dashboard requests.
- Test coverage of critical domain rules and authorization paths.
- Successful webhook processing and duplicate-delivery handling.
- Usability feedback from a few developers trying the demo.

Avoid claiming scale (for example, “100 users” or “1,000 requests”) unless a repeatable load test was run and its setup and results are documented.

## Resume target

> Built and deployed **DevFlow**, a full-stack collaboration platform for engineering teams, using React, TypeScript, Express, PostgreSQL, and Prisma. Implemented workspace-level role-based access, task and issue workflows, sprint planning, and GitHub pull request integration; added automated API tests and CI. *(Replace or extend this with only shipped features and measured results.)*

## Definition of done

- **MVP:** authentication, workspace roles, projects, tasks, issues, and sprint basics work end to end.
- **Portfolio release:** deployed app, clean onboarding, screenshots, architecture notes, CI, and meaningful automated coverage.
- **Advanced release:** GitHub integration, real-time updates, and Redis each have a working demo and documented design reason.
- **AI extension:** useful, source-grounded assistance with user review and clear failure behavior.
