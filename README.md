# FlowForge Backend

## Overview

This repository contains the backend for a workflow execution platform implemented with NestJS, TypeORM, MySQL, and Redis. It supports workflow creation, versioning, execution tracking, and real-time step updates.

## Architecture

- **NestJS** for application structure, modules, controllers, providers, and dependency injection.
- **TypeORM** for MySQL persistence with entities and migrations.
- **MySQL** for workflow, workflow version, and run history storage.
- **Redis** for caching workflow metadata and version payloads.
- **WebSockets** for real-time status broadcasts through `WorkflowGateway`.
- **Docker / docker-compose** for local stack orchestration.
- **GitHub Actions** for CI: linting, tests, build, and artifact packaging.

## Setup

### Install dependencies

```bash
npm install
```

### Application environment

Create a `.env` file at the repository root with the following values:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_NAME=flowforge
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=your-secret-key
```

### Run locally

```bash
npm run start:dev
```

## Docker development

Start the full stack with:

```bash
docker-compose up --build
```

Stop and remove containers:

```bash
docker-compose down
```

## Database migrations

Run migrations with:

```bash
npm run migration:run
```

## Testing

Run unit tests:

```bash
npm run test
```

Run end-to-end tests:

```bash
npm run test:e2e
```

Run unit test coverage:

```bash
npm run test:cov
```

Run e2e tests with coverage:

```bash
npm run test:e2e:cov
```

## Docker commands

Build the Docker image:

```bash
docker build -t flowforge-backend .
```

## CI pipeline

The GitHub Actions workflow is defined in `.github/workflows/ci.yml` and includes:

- linting with ESLint
- unit tests and coverage
- e2e tests and coverage
- Docker build
- artifact upload for deployment pipelines

## Trade-offs and improvements

### Trade-offs made

- Focused on delivering core backend features: workflow CRUD, versioning, execution, retries, and caching.
- Kept workflow execution logic relatively simple rather than building a full workflow orchestration engine.
- Used a single database schema for MySQL without abstracting multiple datastore implementations.
- Redis caching is used for performance, but cache invalidation is limited to create/update flows only.

### Improvements with more time

- Add better **workflow version management** with semantic versioning and rollout history.
- Add stronger **payload validation** and DTO-level sanitization.
- Add **observability** with metrics, tracing, and structured logging.
- Improve the CI pipeline with **security scanning**, dependency auditing, and environment matrix testing.
- Add a dedicated **frontend service** inside Docker Compose and a full UI integration.
- Add more **isolated e2e fixtures** so tests do not rely on shared local state.

## Project structure

- `src/` — application source
- `src/workflow/` — workflow module, services, entities, controller, gateway
- `src/auth/` — authentication and authorization
- `src/migrations/` — database migrations
- `Dockerfile` — multi-stage image build for backend
- `docker-compose.yml` — local stack definition
- `.github/workflows/ci.yml` — CI pipeline

## Notes

- API defaults to `http://localhost:3000`
- Docker Compose exposes MySQL on local port `3306`
- Redis runs on `localhost:6379`
