# ClearFlow Dental repository architecture audit

- **Reviewed commit:** `209db00166203376ad062a1e8eb91f0ff632e55f`
- **Branch:** `main`
- **Review date:** 2026-10-29
- **Scope:** Tracked repository structure, representative frontend/service modules, Appwrite API and AI paths, Windmill assets, schema verification, and GitHub Actions configuration.
- **Method:** Read-only repository inspection plus comparison with official Vue, Google Cloud Well-Architected, Microsoft multitenant-agent, and Martin Fowler monolith-first guidance.
- **Not performed:** Live authenticated browser testing, live database/schema verification, live AI provider calls, or an exhaustive line-by-line security penetration test.

## Executive summary

The repository has **49 tracked files** at the reviewed commit. It is small enough that a wholesale folder reorganization is not justified. The current top-level separation by deployable/runtime boundary is broadly sensible:

- `app/`: Vue 3 + Vite web application.
- `appwrite/functions/clearflow-dental-api/`: authenticated application API.
- `appwrite/functions/clearflow-windmill-bridge/`: separately deployed Windmill bridge.
- `appwrite/schema/` and `scripts/appwrite-schema/`: schema manifest and read-only verifier.
- `f/dental/`: Windmill-managed assets.
- `.github/workflows/`: validation and scoped deployment workflows.

**Recommendation:** keep the current top-level layout for now. Improve internal modularity and test coverage in small, verified steps. Do not introduce a new microservice, separate AI runtime, or broad `backend/`, `ai/`, and `python/` trees until a concrete deployment or ownership boundary requires it.

## Repository inventory

| Area | Tracked files |
|---|---:|
| `app/` | 23 |
| `.github/workflows/` | 6 |
| `appwrite/` | 12 |
| `f/` | 3 |
| `scripts/` | 2 |
| Root README | 1 |
| Root configuration files (`appwrite.config.json`, `wmill.yaml`) | 2 |
| **Total** | **49** |

Counts exclude dependencies and generated build output.

## Findings and priorities

### P1 — Address before expanding real AI/clinical usage

1. **The Appwrite API entry point owns too many responsibilities.**  
   `appwrite/functions/clearflow-dental-api/src/main.js` contains request/authentication handling, membership checks, clinic/patient/appointment/encounter/document operations, AI provider requests, conversation persistence, usage tracking, and workspace search in one action-dispatch function. This increases the cost of testing changes and makes boundaries harder to inspect. Extract cohesive internal modules while preserving the deployed entry point, action names, payloads, response shapes, and environment variables.

2. **AI conversation context is not currently sent to the model.**  
   The `ai.chat` path sends only the current user message in the provider request. The API stores conversation messages and exposes `ai.history.list`, but the inspected frontend chat starts a conversation ID and does not load history. A conversation ID therefore groups records but does not yet establish multi-turn model context. Treat this as a capability gap, not a folder-structure issue.

3. **AI budget enforcement is not reliable enough to represent actual cost control.**  
   Usage rows currently record `costMinor: 0` until model pricing is implemented. The budget check sums a bounded list of usage rows, and the shared `listRows` helper caps results at 100 without pagination. A configured budget therefore cannot yet be described as an accurate spend limit. Before relying on it, implement complete/efficient monthly aggregation, model pricing, and concurrency-safe budget enforcement.

4. **List operations silently cap results at 100 rows.**  
   `listRows` appends `Query.limit(100)` and does not paginate. This affects clinical lists, workspace search, AI usage checks, and other queries using the helper. Counts and search results can be incomplete once a tenant exceeds the cap. Add explicit pagination or documented bounded queries, and test behavior above 100 records.

5. **The schema manifest filename and declared version disagree.**  
   The file is named `appwrite/schema/prototype-v0.1.json`, while its `schemaVersion` is `0.2` and notes call it v0.2. The verifier refers to the filename directly. Resolve this with a compatibility-conscious rename or a documented canonical filename change, and update all references together.

### P2 — Improve as part of modularization

6. **Frontend services have clear beginnings but inconsistent feature boundaries.**  
   `app/src/services/` is a useful service boundary and `features/` groups screens by capability. Keep it. As code grows, split the API handler into domain modules that correspond to existing actions (clinic, clinical records, documents, AI, search/audit), not a generic hierarchy invented in advance.

7. **Overview metrics are derived from loaded list lengths.**  
   `overview-service.js` loads patient, appointment, and encounter lists, then uses their lengths. With the 100-row cap, these are not reliable total counts. Prefer explicit count/summary operations or paginated aggregation when required.

8. **The automated validation suite is narrow.**  
   The API package has focused tests for AI provider configuration, credential encryption, and domain helpers. There are no inspected automated tests for tenant authorization across API actions, pagination, AI history/context, budget accounting, clinical workflows, or the Windmill bridge. Add tests before changing the relevant modules.

