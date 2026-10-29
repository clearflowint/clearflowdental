# ClearFlow Dental Clinic — Architecture Goal

- **Status:** Guiding goal for prototype design and implementation
- **Applies to:** The `main` branch and the complete ClearFlow Dental Clinic prototype
- **Purpose:** Keep architecture decisions consistent while we discuss, build, test, and complete the prototype end to end.

## 1. Product goal

Build a working, maintainable, multi-tenant dental clinic SaaS prototype that can be run and verified end to end—not merely a set of screens or disconnected integrations. A clinic should be able to sign in, establish its clinic workspace, manage the supported clinical workflow, use AI features where configured, and retain its own data securely without affecting another clinic.

The prototype must remain honest about what is implemented, what is a preference or placeholder, and what still needs configuration or live verification.

## 2. Architecture principles

1. **Keep the current repository layout unless evidence justifies a change.** The existing top-level boundaries are based on actual runtimes and deployment units: `app/`, `appwrite/functions/`, `appwrite/schema/`, `scripts/`, `f/dental/`, and `.github/workflows/`. Do not add generic `backend/`, `ai/`, or `python/` trees just for appearance.
2. **Use a modular monolith first.** Keep the Vue application and the existing Appwrite functions as the deployable units. Split internal code by cohesive responsibility and existing product actions, not by speculative future services.
3. **Preserve working contracts.** Before refactoring, identify existing callers and tests. Preserve action names, request payloads, response shapes, environment variables, collection/table identifiers, and deployment entry points unless a deliberate, documented migration is agreed.
4. **Make tenant isolation a server-side invariant.** Every tenant-owned read and write must derive the authenticated actor and validate clinic membership on the trusted server side. Never trust a tenant or clinic ID supplied by the browser by itself. Add negative tests proving one clinic cannot access another clinic's records.
5. **Keep frontend responsibilities clear.** Vue components render UI and collect input; composables manage reusable UI state; feature screens stay grouped by capability; `app/src/services/` remains the boundary for calling the authenticated API. Avoid duplicating authorization, business rules, or authoritative calculations in the browser.
6. **Use deterministic code for predictable operations.** Validation, permissions, CRUD, scheduling, calculations, workflow transitions, and other rule-based behavior belong in ordinary code. Use AI only where language understanding or generation adds real value.
7. **Keep AI behind a trusted, testable boundary.** Provider credentials stay server-side and encrypted where applicable. Validate tenant access, provider/model configuration, input limits, usage, and failures. Do not describe budgets as hard limits until cost calculation, complete accounting, and concurrent-request behavior support that claim.
8. **Make memory explicit and safe.** A UI preference is not a memory system. Any future memory capability needs a defined store and retrieval behavior, tenant/user scoping, consent, retention/deletion rules, and tests before it is presented as implemented.
9. **Use Windmill for workflows that genuinely need it.** Keep the existing bridge and `f/dental/` assets within their current deployment boundaries. Do not commit secrets or provider resources. Keep production workflow sync manual, narrowly scoped, and preceded by dry-run inspection.
10. **Treat the schema as a contract.** Keep the schema manifest and verifier aligned with the actual Appwrite project. Schema changes must be deliberate, reviewed against application code, and verified; read-only checks must stay read-only.
11. **Design mobile-first.** Keep common workflows comfortable on a phone, avoid horizontal scrolling, and use compact, clear cards and forms where appropriate. Do not redesign working screens as a side effect of backend refactoring.
12. **Prefer small, reversible changes.** Work in batches. For each batch, state the behavior being changed, preserve relevant contracts, add or update tests, run the available checks, and inspect the diff before continuing.
13. **Use one canonical working branch.** The agreed working branch is `main`. Do not create parallel architecture branches or merge competing versions unless explicitly agreed.
14. **Do not claim verification that did not happen.** Separate automated test/build results from live Appwrite, browser authentication, AI provider, Cloudflare, and Windmill checks. Record blockers and manual steps honestly.

## 3. Intended responsibility boundaries

These are responsibility boundaries, not a demand to create new folders immediately.

- **Vue frontend (`app/`):** authentication UI, clinic setup, mobile workspace and feature screens, form state, and calls through the existing service layer.
- **Frontend service layer (`app/src/services/`):** typed-by-convention request construction and response handling using the current JavaScript patterns; no secret keys or trusted authorization decisions.
- **Appwrite Dental API (`appwrite/functions/clearflow-dental-api/`):** trusted request entry point, authenticated actor resolution, clinic membership checks, validation, clinical domain operations, AI orchestration, and persistence through Appwrite. Internal modules should be extracted only when their boundaries are clear and covered by tests.
- **Windmill bridge (`appwrite/functions/clearflow-windmill-bridge/`):** narrow, server-side integration boundary for configured Windmill workflows.
- **Windmill assets (`f/dental/`):** version-controlled workflow definitions and supporting code; environment-specific resources and secrets remain outside Git.
- **Schema and verification (`appwrite/schema/`, `scripts/appwrite-schema/`):** a versioned description of required data structures and a read-only way to compare them with the configured Appwrite project.
- **CI and deployment (`.github/workflows/`):** repeatable validation and narrowly scoped deployment, with explicit confirmation for production-changing operations.

