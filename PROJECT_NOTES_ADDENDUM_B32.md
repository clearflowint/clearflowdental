# ClearFlow Dental Clinic — Research Addendum Batch 32

Reviewed 2026-10-27. This note compares DentalPin medical-reference models, services and tests. It is source research, not a clinical rule set.

## 32.1 Medical-reference model and service

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/medical_reference/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/medical_reference/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/medical_reference/test_tenant_isolation.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/medical_reference/test_patient_flags.py

The reference module has clinic-scoped allergy, medication, surgery and disease lookup lists with UUID, name, active flag and timestamps. Unique scope is clinic + name. Retired entries are deactivated instead of physically removed, preserving the ability to interpret older patient history.

Medication interactions connect two medication rows and include a risk note and active state. The service rejects self-interactions, validates that both medication rows belong to the clinic, and canonicalizes the pair order before inserting. A contraindication links one disease and one medication, validates both references against the clinic, and stores a risk note. Pair ordering and some duplicate checks are service-level logic; uniqueness constraints are the database backstop. ClearFlow should test concurrent create attempts and handle uniqueness conflicts cleanly.

The service searches within clinic, optionally filters active entries, does case-insensitive partial name search and limits/sorts results. Create checks duplicates case-insensitively before insert, but a preflight query alone is not safe against simultaneous requests. The model's simple unique constraint may not enforce case-insensitive uniqueness at database level; use a normalized name key or database index where supported.

The tenant-isolation test file documents that prior update/deactivate paths lacked clinic-scoped lookups, which could permit mutation of another clinic's reference entry if the identifier were known. Tests were added around clinic-scoped get methods and interaction/contraindication retrieval. This is an important code-review lesson: a safe read helper does not prove every mutation route uses it.

## 32.2 ClearFlow tenant mutation contract

Every mutation service should accept tenant context and load the target by both tenant and entity ID in the same transaction before changing it. Parent/child links must also be checked for tenant consistency. Do not rely on the frontend hiding other tenants' rows.

Acceptance tests:
1. Tenant A cannot read, rename, deactivate or attach Tenant B's row using a valid identifier.
2. Tenant A cannot associate a patient with Tenant B's reference term.
3. Concurrent case-variant name inserts cannot create logical duplicates.
4. Concurrent reversed-order interaction inserts cannot create duplicate pairs or produce an unhandled server error.
5. Test each route's authorization and scoped lookup, not only helper methods.
6. Retired terms remain visible on historical records but do not appear in active search when policy says otherwise.

## 32.3 Patient clinical context

Source: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/patients_clinical/models.py

MedicalContext is a one-to-one current-context record containing pregnancy/week, lactation, anticoagulant flag/name, INR/date, smoking/frequency, alcohol, bruxism, anesthesia reaction/details and last-updated actor/time. Allergy, medication, systemic disease and surgical history are separate repeatable rows. Allergy rows include name/type/severity/reaction/notes/status and optional reference ID; medication rows include name/dosage/frequency/start date/notes/status; disease rows include name/type/diagnosis date/control state.

INR is stored as a Float in this reference. ClearFlow should preserve measurement value, unit, observed time, source/reporter, quality and review; use appropriate numeric precision and do not silently round source measurements. Loose optional reference IDs support modularity but are not guaranteed referential integrity.

Some patient-child foreign keys cascade on physical patient deletion, despite module guidance favoring soft deletion. ClearFlow should prevent ordinary hard deletion through permissions and retention workflows, and choose database deletion behavior deliberately so a direct database operation cannot accidentally erase clinical history.

## 32.4 Medication warnings and prescription lifecycle

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/medical_reference/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/prescriptions/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/prescriptions/CLAUDE.md

Patient flags compare reference-linked medication/disease rows; free-text-only legacy entries are not fuzzy-matched. This avoids some false positives but can miss a warning when history has not been linked to a reference. ClearFlow should indicate when some entries could not be checked, rather than present an empty warning list as proof that no risk exists.

The reference interaction/contraindication models contain a risk note, but a production decision-support source needs provenance: source organization/document/version, evidence date, severity, applicability, clinical reviewer, effective/retired dates and policy. AI should not invent interaction rules.

Prescription header and medication lines are separate. Header fields include clinic/patient/prescriber, state, issue time, notes/locale, prescriber name/license snapshot, signature-document reference and jurisdiction-specific compliance data. Lines include medication text, optional catalogue reference, dose/unit/route/frequency/duration/instructions and order. Templates are reusable fill-in configuration, not issued clinical evidence.

The documented lifecycle is draft -> issued -> cancelled. Issued prescriptions freeze; correction is cancel and reissue, retaining the original prescriber snapshot. Agent tools may create drafts, while issuing remains prescriber-only. ClearFlow should keep proposal, human authorization, issued artifact, signature and correction/reissue chain distinct. Catalogue text changes must not rewrite issued medication instructions.

## 32.5 New canonical-model candidates

- Medical reference item with code system, external code, locale/synonyms, source, version, active period and superseded-by relationship.
- Interaction/contraindication evidence with source/version, severity, applicability, review, effective date and retirement.
- Patient clinical assertion with source/reporter, observed/recorded dates, reviewer, certainty, measurement value/unit and history.
- Explicit flag evaluation outcome, including linked items checked and unlinked entries not evaluated.
- Prescription issue snapshot, prescriber credential snapshot, signature evidence, country compliance result and cancel/reissue link.
- Scoped mutation audit and tests for all tenant-owned records.

## 32.6 India-specific research boundary

The reference privacy module is GDPR-specific and includes a 30-day request target and a small set of erasure categories. These are EU implementation choices, not automatically Indian requirements. Do not assume US insurance identifiers, EU privacy deadlines or Spanish tax rules apply to an Indian clinic.

Official sources to verify in a separate legal/standards batch:
- National Health Authority / ABDM: https://abdm.gov.in/ and https://www.nha.gov.in/
- Ministry of Electronics and Information Technology: https://www.meity.gov.in/
- CBIC GST: https://cbic-gst.gov.in/
- Dental Council of India: https://dciindia.gov.in/
- CDSCO: https://cdsco.gov.in/

For each applicable requirement, record the current official document/version/date, exact section, commencement/applicability and legal-review status. Do not treat vendor implementation as proof of a legal obligation.

End of Batch 32. Research continues; this is not the final schema.
