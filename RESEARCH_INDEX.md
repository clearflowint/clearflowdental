# ClearFlow Dental Clinic — Research Index

Updated 2026-10-27. This index points to the consolidated notebook and the continuing source-specific batches. Research is ongoing; no canonical schema should be frozen until the evidence matrix and jurisdiction review are complete.

## Core notebook
- [PROJECT_NOTES.md](./PROJECT_NOTES.md) — consolidated project goals, domain coverage, architecture principles, core source observations, invariants and next research steps.

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

## Preservation and design rule
The original app is preserved on branch `backup/before-project-notes-reset-2026-10-27`. `main` is intentionally research-notes-only after the user-requested reset. Keep the large workspace dossier `ClearFlow_Dental_Enterprise_Schema_Research_Dossier.md` and complete workspace copy `ClearFlow_Dental_PROJECT_NOTES_Complete.md` alongside the GitHub notes; they contain the unstructured working research. Never claim the local workspace artifact is committed to Git unless a repository file confirms it.

Every new batch must separate observed database structure, observed service behavior, observed test behavior, interpretation, ClearFlow candidate requirement and decision pending. Record exact source URL/version and licence notes. Do not turn US/EU/Spain-specific examples into Indian legal rules. Simplify the UX, not the data model.