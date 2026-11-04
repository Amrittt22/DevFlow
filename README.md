# DevFlow

DevFlow is a full-stack collaboration platform for software teams to create workspaces, manage projects, organize tasks, assign team members, and track progress.

## Current Features

### Authentication and Security
- Responsive React dashboard built with TypeScript and Tailwind CSS.
- Light and dark themes.
- Supabase email sign-up, sign-in, session tracking, and sign-out.
- Signup stores the user's trimmed `full_name` in Supabase metadata.
- Password recovery with a dedicated `/reset-password` page.
- Express API with server-side Supabase bearer-token verification.
- Protected backend routes with workspace-scoped authorization.
- Authenticated user profiles are available through `/api/v1/auth/me`.

### Workspaces and Projects
- Create and list workspaces.
- Create and list projects within a workspace.
- Select projects from the sidebar.
- Persist the selected workspace, project, and current task view after refresh.
- Workspace roles: Owner, Admin, and Member.
- Workspace member listing and member selection for task assignments.

### Task Management
- Create, load, edit, and delete tasks.
- Task titles, descriptions, statuses, priorities, and optional due dates.
- Board view with Todo, In Progress, and Done columns.
- Drag-and-drop status changes persisted in the database.
- List view and Calendar view.
- Search by task title or description.
- Filter tasks by status, priority, and due-date availability.
- Assign and remove workspace labels.
- Create labels directly from task forms.
- Custom label names and colors.
- Assign one or more workspace members to tasks.
- Display assignee initials in Board, List, and Calendar views.
- Validate that task assignees and labels belong to the task's workspace.
- Persist task assignments and labels after refresh.
- Persistent task activity history for creation, updates, status changes, label changes, assignee changes, and deletion.
- Activity timeline with actor names, timestamps, status badges, loading, empty, error, and refresh states.
- Responsive activity UI with light and dark mode support.

### Workspace Invitations
- Invite workspace members by email.
- Restrict invitation creation to Owners and Admins.
- Deliver invitation emails through Supabase.
- Accept invitations through a dedicated `/invite` page.
- Validate invitation email, status, and expiry before joining a workspace.
- List pending invitations.
- Resend or revoke invitations.
- Copy invitation links for existing Supabase users.

### Backend and Database
- Node.js, Express, and TypeScript REST API.
- Supabase PostgreSQL database.
- Prisma 7 Client with a PostgreSQL driver adapter.
- Zod validation for request data where implemented.
- Shared frontend types, reusable hooks, task views, and modal components.

## Current User Flow

```text
Sign in
  → Recover a forgotten password if needed
  → Create or select a workspace
  → Create or select a project
  → Create workspace labels
  → Create tasks and assign labels or members
  → Invite workspace members
  → View tasks in Board, List, or Calendar
  → Search and filter tasks
  → Edit, delete, assign, label, or move tasks between statuses
  → Review task activity history from task cards or the task list
```

## Project Layout

```text
DevFlow/
├── frontend/                 # React, TypeScript, Vite, Tailwind CSS
│   └── src/
│       ├── app/              # App shell and shared application types
│       ├── components/       # Task views and reusable modals
│       ├── features/         # Authentication and invitation features
│       ├── hooks/            # Workspace, task, and label hooks
│       ├── lib/              # API and Supabase clients
│       └── services/         # Authentication and backend services
├── backend/                  # Express API, Prisma, Supabase integration
│   ├── prisma/
│   └── src/
│       ├── modules/
│       ├── routes/
│       ├── middleware/
│       └── config/
├── docs/                     # Architecture and planning documents
├── DEVFLOW_PLAN.md           # Implementation roadmap
└── README.md
```

## Prerequisites

- Node.js and npm
- A Supabase project with Email authentication enabled
- A Supabase PostgreSQL Session Pooler connection string

## Supabase Setup

1. Create a Supabase project.
2. Open **Authentication → URL Configuration**.
3. Add the following local redirect URLs:
   - `http://localhost:5173/**`
