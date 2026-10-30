# ClearFlow Dental Clinic — Implementation Roadmap

**Purpose:** The single staged plan for completing the prototype end to end while preserving the architecture goal.  
**Canonical branch:** `main`  
**Status:** Planning baseline; stages must be marked complete only when their exit criteria have evidence.

This roadmap turns the [Architecture Goal](architecture-goal.md) and [Repository Architecture Audit](repository-audit-2026-10-29.md) into a practical delivery sequence. It is deliberately organized around dependencies and verifiable outcomes, not a speculative rewrite or a new folder structure.

## Rules for using this plan

- Work on **one stage at a time**, in the order below unless an actual dependency or test result requires a documented adjustment.
- Keep changes small and focused. Do not combine unrelated refactors.
- Before editing a behavior, inspect its current implementation, callers, data contract, and tests.
- Preserve the current top-level layout and deployable boundaries. Extract internal modules only when doing so improves a real responsibility boundary.
- Keep the existing JavaScript/Vue conventions; do not introduce TypeScript or a new framework as part of this plan.
- Do not change production data, apply destructive schema changes, deploy functions, or sync production Windmill assets as incidental work. Treat these as separate, explicitly approved operations.
- A checkbox is not evidence by itself. Record the commit, test/build output, environment checked, and any limitation before marking a stage complete.
- Do not claim live verification from a unit test, or claim production deployment from a successful build.
- If a proposed change does not help the agreed end-to-end prototype, security, maintainability, or reliability, defer it.

## Overall delivery map

| Group | Stages | Outcome |
|---|---|---|
| A. Scope and baseline | 0–1 | A frozen prototype scope and reproducible baseline |
| B. Contracts and safety | 2–3 | Known data/API contracts and tested tenant boundaries |
| C. Core clinic journey | 4–5 | Authentication, clinic setup, workspace and clinical records work end to end |
| D. Reliability and data correctness | 6–7 | Lists, search, metrics, errors and schema checks are trustworthy |
| E. AI capability | 8–9 | AI configuration, chat context, usage, budgets and memory claims are explicit and tested |
| F. Automation integration | 10 | Windmill integration behaves safely and predictably |
| G. User experience and quality | 11–12 | Mobile usability, regression coverage and operational readiness |
| H. Release validation | 13 | A verified prototype with a clear record of what is and is not live |

---

# Group A — Scope and baseline

## Stage 0 — Agree the first-prototype scope

**Goal:** Define the exact journeys that the first complete prototype must support so implementation does not drift.

### Tasks
- [ ] List the roles and actors supported by the current product. Confirm which authentication methods and clinic ownership model are in scope.
- [ ] Confirm the minimum journey: sign in → clinic setup or selection → workspace → supported clinical record actions → reload and confirm persistence → sign out.
- [ ] Inventory the visible screens and actions already in the frontend. Label each as working, partially working, placeholder, or not connected to the real API.
- [ ] Decide which clinical entities and workflows are required for the prototype, using the existing schema and code as the starting point. Do not invent fields or workflows without a product decision.
- [ ] Decide which AI capabilities are required for the first release and which can remain disabled or explicitly marked as not implemented.
- [ ] Decide whether Windmill-dependent workflows are part of the first end-to-end acceptance path or are an optional integration.
- [ ] List out-of-scope items so they are not pulled into implementation by accident.
- [ ] Convert each in-scope journey into observable acceptance criteria.

### Deliverables
- [ ] Scope decisions recorded in this roadmap or a linked decision record.
- [ ] A prioritized list of must-work user journeys.
- [ ] A clear list of intentionally deferred capabilities.

### Exit gate
No major implementation batch begins until the minimum prototype journey and excluded scope are clear.

## Stage 1 — Reproduce and record the current baseline

**Goal:** Know what works today before changing it.

### Tasks
- [ ] Confirm the current commit on `main` and inspect the working tree/diff where available.
- [ ] Inspect the package scripts and dependency requirements for the Vue app, Dental API, bridge and schema verifier.
- [ ] Run the frontend production build from the documented clean-install instructions.
- [ ] Run the Dental API unit tests.
- [ ] Run any existing bridge tests, Windmill dry-run checks, and schema-verifier checks that can safely run without production mutation.
- [ ] Inspect GitHub Actions results for the current commit and record the exact run and result; do not infer success from an earlier commit.
- [ ] Identify required environment variables and distinguish local test configuration from live secrets.
- [ ] Record existing failures, flaky checks, missing setup, and environment-dependent checks before fixing anything.
- [ ] Confirm that generated files, dependencies, credentials, patient information and local environment files are not being added to Git.

