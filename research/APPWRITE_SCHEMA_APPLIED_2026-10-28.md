# Appwrite prototype schema application record

Date: 2026-10-28
Project: Dental Hospitals (`6adcea89003c9613425b`)
Database: `clearflow_dental`
Status: Initial table structures created directly in Appwrite; repeatable migration/export still required before calling schema deployment reproducible.

## Tables verified
The Appwrite TablesDB list call returned 10 tables in `clearflow_dental`:

- `clinics` — name, slug, timezone, status, creator and timestamps.
- `clinic_memberships` — tenantId, userId, role, status and timestamps.
- `patients` — tenantId, optional patientNumber, names, dateOfBirth, sexOrGender, notesForReception, status, creator/updater and timestamps.
- `patient_contacts` — tenantId, patientId, type, value, label, primary/verified flags and timestamps.
- `patient_documents` — tenantId, patientId, optional encounterId, storageFileId, original file metadata, source category/date, uploader/time, reviewStatus and sourceProviderName.
- `appointments` — tenantId, patientId, optional providerUserId, startsAt/endsAt, status, reason/notes, creator/updater and timestamps.
- `encounters` — tenantId, patientId, optional appointmentId, start/end, status, visitPurpose, summary, creator/updater and timestamps.
- `encounter_treatments` — tenantId, encounterId, name, status, performedAt/performedBy, notes, creator and timestamps.
- `clinical_drafts` — tenantId, patientId, encounterId, optional sourceDocumentId, draftContent, status, creator/reviewer, reviewedAt, version and timestamps.
- `activity_events` — tenantId, actorUserId/actorService, action, entityType/entityId, occurredAt, outcome, correlationId and summary.

## Permissions baseline
All 10 tables were created with row security enabled and empty table-level permissions. This intentionally does not grant broad table access. The application must use explicit row permissions and/or a trusted service path. Do not make the tables publicly readable just to make the UI work.

## Indexes created
- `clinics.slug_unique` (unique on slug)
- `clinic_memberships.tenant_user_unique` (unique on tenantId + userId)
- `patient_contacts.tenant_patient` (tenantId + patientId)
- `patient_documents.tenant_patient_uploaded` (tenantId + patientId + uploadedAt)
- `appointments.tenant_starts` (tenantId + startsAt)
- `encounters.tenant_patient_started` (tenantId + patientId + startedAt)
- `encounter_treatments.tenant_encounter` (tenantId + encounterId)
- `clinical_drafts.tenant_encounter_status` (tenantId + encounterId + status)
- `activity_events.tenant_occurred` (tenantId + occurredAt)

An index attempt for `patients.tenant_family` was blocked by the connector safety layer and was not confirmed created. Do not assume it exists. Revisit through the supported Appwrite Console/API path if patient search requires it.

## Validation still required
- Verify every column's final status and index state by reading each table directly.
- Generate a repeatable migration/schema definition checked into Git; direct manual creation is not yet reproducible.
- Add a safe clinic bootstrap and membership flow; don't allow a browser to self-assign arbitrary tenant IDs or roles.
- Test two synthetic accounts/tenants for isolation before any real patient data.
- Configure a private storage bucket and document-file access in the document batch.
- Validate Appwrite SDK/API version behavior against this self-hosted installation.

## Important note
This is a prototype schema, not a declaration of clinical, regulatory or production readiness. The database contains no intentionally seeded real patient records as part of this work.
