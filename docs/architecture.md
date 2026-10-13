# DevFlow Architecture

Frontend files live in `frontend/` and API/database files live in `backend/`.

## Frontend

- `src/app/` — application shell, routing, and global providers
- `src/components/` — reusable interface components
- `src/features/` — screens and logic grouped by product feature
- `src/hooks/` — shared React hooks
- `src/services/` — API clients and request functions
- `src/types/` — shared frontend types
- `src/utils/` — small reusable helpers

## Backend

- `src/modules/` — feature modules such as tasks, projects, and workspaces
- `src/routes/` — API route registration
- `src/middleware/` — authentication, authorization, and error handling
- `src/config/` — environment and service configuration
- `prisma/` — Prisma schema and database migrations

Keep API request flow understandable: route → middleware → controller/service → Prisma → PostgreSQL.