### Deliverables
- [ ] Baseline checklist with commands, results and commit SHA.
- [ ] Known-failure list separated from newly introduced regressions.
- [ ] Environment/setup checklist with secret values excluded.

### Exit gate
The team can reproduce the available automated checks and can tell a pre-existing failure from a new failure.

---

# Group B — Contracts and safety

## Stage 2 — Map API, schema and deployment contracts

**Goal:** Make the existing connections explicit before restructuring internals.

### Tasks
- [ ] Map frontend service methods in `app/src/services/` to their API action names and the corresponding handler paths.
- [ ] For every in-scope action, document required input, authenticated actor, tenant/clinic checks, persisted data, success response and error response.
- [ ] Identify the actual Appwrite database, tables/collections, indexes, buckets and permissions referenced by the code. Use the existing schema manifest as a starting point, not as proof of live schema state.
- [ ] Trace authentication from the frontend Appwrite client through actor verification and membership validation.
- [ ] Map the Windmill bridge request to its configured endpoint, secret/resource expectations and failure behavior without exposing secret values.
- [ ] Inspect GitHub workflows for path filters, target function names, deployment commands, confirmation gates and production scope.
- [ ] Resolve the schema manifest filename/version mismatch in one focused change. Update all references together and keep the verifier read-only.
- [ ] Record any contract ambiguity before changing it. If a contract must change, update its callers, tests and documentation in the same batch.

### Deliverables
- [ ] Compact action/contract map for the in-scope prototype journeys.
- [ ] Schema manifest and verifier references agree.
- [ ] Deployment boundaries and required configuration are documented.

### Exit gate
Every in-scope frontend operation can be traced to a server action and intended data contract, and no refactor depends on guessing a contract.

## Stage 3 — Establish tenant isolation and authorization tests

**Goal:** Prove the server—not browser input—controls access to clinic-owned data.

### Tasks
- [ ] Review the authenticated actor resolution path and ensure untrusted request fields cannot impersonate a different actor.
- [ ] Review clinic membership lookup and authorization checks for each tenant-owned read and write action.
- [ ] Build tests for an authenticated member accessing their own clinic's data.
- [ ] Build negative tests for a user who is not a member, a missing/invalid identity, a missing clinic context and a request that supplies another clinic's identifier.
- [ ] Verify that all records returned by search, history, overview and clinical list actions are tenant-scoped.
- [ ] Verify that file/document operations enforce clinic ownership and appropriate access.
- [ ] Review whether audit events that are required for security can fail silently. Separate mandatory security/audit records from best-effort telemetry.
- [ ] Check that error responses do not leak another clinic's data, provider credentials, encryption details or internal secrets.
- [ ] Add regression tests before modifying the relevant authorization code.

### Deliverables
- [ ] Repeatable tenant authorization test suite.
- [ ] A list of covered actions and any actions not yet covered.
- [ ] Documented disposition for required versus best-effort audit events.

### Exit gate
Positive and negative authorization tests pass for the in-scope actions. Any untested tenant-owned action is explicitly recorded as a blocker, not assumed safe.

---

# Group C — Core clinic journey

## Stage 4 — Complete authentication and clinic setup

**Goal:** A real user can establish a valid session and reach the correct clinic workspace.

### Tasks
- [ ] Inspect the current auth screen, Appwrite client, session composable and clinic setup screen before changing them.
- [ ] Verify sign-in success, session restoration after refresh, sign-out, invalid session and expired-session behavior in the configured environment.
- [ ] Verify loading, empty, validation-error, permission-error and network-error states for authentication and clinic setup.
- [ ] Verify clinic setup persists to Appwrite and the workspace is loaded from the server after reload.
- [ ] Verify the current actor's clinic membership is established using trusted server-side rules.
- [ ] Verify a user cannot gain access by manually changing clinic identifiers in the browser.
- [ ] Ensure credentials and server-only keys are not bundled into frontend code or browser responses.
- [ ] Keep the existing visual design unless a functional issue requires a targeted UI change.

