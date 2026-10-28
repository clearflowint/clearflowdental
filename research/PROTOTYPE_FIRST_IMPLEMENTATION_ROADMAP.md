# ClearFlow Dental Clinic — Prototype-First End-to-End Implementation Roadmap

**Created:** 2026-10-28  
**Repository:** `clearflowint/clearflowdental`  
**Status:** Proposed execution roadmap based on the owner’s recorded decisions and current repository/runtime evidence.  
**Purpose:** Turn the existing research into a practical, low-duplication sequence: build a coherent working prototype in batches, test it end-to-end with synthetic data, then harden it into an enterprise-grade product. This roadmap does not claim that planned modules are already implemented.

## 1. Executive direction

Build the product as a sequence of usable vertical slices, not as a large security/framework exercise followed by a late UI. Every batch should leave the repository in a runnable state and add something demonstrable. Do not start all clinical domains at once.

The delivery order is:

1. Make the current Appwrite ↔ Windmill bridge repeatable and observable.
2. Build the smallest complete clinic workspace with authentication, clinic setup, patient list and patient details.
3. Add original-document capture and a coherent visit timeline.
4. Add appointments and the visit/encounter workflow.
5. Add optional structured clinical drafts without replacing the original source.
6. Add shared realtime UI and background reminders.
7. Add conversational AI as a read/draft assistant, with explicit confirmation for consequential actions.
8. Test the whole prototype using synthetic scenarios and real mobile browsers.
9. Freeze the prototype scope, fix usability/data-model issues, then run the enterprise-hardening programme in controlled batches.
10. Only after evidence-backed gates and qualified review should real patient data or external clinics be onboarded.

**Owner’s sequencing decision:** Do not require the full enterprise security/compliance programme before a useful prototype exists. Do retain a small non-negotiable safety floor from the beginning: synthetic data only during prototype, no public exposure of sensitive records, tenant scope on all prototype data access, secrets kept server-side, and no autonomous AI clinical approval/issuance/deletion. This supersedes any interpretation of `IMPLEMENTATION_BATCH_PLAN.txt` that would force all production-grade controls ahead of the prototype.

## 2. Evidence and current baseline

### Verified as of 2026-10-28
- The research notebook, decision log, source comparison, field inventory/maps, traceability matrix, research status and implementation gap review are preserved under `research/`.
- The preserved Vue 3 + JavaScript + Vite application described in the gap review is a thin prototype for clinic setup, patient details and visit history; it is not the full researched product.
- Appwrite project `6adcea89003c9613425b` has a database `clearflow_dental` with the three observed tables `dental_clinics`, `dental_patients`, and `dental_visits`. Those tables are not the final schema.
- The current repository `main` branch includes deployment/configuration assets and research notes. Do not delete or reset these files as part of application implementation.
- The Appwrite-to-Windmill bridge live ping returned HTTP 200. The ping confirms connectivity/authentication only; it performed no database writes and processed no clinical data.
- GitHub Actions has successfully deployed the bridge function. The Windmill sync workflow and the full application deployment path must be verified separately before relying on them.
- The decision log states: PWA, mobile-first/card-based/no horizontal scroll, plain JavaScript preferred over unnecessary TypeScript, Appwrite for auth/database/storage/realtime where verified, Windmill for Python workflows, original clinical documents preserved, visit purpose separate from treatments, shared phone numbers do not define patient identity, external diagnostic reports can be manually uploaded, and external centre API integrations are deferred initially.

### Not verified / not assumed
- Full clinical schema, production-grade tenant isolation, two-user negative tests, real patient workflow, document upload lifecycle, appointment workflow, realtime subscriptions, AI streaming/voice, background reminders, backup/restore and production readiness.
- Final legal/regulatory applicability for India/Telangana, clinical approval of detailed terminology/units, and exact production retention policy.
- Final frontend choice: Vue + plain JavaScript is the first candidate to prototype; compare only if the existing app makes a rewrite demonstrably worthwhile. Do not rewrite just to adopt a different framework.

