# ClearFlow Dental Clinic — Prototype Data Model Contract v0.1

Date: 2026-10-28. Status: Applied prototype baseline in the canonical Appwrite project. This is the minimal end-to-end prototype schema, not the final enterprise schema.

## Canonical environment

- Canonical Appwrite project: Dental Hospitals (`6adcea89003c9613425b`).
- Canonical endpoint: `https://clearflowappwrite.duckdns.org/v1`.
- Canonical database: `clearflow_dental`.
- Retired tenant-isolation test project: deleted by owner; do not recreate or reference it.
- The PWA, ClearFlow Dental API function and schema manifest must all use the canonical project/database above.
- Do not delete or recreate current project data as part of configuration cleanup.
- The live baseline was created directly in Appwrite. `appwrite/schema/prototype-v0.1.json` is the current expected-state manifest and `scripts/appwrite-schema/verify.mjs` checks it without mutating live data. A complete typed, repeatable migration/apply script is still required before schema changes can be reproduced automatically.

## Design rules
- Stable internal patient IDs; phone is a contact channel, never a patient identifier.
- Every clinic-owned record has tenantId. Clinic is the initial tenant boundary; branch support is deferred.
- Authentication identity, clinic membership, role and professional qualification are separate.
- Appointment, actual encounter/visit, visit purpose and treatments are distinct.
- Captured original documents remain unchanged. Upload, extraction, draft, clinical review and approval are separate states.
- Validate linked IDs against the same tenant in trusted operations. Do not assume Appwrite provides foreign keys.
- Use synthetic data only in the prototype.

## Entities and core fields
1. clinics: id, name, slug, timezone, status (setup/active/archived), createdBy, createdAt, updatedAt.
2. clinic_memberships: id, tenantId, userId, role (owner/dentist/receptionist/assistant), status (invited/active/suspended), createdAt, updatedAt. Target unique tenantId+userId, subject to verified Appwrite index support.
3. patients: id, tenantId, optional patientNumber, givenName, familyName, optional dateOfBirth, optional sexOrGender only when justified, optional notesForReception, status (active/inactive), createdBy, updatedBy, createdAt, updatedAt. Never unique on name+phone; duplicates warn but never auto-merge.
4. patient_contacts: id, tenantId, patientId, type (phone/email/other), value, optional label (self/parent/caregiver/family/other), isPrimary, isVerified, createdAt, updatedAt. Shared contacts allowed; phone is not globally unique.
5. patient_documents: id, tenantId, patientId, optional encounterId, storageFileId, originalName, mimeType, sizeBytes, sourceCategory (handwritten_prescription/report/image/referral/patient_supplied_history/other), optional sourceDate, uploadedBy, uploadedAt, reviewStatus (not_reviewed/reviewed), optional sourceProviderName. Original file is immutable; extracted text is a separate derived artifact.
6. appointments: id, tenantId, patientId, optional providerUserId, startsAt, endsAt, status (scheduled/confirmed/arrived/cancelled/completed/no_show), optional reason and operational notes, createdBy, updatedBy, createdAt, updatedAt. Validate timezone-aware input and store timestamps consistently.
7. encounters: id, tenantId, patientId, optional appointmentId, optional startedAt/endedAt, status (in_progress/completed/amended), visitPurpose, optional clinician-authored summary, createdBy, updatedBy, createdAt, updatedAt. Walk-ins are allowed; appointment completion does not imply encounter completion.
8. encounter_treatments: id, tenantId, encounterId, name, status (discussed/planned/performed/not_performed), optional performedAt/performedBy/notes, createdBy, createdAt, updatedAt. A treatment listing alone does not assert performance.
9. clinical_drafts (optional in first slice): id, tenantId, patientId, encounterId, optional sourceDocumentId, draftContent using a verified supported field type, status (draft/submitted_for_review/approved/amended), createdBy, reviewedBy, reviewedAt, version, createdAt, updatedAt. Saving never silently approves.
10. activity_events: id, tenantId, actorUserId or actorService, action, entityType, entityId, occurredAt, outcome, optional correlationId and short redacted summary. Never log secrets or full clinical notes.

## Creation order
clinics → clinic_memberships → patients → patient_contacts → patient_documents → appointments → encounters → encounter_treatments → optional clinical_drafts → activity_events. Storage bucket is configured separately from document metadata.

## Index candidates (verify before applying)
- clinics: unique slug if supported.
- clinic_memberships: tenantId+userId; userId+status.
- patients: tenantId+status; tenantId+familyName; optional tenantId+patientNumber.
- patient_contacts: tenantId+patientId; tenantId+normalized value.
- patient_documents: tenantId+patientId+uploadedAt; tenantId+encounterId.
- appointments: tenantId+startsAt; tenantId+patientId+startsAt; tenantId+providerUserId+startsAt.
- encounters: tenantId+patientId+startedAt; tenantId+appointmentId.
- encounter_treatments: tenantId+encounterId.
- clinical_drafts: tenantId+encounterId+status.
- activity_events: tenantId+occurredAt; tenantId+entityType+entityId.
Never make patient phone unique. Confirm Appwrite's actual attribute, index, query and permission limits first.

## Shared functions to implement once
getActiveClinic(actor); requireClinicMembership(actor, tenantId, roles?); getPatientInClinic(actor, tenantId, patientId); getEncounterInClinic(actor, tenantId, encounterId); validateRelatedRecordClinic(tenantId, entityType, entityId); writeActivityEvent(...); paginateClinicRecords(...); createJobEnvelope(...). These are contracts, not existing code. Avoid duplicated raw Appwrite access across screens.

## Deliberate deferrals
Branches, professional credentials, advanced odontogram/periodontal/orthodontic records, prescriptions/dispensing, medication inventory, billing/tax, payroll, insurance, facility compliance, direct external diagnostic APIs and vector memory. Manual external report intake is supported through patient_documents. Do not add a Java backend unless a demonstrated trust-critical requirement needs it; first prove Appwrite + Windmill for the prototype.

## Remaining validation gates
A. Verify live schema and storage bucket against the checked-in manifest.
B. Make schema changes reproducible with typed migration/apply scripts and safe drift checks.
C. Test two synthetic tenants/users across list/get/create/update and related IDs using only this canonical project.
D. Complete authenticated browser testing and verify tenant isolation.
E. Complete the end-to-end prototype before enterprise hardening.
