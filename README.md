# ClearFlow Dental Clinic

Multi-tenant dental clinic workspace using Vue 3, Appwrite, and Windmill for separately managed automation workflows.

## Repository layout

- `app/` — Vue 3 + Vite frontend.
- `app/src/components/` — authentication and clinic setup screens.
- `app/src/composables/` — session and clinic-workspace state.
- `app/src/features/` — workspace shell and feature screens.
- `app/src/services/` — frontend service boundary for authenticated Appwrite API actions.
- `appwrite/functions/clearflow-dental-api/` — tenant-scoped application API and unit tests.
- `appwrite/functions/clearflow-windmill-bridge/` — server-side bridge to a configured Windmill webhook.
- `appwrite/schema/` and `scripts/appwrite-schema/` — schema manifest and read-only verifier.
- `f/dental/` — Git-managed Windmill assets; secrets and resources are configured in Windmill, not committed here.
- `appwrite.config.json` — Appwrite function deployment configuration.
- `.github/workflows/` — frontend/backend validation and scoped deployment workflows.
- [Architecture goal](docs/architecture/architecture-goal.md) — the agreed principles and end-to-end prototype acceptance criteria.
- [Repository architecture audit](docs/architecture/repository-audit-2026-10-29.md) — current-state inventory, findings, priorities, and staged improvement plan.

## Frontend

Run locally:

```sh
cd app
npm install
npm run dev
```

Build for production:

```sh
cd app
npm install
npm run build
```

## Appwrite API function

Run the unit tests:

```sh
cd appwrite/functions/clearflow-dental-api
npm install
npm test
```

The frontend sends authenticated actions through `app/src/appwrite-client.js`. Feature components use the shared service registry at `app/src/services/index.js`; tenant membership and data operations are validated by the Appwrite API function.

## Validation and deployment

- GitHub Actions validates frontend builds and Appwrite API unit tests on relevant changes to `main` and pull requests.
- Cloudflare Pages deploys the frontend from `main`.
- Appwrite Windmill Bridge deployment runs on relevant changes to its function/configuration and deploys only that function.
- Dental API deployment is manual and requires explicit confirmation; the workflow runs API unit tests before deploying only that function.
- Windmill sync validation is a dry run. Production Windmill deployment is a separate manually confirmed workflow.

Never commit provider API keys, Appwrite server API keys, Windmill tokens, encryption keys, or real patient information.
