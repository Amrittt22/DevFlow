# DevFlow

DevFlow is an early-stage collaboration platform for software teams to plan projects, track tasks and issues, and coordinate sprints.

## Current features

- Responsive React dashboard built with TypeScript and Tailwind CSS, including light and dark themes.
- Supabase email sign-up, sign-in, session tracking, and sign-out.
- Express API with a health endpoint and a protected endpoint for the current user.
- Protected workspace endpoints for creating workspaces and listing the signed-in user's workspaces.
- Workspace creation from the dashboard, with workspace selection remembered in the browser.
- Protected project endpoints for creating and listing projects in a workspace.
- Project selection remembered in the browser, with real projects shown in the dashboard sidebar.
- Protected task endpoints for creating, listing, and editing project tasks.
- A task board with Todo, In Progress, and Done columns.
- Task creation and editing for title, description, status, priority, and due date.
- Task status changes persist through the backend and remain after refresh.
- Prisma and PostgreSQL models for users, workspaces, workspace memberships, projects, and tasks.
- Prisma 7 Client with a PostgreSQL driver adapter; Prisma 8 migration work is being introduced alongside it.

The main working flow is:

```text
Sign in → Create/select workspace → Create/select project → Create task
→ View board → Change status → Edit task details
```
The activity feed and the remaining dashboard tabs are still sample UI.

## Project layout

- `frontend/` — React, TypeScript, Vite, Tailwind CSS, Supabase client, and UI features.
- `backend/` — Express API, authentication middleware, workspace services, task services, and Prisma database schema/migrations.
- `docs/` — architecture and product planning documents.
- `DEVFLOW_PLAN.md` — product scope and delivery roadmap.

## Prerequisites

- Node.js and npm.
- A Supabase project with Email authentication enabled.
- A PostgreSQL connection string from the Supabase project.

## Supabase setup

1. Create a Supabase project.
2. In **Authentication → URL Configuration**, add `http://localhost:5173/**` to the redirect URLs.
3. In **Project Settings → API Keys**, copy the Project URL and publishable key.
4. Copy the Session Pooler connection string from the Supabase database settings.
For local testing, Supabase email confirmation can be enabled or disabled in the Email provider settings. If confirmation is enabled, use an email inbox you can access.

## Environment variables
Create `backend/.env`:

```
DATABASE_URL="paste-your-supabase-session-pooler-connection-string"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
PORT=4000
```
Create `frontend/.env`:

```
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
VITE_API_URL="http://localhost:4000"
```
Use the Project URL and publishable key from the same Supabase project in both files. Never put a Supabase secret or `service_role` key in the frontend. Local `.env` files are ignored by Git.

## Install and prepare the backend
From the project root:

```
cd backend
npm install
npx prisma7 migrate deploy
npm run dev
```
The backend `dev` and `build` scripts generate Prisma Client 7 before running. Use `prisma7` for the current schema and migration workflow.

## Install and run the frontend
Open a second terminal from the project root:

```
cd frontend
npm install
npm run dev
```
Open the local Vite URL, usually `http://localhost:5173`.

## API endpoints

| Method | Path | Purpose | Authentication |
| --- | --- | --- | --- |
| `GET` | `/api/v1/health` | Check that the API is running. | Public |
| `GET` | `/api/v1/auth/me` | Return the authenticated user's ID and email. | Supabase Bearer token required |
| `GET` | `/api/v1/workspaces` | List workspaces the authenticated user belongs to. | Supabase Bearer token required |
| `POST` | `/api/v1/workspaces` | Create a workspace and make the user its owner. | Supabase Bearer token required |
| `GET` | `/api/v1/workspaces/:workspaceId/projects` | List projects in a workspace. | Supabase Bearer token required |
| `POST` | `/api/v1/workspaces/:workspaceId/projects` | Create a project in a workspace. | Supabase Bearer token required |
| `GET` | `/api/v1/projects/:projectId/tasks` | List tasks in a project. | Supabase Bearer token required |
| `POST` | `/api/v1/projects/:projectId/tasks` | Create a task in a project. | Supabase Bearer token required |
| `PATCH` | `/api/v1/tasks/:taskId` | Update task details or status. | Supabase Bearer token required |

## Example request bodies
Create a workspace:

```
{
  "name": "Design Team"
}
```
Create a project:

```
{
  "name": "Marketing Website",
  "description": "Website redesign work"
}
```
Create a task:

```
{
  "title": "Design the task board",
  "description": "Create Todo, In Progress, and Done columns.",
  "status": "TODO",
  "priority": "HIGH"
}
```
Update a task:

```
{
  "title": "Design the updated task board",
  "description": "Add responsive board cards.",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "dueDate": "2026-11-01T12:00:00.000Z"
}
```
Valid task statuses are `TODO`, `IN_PROGRESS`, and `DONE`.

Valid priorities are `LOW`, `MEDIUM`, and `HIGH`.

Send `null` for `description` or `dueDate` to remove the current value.

## Production builds
Run each build from its own folder:

```
cd frontend
npm run build
```

```
cd backend
npm run build
```
