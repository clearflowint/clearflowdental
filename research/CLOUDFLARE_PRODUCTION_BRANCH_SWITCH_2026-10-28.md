# Cloudflare production branch switch — 2026-10-28

Cloudflare Pages project `clearflowdental` now has `prototype/rebuild-from-scratch` configured as its production branch. This was changed because the rebuilt frontend and Appwrite integration live on that branch, while `main` still contained the older prototype frontend.

- Production hostname: `https://clearflowdental.pages.dev`
- Source branch: `prototype/rebuild-from-scratch`
- Source commit at switch: `efe20cd13858667e9eb67dfacd060d8ff3d0db60`
- Current Appwrite project: `6adcea89003c9613425b`
- Current Appwrite database: `clearflow_dental`

The branch setting alone does not retroactively promote an existing preview deployment. A new deployment from the configured production branch must complete and be checked before the production hostname is considered updated. Authentication is still under investigation; do not use real patient data in this prototype.