## 3. Architecture and reuse rules

### 3.1 Responsibility boundaries
- **PWA (HTML/CSS/JavaScript; evaluate existing Vue 3 app first):** screens, forms, local interaction, upload UI, visit timeline, realtime presentation, streamed AI text. It must not be the authority for authorization or clinical rules.
- **Appwrite:** user authentication/session, tenant/clinic records, authoritative application data, file storage, and realtime notifications where the installed version and permissions support the required behavior.
- **Windmill + Python:** deterministic business operations, validation, imports/exports, reminders and retryable background work. Do not create a new workflow for every screen when one reusable service/helper is sufficient.
- **Bridge:** narrow authenticated handoff from Appwrite-triggered/backend requests to allowlisted Windmill workflows. Do not turn the bridge into an arbitrary code execution endpoint.
- **AI provider adapter (later batch):** language understanding, document assistance and conversational interaction. AI output is an untrusted proposal; deterministic validation and authorized services decide whether an action is valid.
- **GitHub Actions:** versioned deployment of explicitly scoped assets. Keep secrets and Windmill resources out of Git. A passing bridge deployment is not evidence that every workflow is synced.

### 3.2 Reuse before creating
Create a shared module/helper only when at least two real use cases need it or its boundary is already clearly cross-cutting. Keep the first version small. Prefer a few explicit reusable helpers over either duplicated logic or an elaborate generic framework.

Shared capabilities to build once and reuse:
1. Auth/session state and current clinic/tenant context.
2. Server-side identity, tenant membership and role check.
3. Validated Appwrite read/write adapter with consistent errors and pagination.
4. Patient identity/contact lookup (phone is a contact channel, not a unique patient key).
5. File upload/capture metadata and access handling.
6. Visit/encounter context builder for the unified timeline.
7. Audit/provenance event helper for meaningful changes.
8. Idempotent job envelope, retries and result status for Windmill tasks.
9. Notification/reminder delivery adapter and delivery-result lifecycle.
10. Realtime subscription manager with reconnect/reconcile behavior.
11. AI context retrieval, schema validation and action-confirmation gate.
12. Shared UI patterns: form validation, loading/empty/error states, confirm dialog, status chips, pagination and mobile cards.

Do not create separate copies of tenant checks, upload handling, notification delivery, audit logging, AI approval or pagination in every module. Keep clinical concepts separate where their meaning differs; reuse mechanics, not semantics.

### 3.3 Minimum prototype safety floor
This is deliberately smaller than enterprise hardening:
- Use synthetic test patients and files only.
- Every record and file belongs to an explicit tenant/clinic; every prototype read/write must scope to the active authorized clinic.
- Do not solve listing errors by granting every user table-wide access. If direct client listing cannot be made tenant-safe, use a narrow backend-mediated endpoint.
- Do not trust client-supplied `clinic_id`, `owner_user_id`, or `patient_id` without checking the authenticated identity and linked records in the trusted operation.
- Keep privileged API keys and webhook secrets out of frontend code, Git and logs.
- Original captured clinical source is preserved; extraction/draft is not approval.
- AI cannot independently approve/sign clinical records, issue prescriptions, dispense medication, merge patients, or perform destructive writes. Consequential operations require the appropriate user confirmation and authorization.
- Clearly label prototype/test data and do not call the prototype production-ready.

These are basic safety constraints, not a requirement to complete every penetration test before showing the first working screens.

## 4. Implementation batches

Each batch should have: a visible outcome, a small implementation scope, automated or reproducible tests, a short evidence note, and an explicit status. Use statuses **Not started / In progress / Implemented / Tested / Validated / Deferred**. “Implemented” does not mean “tested”; “tested” does not mean “enterprise validated.”

