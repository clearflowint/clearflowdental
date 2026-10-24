# ClearFlow Dental

A mobile-first dental clinic workspace built with Vue 3, TypeScript, Vite, and the self-hosted Appwrite backend.

## Current scope

- Clinic workspace associated with the signed-in Appwrite user
- Basic patient details: name, phone, optional notes
- Patient visit history: treatment name/date, doctor advice, optional next-visit date
- Upcoming advised visit dates (display only; no reminders are scheduled or sent)
- No payments, billing, WhatsApp, or AI in this phase

## Architecture

- Frontend: Cloudflare Pages (`https://clearflowdental.pages.dev`)
- Authentication and data: Appwrite SDK
- Appwrite endpoint: `https://clearflowappwrite.duckdns.org/v1`
- Appwrite project: `6adcea89003c9613425b`
- Appwrite database: `clearflow_dental`
- Tables: `dental_clinics`, `dental_patients`, `dental_visits`
- Tenant-owned rows use row-level permissions; each row grants access only to its owner user.

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

Set these Cloudflare Pages environment variables if you want to override defaults:

- `VITE_APPWRITE_ENDPOINT`
- `VITE_APPWRITE_PROJECT_ID`
- `VITE_APPWRITE_DATABASE_ID`

Build command: `npm run build`; output directory: `dist`.

## Security test before real patient data

This is a test application. Verify with two separate user accounts that one clinic cannot list or access the other clinic's rows before using real patient information. Row permissions are enforced by Appwrite; client-side filters are not the security boundary.
