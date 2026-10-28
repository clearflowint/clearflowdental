# ClearFlow Windmill Bridge

This Appwrite Function forwards JSON POST requests to the configured Windmill webhook. It only accepts HTTPS webhook URLs and never accepts a destination URL from the caller.

## Required function environment variables

Configure these as **function-level variables** in Appwrite (not GitHub files):

- `WINDMILL_WEBHOOK_URL`: the exact Windmill webhook URL.
- `WINDMILL_WEBHOOK_KEY`: the secret expected by the Windmill webhook.

Do not commit either value. If the Windmill webhook expects a different authentication header or payload shape, update the bridge and workflow contract before production use.

## GitHub deployment

The repository workflow deploys this function on pushes to `main` when this function folder or `appwrite.config.json` changes. It requires repository Actions secrets:

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY` (least-privilege API key with function read/write permissions)

The workflow deploys only `clearflow-windmill-bridge`; it does not deploy other Appwrite resources.