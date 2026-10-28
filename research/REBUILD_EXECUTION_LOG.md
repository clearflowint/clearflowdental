# ClearFlow Dental Clinic — Rebuild Execution Log

**Track:** Fresh prototype rebuild  
**Branch:** prototype/rebuild-from-scratch  
**Started:** 2026-10-28  
**Rule:** Work through batches without reopening settled architecture discussions. Log meaningful commits, tests, blockers and next actions. Ask the owner only when a real product decision or access requirement blocks progress.

## Starting baseline
- Owner confirmed the old application files were deleted. Current main contains research, roadmap, Appwrite↔Windmill bridge and deployment assets, not a reusable frontend.
- Rebuild application source from scratch on this feature branch. Preserve all existing research and deployment assets.
- Baseline decisions: mobile-first PWA, card UI/no horizontal scroll, plain JavaScript preferred, Appwrite for auth/data/files/realtime where verified, Windmill/Python for deterministic jobs, AI for language tasks only when useful, and explicit confirmation for consequential actions.
- Synthetic data only during prototype. The bridge ping is verified; real dental workflows are not yet verified.

## Batch tracker
| Batch | Scope | Status | Next evidence |
|---|---|---|---|
| 0 | Repository baseline and rebuild branch | Complete | Main tree inspected; fresh feature branch created. |
| 1 | Prototype data model/schema contract | In progress | Schema v0.1 drafted; inspect live Appwrite capabilities before applying. |
| 2 | Runnable PWA shell/build/test foundation | Not started | Fresh app source, local build and CI. |
| 3 | Appwrite schema setup and repeatable migration | Not started | Apply minimal schema in the correct test project; verify IDs/indexes/permissions. |
| 4 | Authentication, clinic workspace and membership | Not started | Working login/session and active clinic context. |
| 5 | Patient directory | Not started | Synthetic patient create/search/view/update. |
| 6 | Original document capture | Not started | Upload, metadata, preview/download with source preserved. |
| 7 | Appointments | Not started | Schedule/reschedule/cancel flow. |
| 8 | Visit timeline and treatment association | Not started | Encounter distinct from appointment; purpose distinct from treatments. |
| 9 | Optional clinical draft | Not started | Draft/review states; no silent approval. |
| 10 | Realtime | Not started | Two-user update and access test. |
| 11 | Deterministic Windmill workflow | Not started | Real workflow beyond connectivity ping; synthetic inputs. |
| 12 | Read-first AI assistance | Not started | Authorized retrieval and proposals only. |
| 13 | Full prototype end-to-end test | Not started | Synthetic journey evidence and mobile checks. |
| 14+ | Enterprise hardening and optional modules | Deferred | Follow the prototype-first roadmap after full prototype testing. |

## Execution notes
### 2026-10-28 — Rebuild kickoff
- Created branch prototype/rebuild-from-scratch from main.
- Confirmed old app source is absent from current main; do not assume it can be reused.
- Existing research and bridge assets remain untouched.
- Drafted prototype data-model contract v0.1 as the first implementation artifact.

## Per-batch logging convention
Record date, commit/PR, files changed, test commands and results, observed gaps, and next batch. A commit is not proof of runtime behavior. Keep credentials, webhook secrets and real patient data out of notes.