### Deliverables
- [ ] Tested sign-in → setup/selection → workspace journey.
- [ ] Clear handling of unauthenticated, unauthorized and network-failure states.

### Exit gate
An authenticated user can reach only an authorized clinic workspace and can reload it without losing the valid session/workspace relationship.

## Stage 5 — Complete the agreed clinical workflows

**Goal:** In-scope clinical operations use the real API and persist correctly.

### Tasks
- [ ] Use Stage 0 scope to choose the exact records/actions required; do not silently expand the scope.
- [ ] For each selected workflow, trace the Vue component → frontend service → Appwrite action → persistence → returned data.
- [ ] Verify create, read, update and any supported delete/archive operation for each in-scope entity.
- [ ] Verify required-field validation and server-side validation for malformed or incomplete input.
- [ ] Verify relationships between records follow the existing data model and cannot cross clinic boundaries.
- [ ] Verify success feedback reflects a confirmed server response, not only an optimistic local update.
- [ ] Reload the page and confirm persisted data is recovered from the server/cache according to the existing design.
- [ ] Verify duplicate submission, rapid repeat actions and network failure do not create misleading UI state or accidental duplicate records where the current operation requires idempotency.
- [ ] Add tests for normal behavior and the most important invalid/unauthorized paths.
- [ ] Avoid changing multiple unrelated clinical entities in one implementation batch.

### Deliverables
- [ ] Each agreed clinical journey works against the configured backend.
- [ ] Tests cover the main domain rules and failure paths.
- [ ] Remaining unimplemented clinical workflows are explicitly listed.

### Exit gate
The agreed clinical workflow can be completed from the UI, its data persists after reload, and tenant authorization is covered by tests.

---

# Group D — Reliability and data correctness

## Stage 6 — Correct list limits, pagination, search and overview metrics

**Goal:** Prevent silent data truncation and inaccurate counts.

### Tasks
- [ ] Identify every use of the shared `listRows` helper and classify it as a list, search, aggregation, history or usage query.
- [ ] Decide per operation whether it needs pagination, a documented hard limit, a count/summary query or a bounded recent-history window.
- [ ] Implement pagination using the installed Appwrite SDK's supported query/cursor mechanisms; confirm exact SDK behavior before coding.
- [ ] Preserve current response contracts where possible. If a response must change, update all callers and tests in the same batch.
- [ ] Ensure pagination remains tenant-scoped on every page and cannot be manipulated to bypass authorization.
- [ ] Add tests with more than 100 records, including records at page boundaries and across two tenants.
- [ ] Ensure workspace search reports whether results are complete or intentionally limited.
- [ ] Correct overview metrics so loaded-page lengths are not presented as true totals unless that is explicitly the intended definition.
- [ ] Ensure AI usage checks do not rely on a silently truncated usage list.
- [ ] Check ordering, duplicate rows between pages and behavior when records are added during paging.

### Deliverables
- [ ] Documented pagination/limit behavior for each affected operation.
- [ ] Tests proving behavior above 100 records.
- [ ] Overview/search/usage results that match their documented semantics.

### Exit gate
No affected operation silently presents a partial result as complete, and tenant filtering remains enforced across pages.

## Stage 7 — Standardize errors, persistence behavior and schema verification

**Goal:** Make failure behavior understandable and data contracts dependable.

### Tasks
- [ ] Inventory current API error shapes and how the frontend service layer handles them.
- [ ] Define a small consistent error contract while preserving existing consumers or migrating them deliberately.
- [ ] Ensure expected validation, authentication, permission, not-found, rate/limit and provider errors are distinguishable without exposing internals.
- [ ] Check loading and retry behavior for network failures; avoid infinite retry loops or duplicate writes.
- [ ] Review writes that need atomicity or idempotency. Use the capabilities actually supported by the existing Appwrite services; do not assume a transaction facility without verifying it.
- [ ] Review required audit events and surface failure where the operation must not proceed without the event.
- [ ] Update the schema verifier deliberately to cover the attributes, indexes, bucket settings and permissions required by the agreed scope.
- [ ] Keep schema verification read-only. Do not make it auto-create, mutate or delete production schema.
- [ ] Run local/mock verification first, then schedule a separate live read-only schema verification with the correct credentials.
- [ ] Record any difference between manifest expectations and live Appwrite schema before proposing a migration.

