# AI Gateway Prototype: Windmill Setup

This document describes the prototype bridge only. It does not enable production AI by itself.

## Request flow

1. The Appwrite API authenticates the signed-in user and verifies active clinic membership.
2. Appwrite checks that the clinic has a connected provider credential and enforces the configured monthly budget guard.
3. Appwrite forwards the bounded chat request to the existing authenticated Windmill HTTP trigger.
4. Windmill reads the encrypted provider credential from the clinic's Appwrite row, decrypts it inside the Windmill runtime, and calls LiteLLM's Python SDK with that clinic's key for that request.
5. Appwrite stores the conversation reply and usage metadata. Windmill does not read patient records or write clinical data.

Model IDs are discovered from the selected provider's live catalogue; they are not maintained in a hardcoded model allowlist. The provider list remains an explicit supported-provider catalogue for this prototype.

## Required server configuration

Configure these values outside source control. Never commit secret values.

### Appwrite Function environment

- `CLEARFLOW_WINDMILL_AI_URL=https://clearflowwindmill.duckdns.org/api/dental/ai/chat`
- `CLEARFLOW_WINDMILL_WEBHOOK_SECRET`: the same value used by the existing Windmill secret variable `u/mahirocks66/appwrite_webhook_secret`.
- `CLEARFLOW_AI_ENCRYPTION_KEY`: the existing 64-character hexadecimal AES-256 key used to encrypt clinic provider credentials.

### Windmill secret variable

Create the secret variable:

- Path: `f/dental/ai_encryption_key`
- Value: exactly the same 64-character hexadecimal value as `CLEARFLOW_AI_ENCRYPTION_KEY` in the Appwrite Function.

The Windmill script uses this key only to decrypt the existing AES-256-GCM credential fields. Do not generate a different key unless the stored clinic credentials are re-encrypted.

The existing Windmill trigger already authenticates requests with `X-ClearFlow-Webhook-Key` and the existing shared secret. Do not create a second webhook secret.

## Prototype test sequence

1. Save the Windmill script draft `f/dental/ai_chat` after review.
2. Configure the encryption key variable and Appwrite Function environment values.
3. Run the synthetic no-credential test; it should return `provider_not_connected` without calling an AI provider.
4. Save a test clinic's own provider API key through AI Settings.
5. Test live model discovery, then one short synthetic chat request.
6. Verify no API key is present in Windmill job arguments/logs and no clinical records are read or written.
7. Only after successful tests should the Windmill draft be deployed and the Appwrite Function redeployed.

## Current limitations

- This is a prototype, not a clinical decision-support or autonomous clinical workflow.
- No patient context, RAG, tools, or clinical writes are sent to the model.
- Transient unsaved API keys used only for model discovery are sent directly from Appwrite to the provider and are not persisted.
- Token usage is captured, but exact per-model pricing and budget reconciliation are not implemented yet.
- The Windmill AI script is currently a **draft**; the existing deployed trigger still targets the previously deployed script until the draft is explicitly deployed.
- The GitHub pull request remains unmerged. Do not merge until environment setup, end-to-end testing, and CI checks are confirmed.
