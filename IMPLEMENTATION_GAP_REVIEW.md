# ClearFlow Dental Clinic — Preserved Application Implementation Gap Review
**Reviewed:** 2026-10-27  
**Branch inspected:** `backup/before-project-notes-reset-2026-10-27`  
**Backend inspected read-only:** Appwrite project `6adcea89003c9613425b`, database `clearflow_dental`  
**Safety boundary:** Schema/settings metadata and application source were inspected. No patient rows were queried, and no live database or application writes were made in this review.

## Executive conclusion

The preserved application is a **small, useful prototype**, not an implementation of the B17–B37 research model and not ready for real patient information until the highest-priority controls are verified. It currently supports owner account/clinic setup, basic patient details and visit history with an advised next-visit date. The README explicitly says there are no payments, billing, WhatsApp or AI in this phase and calls out testing two user accounts before real data.

This review does not replace the application or change backend permissions. It translates the observed state into a verification backlog. Findings marked “unverified runtime condition” must be tested in a safe non-production environment before being described as a proven exploit or corrected by changing permissions.

## 1. Scope inspected

### Repository code on backup branch
- `README.md`
- `package.json`
- `src/App.vue`
- `src/main.js`
- `src/style.css`
- `src/lib/appwrite.js`
- `.env.example`
- `.github/workflows/build.yml`

The backup is a Vue 3 / JavaScript / Vite application using the Appwrite SDK. Package scripts are only `dev`, `build`, and `preview`. The CI workflow installs packages and runs `npm run build`; it does not run unit tests, tenant-isolation tests, schema validation, linting, type checking or browser integration tests. No test suite was seen in the inspected root/source paths.

### Live database metadata (not patient data)
Database ID: `clearflow_dental`; enabled/ready. TablesDB lists three enabled tables with row security enabled.

| Table | Current columns observed | Current indexes | What this does not provide |
|---|---|---|---|
| `dental_clinics` | `clinic_name` (required string, max 255); `owner_user_id` (required string, max 36) | non-unique key index on `owner_user_id` | No facility registration/category/address, membership/roles, credential, lifecycle or unique one-owner-one-clinic constraint visible |
| `dental_patients` | `clinic_id` (required string, max 36); `owner_user_id` (required string, max 36); `full_name` (required string, max 255); `phone` (optional string, max 64); `notes` (optional text) | key indexes on `clinic_id`, `owner_user_id` | No relationship/contact types, demographics/identifiers/history, source or verification, access sensitivity, archive/merge or author/versioned notes |
| `dental_visits` | `clinic_id`, `owner_user_id`, `patient_id` (required strings, max 36); `treatment_name` (required string, max 255); `treatment_date` (required string, max 10); `doctor_advice` (optional text); `next_visit_date` (optional string, max 10) | key indexes on clinic, patient and owner columns | No native relationship/FK constraints, encounter/procedure code/target/status, responsible provider, authored/signed notes, correction history, recall obligation, appointment booking or reminder lifecycle |

**Important:** The current schema's strings that look like IDs are not database-enforced relationships. Indexes are not foreign keys, and filtering by an ID in a browser query is not proof the linked record belongs to the active tenant.

## 2. Code path findings

### APP-001 / P0 — Sensitive writes happen from the browser
`src/lib/appwrite.js` constructs an Appwrite client with public frontend configuration and uses `TablesDB.createRow` in client code for clinics, patients and visits. The client payload supplies `clinicId`, `patientId` and `userId`; frontend code passes current values from state, but a caller can alter request arguments. No server-side validation function was found in the inspected source to independently re-derive authenticated user, confirm clinic ownership, resolve the patient within that clinic, and authorize the requested action.

**Required outcome:** Move trust-critical writes to an Appwrite Function / server-side service (or another authorized backend) that derives identity from verified execution context and performs relationship, tenant, permission and lifecycle checks. Do not trust owner/clinic IDs supplied by the browser. Keep user-visible UI filters as usability filters only.

### APP-002 / P0 — Visit-to-patient ownership is not validated in observed client code
The current `createVisit(clinicId, userId, patientId, input)` writes the provided clinic, owner and patient IDs as strings. The code does not first fetch/validate that the patient row belongs to that clinic and owner in a way enforced outside the client. Because `patient_id` is a plain string, Appwrite cannot apply a native relationship permission/constraint for that link.

**Required outcome:** Validate that the authenticated user has an active role in clinic; the clinic belongs to the permitted tenant; the patient is a member of that same tenant; and any linked visit, image, prescription or procedure resolves inside the authorized scope. Enforce this at every mutation and at background-worker boundaries, not only in the modal/UI.

### APP-003 / P0 — Row-level listing permission behavior needs an immediate sandbox test
Observed live metadata: each table has row security enabled and table-level permissions appear to grant only `create("users")`. Browser-created rows receive per-user read/update/delete permissions. The client uses `TablesDB.listRows` for clinics, patients and visits.