### Deliverables
- [ ] Consistent user-safe errors with preserved diagnostic detail in appropriate server logs.
- [ ] Schema manifest/verifier aligned and live differences recorded.
- [ ] Documented handling of operations that require idempotency or stronger write guarantees.

### Exit gate
Failure cases are predictable and visible, and schema claims are backed by the appropriate read-only verification evidence.

---

# Group E — AI capability

## Stage 8 — Modularize the API and AI boundary safely

**Goal:** Reduce the oversized API handler without breaking the deployed function or its callers.

### Tasks
- [ ] Add or confirm regression tests for current action names, request payloads, response shapes, authentication and error behavior before extraction.
- [ ] Keep the current Appwrite function entry point and deployment configuration stable.
- [ ] Identify cohesive groups from existing responsibilities: actor/membership checks, clinical domain actions, AI configuration/credentials, AI chat/history/usage, search and audit handling.
- [ ] Extract one cohesive group at a time into internal modules within the existing function package. Do not create new deployable services for organizational neatness.
- [ ] Keep the central dispatcher thin: parse/validate the request, resolve trusted actor context, route to the appropriate handler and normalize errors.
- [ ] Avoid circular dependencies and duplicate authorization logic. Shared helpers should have clear inputs and outputs.
- [ ] Preserve environment variable names and secret handling.
- [ ] Run the complete API test suite after each extraction and compare behavior before/after.
- [ ] Review the diff to ensure the change is structural, not an accidental rewrite of business rules.

### Deliverables
- [ ] Smaller internal modules with explicit responsibilities.
- [ ] Stable function entry point and action contracts.
- [ ] Regression tests passing after every extraction batch.

### Exit gate
The API is easier to reason about and test without requiring frontend or deployment contract changes.

## Stage 9 — Finish the agreed AI behavior honestly

**Goal:** Implement only the AI behavior agreed for the prototype and make its limitations clear.

### Part A — Provider configuration and credentials
- [ ] Verify provider/model configuration validation and safe defaults.
- [ ] Verify credentials are saved and retrieved only through the trusted server path and remain encrypted according to the current design.
- [ ] Verify credentials never appear in frontend responses, browser storage, logs or error messages.
- [ ] Test missing credentials, invalid provider/model, provider timeout, rate limiting and malformed provider response.
- [ ] Ensure UI state accurately reflects whether a provider is configured and usable.

### Part B — Conversation behavior
- [ ] Agree whether conversations are truly multi-turn in the first prototype or explicitly single-turn.
- [ ] If multi-turn is in scope, load the correct prior messages server-side using tenant-scoped conversation ownership checks.
- [ ] Define history ordering, maximum context size, message limits and behavior when history is too large.
- [ ] Ensure a conversation identifier cannot be used to read or append to another clinic's conversation.
- [ ] Persist user and assistant messages consistently; define behavior for a provider failure after the user message has been stored.
- [ ] Add tests for first message, follow-up message, empty history, long history, invalid conversation ID and cross-tenant conversation access.
- [ ] Make the frontend display the conversation state that the backend actually supports.

### Part C — Usage and budget correctness
- [ ] Define which usage fields are authoritative and which provider/model response fields can be used to estimate tokens or costs.
- [ ] Implement model pricing only from an explicit, maintained pricing configuration; unknown pricing must be marked unknown rather than recorded as zero cost.
- [ ] Replace bounded/truncated monthly spend calculations with a complete, scalable aggregation strategy supported by the current database/API.
- [ ] Decide how concurrent requests reserve/check budget and avoid representing a race-prone check as a hard cap.
- [ ] Define the meaning and reset period of each budget setting.
- [ ] Test missing usage data, unknown pricing, month boundaries, pagination and concurrent-request risks.
- [ ] Make UI labels accurately distinguish estimated cost, actual cost, unavailable cost and enforced budget.

### Part D — Memory decision
- [ ] Decide whether persistent AI memory is required for the first prototype.
- [ ] If deferred, keep the setting labelled as a preference/disabled capability and avoid implying retrieval is working.
- [ ] If implemented, specify memory storage, extraction rules, tenant/user scope, consent, access controls, retention/deletion, prompt injection handling and tests before building it.
- [ ] Do not use clinical information as persistent memory without explicit product, privacy and security decisions.

