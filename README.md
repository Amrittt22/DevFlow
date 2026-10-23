# DevFlow

DevFlow is a full-stack collaboration platform for software teams to create workspaces, manage projects, organize tasks, and track progress.

## Current features

- Responsive React dashboard built with TypeScript and Tailwind CSS.
- Light and dark themes.
- Supabase email sign-up, sign-in, session tracking, and sign-out.
- Express API with server-side Supabase token verification.
- PostgreSQL database hosted on Supabase and accessed through Prisma.
- Protected workspace creation and workspace listing.
- Protected project creation and project listing inside workspaces.
- Project selection in the sidebar, remembered in the browser.
- Task creation, loading, editing, and deletion.
- Task title, description, status, priority, and optional due date.
- Task Board with Todo, In Progress, and Done columns.
- Drag-and-drop task status changes that persist in the database.
- List view for project tasks.
- Calendar view for tasks with due dates.
- Search tasks by title or description.
- Filter tasks by status, priority, and due-date availability.
- Protected backend authorization checks for workspace-scoped data.
- Prisma 7 Client with a PostgreSQL driver adapter.

## Current user flow

```text
Sign in
→ Create or select a workspace
→ Create or select a project
→ Create tasks
→ View tasks in Board, List, or Calendar
→ Search and filter tasks
→ Edit, delete, or move tasks between statuses
```

## Project layout

```text
DevFlow/
├── frontend/              # React, TypeScript, Vite, Tailwind CSS
│   └── src/
│       ├── app/
│       ├── features/
│       ├── lib/
│       └── services/
├── backend/               # Express API, Prisma, Supabase integration
│   ├── prisma/
│   └── src/
│       ├── modules/
│       ├── routes/
│       ├── middleware/
│       └── config/
├── docs/                  # Architecture and planning documents
├── DEVFLOW_PLAN.md        # Implementation roadmap
└── README.md
```

## Prerequisites

- Node.js and npm
- A Supabase project with Email authentication enabled
- A Supabase PostgreSQL Session Pooler connection string

## Supabase setup

1. Create a Supabase project.
2. Open **Authentication → URL Configuration**.
3. Add `http://localhost:5173/**` to Redirect URLs.
4. Open **Project Settings → API Keys**.
5. Copy the Project URL and publishable key.
6. Open your database connection settings and copy the Session Pooler connection string.

For local testing, email confirmation can be enabled or disabled in the Supabase Email provider settings.

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

Never commit `.env` files or Supabase secret keys.

## Run the backend

From the project root:

```sh
cd backend
npm install
npx prisma7 migrate deploy
npm run dev
```

The backend runs on `http://localhost:4000`.

Use `prisma7` for schema and migration commands in this project.

## Run the frontend

Open a second terminal from the project root:

```sh
cd frontend
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

## API endpoints

| Method | Path | Purpose | Authentication |
| --- | --- | --- | --- |
| `GET` | `/api/v1/health` | Check whether the API is running. | Public |
| `GET` | `/api/v1/auth/me` | Return the authenticated user. | Bearer token required |
| `GET` | `/api/v1/workspaces` | List workspaces for the signed-in user. | Bearer token required |
| `POST` | `/api/v1/workspaces` | Create a workspace. | Bearer token required |
| `GET` | `/api/v1/workspaces/:workspaceId/projects` | List projects in a workspace. | Bearer token required |
| `POST` | `/api/v1/workspaces/:workspaceId/projects` | Create a project in a workspace. | Bearer token required |
| `GET` | `/api/v1/projects/:projectId/tasks` | List tasks in a project. | Bearer token required |
| `POST` | `/api/v1/projects/:projectId/tasks` | Create a task in a project. | Bearer token required |
| `PATCH` | `/api/v1/tasks/:taskId` | Update task details or status. | Bearer token required |
| `DELETE` | `/api/v1/tasks/:taskId` | Delete a task. | Bearer token required |

## Example request bodies

Create a workspace:

```json
{
  "name": "Design Team"
}
```

Create a project:

```json
{
  "name": "Marketing Website",
  "description": "Website redesign work"
}
```

Create a task:

```json
{
  "title": "Design the task board",
  "description": "Create Todo, In Progress, and Done columns.",
  "status": "TODO",
  "priority": "HIGH"
}
```

Update a task:

```json
{
  "title": "Design the updated task board",
  "description": "Add responsive task cards.",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "dueDate": "2026-11-01T12:00:00.000Z"
}
```

Valid task statuses are `TODO`, `IN_PROGRESS`, and `DONE`.

Valid task priorities are `LOW`, `MEDIUM`, and `HIGH`.

Send `null` for `description` or `dueDate` to remove the current value.

## Production builds

Build the frontend:

```sh
cd frontend
npm run build
```

Build the backend:

```sh
cd backend
npm run build
```

## Planned features

- Task labels
- Task assignments
- Workspace member invitations and roles
- Task comments and activity history
- Notifications
- Timeline view and sprint planning
- Issue tracking
- Automated tests
- Docker, Docker Compose, Redis, GitHub Actions, and deployment
