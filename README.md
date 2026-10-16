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
- Protected task endpoints for creating and listing a project's tasks.
- A task board with Todo, In progress, and Done columns, plus a Create Task form.
- Prisma and PostgreSQL models for users, workspaces, workspace memberships, projects, and tasks.
- Prisma 7 Client with a PostgreSQL driver adapter; Prisma 8 migration work is being introduced alongside it.

The main working flow is: sign in → create/select a workspace → create/select a project → create tasks → view tasks on the board. The activity feed and the remaining dashboard tabs are still sample UI.

## Project layout

- `frontend/` — React, TypeScript, Vite, Tailwind CSS, Supabase client, and UI features.
- `backend/` — Express API, authentication middleware, workspace services, and Prisma database schema/migrations.
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

For local testing, Supabase email confirmation can be enabled or disabled in the Email provider settings. If confirmation is enabled, use an email inbox you can access. Before public use, configure an email sender and choose the confirmation behavior you want for your app.

## Environment variables

Create `backend/.env`:

```env
DATABASE_URL="paste-your-supabase-session-pooler-connection-string"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
PORT=4000
```

Create `frontend/.env`:

```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
VITE_API_URL="http://localhost:4000"
```

Use the Project URL and publishable key from the same Supabase project in both files. Never put a Supabase secret or `service_role` key in the frontend. Local `.env` files are ignored by Git. Restart the development server after changing environment variables.

## Install and prepare the backend

From the project root:

```sh
cd backend
npm install
npx prisma7 migrate deploy
npm run dev
```

The backend's `dev` and `build` scripts generate Prisma Client 7 before running. Use `prisma7` for the current schema and migration workflow; `prisma` is the Prisma 8 CLI, which is installed for a staged migration and does not run the older `generate` or `migrate deploy` commands.

## Install and run the frontend

Open a second terminal from the project root:

```sh
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## API endpoints

| Method | Path | Purpose | Authentication |
| --- | --- | --- | --- |
| `GET` | `/api/v1/health` | Check that the API is running. | Public |
| `GET` | `/api/v1/auth/me` | Return the authenticated user's ID and email. | Supabase Bearer token required |
| `GET` | `/api/v1/workspaces` | List workspaces the authenticated user belongs to, including their role. | Supabase Bearer token required |
| `POST` | `/api/v1/workspaces` | Create a workspace and make the authenticated user its owner. | Supabase Bearer token required |
| `GET` | `/api/v1/workspaces/:workspaceId/projects` | List projects in a workspace. | Supabase Bearer token required |
| `POST` | `/api/v1/workspaces/:workspaceId/projects` | Create a project in a workspace. | Supabase Bearer token required |
| `GET` | `/api/v1/projects/:projectId/tasks` | List tasks in a project. | Supabase Bearer token required |
| `POST` | `/api/v1/projects/:projectId/tasks` | Create a task in a project. | Supabase Bearer token required |

The workspace endpoint expects a JSON body such as:

```json
{
  "name": "Design Team"
}
```

The project endpoint expects:

```json
{
  "name": "Marketing website",
  "description": "Optional project context"
}
```

The task endpoint expects:

```json
{
  "title": "Design the task board",
  "description": "Optional task context",
  "status": "TODO",
  "priority": "HIGH"
}
```

Valid task statuses are `TODO`, `IN_PROGRESS`, and `DONE`. Valid priorities are `LOW`, `MEDIUM`, and `HIGH`.

## Production builds

Run each build from its own folder:

```sh
cd frontend
npm run build
```

```sh
cd backend
npm run build
```
