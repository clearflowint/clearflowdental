# ClearFlow Dental Clinic — Research Addendum (Batch 26)

Reviewed 27 October 2026. This batch adds official India-specific interoperability/privacy sources to the schema research. These documents define exchange/compliance profiles and workflow states; they do not replace the full internal clinical model. This is engineering research, not legal advice.

## 1. ABDM FHIR R4: versioned exchange profiles
Primary sources:
- ABDM Developer Portal — NRCeS FHIR documentation: https://docs.abdm.gov.in/docs/hiecm/v3/resources/standards/fhir/nrces
- NRCeS FHIR Implementation Guide profiles v6.5.0: https://nrces.in/ndhm/fhir/r4/profiles.html
- NRCeS FHIR implementation downloads: https://nrces.in/ndhm/fhir/r4/downloads.html

The official ABDM developer portal describes the NRCeS implementation guide as the rules for how ABDM health records and claims conform to FHIR R4.0.1, not merely a statement that a base resource exists. It identifies published guide v6.5.0 (published 8 May 2025) and says to pin the version used and read the release history before upgrading. Search results also expose a v7.0.0 preview; do not assume a preview is the current published profile release. The Downloads page says the NPM package is the preferred implementation input because it carries profiles, value sets, package/page definitions and examples.

### Published clinical artifact profiles
- DiagnosticReportRecord: diagnostic/radiology/lab report.
- DischargeSummaryRecord: discharge summary.
- HealthDocumentRecord: unstructured historical health documents.
- ImmunizationRecord: immunization plus supporting documents/recommendations.
- OPConsultRecord: outpatient consultation, examinations, procedures, medication administered and advice.
- PrescriptionRecord: prescription/medication advice.
- WellnessRecord: wellness record including vitals and assessment.
- InvoiceRecord: billing artifact including consultation/pharmacy invoices and scanned supporting documents.

### Other FHIR resources/profile categories visible in the profile index
Patient, Practitioner, PractitionerRole, Organization, Appointment, Encounter, Condition, AllergyIntolerance, FamilyMemberHistory, CarePlan, Procedure, ServiceRequest, Specimen, DiagnosticReportLab, DiagnosticReportImaging, ImagingStudy, Observation (including vitals, body measurements, lifestyle and general assessment), Medication, MedicationRequest, MedicationStatement, Immunization, ImmunizationRecommendation, DocumentReference, Binary, Media, ChargeItem, Invoice and DocumentBundle.

### Terminology / code system details stated by the portal
- SNOMED CT (`http://snomed.info/sct`) is used for record types, conditions, procedures, allergies, medicines, specimens and many clinical codes.
- LOINC (`http://loinc.org`) is used for lab/imaging report codes and vital sign/body measurement observations.
- ICD-10 (`http://hl7.org/fhir/sid/icd-10`) is used for diagnoses on Condition and claims.
- ABDM's own code systems use canonical `https://nrces.in/ndhm/fhir/r4/CodeSystem/...` URIs.
- Units in examples use UCUM (`http://unitsofmeasure.org`).

### ClearFlow schema implications
1. Keep the full internal clinical model independent of a single FHIR resource shape, then define explicit, versioned mapping profiles. Exchange bundles should be generated from authoritative canonical entities rather than using FHIR JSON blobs as the only clinical database.
2. Every coded attribute needs separate code-system URI, code, display, terminology/version where available, and provenance. Preserve local display/free text when no code exists or mapping confidence is low. Do not silently coerce free text to SNOMED/LOINC/ICD-10.
3. Model diagnostic report and its individual observations/results, imaging study and binary/media documents, medication order and medication statement separately. Their FHIR profiles are distinct, consistent with the vendor schema comparison.
4. Store export profile version, mapping version, validation result, generated bundle ID/hash, source clinical record references, exported-at, recipient/purpose, delivery status and rejection/error response. Profile updates must not rewrite the historical artifact already exchanged.
5. Pin ABDM guide/package version per integration and validate at boundary using the official profile package. Keep internal schema migrations separate from external profile upgrades.

## 2. ABDM M2 — Health Information Provider and care contexts
Primary source: https://docs.abdm.gov.in/docs/hiecm/v3/milestones/m2

