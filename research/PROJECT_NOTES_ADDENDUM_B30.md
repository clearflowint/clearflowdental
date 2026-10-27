# ClearFlow Dental Clinic — Research Addendum (Batch 30)

Reviewed 27 October 2026. This batch focuses on historical changes, signatures, identity mapping, API logs and notification evidence in OpenEMR’s EHI Export table dictionary. These are data-model patterns and gaps in one mature EHR, not a compliance certification.

## 1. Audit master/detail is a record-difference capture, not a universal audit contract
Sources:
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/audit_master.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/audit_details.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/amendments_history.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/patient_history.html

`audit_master` includes patient, user approving/denying, status (pending/approved/denied/directly-updated/cancelled), comments, create/modified time, IP, activity type and flags for QRDA/unstructured documents. `audit_details` records table, field, field value and parent audit ID with an entry-identification field for multiple changes/rows. `amendments_history` stores amendment ID, note, status, actor and creation time. `patient_history` records dated patient-related changes including care-team provider/facility lists and prior name components/suffix plus name-valid-to, type/key and actor.

These tables have a focused purpose and do not by themselves establish one fully immutable audit stream for every entity/action. Field-value diffs may capture sensitive PHI; a patient-history table containing only prior names/care-team is not complete record versioning. ClearFlow should distinguish:
- Entity lifecycle history (domain state change with from/to, actor, time, reason).
- Clinical note/document amendment history (signed/finalized content cannot silently change).
- Security audit (authentication, authorization, high-risk read/export, rejected access and admin configuration changes).
- Record-data provenance/import mapping (originating system/source ID, raw original, normalized mapping and confidence).
- Product/activity timeline (friendly projection of clinical and operational events).

Use dedicated event types and IDs, `tenant_id`, actor/service, timestamp, correlation and idempotency keys, affected entity/version, reason, before/after or patch evidence appropriate to the data, and redaction/retention rules. Where exact previous values are required, store the versioned snapshot or controlled diff, not only the latest row.

## 2. Signed documents and e-signature integrity
Sources:
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/documents_legal_master.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/documents_legal_detail.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/esign_signatures.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/onsite_signatures.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/onsite_documents.html

`documents_legal_master` holds category/subcategory, document ID/name/path/filename, facility/provider, sign layout dimensions, effective date, version, content/template, saved-sign and review flags, upload type (provider vs patient). `documents_legal_detail` is the per-subject/encounter instance with patient/facility/provider/encounter, master-template reference, signature/ready/denied/patient-upload state, signed time, signer identity, signature level, layout content, filled document data, denial reason and patient comments. Thus a reusable form template, issued instance, signature process, and filled final artifact are separate objects.

`esign_signatures` attaches to a form or encounter with actor, timestamp, lock/amendment state, amendment text, hash of signed record content and signature hash. `onsite_signatures` stores workflow status/type, patient/encounter, actor/authorizer, signator/signer, raw signature image, signature string/hash and IP. These field choices give integrity/provenance clues but are not a universal legal e-signature design.

ClearFlow requirements:
- Save immutable template/document version and exact rendered bytes/hash before obtaining signature; link consent/authorization to that version and source record snapshot.
- Distinguish patient signer, legal representative, witness, clinician authorizer and staff recorder. Record authority and effective period when the signer is not the patient.
- Maintain lifecycle status for draft, presented, signed, denied, expired, superseded, revoked or amended; retain denial and amendment reasons and actor/time.
- Store signature payload only in protected storage; expose neither signature data nor full signed files to logs or generally authorized staff. Use strong cryptographic signature/audit design vetted for applicable law rather than merely trusting a stored image/hash.
- A signed/locked record correction should create a new version or amendment referencing the prior hash, not change the bytes the signer actually saw.

## 3. UUID mapping, API request logging and external system identity
Sources:
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/uuid_mapping.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/uuid_registry.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/api_log.html

`uuid_mapping` stores UUID, resource name, resource path, target table, target UUID and creation time; `uuid_registry` maps UUID to table name, table ID, vertical and mapping/document-drive flags. This is an interoperability identity layer: one canonical identifier may map to an internal row/table. ClearFlow should store a source-system/external-ID mapping with tenant, entity type, local record ID, external ID, source version/system, effective and last-seen times and conflict state. External identifiers should not be treated as internal primary keys or foreign keys.

`api_log` stores user/patient, IP, method, request URL/body, response and time. This is useful for debugging but storing unredacted raw request/response creates a sensitive-data sink. ClearFlow should split diagnostics/correlation metadata from protected payload evidence, redact tokens/secrets and unnecessary PHI, enforce access/retention, and log denials without leaking payload contents. Store full external request/response payload separately only when needed for clinical/financial evidentiary reconciliation with explicit access policy.

## 4. Notification log evidence is not a modern outbox model
Source: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/notification_log.html

`notification_log` includes patient, appointment event, SMS gateway type/info, message, email sender/subject, type (SMS/email), patient information snapshot, event date range/start/end and sent timestamp. It lacks, in the exported fields, a generalizable retry lifecycle/provider delivery/read events and consent decision per channel/purpose. Combine this evidence with the DentalPin outbox findings in Batch 24: queued message vs attempt vs provider acceptance vs delivery/read/reply are different states; persist dedup keys, retries, provider IDs, delivery timestamps and skip/failure reason, while enforcing purpose-specific opt-out and no-contact blocks.

## 5. Cross-cutting integrity decisions
1. Do not rely on generic audit JSON, a patient activity timeline, or request log as the single audit source. Each answers different questions and has different retention/PHI needs.
2. Keep source/previous record value distinct from current normalized value. Versioned identifiers and data provenance are needed for imports, FHIR sync, payer gateways, lab interfaces, and duplicate patient merges.
3. All signed artifacts bind to a content hash/version; any later correction is explicitly versioned/linked and must not rewrite prior signed content.
4. Patient merge, name change, duplicate resolution and external-ID remapping need durable mapping/history and recoverable link checks across appointment, clinical, claim, payment, lab and document records.
5. Keep raw payload evidence encrypted or access-controlled and selectively redacted; never log authentication secrets or dump all PHI by default.
6. Audit trails are append-only or amendment-linked; user-facing “timeline” is a derived projection, not the ledger of record.

## 6. Acceptance tests
- Editing a signed consent/template or signed clinical note creates a new version/amendment and leaves prior hash/rendered bytes unchanged.
- A patient rename or source-ID merge keeps prior identifiers and the mapping path; dependent clinical/financial records remain resolvable.
- Failed webhook/FHIR/payer requests can be correlated with structured request IDs without exposing bearer tokens or full unnecessary PHI in general logs.
- Approval/denial history records who, when, why and exact artifact/record version; a duplicate retry does not create duplicate approval or external side effects.
- Audit log export is separately permissioned from clinical record read; a routine reception user cannot retrieve sensitive API bodies or signature images.
- Notification log records do-not-contact/consent gate and send/delivery state independently of the patient timeline projection.

**End of Batch 30.**