## 4. End-to-end prototype acceptance criteria

The prototype is not considered complete merely because the frontend builds. Completion requires evidence for the following, with any excluded item explicitly documented:

- [ ] A clean install and production build succeed from the documented instructions.
- [ ] Authentication works in the configured environment, including sign-out and expired/invalid session handling.
- [ ] Clinic setup and workspace loading work for an authenticated clinic.
- [ ] Supported clinical create/read/update flows work through the real API and persist after reload.
- [ ] Tenant isolation is tested for both allowed and denied access paths.
- [ ] Empty, loading, success, validation-error, permission-error, and network-error states are handled.
- [ ] Lists, search, and overview metrics remain correct beyond the first 100 records, or any intentional limit is explicit and enforced.
- [ ] AI provider configuration and credential handling work without exposing secrets to the browser; provider failure and missing configuration are handled.
- [ ] AI conversation context, usage tracking, and budget behavior match what the UI claims. Unimplemented memory or inaccurate cost estimates are labelled honestly.
- [ ] Windmill-dependent behavior has a clear disabled/unconfigured state and is verified separately before production use.
- [ ] Schema manifest and verifier agree with the intended schema; live verification is recorded separately from local tests.
- [ ] Automated tests cover key domain rules, authorization boundaries, and regression-prone integrations.
- [ ] Mobile layout is checked on a narrow viewport with no unintended horizontal scrolling.
- [ ] Deployment configuration, required environment variables, rollback considerations, and any remaining manual setup are documented.

## 5. Delivery sequence

Use this sequence as a discussion and implementation guide; adjust it only when repository evidence or test results justify the change.

1. **Agree on prototype scope:** define the user journeys that must work end to end and explicitly list what is out of scope.
2. **Establish a baseline:** run current tests/build, record failures, inspect API contracts and schema references, and add regression tests before risky changes.
3. **Close correctness and security gaps:** prioritize tenant authorization, result pagination/limits, reliable error handling, and schema consistency.
4. **Modularize in small batches:** extract one cohesive API responsibility at a time while keeping the deployed entry point and external contracts stable.
5. **Complete AI behavior honestly:** decide conversation-history semantics, usage/cost policy, and whether memory belongs in the first prototype; implement only the agreed scope.
6. **Verify real workflows:** test authenticated browser flows and integrations in the configured environment, distinguishing automated checks from live checks.
7. **Release readiness:** confirm production build and relevant CI, review the final diff, document deployment status and outstanding risks.

## 6. Change protocol

For each implementation batch:

1. Name the user-visible behavior or technical risk being addressed.
2. Inspect the current implementation and its callers before editing.
3. Prefer the smallest change that improves structure or correctness.
4. Add tests for the behavior and important failure/denial cases.
5. Run the checks that are available and report exact results.
6. Review the diff for accidental contract, UI, schema, or deployment changes.
7. Continue only when the batch is understood; do not combine unrelated refactors.

Do not change production data, run destructive schema operations, deploy functions, or sync Windmill production assets as an incidental part of code refactoring. Those actions require a separate explicit decision and appropriate verification.

## 7. Current known gaps to use as a starting checklist

The repository audit dated 2026-10-29 identifies these items for discussion and verification, not assumptions that they are already fixed:

- The Appwrite API entry point contains several responsibilities and should be modularized incrementally.
- AI chat stores history but currently sends only the current message to the provider; multi-turn context is not yet established.
- AI usage cost is recorded as zero and the current budget calculation is bounded; it must not be represented as reliable hard spend enforcement.
- A shared list helper caps queries at 100 without pagination, which can make lists and metrics incomplete.
- The schema manifest filename and declared schema version disagree.
- Tests do not yet cover several important authorization, pagination, AI-context, budget, clinical workflow, and bridge paths.
- The AI memory setting is a preference, not a complete memory feature.
- Live authenticated browser testing, live schema verification, live provider calls, and exhaustive security testing have not been established by the audit.

## 8. Decision rule

When choosing between a quick implementation and a more elaborate architecture, prefer the simplest design that satisfies the agreed end-to-end prototype, security, testability, and deployment needs. Do not optimize for hypothetical scale, add abstractions without a demonstrated use, or sacrifice correctness to make the folder tree look sophisticated.

This document is the architecture goal. The repository audit is the current-state assessment. Keep both aligned as decisions are made and work is completed.