## 2026-10-28 — Batch 1 and shell progress
- Appwrite project/database inspected: project `Dental Hospitals`, database `clearflow_dental`; it initially had zero tables.
- Created 10 prototype tables with row security enabled and empty table-level permissions: clinics, clinic_memberships, patients, patient_contacts, patient_documents, appointments, encounters, encounter_treatments, clinical_drafts, activity_events.
- Created indexes: clinics.slug_unique; clinic_memberships.tenant_user_unique; patient_contacts.tenant_patient; patient_documents.tenant_patient_uploaded; appointments.tenant_starts; encounters.tenant_patient_started; encounter_treatments.tenant_encounter; clinical_drafts.tenant_encounter_status; activity_events.tenant_occurred. Patient family-name index was not confirmed due connector safety blocking; do not assume it exists.
- Saved `research/PROTOTYPE_DATABASE_SCHEMA_V0_1.md` and `research/APPWRITE_SCHEMA_APPLIED_2026-10-28.md` as the schema contract and applied-schema record.
- Added a fresh static mobile-first workspace shell in `app/`, PWA manifest, Vite build configuration and GitHub Actions build workflow. Current UI is intentionally a shell; it does not yet authenticate or read/write clinic records.
- Important technical correction: keep the initial prototype lean with plain JavaScript + Vite + Appwrite SDK; no Vue dependency is needed for the current shell.
- Verification so far: Git tree confirms app files and CI workflow are present; Appwrite list operation returned 10 tables. The CI build has not yet been observed passing, and live browser rendering has not yet been tested.
- Next: inspect the CI run result, fix any build failures, then implement a repeatable schema setup artifact and the safe clinic bootstrap/membership path before connecting patient UI.


### Batch 2 progress — 2026-10-28
- Added mobile-first application shell with Overview, Patients, Appointments, Visits and Documents navigation.
- Added Appwrite account helper using the official JavaScript SDK, including sign-in, test-account creation, session restore and sign-out. This is account authentication only; clinic membership and clinical records are not yet connected.
- Added auth-screen styling in `app/src/auth.css` and public configuration example `app/.env.example`. No API key or secret is included in frontend files.
- GitHub Actions build passed for the shell and authentication implementation: https://github.com/clearflowint/clearflowdental/actions/runs/40673355062
- A newer CI run is queued for the public config example commit; verify it before declaring the current head green.
- Appwrite TablesDB currently has 10 prototype tables. The full applied-schema record is `research/APPWRITE_SCHEMA_APPLIED_2026-10-28.md`.
- Current blocker for real patient CRUD: tables have row security enabled and no broad table permissions by design. A trusted clinic bootstrap/data API must verify the Appwrite-authenticated user and clinic membership; do not weaken tables to public read/write or trust client-supplied tenant IDs.

### Next batch
Implement and deploy a small trusted Appwrite API/function for clinic bootstrap and tenant-scoped patient operations, or use another existing trusted execution path only if its identity verification is equivalent. Then wire the patient directory through one shared data-access module and add synthetic tenant-isolation tests.


### Batch 3 progress — trusted clinic/patient API
- Added `appwrite/functions/clearflow-dental-api` with a shared tenant-scoped API surface for clinic bootstrap/list and patient list/create. Browser UI calls this API; it does not receive an elevated key.
- Added a dedicated deployment workflow using the existing GitHub Actions secret references; no secret values are written to Git.
- Function execute permission is limited to authenticated Appwrite users. Before any data operation, the function verifies the Appwrite user JWT and matches the verified account ID to the execution identity header. Tenant membership is then checked server-side for every patient operation.
- Tables remain row-secured with no broad table permissions. Newly created clinic/patient rows receive read permission for the creating user; writes remain routed through the trusted API. Membership roles are not accepted from client payloads.
- Live function deployment succeeded: https://github.com/clearflowint/clearflowdental/actions/runs/40674052469
- Negative security check passed: a function execution without a valid user session returned HTTP 401 and created no records.
- Appwrite localhost web platform was registered for local development.
- App build workflow has passed for the previous application-shell/authentication revision: https://github.com/clearflowint/clearflowdental/actions/runs/40673684882 . A new build is required for the latest clinic/patient UI commit; check the run before calling that UI revision green.
- Remaining verification: authenticated end-to-end clinic creation and patient CRUD, two-user/tenant isolation, Appwrite SDK response shape, and mobile browser rendering. No real patient data has been entered.