### Deliverables
- [ ] Agreed AI scope documented.
- [ ] Provider credentials and failure cases tested.
- [ ] Conversation context and usage claims match actual behavior.
- [ ] Memory is either safely implemented and verified or clearly deferred.

### Exit gate
The AI UI describes only verified capabilities; tenant-scoped history, credential protection and usage semantics have tests.

---

# Group F — Automation integration

## Stage 10 — Verify Windmill integration and deployment safety

**Goal:** Ensure automation is optional, correctly configured and safely deployable.

### Tasks
- [ ] Identify which prototype user journeys depend on Windmill and which should work without it.
- [ ] Trace the frontend/API request through the Appwrite Windmill bridge to the configured Windmill webhook and back.
- [ ] Verify authorization, payload validation, timeout behavior, provider/webhook errors and safe failure responses.
- [ ] Ensure the webhook URL/token and other resources are supplied by server-side configuration, not committed to Git or sent to the browser.
- [ ] Add bridge tests for valid request, missing configuration, rejected request, timeout and upstream error where practical.
- [ ] Verify the `f/dental/` deployment include/exclude rules and identify what a production sync could overwrite or delete.
- [ ] Run the dry-run workflow and inspect its output before any production sync.
- [ ] Confirm whether Windmill resources/secrets need separate manual setup and document them without exposing values.
- [ ] Keep production sync manually confirmed and separate from ordinary code commits.
- [ ] Verify the UI has a clear disabled/unconfigured/error state if Windmill is unavailable.

### Deliverables
- [ ] Documented integration path and required configuration.
- [ ] Bridge regression tests.
- [ ] Dry-run evidence and a safe deployment checklist.

### Exit gate
The agreed automation path works in a configured test environment, and failure or missing configuration does not silently appear as success.

---

# Group G — User experience and quality

## Stage 11 — Complete mobile-first usability and accessibility checks

**Goal:** Make the agreed journeys usable on a phone without introducing a visual redesign.

### Tasks
- [ ] Check every in-scope screen at narrow mobile widths and a larger desktop width.
- [ ] Confirm no unintended horizontal scrolling, clipped forms, inaccessible dialogs or hidden primary actions.
- [ ] Verify touch targets, form labels, validation messages, keyboard behavior and focus order.
- [ ] Check long names, long clinical text, empty lists and error messages for layout overflow.
- [ ] Verify loading, empty, success, error and disabled states across the core journey.
- [ ] Check that navigation state and form state behave predictably after refresh/back navigation where relevant.
- [ ] Avoid decorative redesign or new component libraries unless a specific usability issue requires it.
- [ ] Test the actual deployed frontend on a mobile device after a suitable deployment, not just a desktop browser resized to a narrow width.

### Deliverables
- [ ] Mobile review checklist and issue list.
- [ ] Targeted fixes for blocking usability problems.
- [ ] Evidence of deployed mobile checks where environment access allows.

### Exit gate
The core journey is usable on a narrow viewport with no blocking layout or interaction defects.

## Stage 12 — Regression suite and quality gates

**Goal:** Make future changes less likely to break previously completed work.

### Tasks
- [ ] Ensure CI runs the frontend production build and Dental API unit tests on relevant changes.
- [ ] Add tests for tenant isolation, pagination, core clinical workflows, AI context/usage and bridge behavior as those stages complete.
- [ ] Add regression coverage for bugs discovered during manual testing.
- [ ] Keep tests deterministic and independent of real patient data, live provider credentials and production writes.
- [ ] Use mocks/fixtures for unit tests; reserve live integration tests for explicitly configured environments.
- [ ] Confirm workflow path filters actually trigger for the files they are meant to validate.
- [ ] Verify deployment workflows remain manually gated where production changes are possible.
- [ ] Review dependency warnings and security advisories that materially affect the prototype; avoid unrelated dependency churn.
- [ ] Run the full applicable test/build set from a clean checkout before release.
- [ ] Record failures with enough detail to reproduce them.

### Deliverables
- [ ] CI covers the agreed regression-critical behavior.
- [ ] Clean-checkout validation instructions work.
- [ ] Production-changing workflows remain appropriately guarded.

