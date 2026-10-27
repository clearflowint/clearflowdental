# ClearFlow Dental Clinic — Research Addendum Batch 31

Reviewed 2026-10-27. Focus: medical reference data lifecycle, prescription freeze/issue semantics, privacy/erasure as a configurable jurisdiction policy. This is a source-derived design note, not legal or clinical advice.

## 31.1 DentalPin medical-reference model
Source: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/medical_reference/models.py

Observed models:
- ReferenceAllergy, ReferenceMedication, ReferenceSurgery and ReferenceDisease each have UUID primary key, clinic_id, name (150 chars), is_active and timestamps; uniqueness is (clinic_id, name).
- Retiring a lookup item is soft deactivation, not hard delete, so existing patient history remains interpretable after the item disappears from future searches.
- ReferenceInteraction links two medications and records risk_note/is_active. The service canonicalizes medication_a_id < medication_b_id by sorted UUID string so A/B and B/A represent one pair. DB uniqueness is (clinic_id, medication_a_id, medication_b_id), but canonical ordering is enforced in service code, not a database CHECK.
- ReferenceContraindication links disease and medication with risk_note/is_active and unique (clinic_id, disease_id, medication_id). The referenced items have ordinary FKs, but clinic equality across all linked rows is not necessarily guaranteed by those FKs alone.
- Patient allergy/medication/disease/surgery records use soft status and may retain loose reference IDs rather than an FK. The module README explicitly describes that boundary as a modularity choice; ClearFlow must still validate that a reference exists, is visible in the same tenant, and was active/valid when selected.

ClearFlow implications:
1. Separate clinical assertions from terminology/reference entries. A patient-reported allergy should preserve the original wording, source, reporter, date, severity/reaction and verification status even if the reference term is later renamed or retired.
2. Reference terms need code system, external code, version, locale/synonyms, source/provenance, active interval, retired/superseded-by and review status if clinical safety depends on them. A clinic-specific free-text list is useful but is not a substitute for a governed terminology catalogue.
3. Drug-drug interaction and disease-drug contraindication rules need source, effective version/date, severity, clinical rationale, applicability conditions and review authority. They should be decision-support warnings with explainable evidence—not autonomous diagnosis or treatment decisions.
4. If canonical pair ordering matters, enforce it with a DB check where supported as well as service normalization, and test concurrent reversed-order inserts. Composite tenant FKs or equivalent validation should stop cross-clinic references.
5. Keep inactive/retired terms readable on historic records; never delete or reinterpret a signed clinical record merely because the lookup catalogue changed.

## 31.2 Prescription issue is a clinical-document lifecycle
Source: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/prescriptions/CLAUDE.md

Observed behavior:
- The module separates draft creation/edit from an explicit issue endpoint and cancel endpoint. Issue runs a validation hook, freezes the row and emits prescription.issued; cancellation is a separate operation and already-cancelled prescriptions return conflict.
- Issued rows cannot be patched or deleted. Corrections use cancel + reissue, preserving the original prescriber snapshot; edits to the prescriber profile do not rewrite historical prescription attribution.
- Permissions separate read, write and issue; the AI tool can create prescription drafts but cannot issue them. Issuing stays prescriber-only in the described policy.
- The base workflow is described as country-agnostic with country-specific compliance hooks. Warning endpoint surfaces allergy/interaction banners but does not automatically block; whether warnings block, require acknowledgement or allow override must be a policy choice backed by clinical governance.
- Template CRUD is configuration; issued prescription is a retained clinical artifact. Rendering supports a document output, but a PDF itself should be treated as a generated representation of a canonical issued record, not the sole record.

ClearFlow requirements:
- Keep prescription header, normalized medication lines, dose/route/frequency/duration/quantity/refills/pharmacy, clinical indication, prescriber identity/credential snapshot, issue time/timezone, jurisdictional validation result, signature/evidence, cancellation reason/time and reissue linkage.
- Preserve draft/issued/cancelled states with immutable issue snapshot. Do not use one mutable row to represent both the draft and issued document.
- Separate prescribed, dispensed, administered, purchased/sold and stock-consumed events. Each has its own actor, time, quantities and evidence.
- Country rules must be pluggable and versioned. A warning can be acknowledged with user/role/time/reason if policy allows; a safety override must not be silently inferred by AI.

## 31.3 Consent, retention and erasure are a governed workflow—not a single delete flag
Source: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/gdpr/CLAUDE.md

