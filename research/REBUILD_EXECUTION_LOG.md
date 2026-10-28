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


### Batch 12 — Deterministic retrieval and schema verification — 2026-10-28
- Added tenant-scoped `workspace.search` to the trusted API. It searches patient labels, appointment reason/time/status, visit purpose/status, and source document names/categories. It returns at most 25 matching summaries and performs no writes.
- Added a mobile-friendly Quick Find UI that uses the deterministic search API. This is a retrieval foundation, not a claim that the LLM conversational assistant is complete.
- Added a machine-readable prototype schema manifest and a read-only verifier. Live Appwrite schema verification passed: https://github.com/clearflowint/clearflowdental/actions/runs/40676253266 . The manifest checks expected columns, required indexes, row security, empty table-level permissions, and source bucket settings.
- Rechecked unauthenticated API execution after the new search operation; it returned HTTP 401 with “A valid Appwrite user session is required.” No records were created.
- The app build passed for the Quick Find UI revision: https://github.com/clearflowint/clearflowdental/actions/runs/40676119090 . Latest styling/import revision is awaiting its own CI completion.
- Windmill candidate script is deployed and tested, but its trigger is not yet wired to live appointment rows. No outbound messages are sent.


### Batch 13 — PWA shell, deterministic quick find and test plan — 2026-10-28
- Added static-shell service worker and PWA SVG icon/manifest entry. The service worker caches only the shell/static assets and explicitly bypasses Appwrite API/function/storage paths; clinical records are not cached offline.
- Added the machine-readable schema manifest and read-only schema verifier; live schema verification is green.
- Added deterministic tenant-scoped Quick Find for patients, appointments, visits and source document metadata. This is a reusable retrieval tool foundation, not the final AI conversational assistant.
- Added `research/PROTOTYPE_E2E_TEST_PLAN.md` with synthetic-data acceptance tests covering auth, tenant isolation, patient records, appointments, encounters, treatments, drafts, source documents, realtime, PWA, and Windmill candidate behavior.
- Current latest application build evidence before the PWA icon/service-worker commits: https://github.com/clearflowint/clearflowdental/actions/runs/40676501664 . A newer build is running for the latest PWA registration change.
- Latest trusted API deployment is ready in Appwrite, including tenant-scoped search and document metadata validation. Unauthenticated execution continues to return HTTP 401.
- **Only external blocker:** Cloudflare Pages workflow cannot deploy until repository Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are configured. No public preview URL exists; authenticated browser/mobile end-to-end testing remains pending.

### Batch 14 — Patient directory completion and dashboard wiring — 2026-10-28
- Restored the patient directory renderer that was referenced by the workspace but missing from the source. This was a runtime/UI gap not caught by Vite's compile-only build.
- Added patient directory search, patient create/edit forms, optional date-of-birth editing, and patient contact-channel cards/forms. Contact channels distinguish phone/email/other and relationship labels; a phone number is a contact method, not the patient identity. Shared family contact values are allowed; no automatic patient merge is introduced.
- Added tenant-scoped patient_contact.list and patient_contact.create trusted API actions. They verify active clinic membership and that the patient belongs to the selected clinic before returning or creating contact rows. Primary contact selection demotes prior primary channels for that patient; contact verification remains false until a separate verification flow exists.
- Confirmed the live Appwrite database contains the patient_contacts table and expected fields, including tenantId, patientId, type, value, label, isPrimary, isVerified, and timestamps.
- Added shared contact-channel validators and unit coverage. API workflow runs tests before deployment; most recent API deployment evidence: https://github.com/clearflowint/clearflowdental/actions/runs/40676451819 .
- Wired the dashboard overview to fetch and display current patient, appointment, and visit counts instead of showing placeholders that incorrectly claimed those modules were upcoming.
- Latest confirmed prototype build before the dashboard-count change passed: https://github.com/clearflowint/clearflowdental/actions/runs/40676793236 . The dashboard-count change is committed as dc3cdf4d6eb897a2949dee0a1d46bbe263f4d146; its build and deployment workflows are queued/running and must be checked before claiming validation.
- Deployment blocker remains: Cloudflare Pages deployment fails at the explicit credential check because repository Actions secrets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are empty/unconfigured. Latest observed failed deploy: https://github.com/clearflowint/clearflowdental/actions/runs/40676793279 . Build success does not mean a live preview is deployed.
- Still pending: confirm the current commit's CI, set Cloudflare deployment credentials, authenticated browser/mobile E2E, two-user tenant isolation test, source-file upload/view test, runtime Realtime test, and end-to-end appointment/visit/draft workflow. Continue using synthetic data only.