### Batch 0 — Baseline, repo map and executable roadmap
**Outcome:** A clean implementation starting point without losing research.

Tasks:
- Preserve `research/`, existing Appwrite bridge, Windmill assets and workflows.
- Identify which app source branch/files currently exist on `main` and which are only on the historical backup; do not assume a deleted branch is still available.
- Document current Appwrite tables, current function IDs, Windmill script/route IDs, deployment methods and known limitations without storing secrets.
- Decide a single application working branch strategy; use a feature branch for the app implementation and keep deployment changes reviewable.
- Add a small status register linking each batch to PR/commit, test evidence, open issue and next step.

Acceptance:
- A clean checkout and current deployment assets are reproducible.
- Roadmap and research index are linked.
- No existing deployment/research assets were removed.

### Batch 1 — Runnable app shell and clinic workspace
**Outcome:** A user can sign in, establish/select a clinic workspace and navigate a mobile-first shell.

Tasks:
- Inspect the preserved Vue 3 + JavaScript + Vite source and make a go/no-go decision on reuse based on buildability and effort; default to reuse, not rewrite.
- Implement login/logout/session restoration using the selected Appwrite auth mode already supported by the project. Do not claim OAuth/OTP until configured and tested.
- Create clinic setup and a clinic switcher only if multiple clinics per owner are supported by the agreed product rule.
- Build mobile-first navigation, card-based lists, responsive forms, loading/empty/error states, and no horizontal scrolling.
- Add a shared auth/tenant context and common form/status components.

Acceptance:
- Sign in → clinic workspace → sign out works in the target environment.
- Refresh preserves a valid session and invalid/expired sessions fail safely.
- No real patient data is used.

### Batch 2 — First reusable data access layer + patient directory
**Outcome:** A clinic can create, search, view and edit synthetic patients.

Tasks:
- Establish the first patient data contract from the field inventory; include only fields required for the prototype and preserve room for later extension.
- Add a trusted data access layer that derives actor/tenant from authenticated context and verifies linked records; do not repeat direct raw Appwrite calls throughout the UI.
- Support patient create/view/update, search, stable ordering and pagination.
- Treat phone as a searchable contact field, not a unique ID. Permit shared family/caregiver phone numbers; do not auto-merge.
- Add a small duplicate warning using clues, but leave merge as an explicit later workflow.
- Record created/updated actor and timestamps where appropriate.

Acceptance:
- Two synthetic clinic accounts can only see/edit their own clinic’s patients in the tested paths.
- Invalid inputs and linked IDs fail safely.
- Search, pagination and empty states work on mobile.
- The same patient can be found by a shared contact number without implying identity equivalence.

### Batch 3 — Original document capture and patient document shelf
**Outcome:** Staff can upload a source document/photo and find it again without converting it into a clinical record.

Tasks:
- Implement one reusable file service and upload UI for scans, handwritten prescriptions, PDFs, reports and photographs.
- Save metadata: tenant/clinic, patient association, source category, original filename/type/size, upload actor/time, source date if supplied, and optional encounter association.
- Preserve the original object unchanged. Store extraction results separately only if explicitly requested.
- Support patient-supplied historical files and manually received external lab/diagnostic reports.
- Do not build external diagnostic centre integrations in this batch.
- Keep file preview/download authorization consistent with patient access.

Acceptance:
- Upload → list → preview/download works for synthetic documents.
- Wrong-tenant/guessed file IDs are rejected.
- A file upload does not create an approved clinical record or imply that a report has been reviewed.

### Batch 4 — Appointment calendar and simple clinic scheduling
**Outcome:** A receptionist can schedule, reschedule and cancel appointments.

Tasks:
- Define appointment fields/status transitions and provider assignment minimally.
- Keep appointment distinct from visit/encounter and from treatment performed.
- Add day/list calendar views, conflict warnings, status updates and a patient link.
- Reuse the same tenant/data validation, form patterns and pagination helpers.
- Do not add WhatsApp reminders yet; first prove the appointment lifecycle.

