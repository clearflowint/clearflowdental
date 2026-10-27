# ClearFlow Dental Clinic — Research Addendum (Batch 29)

Reviewed 27 October 2026. Direct OpenEMR EHI Export table-dictionary evidence, cross-referenced with the earlier OpenEMR order/result and patient record review. URLs point at first-party OpenEMR source documentation. This is a source inventory, not a recommendation to reproduce OpenEMR’s legacy schema one-to-one.

## 1. Patient demographics, identity, contacts, guardian and care-team fields
Source: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/patient_data.html

OpenEMR `patient_data` is broad: preferred/title/name, language, marital status, DOB, sex, multiple phone channels (home, work, contact, cell), address/country, email and direct/trusted email, occupation, driver licence, SSN, pharmacy, employer/referrer/provider IDs, referral source and status, financial and billing notes/review, public-facing MRN, clinic/site, insurance presence, patient group, price level, first/registration dates, generic custom fields, patient portal/communication permissions, care-team providers/facilities/status, deceased date/reason, guardian name/relationship/sex/address/city/state/postal/country/multiple phones/email, birth name, name history, suffix, preferred name, nationality, sexual orientation/gender identity fields, tribal affiliations, interpreter needed, advance-directive authenticator and various immunization registry / health-information exchange choices/status/effective date.

Several fields are explicitly legacy or jurisdiction-dependent: US SSN/driver licence, HIPAA preference fields, CMS portal, VFC, Medicaid ID, registry fields, sexual orientation/identity, immigration/workforce fields, and US-specific authorization language. They are evidence that identity, contact points, chosen names, family/guardian information, preferences, outreach permissions, health exchange permissions, interpreter/care-team and demographic information may require separate ownership; not a request to collect all sensitive data by default.

ClearFlow requirements:
- Separate patient identity and aliases/name history from contact points, addresses, employment/referral, billing identity, family account/guarantor, guardian/representative, care-team participation, provider assignment and preferred communication method.
- Represent contact point type, verification state/time, effective period, priority/preferred flag, do-not-use flag, and source. Work/mobile/alternate/emergency channels are not interchangeable.
- Separate guardian relationship from legal authority. Authority needs subject/representative ID, permitted scope, evidence/source, effective/expiry/revocation and who verified it.
- Health information exchange/immunization-registry/patient-portal permissions are purpose-specific and need effective-date/history, not one boolean shared by unrelated features. Capture the notice/policy version and evidence supporting a preference.
- Distinguish deceased date/reason and archived/merged status from deletion; preserve duplicate-resolution provenance. Use localized formats for IDs and do not require SSN or US-only fields in India.

## 2. Longitudinal lifestyle, family and surgical history
Source: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/history_data.html

`history_data` includes coffee, tobacco, alcohol, sleep/exercise, seatbelt use, counseling, hazardous activities, recreational drugs, dated preventive screenings/exams/test results, separate family history for mother/father/siblings/offspring/spouse, family history by condition (cancer, TB, diabetes, hypertension, heart problems, stroke, epilepsy, mental illness, suicide), history-like surgery flags/dates (cataract surgery, tonsillectomy, cholecystectomy, heart surgery, hysterectomy, hernia repair, hip/knee replacement, appendectomy), additional history/exams and user-defined fields. Most values are free text or a set of legacy column fields; this is an aggregate/history snapshot model.

ClearFlow should normalize reusable history observations into individual records with type/code, description, value/status, date or interval, reporter/relationship, source and reviewer. Family history is not the patient's own diagnosis. A procedure named in a history table is a self-reported/historical fact, not proof of a clinical operative note in this facility. Convert older fields to a canonical timeline while preserving original source and data gaps.

## 3. Allergies and problems as structured issue rows with interoperability provenance
Source: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/lists.html

`lists` is a patient issue/problem/allergy-style model (table name is generic): start/begin date, reported end date, occurrence, type/subtype, human-readable title, medical-device UDI and raw device-data JSON, referring provider/practice, diagnosis string with multiple coded systems, active/deleted flag, comments, patient, author/group, outcome, destination, reaction, verification, external allergy ID, external eRx source/upload state, severity, and last modification. It can represent an issue from an external system and has explicit active/deleted, reaction/verification and exchange status. There are several legacy and marked-unused fields.

ClearFlow requirements:
- Separate diagnosis/condition, allergy/adverse reaction, device implant, medication intolerance and external exchange issue types using explicit typed records/relationship instead of a generic unvalidated free-form `issues` table alone.
- Preserve when it began/ended, whether currently active, occurrence/recurrent status, severity/reaction, verification status, source system, originating external ID, eRx upload receipt/state, and update times.
- Keep codes from multiple systems as codeable concepts with system URI/version/code/display, not a concatenated string such as `system:code;system:code` as the canonical field.
- A deleted/inactive problem is not the same as resolved; resolution encounter/actor/date and reason should be modeled. `issue_encounter` links issue to encounter and records resolved flag and create/update actors/times. The link between issue and visit is a distinct fact.
- Medical-device UDI and snapshot data are device identifiers/registry evidence; the patient's implanted/used device history is a patient-specific relationship.