The current official developer portal describes M2 as enabling a facility acting as Health Information Provider (HIP) to create digital records, group them into care contexts, link contexts with an ABHA Address, and securely exchange FHIR document bundles. The facility must be registered in the Health Facility Registry and have a valid HFR ID; a HIP ID/client bridge and callback URL are also configured for the integration.

ABDM's eight Health Information Types are DiagnosticReportRecord, DischargeSummaryRecord, HealthDocumentRecord, ImmunizationRecord, OPConsultRecord, PrescriptionRecord, WellnessRecord and InvoiceRecord. Each applicable type is represented as a FHIR Document Bundle. For ClearFlow, a care context is a logical grouping of records for an episode/care relationship; it is not the patient, encounter, clinic tenant, or one physical record. The system should retain the mapping between local source records, exchange bundle and ABDM care context.

Potential integration entities (only activated if ABDM integration is enabled): clinic facility registration and HFR ID; software role/client linkage; patient ABHA number and ABHA address as separately typed identifiers with verification/linkage state; care context and its display/reference/HI type/count; token/request/callback correlation IDs; link status and its timestamps; bundle export record; failed/rejected callback and retry state. Do not treat ABHA as a mandatory replacement for the clinic's local patient ID or copy example patient identity fields into the canonical model without need.

The M2 portal warns that an HTTP 202 acceptance is not final success; final state arrives in callbacks and should be correlated by request IDs. ClearFlow must distinguish request accepted, queued/pending, callback received, linked successfully, and rejected/failed. Token validity stated by the portal should be stored as an expiry if applicable, never hard-coded as a universal identity/session assumption.

## 3. ABDM M3 — Consent-based health information exchange
Primary source: https://docs.abdm.gov.in/docs/hiecm/v3/milestones/m3

The official portal states that an HIU consent request is sent using a patient's ABHA Address; the patient may grant or deny it through a PHR app. On approval, the HIE-CM returns consent artefact IDs, the HIU initiates a health-information request, the HIP checks consent status/date-time range/encryption parameters, pushes the authorized records, and the HIU acknowledges receipt or failure. Consent may be revoked or expire, so access is not a standing indefinite permission. One consent grant can create multiple consent artefacts when requesting from multiple HIPs.

### Candidate fields / entities
- Consent exchange request: local tenant, patient identifier, initiating HIU/client, ABHA Address snapshot or scoped reference, requested HI types, requested care contexts, requested date range, purpose-of-use code, request expiry, consent request ID, initiation/decision timestamps and correlation ID.
- Consent response/artifact relation: decision (requested/granted/denied/revoked/expired), artefact ID list (not one scalar ID), consent period, scope, data types, care-context scope, purpose, status-observed time, revocation/expiry evidence and source/callback provenance.
- Data transfer request: consent artefact IDs, transaction ID, request date range validated against permitted scope, data-push URL identity, encryption/correlation metadata, requested source provider, response/callback state, completion/failure and acknowledgement timestamps.
- Transfer receipt: bundle ID/hash, sender/receiver, record range, received/decrypted/validated status, timestamps, failure reason, profile version and per-bundle provenance.

Do not design ClearFlow as an ABDM Consent Manager by default: M3 is the HIU/HIP consented-exchange protocol. Being a clinic or SaaS integration consumer does not automatically mean the application is a registered Consent Manager. Follow current ABDM role registration requirements before enabling each role. Never bypass or cache around a revoked/expired artifact for future retrieval. Minimize storing cryptographic secrets and raw tokens; prefer secure secret handling and retain only the required audit facts.

## 4. DPDP Act/Rules: official phased commencement and schema implications
Primary sources:
- MeitY, Digital Personal Data Protection Rules 2025 landing page (lists Rules, corrigendum and enforcement timeline): https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa
- DPDP Rules 2025, G.S.R. 846(E), 13 November 2025: https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf
- DPDP Act commencement notification, G.S.R. 843(E), 13 November 2025: https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf
- Corrigendum, G.S.R. 892(E), 10 December 2025: https://www.meity.gov.in/static/uploads/2025/12/3c7ebbae0e5456f493f486e6845df86b.pdf

Official Rules text says Rules 1, 2 and 17–21 came into force on Gazette publication (13 November 2025); Rule 4 comes into force one year later; Rules 3, 5–16, 22 and 23 come into force 18 months later. The Act commencement notification separately phases substantive sections, including sections 3–5 and section 6 subsections (1)–(8) and (10), at 18 months. Calculated from publication dates, the one-year date is 13 November 2026 and the 18-month date is 13 May 2027. The corrigendum dated 10 December 2025 changes certain textual references and wording in Rules; it does not change the listed phased commencement clause in the inspected text. Re-check current official notifications and legal counsel before production compliance sign-off.