4. Open **Project Settings → API Keys**.
5. Copy the project URL and publishable key.
6. Open the database connection settings and copy the Session Pooler connection string.
7. Configure the password recovery and invitation redirects:
   - `http://localhost:5173/reset-password`
   - `http://localhost:5173/invite`

Both routes must be allowed in Supabase Redirect URLs.

For local testing, email confirmation can be enabled or disabled in the Supabase Email provider settings.

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL="your-supabase-session-pooler-connection-string"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
SUPABASE_SECRET_KEY="your-server-only-supabase-secret-key"
FRONTEND_URL="http://localhost:5173"
PORT=4000
```

Create `frontend/.env`:

```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
VITE_API_URL="http://localhost:4000"
```

Never commit `.env` files or server-only Supabase secret keys. Only expose publishable credentials in frontend environment variables.

## Run the Backend

From the project root:

```sh
cd backend
npm install
npx prisma7 migrate deploy
npm run dev
```

The backend is expected to run at `http://localhost:4000`.

Use the Prisma command supported by the project's installed Prisma tooling for schema and migration operations.

## Run the Frontend

Open a second terminal from the project root:

```sh
cd frontend
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

## API Endpoints

All protected endpoints require a valid Supabase bearer token:

```http
Authorization: Bearer <access_token>
```

The API should verify authentication and enforce workspace membership and role permissions on the server. Authentication alone does not authorize access to a resource.

### Health and Authentication

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/health` | Check API health | Public |
| GET | `/api/v1/auth/me` | Get the authenticated user | Authenticated |

### Workspaces and Projects

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/workspaces` | List workspaces for the signed-in user | Authenticated |
| POST | `/api/v1/workspaces` | Create a workspace | Authenticated |
| GET | `/api/v1/workspaces/:workspaceId/projects` | List projects in a workspace | Workspace member |
| POST | `/api/v1/workspaces/:workspaceId/projects` | Create a project | Authorized workspace member |

### Tasks

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/projects/:projectId/tasks` | List tasks in a project | Authorized project/workspace member |
| POST | `/api/v1/projects/:projectId/tasks` | Create a task | Authorized project/workspace member |
| PATCH | `/api/v1/tasks/:taskId` | Partially update task details, status, priority, or due date | Authorized workspace member |
| DELETE | `/api/v1/tasks/:taskId` | Delete a task | Authorized workspace member |
| GET | `/api/v1/tasks/:taskId/activity` | Retrieve the task's activity history | Authorized workspace member |

### Task Activity History

Task activity records are persisted in PostgreSQL through Prisma. The backend records:

- Task creation.
- General task updates.
- Status changes with previous and new values.
- Label changes.
- Assignee changes.
- Task deletion history.
- Actor information and creation timestamps.

The authenticated endpoint returns the most recent 100 activities in descending chronological order. It requires the same Supabase access token as other protected endpoints:

```http
GET /api/v1/tasks/:taskId/activity
Authorization: Bearer <supabase-access-token>
```

Example response:

```json
{
  "activities": [
    {
      "id": "activity_id",
      "taskId": "task_id",
      "projectId": "project_id",
      "actorId": "user_id",
      "type": "STATUS_CHANGED",
      "details": {
        "changes": {
          "status": {
            "from": "TODO",
            "to": "IN_PROGRESS"
          }
        }
      },
      "createdAt": "2026-11-03T19:24:58.267Z",
      "actor": {
        "id": "user_id",
        "displayName": "Amritanshu Singh"
      }
    }
  ]
}
```

The `actor` value may be `null` if the original user profile was removed. The frontend displays `Unknown user` in that case and provides a timeline with relative timestamps, absolute timestamps on hover, responsive layout, and light/dark theme support.

### Authentication and User Profiles

