# ClearFlow Dental Clinic — AI Platform Integration

**Status:** Frontend entry and tenant-authorized API boundary committed; provider execution is blocked pending an approved gateway URL, API credential and model. Do not describe AI chat as operational until the provider round-trip is tested.

## Product boundary
- The AI Assistant is available as a workspace navigation item.
- The prototype is synthetic-data-only.
- Initial mode is read/draft assistance only. AI cannot directly write, update, approve, sign, issue or delete clinic records.
- AI text is untrusted. A later action-execution workflow must parse a proposed action, validate it deterministically, show a preview, obtain explicit user confirmation, then call the ordinary tenant-authorized API.
- Do not send clinic records or source-document contents to a provider by default. Initial chat sends only the user-entered question. Any future retrieval-augmented mode must explicitly fetch tenant-scoped context and show which sources were used.
- Never expose provider keys in the PWA bundle or browser requests.

## Current implementation
- Frontend: `app/src/main.js` exposes an **AI Assistant** workspace and a mobile-friendly chat surface.
- Styling: `app/src/ai.css`.
- API action: `ai.chat` validates active clinic membership and enforces a 6,000-character input limit. It returns a safe configuration message until the provider adapter is configured.
- The API action does not mutate clinical data.
- No AI provider credentials are currently configured as variables on `clearflow-dental-api`; no provider is assumed.

## Required server-side configuration
Use the approved OpenAI-compatible gateway (prefer the existing self-hosted LiteLLM gateway if that remains the chosen platform). Configure these Appwrite Function variables only after the gateway URL and model are verified:

- `AI_API_URL`: the full HTTPS chat-completions endpoint for the approved gateway.
- `AI_API_KEY`: a secret Function variable; never put this in Git, browser environment variables, or client code.
- `AI_MODEL`: the exact model identifier accepted by that gateway.

The adapter must use an HTTPS allowlist or trusted fixed gateway host, bounded timeouts and output length, safe error messages, and server-side credentials. Never echo upstream error bodies or log user prompts, keys, authorization headers, or patient data.

## Acceptance tests before enabling AI
1. No configuration: frontend receives a clear disabled/configuration message; no writes occur.
2. Configured gateway: one synthetic prompt receives a response and displays in chat.
3. Invalid key, throttling, timeout, malformed output: safe actionable errors; no credential or upstream body leakage.
4. User from a different clinic cannot use a clinic-scoped AI request without active membership.
5. Prompt asks to modify records: assistant must explain that it cannot execute changes; the normal UI/API remains the only mutation path.
6. No model response is persisted into clinical records unless the user explicitly submits a separate draft through the existing workflow.
7. Verify provider privacy, retention and model-training settings before any clinical content is sent. Real patient data remains prohibited in prototype.

## Blocker
The workspace currently has no verified AI gateway URL/model/secret available to the implementation. The UI and authorization boundary are not equivalent to a working AI provider. Complete the server-side adapter and live round-trip after the gateway settings are confirmed.