Acceptance:
- Create, reschedule, cancel and view appointments.
- Invalid dates and overlapping provider slots produce a clear result based on the agreed simple rule.
- Duplicate submissions do not create duplicate appointments in the tested retry path.

### Batch 5 — Visit/encounter timeline and treatment association
**Outcome:** A patient’s visit is understandable in one coherent screen.

Tasks:
- Model a visit/encounter separately from an appointment; an appointment may result in no visit, and a visit may be walk-in.
- Use separate `visit_purpose` and `treatments` fields/associations.
- Do not infer that a treatment was performed merely because it appears in the treatment list. Where needed, use a clear planned/discussed/performed status or separate procedure event.
- Show related appointment, source documents, optional draft clinical information, visit notes, next visit/recall data and provenance in one timeline.
- Keep the backend model modular; do not place the entire visit history into one unrestricted JSON blob.

Acceptance:
- Appointment → attended visit flow works; walk-in visit works.
- A visit may have multiple associated treatments.
- Original documents remain separate and linked to the relevant patient/visit.
- The timeline is coherent on a phone screen.

### Batch 6 — Optional structured clinical draft, not forced digitization
**Outcome:** Dentist/staff can choose to enter a lightweight structured draft while preserving the original source.

Tasks:
- Add only the first approved subset of encounter observations/notes supported by the reviewed research and a clinical reviewer.
- Distinguish patient-reported, staff-entered, clinician-entered, imported and AI-suggested values where relevant.
- Support draft vs reviewed/approved states; do not silently approve on save/upload.
- Preserve versions/corrections for approved or signed content according to the minimal agreed workflow.
- Defer advanced odontogram, periodontal charting, orthodontics, prescriptions and lab operations to their own batches unless needed for the pilot slice.

Acceptance:
- Draft can be saved, edited and clearly labelled as draft.
- Approval is an explicit authorized action and records actor/time/version.
- Original source document remains untouched.
- No automatic diagnosis/treatment decision tree is introduced.

### Batch 7 — Shared realtime updates
**Outcome:** Authorized staff see relevant updates without full-page refresh or continuous polling.

Tasks:
- Verify Appwrite Realtime behavior and permission semantics against the deployed version before wiring UI.
- Build one shared subscription manager and reconnect/reconcile pattern.
- Subscribe only to the minimum events needed for patient, appointment and visit lists.
- On sensitive changes, use the event as a signal and re-fetch authorized data instead of broadcasting clinical details.
- Reconcile against canonical saved data after reconnect.

Acceptance:
- Two authorized test users observe a relevant update without a manual full-page refresh.
- Unauthorized subscriptions do not reveal another clinic’s data.
- Reconnect does not leave stale state indefinitely.

### Batch 8 — Deterministic Windmill workflows and reminders
**Outcome:** At least one real business workflow is executed through the bridge and reports an auditable result.

Tasks:
- Reuse the verified Appwrite-to-Windmill bridge and existing ping receiver; do not create a second bridge.
- Define a common job envelope: job/request ID, tenant/clinic, actor/service, action, target references, created time, idempotency key, correlation ID and status.
- Add one harmless but real workflow first, such as appointment reminder candidate generation or next-visit follow-up queue creation; use synthetic data and do not send external messages in the first test.
- Keep delivery separate from candidate generation. A reminder candidate is not proof a message was sent.
- Add retries/statuses and concise redacted logs; never log webhook secrets or full clinical notes.
- Use deterministic Python for date rules, filtering and validation; AI is not needed for this batch.

Acceptance:
- Appwrite-originated request reaches Windmill; input validation and deterministic result are verified.
- Duplicate request test does not create duplicate jobs/results.
- A tenant-A request cannot process tenant-B data.
- No outbound message is sent until the delivery provider and user-approved behavior are explicitly configured.

