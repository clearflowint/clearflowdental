# ClearFlow Dental — Windmill assets

This folder is the Git-managed source for Windmill scripts, flows, and other compatible assets belonging to ClearFlow Dental Clinic.

- Target Windmill workspace: `clearflow`
- Sync direction: GitHub `main` → Windmill
- The GitHub Actions workflow only syncs files under `f/dental/**`.
- Windmill resources and secrets are deliberately excluded from automatic sync. Configure credentials/resources separately inside Windmill.
- Do not store patient information, API tokens, passwords, or other secrets in this folder.

Add Windmill-compatible assets under this folder using the Windmill CLI's normal sync file format. A commit to `main` that changes this folder triggers the sync workflow.