### Exit gate
The required automated checks pass on the release candidate commit, and the exact commit/run is recorded.

---

# Group H — Release validation

## Stage 13 — End-to-end acceptance, deployment and handover

**Goal:** Demonstrate the complete prototype journey in the real configured environment and record its true status.

### Tasks
- [ ] Select a safe test clinic/account and synthetic test records; do not use real patient data for routine testing.
- [ ] Run the full journey from sign-in through clinic setup/workspace and every agreed clinical action.
- [ ] Reload between steps where useful to prove persistence rather than only local component state.
- [ ] Test unauthorized access using a separate test identity/clinic and verify no cross-tenant data is disclosed or changed.
- [ ] Test configured AI behavior, including a follow-up conversation if multi-turn is in scope, and verify saved history/usage behavior.
- [ ] Test Windmill only if it is in the agreed prototype scope; record any required manual resource setup.
- [ ] Verify schema using the read-only verifier against the intended Appwrite project and record the target/project context without secrets.
- [ ] Confirm GitHub Actions status for the exact candidate commit.
- [ ] Confirm Cloudflare Pages deployment status for the exact candidate commit and test the deployed URL.
- [ ] If an Appwrite function deployment is required, review the diff and deployment target, obtain explicit approval, deploy only the intended function and smoke-test it.
- [ ] If a Windmill production sync is required, review the dry-run output, obtain explicit approval, sync only the intended scope and smoke-test it.
- [ ] Record browser, mobile, backend and integration checks separately; mark any check not performed as unverified.
- [ ] Review logs for leaked credentials or patient information and remove test data through the approved process.
- [ ] Write a concise release note: what works, what was tested, known limitations, manual configuration and rollback/recovery notes.

### Deliverables
- [ ] End-to-end acceptance checklist with pass/fail/unverified statuses.
- [ ] Commit SHA, CI run and deployment identifiers/URLs.
- [ ] Known limitations and remaining risks.
- [ ] Setup, deployment and rollback notes.

### Exit gate
The prototype is called complete only when all agreed critical journeys pass, tenant isolation has evidence, required checks pass, and all unverified items are explicitly disclosed.

---

# Cross-stage definition of done

A stage or implementation batch is done only when all applicable conditions are met:

- [ ] Scope and expected behavior are stated.
- [ ] Existing callers and contracts were inspected before editing.
- [ ] Code change is limited to the intended concern.
- [ ] Relevant tests were added or updated.
- [ ] Available tests/builds were run and their actual results recorded.
- [ ] The diff was reviewed for accidental UI, API, schema, security or deployment changes.
- [ ] Secrets and real patient data are not committed or exposed.
- [ ] Live verification is distinguished from automated verification.
- [ ] Remaining gaps and follow-up work are written down.

## Parking lot — defer unless required by the agreed scope

Keep these out of the active stage unless a real acceptance criterion depends on them:

- Splitting the application into microservices.
- Adding generic top-level `backend/`, `ai/` or `python/` directories for appearance.
- Replacing Vue, Appwrite or Windmill without evidence that the current choice blocks the prototype.
- Broad visual redesign or adding a new UI framework.
- Building persistent AI memory before its privacy, scope and retention rules are agreed.
- Claiming enterprise-scale budget enforcement before the required accounting and concurrency behavior exists.
- Building features for hypothetical future workflows not included in Stage 0.
- Broad dependency upgrades unrelated to a known defect or security requirement.

## Decision log

Record material changes to the sequence or scope here, with a date and reason. Keep the architecture goal as the governing principle.

| Date | Decision/change | Reason and evidence |
|---|---|---|
| 2026-10-29 | Initial roadmap created | Based on the architecture goal and repository audit dated 2026-10-29. |
| 2026-10-30 | Prioritize AI module completion before detailed clinic workflow design | Product direction confirmed: finish the provider-neutral AI module and Appwrite–Windmill–LiteLLM path first; then design clinic workflows around the verified AI capabilities. Keep tenant isolation, credential protection, and synthetic-only testing as required boundaries. |

## Related documents

- [Architecture Goal](architecture-goal.md) — principles and end-to-end acceptance criteria.
- [Repository Architecture Audit](repository-audit-2026-10-29.md) — current-state findings and known gaps.