- Follow-up validation note: the first dashboard-count commit failed the Vite build because the automated edit inserted loadOverview twice. Removed the duplicate declaration in commit 7c0f9f642450ff24a82fcf018d969974b4de3f1e; CI is rerunning. This failure and correction are recorded explicitly rather than treated as a pass.

- Realtime follow-up: added patient_contacts to the Appwrite client subscription channels. The dashboard callback already refreshes the overview through loadOverview, so the same event path now covers summary counts while the contacts table is subscribed too. Runtime behavior still needs an authenticated multi-user browser test.

### Batch 15 — Tenant-scoped reminder candidates and Realtime coverage — 2026-10-28
- Added patient_contacts to Appwrite Realtime subscriptions so contact changes can refresh the directory. The overview refresh path now reloads the deterministic dashboard summary; runtime event delivery remains unverified until browser testing.
- A CI failure caught a mismatch between reminder tests and the Python function signature. Fixed the API to require tenant_id explicitly and filter every candidate row to that tenant before evaluating status/time. Added tests for foreign-tenant exclusion and missing tenant rejection. This is a meaningful safety property, not just a test signature adjustment.
- The first rerun after the function change passed at https://github.com/clearflowint/clearflowdental/actions/runs/40677412118 for the intermediate commit. The full corrected test suite is queued/running after commits 826fd14b3c03e193eee266f5613692661b7dd156 and 7ff03eb480b5c92af1efc000454b75d6509456b2; verify the newest run before treating all tests as green.
- Current app build passed at https://github.com/clearflowint/clearflowdental/actions/runs/40677190659 for commit 7c0f9f642450ff24a82fcf018d969974b4de3f1e. Subsequent Realtime-channel edit is not yet covered by a newer confirmed build in the available run list.
- Cloudflare Pages deployment remains blocked on missing GitHub repository Actions secrets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID. Do not call the prototype deployed or browser-testable until the secrets are configured and deployment succeeds.


### Batch 16 — Appointment/visit consistency and current build — 2026-10-28
- Added a frontend validation before opening a visit: when an appointment is selected, its patient must match the visit patient. The trusted API continues to enforce the same relationship server-side along with tenant membership; frontend validation is for clearer feedback, not the security boundary.
- Current app build passed for commit 37d0c6497c33cc73882d363e6ee564ad3fcd6b65: https://github.com/clearflowint/clearflowdental/actions/runs/40677754124 .
- The deployment workflow was triggered for the same commit; check its result separately. A successful build does not establish that Cloudflare Pages is deployed.
- Reminder candidate tests remain green, including explicit tenant isolation: https://github.com/clearflowint/clearflowdental/actions/runs/40677435474 .
- Still pending: Cloudflare Pages secrets, authenticated browser E2E, two-clinic isolation, original document upload/view, realtime runtime test, and complete synthetic patient-to-appointment-to-visit-to-draft journey. Continue synthetic data only.


### Batch 17 — Reminder tests revalidated; deployment and Windmill runtime blockers — 2026-10-28
- The latest deterministic Python test run passed on commit `5536bf9a61e08e215285155db8fb867b49db67b1`: https://github.com/clearflowint/clearflowdental/actions/runs/40678306881 . It covers the JSON-input adapter, bounded time window, timezone requirement, candidate statuses, tenant filtering, and no message/contact payload fields.
- Canonical Git source is `f/dental/appointment_reminder_candidates.py`. The old `windmill/dental/appointment_reminder_candidates.py` now re-exports the canonical function rather than maintaining duplicate logic.
- Windmill deployment status needs correction before use: the currently deployed item was inspected and still exposes the older `appointments: list[dict]` input schema, not the latest JSON-string adapter. The attempted Windmill draft update was blocked by the tool safety layer, so do NOT assume the deployed script has been updated or runtime-tested. Keep this workflow disabled/not scheduled until its input schema and tenant-filtered behavior are verified in Windmill itself.
- Latest confirmed frontend build remains green at https://github.com/clearflowint/clearflowdental/actions/runs/40677754124 for commit `37d0c6497c33cc73882d363e6ee564ad3fcd6b65`. The latest frontend deployment failed because Cloudflare Pages GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are not configured. This is a credential/configuration blocker, not evidence of a successful live deployment.
- Next actions: configure the two Cloudflare secrets; update the existing Windmill script through the Windmill UI or an authorized API path and verify its schema/run; then run authenticated synthetic-data browser tests for patient/contact CRUD, appointments, appointment-to-visit consistency, original document upload/view, Realtime refresh, and tenant isolation. No production clinical data and no automated message delivery.