## 4. Medication, prescriptions, adherence, and stock management
Sources:
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/lists_medication.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/prescriptions.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/drugs.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/drug_templates.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/drug_inventory.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/drug_sales.html

`lists_medication` includes parent list/issue reference, dosage instructions, usage category and its display title, request intent and display title, medication adherence information source, adherence status/date asserted, prescription ID, and primary-vs-reported record flag plus reporting-source-record ID. Those last fields are critical: a medication record may be a current/primary prescription or patient-/third-party-reported evidence, and adherence can have its own source and assertion date.

`prescriptions` carries patient, pharmacy, prescriber, encounter, start/end/filled dates, free-text drug, drug ID and RxNorm code, form, dosage, quantity, size, unit, route, interval, substitution, refills/per-refill, note, active state, time/author, site, prescription GUID, eRx source/upload status, external drug info/ID, indication, PRN, repeat/number-of-treatment fields, transaction date, usage category, request intent, medication instructions, created/updated actors and coded diagnosis/justification. This reinforces that a medication order has content, workflow/transmission status, source and authorship, while medication statement/adherence has a separate lifecycle.

`drugs` catalog stores NDC and drug/product identity, order/reorder/max quantity thresholds, reactions, form/size/unit/route, substitution, related code, active state, lot-combining/multiple-lot settings, drug code, consumable-vs-dispensable and created/updated timestamps. `drug_inventory` adds inventory item, lot, expiry, manufacturer, on-hand quantity, warehouse, vendor, last notification and destroyed date/method/witness/notes. `drug_templates` holds prescribed dosage/period/quantity/refills/tax rates/package quantity. `drug_sales` stores item/inventory/prescription/patient/encounter links, date/quantity/fee, billed-to-accounting flag, transfer target, distributor field, notes, bill date, price level, template selector, transaction type (sale/purchase/return/transfer/adjustment), charge category, pharmacy-supply type and audit fields.

ClearFlow requirements:
- Normalize medication concept/product, ingredient/brand, strength/form/route/unit, catalogue reference and external code separately from patient medication statement, adherence report, prescription/version, dispense record, stock product/lot, sale/return/transfer and financial posting.
- Preserve the source of adherence and `asserted_at`; do not convert self-reported usage into a fact that the prescription was issued or dispensed.
- Prescription line data must handle the exact issued dose/sig, quantity, refill rules, pharmacy, indication and PRN directions; use immutable issued artifacts and eRx submit/delivery/error evidence.
- Inventory needs lots/batches, expiry, manufacturers, warehouses, vendors, stock movement ledger, returns/destroyed stock, witness/disposal evidence, item costs/charges and connection to sales/receipts. A current on-hand counter is not an audit trail.
- The source uses FLOAT quantities for some reorder fields and generic free-text units; ClearFlow should use appropriate decimals, controlled units, explicit conversion/rounding, and batch lineage. Local formulary and prescription compliance require jurisdictional validation; U.S. NDC/RxNorm are external concepts, not a local all-purpose code.

## 5. Laboratory order, code lines, report and observations
Sources:
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_order.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_order_code.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_order_relationships.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_report.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_result.html

`procedure_order` header includes patient/provider/encounter, collection/order/transmission dates, priority/status, patient instructions, active/deleted, external lab control ID, lab, specimen type/location/volume, clinical history, external ID, history-only flag, diagnosis, billing type, procedure type, fasting state, PSC hold, CMS ABN state (US-specific), collector, source facility/account, provider number, order type, scheduled service interval, performer type and location. `procedure_order_code` has order + sequence, code/name, original-vs-added-after-send source, diagnoses, do-not-send flag, title/type/transport and reason code/description/period/status. `procedure_order_relationships` links a request to external FHIR resource type/UUID plus relation/actor/time.

`procedure_report` has order/line references, collection/report times plus timezone offsets, source, specimen identifier, report state, review state and notes. `procedure_result` has data type (numeric/string/formatted/external/long text), result code (often LOINC), display, date, facility, units, result, reference range, abnormal text, lab comments, document attachment, result state (preliminary/final/corrected/incomplete etc.) and result end date.

ClearFlow requirements:
- Separate order header, requested service/code lines, specimen/collection event, external-lab acknowledgement, report, individual result values, corrected/preliminary results, clinician review and linked documents. One order can produce multiple result values and amendments; do not overwrite corrected results in place.
- Preserve submitted code/description/system and the source's line sequence; allow codes or service requests added after original order send to be tracked as amended items with explicit transmission state.
- Record actual timezone/source timestamps and specimen IDs; distinguish date of collection, date report generated, date result asserted and date clinician acknowledged.
- Use code systems and typed units/references; carry raw external result values/payload for reconciliation. `abnormal` text itself is not a diagnosis.
- The `procedure_order_relationships` table’s polymorphic type+UUID requires controlled resource type registry and safe existence/tenant checks.
- OpenEMR’s `procedure_order` is a specimen/lab order, not prosthetic dental laboratory casework. The two remain distinct.

