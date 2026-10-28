# ClearFlow Dental Clinic — Prototype End-to-End Test Plan

**Status:** Prepared; browser execution blocked until Cloudflare Pages credentials are configured and a preview URL is deployed. Use synthetic data only.

## Test setup
- Deploy branch `prototype/rebuild-from-scratch` to Cloudflare Pages project `clearflow-dental-prototype`.
- Confirm Appwrite Web platform includes the exact Pages preview hostname.
- Use two synthetic Appwrite accounts and fictional clinic names. Never use real patient details or real documents.
- Keep browser developer console and GitHub Actions logs open for runtime errors; do not copy session cookies, JWTs or secrets into the issue/log.

## A. Authentication and clinic bootstrap
1. Open preview in a private browser session; verify login/signup screen fits mobile width.
2. Create a synthetic account; verify it signs in and remains signed in after refresh.
3. Create a fictional clinic; verify a `clinics` row and `clinic_memberships` owner row are created.
4. Sign out and sign in again; verify the same clinic workspace loads.
5. Attempt an unauthenticated function execution; expect HTTP 401 and no writes.
6. Try to create a second clinic under the same account; expect a conflict response rather than a duplicate owner workspace.

## B. Patient records
1. Create a synthetic patient with given name and optional family name.
2. Refresh and verify the patient remains listed.
3. Search by partial name and patient ID using Quick Find.
4. Update patient name through the trusted API and verify updated timestamp/actor fields.
5. Verify shared phone numbers are not treated as unique IDs and are not auto-merged.
6. With a second synthetic account in a different clinic, submit the first clinic's tenant ID; expect HTTP 403 and no returned rows.

## C. Appointments
1. Schedule an appointment for a patient with valid start/end times.
2. Verify invalid/reversed time ranges are rejected.
3. Change status across scheduled, confirmed, arrived, cancelled, completed and no_show; verify persistence.
4. Verify appointment status changes do not automatically create or complete an encounter.

## D. Visits, treatments and drafts
1. Open a visit for a patient without an appointment (walk-in).
2. Open a visit linked to an appointment through API test or UI enhancement when available.
3. Record treatments as discussed and planned; verify neither is displayed as performed.
4. Record a treatment as performed; verify performedAt/performedBy are populated.
5. Complete an in-progress visit; verify endedAt and status completed.
6. Save a clinical draft; verify its status remains `draft` and it is not presented as approved/signed/issued.
7. Attempt to link a draft/source document to another patient's record; expect rejection.

## E. Original documents
1. Upload synthetic PDF, JPG, PNG and WEBP files under 25 MiB.
2. Verify the source file can be opened by its authorized uploader and metadata appears under the correct patient.
3. Compare file bytes before/after upload; source remains unchanged.
4. Verify unsupported extensions, MIME types and files above 25 MiB are rejected.
5. Verify document review status starts as `not_reviewed`; upload never changes clinical approval state.
6. Force metadata failure after upload; verify the uploaded source remains recoverable and no success is falsely reported.

## F. Realtime and PWA
1. Open the same owner account in two browser tabs; create a patient in one and verify the other refreshes the visible record list without a full-page reload.
2. Sign out and sign in as another account; verify realtime subscriptions are disconnected/recreated and no prior tenant records appear.
3. Install the PWA on a mobile browser and verify responsive layout without horizontal scrolling.
4. Go offline; verify the static shell can load from cache while Appwrite data/API is not served from cache or falsely shown as current.

## G. Windmill and deterministic workflow
1. Run `f/dental/appointment_reminder_candidates` with synthetic appointment rows.
2. Verify only scheduled/confirmed appointments in the bounded window become candidates, results are sorted deterministically, and `sent` remains zero.
3. Verify malformed timestamps and cancelled appointments are excluded.
4. Do not enable outbound messages until consent, contact eligibility, idempotency and delivery tracking are implemented and tested.

## H. Regression/security floor
- Build and schema verifier must pass.
- Function rejects missing/invalid user JWT.
- Every read/write operation checks membership and related-record tenant linkage.
- No browser bundle contains an Appwrite API key, Windmill token, LiteLLM key or webhook secret.
- No real clinical data; no AI-generated clinical content is auto-approved or issued.
- Capture screenshots only with synthetic data. Record pass/fail, run URLs and any fixes in `REBUILD_EXECUTION_LOG.md`.

## Known limitations before testing
- The frontend is not yet deployed because GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are missing.
- Clinic owner bootstrap is implemented; member invitation/role administration is not yet a prototype workflow.
- AI conversational execution and live appointment reminder integration are not yet connected.
- No regulatory or production-readiness claim is made.
