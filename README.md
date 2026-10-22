# ClearFlow Dental

A minimal, mobile-first dental clinic workspace built with Vue 3, TypeScript, Vite, and the existing self-hosted Directus + PostgreSQL stack.

## Current scope

- Clinic workspace associated with the signed-in Directus user
- Basic patient details: name, phone, optional notes
- Patient visit history: treatment name/date, doctor advice, optional next-visit date
- Simple list of upcoming advised visit dates (display only; no reminders are scheduled or sent)
- No payments, billing, WhatsApp, or AI in this phase

## Architecture

- Frontend: Cloudflare Pages
- API/auth/data access: existing Directus instance
- Database: existing PostgreSQL managed by Directus
- No additional backend server

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Environment

`VITE_DIRECTUS_URL` is optional. If omitted, the app uses `https://clearflow-data.duckdns.org`.

For Cloudflare Pages, use build command `npm run build` and output directory `dist`.

## Important before real patient data

Tenant ownership fields are included in the data model, but backend-enforced tenant permissions and authenticated end-to-end verification must be completed before storing real clinic/patient data. UI filters alone are not a security boundary.