Current Appwrite documentation states that row permissions can grant access to individual rows, and a user with table-level read/update/delete permission can access every row in the table; it also says `listRows` requires table-level READ, whereas `getRow` can use table- or row-level READ:
- https://appwrite.io/docs/products/databases/tablesdb/permissions
- https://appwrite.io/docs/products/databases/tablesdb/rows
- https://appwrite.io/docs/advanced/security/permissions

**Do not “fix” this by granting table-level READ to every user:** Appwrite docs explicitly define table-level access as access to all rows in that table. This appears to be a potential functional mismatch (private row permissions plus listRows call), not a proven runtime result in this review. Run controlled authenticated tests first. If direct client listing cannot be made both functional and tenant-safe under the current Appwrite version/configuration, provide a backend-mediated list endpoint with explicit tenant authorization and least-privileged server API key, and keep that key out of the browser.

### APP-004 / P0 — Owner identity is not clinic team membership or professional authority
The data model has one owner ID on each row and no explicit clinic membership, role assignment, practitioner credential, or action grant. This does not express the intended future distinction between tenant, clinic staff, dentist, receptionist, clinic manager, external laboratory mechanic, billing user and AI execution authority.

**Required outcome:** Introduce separately versioned role and membership/access grants only when product scope is defined. A logged-in account alone must not imply professional authority to issue a prescription, sign a clinical record, export a record, amend signed content or approve a refund.

### APP-005 / P1 — One-clinic lookup is not enforced unique
`getMyClinic` queries owner ID with limit 1 and returns the first matching row. The owner index observed is not unique. If one owner can have multiple clinics, provide a clinic selector; if the product requires exactly one clinic, enforce the invariant at the backend/database and handle concurrent creation. Do not rely on first-row selection to enforce a business rule.

### APP-006 / P1 — Pagination limits can silently truncate workspace data
`listPatients` uses a limit of 500; `listVisits` uses a limit of 1000 and does not loop through cursors. Appwrite list calls are paginated. Clinics with more rows than those limits may appear to have missing data if the UI does not show truncation.

**Required outcome:** Implement cursor pagination and deterministic ordering; explicitly signal partial/failed loads. Confirm index support for required sort/filter combinations. Any server-side projection should use bounded page sizes.

### APP-007 / P1 — No idempotency or concurrency guards in observed create paths
Row create operations use `ID.unique()`, and no command/idempotency key is recorded. A double tap or network retry may create duplicate visit records. Appointment completion and stock/finance workflows do not exist yet, but their future side effects need transaction/unique-key tests.

**Required outcome:** Generate a stable command key for operations that may be retried; persist outcome keyed to tenant + operation + key; validate payload equivalence before replay; use Appwrite transaction support or a backend-controlled atomic workflow where multi-record updates require all-or-nothing semantics.

### APP-008 / P1 — Notes and visits lack authored immutable clinical history
Visit has free-text treatment name/advice and a date but no author/provider, status, encounter association, clinical-code version, content hash, signed state, amendment reason or version. Patient notes are mutable free text. This is not enough to support signed clinical record claims or traceable amendments.

**Required outcome:** Treat current visit/note fields as simple prototype records. Before clinical use, define when a note is draft, finalized/signed or amended, bind signatures to exact content and capture authorship. Preserve raw text/import provenance rather than silently normalizing away meaning.

### APP-009 / P1 — Follow-up date is not a scheduled appointment or communication
The README and UI state that upcoming next-visit dates are display-only and no reminders are sent. `next_visit_date` is a date field only, with no recall type/rule, appointment resource, channel permission, task, message attempt or provider delivery result.

**Required outcome:** Do not display the field as an actual booked appointment or scheduled reminder. Introduce separate concepts for recall obligation, appointment, task/outbox message, provider result, patient response and care completion when those features are explicitly scoped.

### APP-010 / P1 — Application has no test suite or high-risk CI gates
Inspected `package.json` has no test, lint or type-check script; `.github/workflows/build.yml` only runs installation and production build. No authenticated browser test of two-tenants was available in this review. Main branch is research-notes-only, so the build workflow on the backup branch should not be confused with CI currently validating research-only main.

**Required outcome:** Add automated validation for domain constraints, tenant-safe link lookups, idempotency, authorization denials, field validators and migrations; add a two-user Appwrite integration test using synthetic records; preserve deterministic fixtures and CI logs. Keep the production build, security tests and live browser validation as separate evidence classes.

### APP-011 / P1 — Account registration surface requires deployment review
The UI supports email/password account creation and login. The app handles signup and session creation in the browser. Current README documents Appwrite endpoint/project/database IDs, which are client configuration values and may be public; privileged API keys must never enter this surface. Review Appwrite console signup restrictions, email verification, password/session policies and account recovery configuration before production.

**Required outcome:** Choose and document the identity policy (the project has previously considered OAuth/phone OTP for other products, but this dental prototype currently uses email/password). Do not claim OTP/OAuth is implemented unless the code and provider config prove it. Validate login throttling/session expiry/revocation, verified email/phone and account recovery flows.