### Batch 9 — AI-assisted retrieval and drafting (read-first)
**Outcome:** A user can ask natural-language questions about authorized data and request a draft without giving AI unrestricted mutation authority.

Tasks:
- Define a provider-neutral adapter and a narrow tool catalogue.
- Start with read-only patient/appointment/document metadata retrieval using authorized server-side access.
- If document extraction is enabled, return source reference, source date and uncertainty; never replace the source.
- Validate any proposed structured draft against deterministic schemas.
- Add a clear preview/confirm step before creating a draft record or triggering an external action; clinical approval remains a separate professional action.
- Do not build vector memory until normal authorized retrieval proves insufficient. If later added, treat it as rebuildable and revalidate access against authoritative records.
- Streaming text/voice is a separate UI capability, not the same mechanism as Appwrite database realtime.

Acceptance:
- Questions are scoped to the active tenant and source references are shown.
- AI output cannot call arbitrary URLs/code or bypass the approved tool list.
- No clinical approval, prescription issuance, merge or deletion can occur without explicit authorized confirmation.
- Core patient/appointment workflows still work when AI is disabled.

### Batch 10 — Prototype full-journey test and usability freeze
**Outcome:** A coherent end-to-end prototype is demonstrated and a practical defect list is recorded.

Test journeys using synthetic data:
1. Sign in → clinic workspace.
2. Register patient → search by name/shared contact → open patient.
3. Upload original document → preview → link to a visit.
4. Create appointment → reschedule/cancel → check status.
5. Record a visit with purpose and multiple treatments.
6. Save an optional draft and verify it is not marked approved.
7. Observe an update from another authorized user.
8. Generate a reminder candidate in Windmill and inspect its status.
9. Ask an AI read-only question and review a draft proposal if the AI batch is enabled.
10. Sign out/switch accounts and confirm the previous tenant’s data is no longer visible.

Tasks:
- Test phone/tablet/desktop sizes and common browser failure states.
- Fix workflow-breaking issues and data-model mistakes before adding many more modules.
- Collect clinician/staff feedback using synthetic data.
- Update the roadmap when real prototype evidence shows a better sequence.

Acceptance:
- All in-scope journeys have a pass/fail record and reproducible steps.
- No known cross-tenant leak in the prototype test paths.
- Every untested feature is marked untested; no production-readiness claim.
- Prototype scope and deferred modules are explicitly frozen for the next phase.

## 5. Enterprise hardening AFTER the full prototype works

These are deliberate follow-on batches, not prerequisites to build the first coherent prototype. The safety floor in §3.3 still applies from the beginning.

### Batch 11 — Cross-tenant, auth and relationship hardening
- Expand two-tenant negative tests to all read/write/list/search/direct-ID/nested-reference/file/export paths.
- Verify session expiry/revocation, role membership, tenant switch and access revocation.
- Fix browser-side privileged writes by moving trust-critical operations to authorized backend services.
- Add idempotency and concurrency protection where duplicate/retry behavior could change records.
- Add tests for forged clinic/patient/document IDs and client-supplied permissions.
**Gate:** no confirmed cross-tenant access or mutation in tested paths; all failures have evidence.

### Batch 12 — Clinical provenance, approval, amendment and audit
- Reuse a shared audit/provenance helper; do not create a separate audit design for each module.
- Preserve actor/source/version and the difference between captured, drafted, reviewed, signed/issued and amended artifacts.
- Protect signed/approved snapshots and use linked amendments rather than silent overwrites.
- Define restricted audit access and minimal sensitive logging.
**Gate:** representative record lifecycle can be reconstructed and changes are attributable.

### Batch 13 — Document integrity, consent, retention and deletion lifecycle
- Define clinic/jurisdiction-reviewed retention rules by record class.
- Test attachment authorization, original integrity, version references, archival, legal hold, correction and eventual deletion where permitted.
- Treat consent, clinical approval and communication preferences as separate concepts.
**Gate:** the lifecycle is documented and tested; no blanket deletion behavior silently erases required records.