9. **Windmill deployment boundaries are appropriately explicit but need operational caution.**  
   The dry-run workflow and manually confirmed production sync both scope to `f/dental/**` and skip secrets/resources. The production workflow warns that items inside the included scope can be overwritten or deleted. Preserve this narrow scope and inspect dry-run output before manual production sync.

10. **Schema verification is manual and read-only.**  
    `.github/workflows/verify-appwrite-schema.yml` requires explicit confirmation and runs `verify.mjs`. It checks the tables named in the manifest and bucket settings, but does not appear to reject additional tables or compare every schema attribute. Keep it read-only; broaden its checks deliberately and run it against the live project before making schema claims.

11. **The memory setting is a preference flag, not an implemented memory system.**  
    The AI settings screen labels it “preference only,” and the inspected `ai.chat` provider payload sends only the current message. Do not represent memory as operational until a defined memory store, retrieval policy, tenant/user scoping, consent/retention controls, and tests exist.

12. **Audit event failure handling deserves review.**  
    The shared `logEvent` helper catches and suppresses write failures. That may be acceptable for non-critical telemetry, but should not be used where an audit event is a required security or compliance record. Decide which events are best-effort versus transaction-critical and implement that distinction explicitly.

13. **Deployment validation does not fully cover all runtime assets.**  
    The main validation workflow builds the frontend and runs API unit tests. The Windmill bridge deployment workflow is scoped correctly to the bridge, but the bridge has no dedicated automated test suite in the inspected tree. Add a lightweight bridge test/validation job without broadening deployment scope.

## AI-first architecture assessment

The appropriate near-term pattern is a **modular monolith with explicit integration boundaries**:

1. **Product/UI:** Vue views, composables, and service adapters.
2. **Trusted application API:** Appwrite session verification, tenant membership, validation, and domain operations.
3. **Deterministic operations:** validated functions/workflows for calculations, transformations, and predictable business rules.
4. **AI provider adapter/orchestration:** provider/model selection, encrypted credentials, request normalization, error handling, usage and cost accounting.
5. **Automation integration:** the existing Appwrite-to-Windmill bridge and Git-managed Windmill assets.
6. **Persistence and governance:** tenant-scoped Appwrite records, schema checks, audit events, and explicit data-retention rules.

These are **logical responsibilities**, not a recommendation to create six new top-level folders or six services today. Keep the current deployable boundaries stable and introduce internal modules only where code can move with tests and verified imports.

For multi-tenant AI, tenant identity and permissions must be enforced by deterministic backend code at every data/tool boundary. Prompts or model behavior must not be treated as security controls. Tenant-specific credentials, configuration, conversation history, and any future memory need tenant-aware access and lifecycle controls.

## Suggested implementation sequence

### Batch 0 — Baseline and contracts
- Keep `main` as the only working branch, per project decision.
- Record current action names, request/response shapes, environment variables, function IDs, and deployment paths.
- Capture passing frontend build and API tests before edits.
- Do not modify the live schema during code refactoring.

### Batch 1 — Correctness tests before moving code
- Add tests for tenant authorization and unauthorized cross-tenant access.
- Add tests for the 100-row boundary and pagination expectations.
- Add tests for AI provider request construction and conversation context.
- Add tests for budget/usage calculations and audit failure behavior.

### Batch 2 — Internal API modules
- Extract one domain area at a time from `main.js`.
- Keep `src/main.js` as the Appwrite entry point.
- Preserve action names and payload/response contracts.
- Run all tests after each extraction.

### Batch 3 — AI behavior and cost correctness
- Decide the intended multi-turn conversation behavior and persist/load history consistently.
- Implement complete usage aggregation and pricing before describing the monthly budget as a hard limit.
- Keep `memoryEnabled` explicitly a preference until real, tested memory behavior is implemented.

### Batch 4 — Schema and integration verification
- Reconcile the schema manifest version/name.
- Run the existing read-only live schema verifier with approved credentials.
- Add bridge tests and validate Windmill dry-run output.
- Deploy only through the existing scoped/manual-confirmation workflows.

### Batch 5 — Reassess folder structure
- Move files only when the new boundary improves ownership, testing, or deployment clarity.
- Update imports, tests, Appwrite config, workflow path filters, and documentation in the same change.
- Avoid creating empty directories or speculative subsystems.

## External engineering references

These references informed the review; they do not prescribe one universal folder tree.

- Vue.js Style Guide: https://vuejs.org/style-guide/
- Google Cloud Well-Architected Framework: https://docs.cloud.google.com/architecture/framework
- Microsoft Learn, Considerations for Multitenant Agentic Systems: https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/agentic-systems
- Martin Fowler, Monolith First: https://martinfowler.com/bliki/MonolithFirst.html

## Verification limitations

This document is a repository architecture audit based on the reviewed commit and inspected files. It is not a live security certification, a complete Appwrite schema report, or proof that authentication, AI provider calls, and clinical workflows work end-to-end in production.