### APP-012 / P1 — Data deletion, archive and data retention workflow not present
The observed schema has no explicit archive/deactivation/soft-delete or record-retention/legal hold columns and no audit/amendment mechanism. Absence of an archive UI does not mean records can safely be hard-deleted.

**Required outcome:** Decide a record-class retention policy after clinical/legal review; keep corrections/archival events, legal-hold checks and record-access/disclosure evidence. A generic delete button must not erase signed or referenced clinical/financial history.

### APP-013 / P2 — Schema has no provenance/import/terminology structure
No dedicated field groups for external-system IDs, raw imported values, terminology system/version, mapping version or conflict state are present in three tables.

**Required outcome:** Add these capabilities in the future data model only where applicable; never guess mappings for unmapped tooth number, medication code, unit or clinical status. Keep original raw source values and explicit exceptions.

## 3. Priority-ordered sandbox verification plan

Run in a **non-production Appwrite project using synthetic data and two test accounts**; never probe real patient data.

1. **Listing behavior:** With live-equivalent table settings (row security true, table CREATE only, rows carrying per-user READ/UPDATE/DELETE), verify account A can list only its own rows using each current query. Record exact API status/body. Test direct get by ID separately. Test with current Appwrite version; docs indicate list/read permission differences.
2. **Cross-tenant negative tests:** Seed clinic/patient/visit for account B; account A attempts list, direct get, update, delete and relationship lookup by B's IDs. All should deny access without revealing B's PHI.
3. **Forged relationships:** Account A attempts create visit with A's clinic/owner but B's patient ID; alter clinic/user IDs in requests, call the direct API bypassing frontend, and repeat after membership revoke. The operation must fail at trusted backend.
4. **Row permission tampering:** Try create with row permissions granting another user access. Verify the authoritative backend ignores or safely validates requested permissions rather than accepting client authorization claims.
5. **Duplicate clinic race:** Run concurrent clinic setup requests and verify intended cardinality; if multi-clinic is allowed, prove selection works without arbitrary limit-1.
6. **Idempotent retry:** Repeat the same visit-create command with the same idempotency key and simulated timeouts; expect one row and the same stable outcome.
7. **Pagination:** Seed more than 500 patients and 1,000 visits; verify every record is surfaced by cursor pages, stable sort, no duplicate/skip at page boundary.
8. **Logout and account switch:** Sign out A, sign in B; clear client state/cache and confirm no A data remains visible or actionable.
9. **Authorization revocation:** Revoke membership/row access during a session; next sensitive request/worker run must deny.
10. **End-to-end evidence:** After the tests pass, record app/SDK/server version, table settings, test account role, requests/status codes, expected vs actual outcomes, and commit/report hash. Do not label anything fixed based only on visual filtering.

## 4. Current readiness classifications

| Area | Current evidence | Classification |
|---|---|---|
| Build | CI workflow definition exists on backup branch; not run in this review | Build pipeline defined, current passing status not verified |
| Schema | 3 tables / 14 business columns in live metadata | Prototype scope only |
| Tenant isolation | Row security enabled and user-specific row permissions are created, but list/read behavior and linked-ID validation not runtime-tested | **P0: unverified; not safe to claim production-ready** |
| Relationship integrity | IDs stored as strings; no native relations shown | **P0: backend relationship enforcement absent in inspected client code** |
| Clinical prescriptions/signatures | Not present in app tables/UI | Not implemented |
| Appointments/recalls/messaging | Next-date display only; no appointment booking/reminders | Not implemented |
| Financial/inventory/claims | Not present in inspected app scope | Not implemented |
| Provenance/audit/amendments | No dedicated structures in inspected schema | Not implemented |
| Test coverage | Build only in workflow; no test script discovered | P0 security and integrity test coverage missing |
| Research-to-code traceability | Matrix and inventory now documented; no generated schema/code mapping | In progress |

## 5. Allowed next engineering step (after research review)
1. Keep research-only `main` separate from application work.
2. Create a feature branch from the preserved application branch for the sandbox security tests and minimal server-mediated tenant-safe operations; do not merge to deployment branch before tests pass.
3. Decide whether clinic scope is one clinic per owner or multiple clinics per owner, and define staff roles.
4. Build canonical source-to-target mappings from FIELD_LEVEL_INVENTORY.md before adding database columns/tables.
5. Make P0 tenant, relationship, idempotency and signed-content invariants executable CI tests.
6. Only after those safeguards are verified should a staged schema migration begin. Do not make schema changes by directly editing production tables first.

**Conclusion:** The prototype is a thin slice for basic patient and visit entry. The research model is much broader. Its most important near-term risk is not missing clinical features; it is ensuring that tenant-linked reads and mutations are authorized by trusted backend logic and validated by two-tenant tests. No live data was accessed or modified in this review.