### Batch 14 — Clinical expansion modules (only when approved)
Implement in dependency order and one vertical slice at a time:
- clinical observations and approved terminology;
- diagnosis/procedure/treatment plan;
- allergies and medication context;
- prescription draft → professional review/signature → issue/cancel;
- medication inventory/stock movements only if in product scope;
- odontogram/periodontal/orthodontic specialty records;
- external referrals and manual returned-report intake;
- in-house lab, imaging and equipment modules only for clinics that use them.
Each module needs a named clinical owner/reviewer, data contract, lifecycle and test fixture. Do not build all research domains merely because they exist in the inventory.

### Batch 15 — Operational and financial modules (optional product scope)
- Billing/receipts/refunds, invoices and tax snapshots.
- Inventory/consumables and supplier workflows.
- Staff roster/schedules/attendance/payroll only if explicitly included.
- Facility/equipment registration, X-ray safety, biomedical waste and compliance evidence only where applicable to the clinic’s service category.
- External integrations, insurance/claims and direct diagnostic-centre APIs remain deferred until separately approved.
These modules are optional; their existence in research is not a commitment to include them in the first product.

### Batch 16 — AI conversation, streaming voice and controlled execution
- Add incremental text streaming, voice input/output and interruption only after read-only AI behavior is reliable.
- Reuse the same tool schemas, authorization, deterministic validators, confirmation flow and audit hooks.
- Split intent interpretation, action preview, user confirmation and deterministic execution.
- AI may retrieve and prepare proposals; it cannot bypass user permission or professional authority.
- Test prompt injection, ambiguous patient identity, stale retrieval, cross-tenant context and unavailable AI providers.
**Gate:** AI can be disabled without breaking deterministic workflows, and all consequential actions have explicit authorization/confirmation.

### Batch 17 — Reliability, operations and enterprise release gates
- Add automated unit/domain/integration/browser tests, static/dependency checks and secret scanning at a useful level.
- Verify backups and a restore drill, migration rehearsal/rollback, structured redacted logs, monitoring and incident runbooks.
- Add rate limits, service-level controls, alerting, load tests and recovery objectives appropriate to the real scale.
- Verify mobile accessibility, performance, browser compatibility and network recovery.
- Conduct qualified clinical, privacy, legal and regulatory review for the actual India/Telangana product scope; keep effective dates and evidence.
**Gate:** staging release has test evidence, named approvers, rollback path and no unresolved release-blocking findings.

### Batch 18 — Controlled pilot and iteration
- Start with a limited set of clinics and synthetic/training data until approvals permit real data.
- Onboard real patient data only after the specific release gates, agreements, privacy/legal requirements, backups and operational support are ready.
- Track issues by severity, fix and add regression tests, and expand modules only based on observed value.
- Keep the status register current and distinguish implemented, tested, validated and deferred features.

## 6. Shared module map — build once, extend later

| Shared module | First used | Reused by |
|---|---|---|
| Auth/session + active clinic context | B1 | All protected screens and jobs |
| Tenant-scoped data access/validation | B2 | Patients, appointments, visits, files, reports |
| Common form/status/error/pagination UI | B1–B2 | All screens |
| Patient identity/contact service | B2 | Search, appointments, visits, referrals, documents |
| File storage + metadata service | B3 | Visit sources, external reports, imaging, consent artifacts |
| Visit/encounter context/timeline | B5 | Clinical drafts, procedures, documents, reminders |
| Audit/provenance helper | B2 lightweight; expanded B12 | All meaningful state transitions |
| Windmill job envelope + idempotency | B8 | Reminders, imports, exports, notifications, AI-assisted jobs |
| Notification/delivery adapter | B8 candidate-only, later delivery | Reminders, operational messages |
| Realtime subscription/reconcile helper | B7 | Patient/appointment/visit/document status |
| AI adapter + tool registry + confirmation gate | B9 | Conversational retrieval, drafting and later voice |
| Test fixtures and synthetic tenant factory | B2 | All integration/security/E2E tests |

