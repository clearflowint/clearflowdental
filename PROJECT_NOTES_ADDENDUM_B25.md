# ClearFlow Dental Clinic — Research Addendum (Batch 25)

Reviewed 2026-10-27. Source: DentalPin patient-clinical and medical-reference models/services/tests. These are implementation observations, not validated clinical guidance.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/patients_clinical/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/patients_clinical/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/medical_reference/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/medical_reference/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/patients_clinical/test_soft_delete.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/patients_clinical/test_blank_inputs.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/prescriptions/test_prescriptions.py

## Exact patient-clinical fields observed
- MedicalContext (one row per patient): pregnancy flag/week, lactation, anticoagulant flag/name, INR/date, smoking flag/frequency, alcohol consumption, bruxism, anesthesia adverse-reaction flag/details, last-updated actor/time.
- Allergy: patient/clinic, name, type, severity (default medium), reaction, notes, optional reference ID, status.
- Medication list: patient/clinic, name, free-text dosage/frequency, start date, notes, optional reference ID, active/archive status. This is medication history, not the full prescription order/line/dispense lifecycle.
- SystemicDisease: name/type, diagnosis date, controlled flag, critical flag, medication text, notes, optional reference ID and status.
- SurgicalHistory: procedure, date, complications, notes, optional reference ID and status.
- EmergencyContact and LegalGuardian are separate 1:1 records in this source. Emergency contact stores name/relationship/phone/email/guardian flag; legal guardian stores name/relationship/DNI/phone/email/address/notes/status. This still does not model multi-contact authority scopes, effective periods and revocation as fully as a relationship-authority graph.
- Tests establish soft-delete semantics: archive clinical history instead of hard-delete; active lists hide it while historical Get still finds it. Blank form strings for optional date/number/email fields should normalize to NULL. ClearFlow must distinguish unknown, explicitly none, not asked and cleared values.

## Medical reference tables observed
- ReferenceAllergy, ReferenceMedication, ReferenceDisease and ReferenceSurgery each store clinic, plain name (up to 150 chars), active flag and unique clinic+name. Retired terms are hidden from new searches but must remain resolvable in existing history.
- ReferenceInteraction stores clinic, medication A/B FKs, free-text risk note and active flag; pair uniqueness is clinic+A+B. Canonical A/B ordering is performed by service code rather than DB CHECK, so concurrent reverse-order creates need a database-safe canonicalization test.
- ReferenceContraindication stores clinic, disease FK, medication FK, free-text risk note and active flag, unique by clinic+disease+medication.
- Patient-flag service only evaluates active patient medication/disease rows where reference_id is present. Free-text-only legacy entries are deliberately excluded from automated matching instead of fuzzy-matched. It derives interaction flags for active reference medication pairs and contraindication flags for active disease-medication pairs.
- The reviewed rule fields do not show external evidence source, evidence grade, severity taxonomy, version/release, valid-from/to or review date. Verify other code paths before concluding they are globally absent. A clinic's plain-name list is not itself a validated terminology or drug interaction authority.

## ClearFlow candidate requirements
1. Never discard free-text reported medications/allergies because mapping fails. Preserve them as visible unmapped/uncertain facts and surface that no warning can be inferred from an absent code.
2. Store terminology system/code/version, synonyms/local label, source URI/licence, effective dates and retirement/replacement mapping. A local clinic list maps to a terminology; it is not the authoritative medical source.
3. Interaction/contraindication warnings need reviewed source, evidence/version, effective date, applicability, severity, review date and approving clinician. Keep warning source and the exact patient entries that triggered it. Do not let an LLM invent authoritative interaction rules.
4. Distinguish patient-reported medicine, prescription order, dispensed/administered medicine, allergy/adverse reaction, diagnosis and rule-derived warning; each has different authority and lifecycle.
5. Ensure reference IDs cannot cross tenant boundaries. Optional-module UUID references without FKs need a tenant-scoped resolver and service checks; if a standard terminology service is core, consider real tenant-safe constraints.
6. Rename/retire reference values without rewriting existing patient history or issued prescription text. Keep source/version used at point of decision.

## Acceptance tests added
- Active allergy appears in current safety context; archived allergy is hidden from current warnings but remains in historical detail.
- An unmapped free-text medicine remains visible and warning output doesn't imply safety based on missing mapping.
- Cross-tenant reference IDs are rejected; interaction pairs cannot be duplicated in reverse order under concurrent creates.
- A reference retirement/effective date doesn't erase historical warnings; old prescription wording stays frozen after reference label changes.
- Empty string in nullable date/number/email input normalizes to NULL, omitted field remains unchanged, explicit null clears only where permitted.
- AI can propose a mapping but requires clinician review for uncertain/safety-critical mappings; evidence, uncertainty and reviewer outcome are stored.

Main implication: preserve clinical history and provenance while refusing to mistake a local plain-name list or an AI guess for a validated medical terminology service. Batch 25 extends the research coverage; it is not the final schema.