### Schema / platform design implications (not legal advice)
- Prepare now for traceable purposes and a clear, separable notice/consent or other lawful basis model where applicable: data principal/guardian, notice/version, purpose, categories, collection method/time, scope, decision, withdrawal/correction, contact channel, policy and proof. Consent must not be the only legal basis by assumption; the actual legal basis and notice design require legal review.
- Data inventory and purpose registry should map each personal-data field and source to purpose, access role, retention class, processor/integration, exportability, erasure/retention exception and applicable policy version.
- Data breach workflow should retain detected/occurred/contained/reported times, scope/data categories, affected population, incident cause/evidence, mitigation, recipient/authority notification details, completion status and incident owner.
- Provide secure access/correction/export request workflows, tenant-scoped authorization, audit visibility, revocation handling and data minimization. Do not expose protected clinical notes to general operational staff by default.
- Avoid assuming every data subject is capable of independently signing: model a related person/guardian/authorized representative with authority scope/effective dates and evidence, rather than treating `is_guardian` as all-purpose permission.
- DPDP Act and Rules have phased dates. As of 27 October 2026, the Rule 4 one-year date is imminent (13 November 2026) but concerns registration/obligations for Consent Managers; do not treat it as the general effective date for every data fiduciary obligation. The 18-month phase date is 13 May 2027 per the official commencement notice. Maintain a compliance calendar and counsel review.

## 5. Indian GST invoice architecture: localization boundary and research status
Official CBIC source located: https://cbic-gst.gov.in/gst-invoice-rules.html (Tax Invoice, Credit and Debit Notes). Exa retrieval of the page and available Rules PDF was unsuccessful in this pass, so exact current Rule 46 particulars and later notifications are **not treated as fully verified here**.

Schema direction regardless of the final local rules: keep an effective-dated tax/invoice compliance adapter, series/financial-year configuration, supplier and recipient legal identities, tax registrations, item/service code system and value, taxable basis, line-level tax rates/amounts, discount/adjustment, place-of-supply/jurisdiction, reverse-charge/zero-rated/exempt reasoning where applicable, issue/credit-note relation and immutable issued-document snapshot. E-invoice applicability thresholds, IRN/QR/signing requirements, invoice field requirements and exemption details must be checked against the current CBIC/GST Notifications and the clinic's actual registration/eligibility; don't bake a static one-size-fits-all '18% GST' rule into the clinical model. Dental treatment's actual tax treatment needs specific tax review.

## 6. New canonical model + validation backlog
1. The internal clinical schema remains source-of-truth; ABDM FHIR is a versioned projection/exchange contract, not the internal database schema.
2. Add a terminology registry/mapping table with system URI, code, display, version, mapping source/confidence/reviewer and valid-from/to. Preserve source codes/text at import/exchange boundaries.
3. Add care-context linkage and exchange-artifact tables behind an opt-in ABDM integration module. Include all request/transfer IDs and callback outcomes for reconciliation.
4. Add consent artefact scope, multiple artefact IDs, expiry and revocation checks to any HIU data-fetch workflow.
5. Implement a profile version pin, FHIR package-validation tests, bundle hash and mapping version; include golden examples for Patient, Encounter/OPConsult, AllergyIntolerance, Condition, Procedure, MedicationRequest/Statement, Observation, DiagnosticReport, ImagingStudy, DocumentReference, Invoice and DocumentBundle.
6. Implement jurisdiction-neutral financial/clinical concepts plus India-specific effective-dated compliance modules. Never store local GST/ABDM rules as implicit global invariants.
7. Add an effective-dated compliance calendar: DPDP notification/corrigendum versions and phase-in dates; actual applicable tax rules and registration state; ABDM profile package version/role eligibility.

**End of Batch 26.** Sources reviewed directly in this batch include the official ABDM developer portal, NRCeS FHIR R4 profile index/download page, and MeitY Gazette PDFs for DPDP Rules and commencement/corrigendum. The CBIC invoice page was located but its contents were not successfully extracted; exact tax requirements remain a verification item.