### Batch status refresh — 2026-10-28
- **Batch 1 — Schema:** Initial ten Appwrite TablesDB tables and nine indexes are applied; private source-document bucket `dental-source-documents` created with file-level security, encryption, create permission for signed-in users, and a 25 MiB limit for PDF/image types. The schema remains a prototype; a fully repeatable schema verification/migration artifact is still outstanding.
- **Batch 2 — App shell/auth:** Mobile-first navigation and Appwrite sign-in/test-account creation are implemented. CI build passes.
- **Batch 3 — Trusted API:** `clearflow-dental-api` deployed through GitHub Actions. It verifies the user JWT, enforces clinic membership server-side, and uses a per-execution Appwrite key scoped to rows.read/rows.write/files.read. Unauthenticated execution test returns 401. No elevated key is shipped to the browser.
- **Batch 4 — Clinic and patient workflows:** Clinic bootstrap/list, patient list/create/update API and clinic/patient UI are in place. Authenticated CRUD still needs a browser end-to-end test.
- **Batch 5 — Appointments and encounters:** Tenant-checked appointment list/create and encounter list/create API plus UI are implemented. Appointment and actual encounter remain separate; encounter purpose is separate from treatments.
- **Batch 6 — Treatments and clinical drafts:** Treatment list/create and non-approved clinical draft list/create are implemented. Treatment status must explicitly distinguish discussed/planned/performed/not_performed. Drafts are saved as `draft`; no auto-approval.
- **Batch 7 — Original documents:** Private file upload and metadata list/create UI/API are implemented. Originals are stored in Appwrite Storage and metadata is linked to the patient; upload is not approval. Validate file-view URL and metadata flow in a browser before declaring complete.
- **Build evidence:** latest shell build passed at https://github.com/clearflowint/clearflowdental/actions/runs/40674884544 . Latest trusted API deployment passed at https://github.com/clearflowint/clearflowdental/actions/runs/40674825725 .
- **Still not complete:** authenticated browser E2E, tenant-isolation test with two users/clinics, real mobile viewport check, appointment reminder workflow, realtime subscription, AI read-first/draft flow, deployment to a reachable prototype URL, and full end-to-end journey test.
- Continue in batches; do not claim end-to-end completion until those gaps are tested. No real patient data has been used.


### Batch 5–11 progress — 2026-10-28
- Appointment API now supports create/list/status update (scheduled, confirmed, arrived, cancelled, completed, no_show). Encounter API supports open/list/complete. UI provides appointment status controls and visit completion.
- Treatment records and clinical draft note capture are wired into the visit timeline. Draft status stays `draft`; no AI or user input can silently approve it.
- Original document capture uses the private `dental-source-documents` bucket and metadata API. Accepted types are PDF/JPG/JPEG/PNG/WEBP, max 25 MiB. Metadata is linked only after verifying patient/clinic membership and file readability. Browser validation remains outstanding.
- Realtime helper was initially attempted using a `Realtime` export absent from the installed `appwrite@17` SDK. Build failures were logged and fixed by switching to the SDK's `client.subscribe` API. Build passed after the correction: https://github.com/clearflowint/clearflowdental/actions/runs/40675176542 . Runtime subscription still needs browser verification.
- Extracted deterministic validation helpers to `appwrite/functions/clearflow-dental-api/src/domain.js`; unit tests cover slug normalization, timestamp ranges, and allowed lifecycle enums. The API deployment workflow now runs tests before deployment; latest test+deployment run passed: https://github.com/clearflowint/clearflowdental/actions/runs/40675665486 .
- Added `windmill/dental/appointment_reminder_candidates.py` and matching tests. The same pure Python candidate generator is deployed in Windmill at `f/dental/appointment_reminder_candidates`; synthetic test succeeded with one candidate and `sent: 0`. This is intentionally candidate-only and does not send messages or include contact/message content. It is not yet connected to live Appwrite data or a schedule.
- Added Python unit-test CI; passed: https://github.com/clearflowint/clearflowdental/actions/runs/40675555027 .
- Added Cloudflare Pages preview deployment workflow for `clearflow-dental-prototype`. Build succeeded, but deployment stopped at the credential check because GitHub repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are not configured. No public app URL exists yet. This is now a genuine external-access blocker for browser E2E/mobile testing; do not claim deployment success.
- Current remaining work: resolve Cloudflare deployment credentials, authenticated browser E2E, test two-user/tenant isolation, verify document view/upload, realtime, then connect Windmill candidates to the trusted data path and build read-first AI assistance. No real patient data has been used.
