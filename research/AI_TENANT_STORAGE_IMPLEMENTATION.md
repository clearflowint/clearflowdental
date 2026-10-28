# ClearFlow Dental — Tenant AI Storage Provisioning

Date: 2026-10-28  
Branch: `prototype/rebuild-from-scratch`  
Appwrite project: `6adcea89003c9613425b`  
Database: `clearflow_dental`

## Provisioned additively

The following tables were created in the existing Appwrite database. Existing tables and data were not deleted or modified.

- `tenant_ai_provider_credentials`
  - tenantId, providerId, credentialCiphertext, credentialNonce, credentialTag, keyVersion, maskedSuffix, status, createdBy, createdAt, updatedAt
  - Unique index: tenantId + providerId
- `tenant_ai_preferences`
  - tenantId, defaultProviderId, defaultModelId, embeddingProviderId, embeddingModelId, memoryEnabled, monthlyBudgetMinor, budgetCurrency, createdAt, updatedAt
  - Unique index: tenantId
- `tenant_ai_usage`
  - tenantId, actorId, providerId, modelId, requestId, inputTokens, outputTokens, costMinor, currency, status, latencyMs, occurredAt
  - Index: tenantId + occurredAt
- `tenant_ai_memory_audit`
  - tenantId, actorId, operation, memoryRef, status, occurredAt
  - Index: tenantId + occurredAt

All four tables have row security enabled and no direct table-level client permissions. All access must go through the trusted backend after validating clinic membership and role.

## Critical security note

The schema is only storage scaffolding. It does **not** mean provider credentials can be saved or used yet. Do not write any real provider key until all of these are implemented and verified:

1. Generate a random encryption key and configure it as a server-only Appwrite Function secret (never in source control, PWA variables, or tenant rows).
2. Implement AES-256-GCM encryption/decryption with authenticated metadata and a key version. Refuse to operate if the secret is missing or invalid.
3. Add API actions to list providers (masked metadata only), save/test/revoke a tenant key, get/update settings, and list usage. Never return ciphertext, nonce, tag, or plaintext key to the browser.
4. Enforce clinic-owner/admin permission for credential and budget changes; ordinary authorized members may only use configured models within policy.
5. Validate provider/model IDs against a server-side allowlist; no arbitrary client-supplied URLs.
6. Verify the exact LiteLLM tenant BYOK routing behavior for the pinned release before enabling live calls. No fallback to another tenant's key or a shared platform key.
7. Add Mem0 integration with server-derived tenant/user identifiers and explicit memory opt-in. Do not persist clinical notes or patient records to long-term memory by default.
8. Add automated tests for wrong-key rejection, credential masking, tenant-crossing attempts, budget limits, provider failures and memory isolation.

## Known implementation state

- The existing `ai.chat` action is a guarded placeholder and does not yet provide real model responses.
- No tenant provider keys have been inserted.
- No encryption secret has been configured or tested.
- No live LiteLLM or Mem0 connection has been verified.
- Index creation returned `processing`; verify all four indexes reach `available` before relying on their uniqueness/performance.

This change is additive and intentionally leaves the existing clinic data untouched.