Observed DentalPin GDPR module (EU-specific implementation):
- Data-subject request rows capture requester identity/contact, request type (access/rectification/erasure/portability/restrict), status, received/deadline/resolved times. Request rows are not deleted; status transitions preserve accountability.
- Patient consent is append-only: grant/withdraw creates an event with canonical purpose, granted boolean, verbatim provided text and grant/withdraw times. Current consent is derived as latest event for (patient, purpose).
- Retention policy is per clinic and includes data category, retention years, legal-hold-until and active flag. Partial erasure checks policies, holds and field mapping; no policy or unmapped category defaults to retain. It blanks eligible identity fields and asks each registered module to redact its own copies inside one transaction, then writes an immutable erasure audit log.
- A data-breach register tracks description, data involved, affected people, status and authority/subject notification times/counts. The module includes a portability export endpoint.
- The source uses GDPR-specific request types and a 30-day SLA, and only maps a small PII category vocabulary. Those are EU implementation choices; they must not be transplanted as Indian legal requirements or treated as a complete privacy model.

ClearFlow design requirements:
1. Separate consent evidence, privacy request, retention policy, legal hold, erasure plan, module coverage report, execution log and breach response. Consent withdrawal is not automatically equivalent to erasing historical clinical/financial records.
2. Retention is data-category + jurisdiction + purpose + legal basis + effective dates, with explicit hold/exception and responsible reviewer. Do not implement one global retention_years number.
3. Erasure/anonymization must enumerate all data stores: normalized DB, object storage, search indexes, vector memory, message bodies, caches, analytics, exports and backups. Each module must report coverage and failures. The system should not claim full deletion when backups or lawful records remain.
4. Keep the request and audit trail even when some subject PII is erased; carefully minimize the audit data so the log does not reintroduce erased content.
5. Model consent purpose and channel separately: clinical treatment, sharing with another provider, appointment reminders, marketing, portal proxy, and AI/document processing are not interchangeable. Store the exact notice/version/language and evidence of the actor/representative's authority.
6. Build a jurisdiction-specific policy matrix only after verifying official Indian sources and the clinic's deployment model. Keep law, regulator guidance, contractual policy and optional product behavior explicitly labelled.

## 31.4 India-first legal/standards research remains an explicit gate

Do not assume US insurance claims, EU GDPR request deadlines, US RxNorm/NPI identifiers, Spanish tax identification or Veri*Factu requirements apply to an Indian clinic.
Official sources to verify in the next legal/standards batch (not yet validated in this pass):
- Ministry of Health and Family Welfare / National Health Authority, Ayushman Bharat Digital Mission and official Health Data Management Policy / FHIR implementation guides: https://abdm.gov.in/ and https://www.nha.gov.in/
- Ministry of Electronics and Information Technology for Digital Personal Data Protection Act and rules/notifications: https://www.meity.gov.in/
- Central Board of Indirect Taxes and Customs for GST invoice/credit-note/e-invoice rules and amendments: https://cbic-gst.gov.in/
- Dental Council of India for professional rules and recordkeeping guidance: https://dciindia.gov.in/
- CDSCO / Ministry of Health official materials where medicines, prescriptions or regulated clinical workflows require them: https://cdsco.gov.in/

Before implementation, verify the currently effective primary text, applicability to the clinic/vendor, commencement dates, amendments, retention obligations, consent/legal basis, breach timelines, data localisation/transfer conditions if any, electronic signature requirements and GST applicability/thresholds. Record official document title, version/date, section, interpretation and legal review status. Do not infer that a policy is legally mandatory merely because a vendor implemented it.

## 31.5 Additional acceptance tests
- Retiring a reference allergy/medication/disease term does not erase or change historical patient assertions.
- Reversed medication interaction pairs cannot be duplicated under concurrent requests.
- Cross-tenant term references are rejected by database/service policy.
- Issued prescription is immutable; correction produces a cancellation/reissue chain and retains original prescriber snapshot.
- Agent can draft but cannot issue a prescription without prescriber authorization.
- Consent grant and withdrawal append separate immutable events; current status is derived deterministically.
- Erasure request respects category-specific holds, records per-module coverage and failure, and does not falsely report completion when an object/vector/cache copy remains.
- Legal deadlines and retention policy are configured from verified jurisdiction rules, not hardcoded from the GDPR reference implementation.

End of Batch 31. Research continues; the canonical schema remains pending the cross-system field matrix and jurisdiction review.