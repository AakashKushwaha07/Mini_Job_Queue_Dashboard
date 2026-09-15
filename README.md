# Mini Job Queue Dashboard

A small React + NestJS assignment project for managing jobs with validated status transitions and SQLite persistence.

## Features

- Create, list, update, and delete jobs
- Filter jobs by status
- Counts for pending, running, completed, and failed jobs
- Loading and API error states in the React UI
- Backend validation for input shape and allowed status transitions
- Optimistic concurrency protection using a `version` field

## Tech Stack

- Backend: NestJS, TypeORM, SQLite
- Frontend: React, Vite, TypeScript

## Setup

```bash
npm install
```

Create `frontend/.env.local` if the API is not running on the default URL:

```bash
VITE_API_URL=http://localhost:3000
```

Run both apps:

```bash
npm run dev
```

Or run them separately:

```bash
npm run start:dev -w backend
npm run dev -w frontend
```

Default URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

## API

`POST /jobs`

```json
{
  "title": "Send welcome email",
  "type": "email"
}
```

`GET /jobs`

Returns all jobs ordered by newest first.

`PATCH /jobs/:id/status`

```json
{
  "status": "running",
  "version": 1
}
```

`DELETE /jobs/:id`

Deletes a job by id.

## Status Rules

Allowed statuses:

- `pending`
- `running`
- `completed`
- `failed`

Allowed transitions:

- `pending -> running`
- `running -> completed`
- `running -> failed`

Terminal jobs (`completed` and `failed`) cannot move again.

## Concurrency Decision

The transition rules are enforced in the backend, not only in React. That matters because users can call the API directly, and because two browser tabs can submit stale updates.

Each job has a numeric `version`. The frontend sends the version it last read when changing status. The backend validates the requested transition, then updates with a `WHERE id = :id AND version = :version` condition. If another request already updated the job, the version no longer matches and the API returns `409 Conflict`.

This is the bonus production-readiness improvement. It avoids silently overwriting stale state and gives the UI a clear signal to refresh.

## Assumptions And Trade-Offs

- Job `type` is free text because the assignment does not define a fixed list.
- SQLite is used for simple local persistence.
- TypeORM `synchronize` is enabled for assignment speed. In production, migrations should replace it.
- Authentication, pagination, deployment config, and background job execution are intentionally out of scope.

## With More Time

- Add integration tests around status transitions and stale version conflicts.
- Add pagination/search once the job list can grow.
- Add API docs with Swagger.
- Deploy the backend and frontend with environment-specific CORS settings.
