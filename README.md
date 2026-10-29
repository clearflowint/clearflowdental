# ClearFlow Dental Clinic

Multi-tenant dental clinic workspace using Vue 3, Appwrite, and Windmill for separately managed automation workflows.

## Repository layout

- `app/` — Vue 3 + Vite frontend.
- `app/src/components/` — authentication and clinic setup screens.
- `app/src/composables/` — session and clinic-workspace state.
- `app/src/features/` — workspace shell and feature screens.
- `app/src/services/` — frontend service boundary for authenticated Appwrite API actions.
- `appwrite/functions/clearflow-dental-api/` — tenant-scoped application API and unit tests.
- `appwrite/functions/clearflow-windmill-bridge/` — authenticated server-side bridge to a configured Windmill webhook.
- `f/dental/` — Git-managed Windmill assets; secrets and resources are configured in Windmill, not committed here.
- `appwrite.config.json` — Appwrite function deployment configuration.
- `research/` — architecture research, decisions, field inventories, and implementation traceability.

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

- GitHub Actions validates frontend builds and Appwrite API unit tests on changes to `main` and pull requests targeting `main`.
- Cloudflare Pages deploys the frontend from `main`.
- Windmill sync validation is a dry run. Production Windmill deployment is a separate manually confirmed workflow.
- Appwrite functions are deployed separately using the Appwrite configuration and the authorized deployment process.

Never commit provider API keys, Appwrite server API keys, Windmill tokens, encryption keys, or real patient information.

## Research

Start with the [Research Index](research/RESEARCH_INDEX.md) for detailed design decisions and implementation traceability.
