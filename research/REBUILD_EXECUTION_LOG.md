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
