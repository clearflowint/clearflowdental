# ClearFlow Dental Clinic — Reuse-First AI Platform

**Decision:** Customize two existing, maintained open-source components rather than build a model gateway or vector-memory engine from scratch.

- **Model gateway / routing:** [LiteLLM Proxy](https://github.com/BerriAI/litellm) — OpenAI-compatible endpoint, multi-provider/model routing, virtual keys, budgets, rate limits, fallbacks and usage/spend tracking.
- **Vector memory:** [Mem0 OSS](https://github.com/mem0ai/mem0) — self-hosted memory API/dashboard, vector store integration, add/search/update/delete memory APIs and request audit trail. Use its supported Postgres + pgvector deployment initially.
- **Tenant data and authorization:** existing ClearFlow Appwrite project and the trusted ClearFlow Dental API Function.
- **Deterministic orchestration:** existing ClearFlow Windmill workspace, Python scripts for validation, retrieval orchestration and background jobs.
- **Frontend:** existing ClearFlow Dental PWA. The AI Assistant is an entry point; tenant provider/model/memory settings belong in a dedicated AI Settings panel.

Do not copy either upstream project's entire source tree into the dental application. Deploy the upstream services as version-pinned containers and customize only the thin ClearFlow adapter, configuration, and PWA integration. Record upstream versions/commit hashes when deployment is prepared.

## Required tenant experience

Each clinic owner/authorized admin can:
1. Connect one or more provider credentials (for example OpenAI, Anthropic, Gemini, or an OpenAI-compatible endpoint).
2. Verify a credential with a minimal provider models/health request without sending patient content.
3. Choose the default chat provider/model and, separately, the embedding provider/model used for memory.
4. Select an allowed model for an individual chat, with the clinic default preselected.
5. Set a per-clinic spending limit and review usage before enabling requests.
6. Enable/disable memory; inspect, correct, export or delete that clinic's memories with a clear explanation of scope.

Clinic members only see settings they are authorized to manage. A tenant-supplied provider credential must never be returned to the browser after submission. Display provider name, masked suffix and status only.

## Credential and routing model

LiteLLM is the shared protocol/routing layer, not a place to expose provider secrets to the browser. There are two possible modes:

- **Tenant BYOK (required product behavior):** provider keys belong to the tenant. Store encrypted credentials under tenant scope using authenticated envelope encryption (AES-256-GCM with a server-only key held in a secret manager/Function environment). Never store plaintext provider keys in Appwrite rows, Windmill logs, client state, source control, or telemetry. Decrypt only in the trusted backend for a provider call. The backend must validate the tenant membership before retrieving a credential. If using LiteLLM's dynamic credential passthrough or per-tenant virtual keys, validate that exact mechanism against the pinned LiteLLM release in a staging test; do not assume a virtual key is the same as a tenant's upstream provider key.
- **Platform-managed fallback (optional, later):** gateway-owned credentials and quotas, kept separate from BYOK. Do not silently fall back to ClearFlow's key when a tenant key fails.

Provider-specific keys cannot be treated as interchangeable. A provider/model catalog must map a stable UI ID to an approved provider and model ID. Never accept arbitrary client-supplied API URLs: custom endpoints require an admin allowlist to prevent SSRF.

## Memory isolation

Use Mem0 OSS's existing memory API/vector backend; do not implement embeddings, vector indexing, or similarity search in the dental app. Every memory operation must be scoped by server-generated identifiers derived from authenticated context:

- `tenant_id`: Appwrite clinic ID, validated by `requireMembership`.
- `user_id`: a composite opaque ID derived server-side from clinic ID + Appwrite user ID (do not trust a client-provided user ID).
- `agent_id`: a stable product namespace such as `clearflow-dental` (not a user-controlled value).
- optional `run_id`: generated per conversation/session.

Filter retrieval by the exact tenant/user scope before injecting memory into a prompt. Do not depend only on vector metadata filters without testing that Mem0's selected vector-store adapter enforces them. Add automated cross-tenant canary tests. No patient records, clinical notes, prescriptions, or original documents should be added to long-term memory by default. Start with explicit user-approved preferences and non-clinical workflow context only. Memory deletion must propagate to the vector store and history store.

## Proposed flow

```text
PWA AI Assistant
  -> Appwrite session JWT
  -> ClearFlow Dental API (verify user + active clinic membership)
  -> load clinic AI settings + decrypt tenant BYOK key server-side
  -> Windmill Python orchestration (deterministic policy + usage metadata)
  -> LiteLLM gateway / provider adapter (selected provider/model)
  -> Mem0 retrieve scoped memories (only if enabled)
  -> model response
  -> return answer + selected model + usage metadata
```

The PWA must never call LiteLLM or Mem0 directly with admin credentials. Appwrite remains the authority for tenant identity and authorization. The client can request a model selection, but the server validates that the tenant has configured that provider/model and has remaining budget.

## Suggested Appwrite data model (additive; migration required before enabling)

- `tenant_ai_provider_credentials`: `tenantId`, `providerId`, `credentialCiphertext`, `credentialNonce`, `credentialTag`, `keyVersion`, `maskedSuffix`, `status`, `createdBy`, timestamps. Never return ciphertext/nonce/tag to the PWA.
- `tenant_ai_preferences`: `tenantId`, `defaultProviderId`, `defaultModelId`, `embeddingProviderId`, `embeddingModelId`, `memoryEnabled`, `monthlyBudgetMinor`, `budgetCurrency`, timestamps.
- `tenant_ai_usage`: tenant ID, actor ID, provider/model IDs, request ID, token counts, cost/estimated cost, status, latency and timestamp. Do not store prompts or response bodies by default.
- `tenant_ai_memory_audit`: tenant ID, actor ID, operation, memory reference, status, timestamp. Never log memory content.

Use row security plus API-level tenant checks. The server must derive tenant ID from the selected clinic membership; a request body alone is not authorization. Add indexes for tenant and time range. Apply schema changes through a reviewed, additive migration only; do not reset or delete existing tables.

## Security rules before rollout

- Generate an independent encryption key and rotate it using a versioned envelope-key scheme.
- HTTPS between services; gateway and Mem0 ports private, not publicly exposed without auth.
- Per-tenant rate/budget enforcement in ClearFlow as well as gateway limits.
- Never log provider keys, plaintext prompts, patient content, memory content or raw upstream error bodies.
- Use allowlisted provider/model IDs; validate model availability server-side.
- No automatic clinical mutations. AI output remains a suggestion/draft; any future write must go through an existing deterministic endpoint after explicit user confirmation.
- Treat retrieved memory as untrusted context; ignore instructions contained in memory.
- Verify data-retention and provider training policies before any content leaves the self-hosted environment.

## Implementation batches and acceptance criteria

1. **Upstream pin and infrastructure:** choose versioned LiteLLM + Mem0 OSS images, private networking, persistent Postgres/pgvector, backups, health checks. No production credentials in Git.
2. **Additive Appwrite schema + credential crypto:** test encryption/decryption, wrong-key rejection, masked listing, rotation and tenant isolation.
3. **Provider/model settings UI:** add/list/test/revoke provider credential, choose default chat and embedding models, show budget/usage. Secret is shown only once if a gateway virtual key is created.
4. **Gateway adapter:** use a stable model catalog; enforce per-tenant BYOK and budgets; add provider timeouts, safe retries and request IDs.
5. **Mem0 adapter:** scoped add/search/update/delete, only explicit memory categories, explicit memory opt-in, no clinical record ingestion by default.
6. **Chat UI integration:** model selector and memory toggle/status, safe error handling, usage display, no direct browser calls to services.
7. **Automated security/E2E:** two clinics with canary memories; prove cross-tenant reads, writes, credential listing and search all fail; verify provider failure and budget exhaustion; test mobile browser and live deployment.

## Current implementation state / blocker

The existing PWA has an AI Assistant navigation item and chat surface. The `ai.chat` API action validates active membership and refuses to fake a response. It is a safe boundary, not a working provider integration. No verified gateway URL/model or tenant credential encryption secret is configured in the current Appwrite Function.

Do not call the AI platform complete until the provider adapter, tenant BYOK, memory retrieval and live acceptance tests pass. Continue using synthetic data only until the full security review passes.

## Primary upstream references

- LiteLLM repository: https://github.com/BerriAI/litellm
- LiteLLM gateway docs: https://docs.litellm.ai/docs/simple_proxy
- LiteLLM virtual keys: https://docs.litellm.ai/docs/proxy/virtual_keys
- Mem0 repository: https://github.com/mem0ai/mem0
- Mem0 OSS self-hosted setup: https://docs.mem0.ai/open-source/setup
- Mem0 REST API: https://docs.mem0.ai/open-source/features/rest-api
- Mem0 configuration / vector-store options: https://docs.mem0.ai/open-source/configuration