- Supabase signup stores `full_name` metadata from the full-name form field.
- Workspace creation and invitation acceptance synchronize the Supabase user's metadata into the Prisma `displayName` profile field without overwriting an existing name with `null`.
- `GET /api/v1/auth/me` returns the authenticated Prisma profile:

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "displayName": "Amritanshu Singh"
  }
}
```

### Labels

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/workspaces/:workspaceId/labels` | List workspace labels | Workspace member |
| POST | `/api/v1/workspaces/:workspaceId/labels` | Create a workspace label | Authorized workspace member |
| PUT | `/api/v1/tasks/:taskId/labels` | Replace the labels assigned to a task | Authorized workspace member |

Example request body:

```json
{
  "labelIds": ["label-id-1", "label-id-2"]
}
```

### Task Assignees

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| PUT | `/api/v1/tasks/:taskId/assignees` | Replace the users assigned to a task | Authorized workspace member |

Example request body:

```json
{
  "userIds": ["user-id-1", "user-id-2"]
}
```

Every assignee must belong to the task's workspace.

### Workspace Members

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/workspaces/:workspaceId/members` | List workspace members available for task assignment | Workspace member |
| PATCH | `/api/v1/workspaces/:workspaceId/members/:userId` | Change an existing member's role | Authorized workspace owner/admin |
| DELETE | `/api/v1/workspaces/:workspaceId/members/:userId` | Remove a member from a workspace | Authorized workspace owner/admin |

Role changes and member removal enforce workspace authorization and protect the Owner from accidental demotion or removal.

### Workspace Invitations

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/api/v1/workspaces/:workspaceId/invites` | Create and send an invitation | Owner/Admin |
| GET | `/api/v1/workspaces/:workspaceId/invites` | List workspace invitations | Authorized workspace administrator |
| DELETE | `/api/v1/workspaces/:workspaceId/invites/:inviteId` | Revoke an invitation | Owner/Admin |
| POST | `/api/v1/workspaces/invites/:inviteId/accept` | Accept an invitation | Authenticated invited user |

Invitation resend is also part of the implemented invitation-management feature. Add its exact endpoint to this table after confirming the route in the backend, rather than assuming a path.

## Example Request Bodies

### Create a Workspace

```json
{
  "name": "Design Team"
}
```

### Create a Project

```json
{
  "name": "Marketing Website",
  "description": "Website redesign work"
}
```

### Create a Task

```json
{
  "title": "Design the task board",
  "description": "Create Todo, In Progress, and Done columns.",
  "status": "TODO",
  "priority": "HIGH"
}
```

### Update a Task

```json
{
  "title": "Design the updated task board",
  "description": "Add responsive task cards.",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "dueDate": "2026-11-01T12:00:00.000Z"
}
```

Valid task statuses:

- `TODO`
- `IN_PROGRESS`
- `DONE`

Valid task priorities:

- `LOW`
- `MEDIUM`
- `HIGH`

Send `null` for `description` or `dueDate` to clear the existing value, provided the update schema supports nullable values.

### Create a Label

```json
{
  "name": "Bug",
  "color": "#EF4444"
}
```

### Invite a Workspace Member

```json
{
  "email": "teammate@example.com",
  "role": "MEMBER"
}
```

Valid invitation roles:

- `ADMIN`
- `MEMBER`

## Production Builds

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

## Planned Features

The following are future enhancements, not claims that the corresponding functionality already exists:

- Task comments.
- Notifications for assignments, comments, and due dates.
- Real-time task, comment, and notification updates.
- Improved task sorting and accessibility.
- Timeline view and sprint planning.
- Issue tracking and links between issues and tasks.
- Automated unit, API, and browser tests.
- Server-side pagination, filtering, and sorting where needed.
- Docker and Docker Compose.
- Redis for rate limiting, caching, or background jobs where appropriate.
- GitHub Actions for automated builds and tests.
- Production deployment, environment configuration, database migrations, and health monitoring.
- GitHub repository and pull request integration.

AI-powered features can be added after the core application, authorization, and collaboration workflows are stable.
