# ClearFlow Dental Clinic — Research Index

Updated 2026-10-27. This index points to the consolidated notebook and the continuing source-specific batches. Research is ongoing; no canonical schema should be frozen until the evidence matrix and jurisdiction review are complete.

## Core notebook
- [PROJECT_NOTES.md](./PROJECT_NOTES.md) — consolidated project goals, domain coverage, architecture principles, core source observations, invariants and next research steps.
- [CROSS_SYSTEM_COMPARISON.md](./CROSS_SYSTEM_COMPARISON.md) — domain-by-domain comparison of DentalPin, Open Dental, OpenEMR, ABDM/India sources and the preserved ClearFlow prototype, including what each source contributes and where evidence is absent or partial.
- [TRACEABILITY_MATRIX.md](./TRACEABILITY_MATRIX.md) — v0.4 cumulative cross-batch requirements matrix with selected field-to-concept mappings, lifecycle/security tests, implementation evidence, India-specific requirements and workforce/payroll traceability.
- [FIELD_LEVEL_INVENTORY.md](./FIELD_LEVEL_INVENTORY.md) — field groups from B17–B38 plus B37A mapped into candidate entities, preserving source semantics, units, missingness, provenance, authority and lifecycle distinctions.
- [IMPLEMENTATION_GAP_REVIEW.md](./IMPLEMENTATION_GAP_REVIEW.md) — read-only review of the preserved Vue/Appwrite prototype and current database metadata; includes P0 security test plan and current limitations.
- [SOURCE_COVERAGE_REGISTER.md](./SOURCE_COVERAGE_REGISTER.md) — per-batch evidence-class ledger for B17–B38 plus B37A, source confidence, evidence gaps and completion gates.
- [SOURCE_FIELD_MAPS.md](./SOURCE_FIELD_MAPS.md) — named source-field families from B17–B38 plus B37A mapped to candidate ClearFlow concepts, normalization rules, lifecycle constraints and acceptance tests; includes explicitly source-specific encodings and unverified gaps.
- [CROSS_SYSTEM_COMPARISON.md](./CROSS_SYSTEM_COMPARISON.md) — comparative domain coverage and lifecycle differences across DentalPin, Open Dental, OpenEMR, ABDM/India sources and the preserved ClearFlow prototype.
- [RESEARCH_COMPLETION_STATUS.md](./RESEARCH_COMPLETION_STATUS.md) — explicit completed/pending ledger separating completed documentation from legal/clinical sign-off, physical-column extraction, runtime tests and implementation work.

## Source-specific addenda
- [Batches 17–22](./PROJECT_NOTES_ADDENDUM_B17_B22.md) — AI execution approval gate, tenant-scoped FKs, import integrity, prescriptions/orders/reports, agent approval/tooling, authoritative payments/refunds, invoice issue snapshots, inventory ledger, specialist dental modules, migration provenance.
- [Batches 23–24](./PROJECT_NOTES_ADDENDUM_B23_B24.md) — OpenEMR payer/eligibility/remittance details, DentalPin notification preferences/outbox, patient clinical context, supplier reorder and appointment timing.
- [Batch 25](./PROJECT_NOTES_ADDENDUM_B25.md) — follow-on source research; review file for its detailed topic and evidence.
- [Batch 26](./PROJECT_NOTES_ADDENDUM_B26.md) — follow-on source research; review file for its detailed topic and evidence.
- [Batch 27](./PROJECT_NOTES_ADDENDUM_B27.md) — follow-on source research; review file for its detailed topic and evidence.
- [Batch 28](./PROJECT_NOTES_ADDENDUM_B28.md) — follow-on source research; review file for its detailed topic and evidence.
- [Batch 29](./PROJECT_NOTES_ADDENDUM_B29.md) — follow-on source research; review file for its detailed topic and evidence.
- [Batch 30](./PROJECT_NOTES_ADDENDUM_B30.md) — follow-on source research; review file for its detailed topic and evidence.
- [Batch 31](./PROJECT_NOTES_ADDENDUM_B31.md) — medical reference terminology, prescription issue/freeze, consent, retention and erasure.
- [Batch 32](./PROJECT_NOTES_ADDENDUM_B32.md) — tenant-scoped mutation testing, clinical context precision, medical decision-support coverage and prescription lifecycle.
- [Batch 33](./PROJECT_NOTES_ADDENDUM_B33.md) — OpenEMR prescriptions, medication inventory/sales, procedure orders/results, reminder obligations, immunization and signature hashes.
- [Batch 34](./PROJECT_NOTES_ADDENDUM_B34.md) — OpenEMR patient demographics, observations/vitals, medication statements vs prescriptions, forms and signature linkage.
- [Batch 35](./PROJECT_NOTES_ADDENDUM_B35.md) — India-specific primary-source evidence gate for dental records/retention, phased DPDP commencement, telemedicine context and AI prescription authorization.
- [Batch 36](./PROJECT_NOTES_ADDENDUM_B36.md) — prosthetic lab cases and lab-slip lifecycle, plus continued research on odontogram provenance, periodontal exams/measurements, treatment-plan versioning, recall lifecycle, imaging asset metadata/DICOM, orthodontic records and traceability tests.
- [Batch 37](./PROJECT_NOTES_ADDENDUM_B37.md) — current NDC prescription particulars and dental-mechanic registration notices, Telangana clinical-establishment rules, DPDP commencement timing, CDSCO Drugs Rules source and ABDM FHIR profile pinning.
- [Batch 37A](./PROJECT_NOTES_ADDENDUM_B37A.md) — staff attendance punch events, clinic/professional schedule templates and overrides, availability vs actual free slots, and sensitive payroll-period lifecycle.
- [Batch 38](./PROJECT_NOTES_ADDENDUM_B38.md) — AERB dental X-ray registration/safety sources, biomedical-waste authorization and collection, dental-clinic standards template, and CBIC invoice/bill-of-supply fields.

## Preservation and design rule
The original app is preserved on branch `backup/before-project-notes-reset-2026-10-27`. `main` is intentionally research-notes-only after the user-requested reset. Keep the large workspace dossier `ClearFlow_Dental_Enterprise_Schema_Research_Dossier.md` and complete workspace copy `ClearFlow_Dental_PROJECT_NOTES_Complete.md` alongside the GitHub notes; they contain the unstructured working research. Never claim the local workspace artifact is committed to Git unless a repository file confirms it.

Every new batch must separate observed database structure, observed service behavior, observed test behavior, interpretation, ClearFlow candidate requirement and decision pending. Record exact source URL/version and licence notes. Do not turn US/EU/Spain-specific examples into Indian legal rules. Simplify the UX, not the data model.