## 6. Vitals and general observations with interpretation/reason
Sources:
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/form_vitals.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/form_vital_details.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/form_observation.html

`form_vitals` includes BP systolic/diastolic, height, weight, temperature + method, pulse, respiration, note, BMI + status, waist/head circumference, oxygen saturation/flow rate, pediatric percentiles, inhaled oxygen concentration, observation date, patient, user/group/authorized/activity and last updated. Some fields are explicitly stored in Imperial units (in/lbs/Fahrenheit). `form_vital_details` stores associated interpretation list/option IDs and archived code/title values, medical reason code/description and reason-status vocabulary. `form_observation` is a more general coded observation model with code/system/table code/type, observation name/value/unit/description/status/result status, reason code/status/text, documentation-of reference, date end, parent-observation link, category, questionnaire response ID, UUID and human-readable coded value description.

ClearFlow should define a canonical observation model with terminology/code-system, value type, value/unit, interpretation, reference range, effective date/time and timezone, status, reason, body site, method, source, recorder, reviewer, encounter, related observations and provenance. A unit conversion must be explicit and preserve the source value/unit. Keep measured values separate from calculated BMI/percentiles and from general notes. Data entered as patient-reported or imported should be attributed as such, not labelled clinic-measured by default.

## 7. Encounters and signed/electronically approved documents
Sources:
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/form_encounter.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/onsite_documents.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/clinical_notes_documents.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/clinical_notes_procedure_results.html

`form_encounter` includes encounter date/reason/facility, patient/encounter IDs, onset date, sensitivity, billing note, event category, last billing and last closure party, last statement date/count, attending/provider/supervisor, invoice reference number, referral source, billing facility, external ID, place-of-service, parent encounter, class/type/shift, voucher/referral number, discharge disposition, end time, collection flag and ordering/referring provider. Billing/patient context can coexist at an encounter header, but this should not collapse clinical encounter, billing account, payer liability, or order/result lifecycles.

`onsite_documents` records patient/facility/provider/encounter, creation date, document type, patient signature status/time, authorizing signature/time, acceptance status, authorizing signator, review date, denial reason, authorized signature, patient signature, full document BLOB, filename/path, template data and staff. Separate link tables attach documents to clinical notes and procedure results with creation time/creator. This is evidence that a patient signature, staff authorization, review/acceptance decision, original rendered document and the underlying clinical/financial record are different things.

ClearFlow requirements:
- Encounter should link patient, clinician(s), facility, referral/ordering/supervising provider, reason/type, onset/service start/end, location, parent/related encounter and source. Financial ledger status and billing party should be projections/references, not replacement for clinical encounter lifecycle.
- Consent/acknowledgement/e-signature record needs signatory identity and role, document/version/hash presented, signature evidence and method, actual signed time, authorizing clinician/actor, review/acceptance or denial reason, and later amendment/revocation linkage where legally supported.
- A document link is not the file object and a signature record is not the consent content. Preserve the exact version signed and retain its hash and associated attachments.

## 8. New ClearFlow schema/validation backlog
1. Build structured identity/contact/care-team/guardian fields with purpose-specific preferences and sources, but keep sensitive optional categories minimized and justified.
2. Model current and historical patient-reported medication, external prescriptions, adherence reports, actual prescription/issue/transmission, dispensing/sale and stock lot as separate records.
3. Model issue start/end/occurrence, coded diagnosis, severity/reaction, verification, active/resolved status, source system and external sync/rejection state.
4. Model order code lines, amended-after-send items, specimen collection, lab report and per-result value/review/correction state; order and report each retain their own external IDs/statuses.
5. Each observation uses controlled unit/value type and records source, clinical interpretation/reason and review. Tests cover unit conversion and reject ambiguous units rather than defaulting silently.
6. Encounter close, diagnosis resolution, lab result review, document consent and signature state must be independent state machines/events with actor/timestamp history.
7. File deletion, clinical record retention, lot destruction and correction need policy-specific permissions, audit trails and business evidence.
8. Import tests preserve source data, unknown terminology and legacy fields, and do not confuse a deleted/inactive source row with an explicit clinical resolution.

## 9. Source confidence and localization
OpenEMR’s EHI Export dictionary is official project documentation with table/field/type descriptions, but field defaults may be legacy artifacts and table structures are not always fully normalized. Preserve the data meaning and event relationships, not literal column shape. Examples such as SSN, HIPAA, VFC, CMS ABN, NDC, imperial measurement defaults and U.S. payer/encounter conventions are localization or source-specific, not global ClearFlow requirements. The schema must support Indian clinics without requiring US-only identifiers or workflows.

**End of Batch 29.**