## 7. Research-to-implementation traceability

Do not copy the entire research notebook into source code. Use the research files as evidence and the implementation artifacts as executable contracts.

For each feature, record a small trace row:
- Requirement ID and short behavior statement.
- Source/decision links (decision log, field inventory/maps, comparison, traceability matrix, applicable addendum).
- Target entity/API/workflow/UI.
- Acceptance test or fixture.
- Batch, status, commit/PR, evidence and open question.

Use `TRACEABILITY_MATRIX.md` and `FIELD_LEVEL_INVENTORY.md` as inputs; do not manually duplicate all their content into this roadmap. If an existing source does not support a field or legal interpretation, mark it open rather than inventing a rule.

## 8. Prototype exit checklist

Prototype is complete only when:
- [ ] The core user journey is usable from login through patient, document, appointment and visit timeline.
- [ ] Original documents remain intact and are linked correctly.
- [ ] Appointment, visit, visit purpose and treatment are not conflated.
- [ ] A draft is not silently treated as approved.
- [ ] Windmill performs at least one deterministic workflow beyond the connectivity ping.
- [ ] Realtime is tested with two authorized synthetic users or clearly marked deferred.
- [ ] The two-tenant synthetic test covers core patient/document/appointment/visit paths.
- [ ] Mobile layouts, empty/error/loading states and account switching are tested.
- [ ] Every claim has evidence; known gaps and deferred modules are listed.

Passing this checklist means **prototype validated for its tested scope**, not enterprise-ready.

## 9. Enterprise exit checklist

Before real patient data or a broader production pilot:
- [ ] Trusted backend enforcement and two-tenant negative tests cover every implemented operation.
- [ ] Clinical authority, signature/approval and amendment behavior are reviewed for the implemented clinical scope.
- [ ] Consent, retention, access, export and deletion lifecycles are approved for the intended jurisdiction and clinic category.
- [ ] Files, audit, background jobs, AI retrieval and exports are tenant-bound and tested.
- [ ] Backup/restore, migration rollback, monitoring and incident response are exercised.
- [ ] Mobile, accessibility, reliability and load tests match the intended launch scale.
- [ ] Qualified clinical/legal/privacy/regulatory owners have signed off on applicable scope.
- [ ] Release evidence and rollback steps are linked to the tagged version.

## 10. Immediate next actions

1. Preserve this roadmap as the current prototype-first sequencing reference.
2. Inspect the actual `main` branch application files and determine whether the preserved Vue prototype is present or only exists in the prior backup/research history.
3. Verify current build/deployment/sync workflow state without changing live data.
4. Create an implementation branch and restore/rebuild only the smallest app shell needed, preserving all current research and deployment assets.
5. Start Batch 1 and deliver a runnable, reviewable vertical slice before broad schema expansion.

## 11. Relationship to the existing master batch plan

`IMPLEMENTATION_BATCH_PLAN.txt` remains the broad enterprise checklist and risk inventory. This document changes the **delivery order** to match the owner’s prototype-first decision; it does not erase or dismiss its security, clinical, privacy or operational requirements. Apply the detailed hardening batches after the complete synthetic-data prototype works, while keeping the minimum safety floor active from day one. If the documents appear to conflict, use the prototype-first sequencing here and retain the enterprise controls as pre-production gates.

## 12. Change log

- **2026-10-28:** Initial prototype-first roadmap authored after reviewing the research index, conversation decision log, implementation batch plan, gap review, field inventory/source maps, traceability matrix and B17–B38 plus B37A/B38 research coverage. It records the verified Appwrite-to-Windmill ping as connectivity only and explicitly separates prototype implementation from enterprise validation.
