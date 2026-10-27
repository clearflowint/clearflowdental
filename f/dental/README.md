# ClearFlow Dental — Windmill assets

This folder is the Git-managed source for Windmill scripts, flows, and other compatible assets belonging to ClearFlow Dental Clinic.

- Target Windmill workspace: `clearflow-automations`
- Sync direction: GitHub `main` → Windmill
- The GitHub Actions workflow only syncs files under `f/dental/**`.
- Windmill resources and secrets are deliberately excluded from automatic sync. Configure credentials/resources separately inside Windmill.
- Do not store patient information, API tokens, passwords, or other secrets in this folder.

Add Windmill-compatible assets under this folder using the Windmill CLI's normal sync file format. A commit to `main` that changes this folder triggers the sync workflow.

## Appwrite ↔ Windmill integration

- Appwrite endpoint: `https://clearflowappwrite.duckdns.org/v1`
- Appwrite project: `Dental Hospitals` (project ID is configured in Windmill resources, not in application payloads).
- The first connectivity probe is `appwrite_connection_test.py`. It performs an Appwrite health check and an authenticated read-only database metadata request; it does not read clinical records or perform writes.
- Store the Appwrite API key only in a Windmill secret-backed resource. Never commit API keys, patient data, or webhook secrets.
- Use a dedicated, least-privilege Appwrite server API key for this integration. Scope it only to the minimum required database read access for the connection probe; grant further scopes only when a reviewed workflow needs them.
- The initial communication direction is Windmill → Appwrite. Appwrite → Windmill event delivery will be added as a separately authenticated webhook/trigger after inbound event scope and verification are defined.
- Do not expose a Windmill service token to browser clients. Browser-to-Appwrite user operations must use Appwrite's normal user session and permissions, not the Windmill service credential.
- The GitHub sync excludes resources and secrets. The connection resource must be configured in Windmill separately.
