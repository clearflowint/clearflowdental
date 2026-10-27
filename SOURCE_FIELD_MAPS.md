# ClearFlow Dental Clinic — Source-to-Concept Field Maps
**Version:** 0.2 · **Updated:** 2026-10-27  
**Linked documents:** FIELD_LEVEL_INVENTORY.md · TRACEABILITY_MATRIX.md · SOURCE_COVERAGE_REGISTER.md · IMPLEMENTATION_GAP_REVIEW.md · RESEARCH_COMPLETION_STATUS.md

## Purpose and scope limit
This file extracts named fields and field groups explicitly recorded in B17–B38 addenda and maps them to candidate ClearFlow concepts. It is deliberately **source-qualified**: an upstream column name, enum, sentinel, unit or behavior is not automatically a universal requirement or a final ClearFlow column. A table family below is only as complete as the cited addendum/API/EHI dictionary reviewed. The original source addenda remain the evidence location for URLs and detailed notes.

Status labels: **Observed** = explicitly named in the reviewed source; **Candidate** = normalized concept proposed; **Source-specific** = vendor encoding/status/enum/unit must be preserved and mapped; **Pending** = exact source DDL, clinical validation, runtime behavior or legal applicability remains unresolved.

## 1. DentalPin source modules (B17–B25, B31–B32)

### 1.1 Agent command / import / approval (B17, B19, B22)
| Source object / named fields or behavior | Candidate mapping | Required preservation/test |
|---|---|---|
| AgentApprovalQueue: clinic, agent, session, tool, JSON arguments, reason, status, reviewer, review time, notes | Proposed action, exact payload, policy/context, approval decision, executor result | Approval is not execution. Hash/version the approved arguments; stale/changed payload cannot execute; concurrent approvals serialized; reviewer and tenant checked at execute time |
| Tool registry/allowlist, parameter schemas, user/tenant/permission/session context | Tool catalogue/version, action permission, authorization context | Allowlist ≠ role permission. Distinguish absent allowlist from explicitly empty allowlist; schema/UUID/date validation server-side |
| Import manifest: canonical UUID/parent/path/size/SHA-256/MIME; metadata/entity counts/schema version; raw source data/extracted timestamp | Import file/object, import batch, row, source identity and mapping | Check source hash and file manifest; keep raw payload; never trust source tenant field |
| ImportJob: source system/adapter/exporter/format version, tenant label, declared/computed hash, counts/progress/checkpoint, opt-in flags, start/completion/errors | Import job/version/checkpoint/report | Resume idempotently; partial import state and row outcomes explicit; do not imply full rollback if source implementation leaves partial results |
| EntityMapping: source system + entity type + canonical source UUID -> destination table/ID; MappingDecision proposed/accepted/relinked/create_new/ignored | External identifier mapping + human resolution decision | Preserve source id/raw row/conflict and operator outcome; human choice overrides fuzzy match; external IDs aren't internal PK/FK |
| Import records: raw_source_data, entity payload, warnings/row errors/duplicate/FK validation, edited values | Source snapshot, normalized candidate values, row validation and mapping version | Stable row IDs/idempotency; row-level outcomes; map provenance; no fabricated surname/DOB/age; historical receivable isn't derived from current tariff |

### 1.2 Patient-clinical and medical-reference records (B25, B31–B32)
| Observed source object/fields | Candidate mapping | Required preservation/test |
|---|---|---|
| MedicalContext: pregnancy flag/week, lactation, anticoagulant flag/name, INR/date, smoking flag/frequency, alcohol consumption, bruxism, anesthesia adverse-reaction flag/details, last-updated actor/time | Typed clinical context item/value/status + source, effective time, reviewer, history | Conditional/sensitive clinical questions; separate unknown/not asked/denied/present; do not collect every field by default |
| Allergy: patient/clinic, name, type, severity (source default medium), reaction, notes, optional reference ID, status | Patient allergy/intolerance statement + concept mapping | Keep raw reported term, reporter/source, onset/reaction/severity/verifier/time; a default severity isn't a universal clinical truth |
| Medication list: patient/clinic, name, free-text dosage/frequency, start date, notes, optional reference ID, active/archive | Medication statement/history | Not prescription/dispensing/adherence; preserve free text where unmapped; effective period/status/asserter/source |
| SystemicDisease: name/type, diagnosis date, controlled/critical flags, medication text, notes, optional reference ID/status | Condition/diagnosis statement | Distinguish patient-reported vs clinician-confirmed and controlled status from active/resolved |
| SurgicalHistory: procedure, date, complications, notes, reference ID/status | Historical procedure statement | Source/reporting person and time, known provider/site if available; don't imply current clinic performed it |
| EmergencyContact / LegalGuardian: name, relationship, phone/email/address, guardian flag, DNI (source-specific) and status | Related person, contact point, legal authority evidence | DNI is source/jurisdiction-specific and not a universal Indian field. Emergency contact not blanket authority. Model scope/effective dates/revocation |
| ReferenceAllergy/Medication/Disease/Surgery: clinic, plain name, active; unique clinic+name | Tenant-local concept dictionary | Local terms map to a terminology; term retirement must preserve historical use |
| ReferenceInteraction: clinic, medication A/B FK, risk note, active, unique clinic+A+B; source canonical ordering in service code | Medication interaction rule + evidence | Pair ordering must survive concurrent reverse-order creates; plain text alone is not authoritative evidence |
| ReferenceContraindication: clinic, disease FK, medication FK, risk note, active; unique clinic+disease+medication | Condition-medication warning rule | Add evidence source/version/severity/effective/review/approver before operational use; never let AI invent authoritative rules |
| Service tests: soft archive hides active list but historical Get still works; optional blank date/number/email becomes NULL; omitted differs from explicit null | Archive/status semantics and nullable normalization contract | Keep archive vs hard delete distinct; empty, omitted and explicit null have different API semantics |

## 2. OpenDental source/API families (B27–B28, B36)

### 2.1 Patient/coverage/claim/financial field families (B27)
| Source API/object and observed fields | Candidate mapping | Source-specific caveat / test |
|---|---|---|
| Patient: stable patient ID and demographics referenced by patient/claim/plan APIs | Person/patient identity + identifier map | API isn't full DDL; verify exact fields from pinned schema before physical mapping |
| InsPlan: group name/number, plan note/type, claim form, employer/payer carrier, UCR/substitution behavior, fee schedule links, allowed/copay schedule, renewal month, coordination-of-benefits, orthodontic claim automation, billing type, PPO writeoff, exclusions and zero-writeoff overrides | Payer plan, benefit/price rules and effective version | US-oriented fields are not required in India by default; keep plan-specific rule/version/effective period |
| InsSub: plan-to-subscriber link; subscriber/member ID, effective/termination dates, benefit notes, release-of-information and assignment-of-benefits authorization, subscription note | Subscriber enrollment, coverage relation, authorization evidence | Subscriber != covered patient; R.O.I. / assignment evidence separate from guardian authority; end enrollment without deleting historical claims |
| PatPlan: person/family-member coverage link, primary/secondary order, relationship, pending flag, patient-specific ID override | Patient coverage link | Relationship to subscriber isn't guardian authority; preserve historical order/effective dates |
| Benefits: plan or patient-plan scope, coverage category, procedure code/group, benefit type, percent/amount/period/quantity, coverage level, area/tooth range | Versioned benefit rule + coverage result | Source -1 sentinel means empty percent/amount; don't import as negative value |
| InsVerify + insverifyhist: verify type, member plan/plan FK, verified date, status definition/note, actor/assignment/edit times; historical verification list | Eligibility/benefit check request/response/history | Verification is timestamped, staleable and historical; never overwrite all history with one boolean |
| Claim header: service/sent/received dates, status, primary/secondary plan, treating/billing provider, claim fee, estimated/actual insurance payment, deductible, prosthesis/original date, underpayment reason/note, claim type, place of service, accident, orthodontic dates/duration, subscriber/member links, write-off, authorization number | Claim version/header + state events | Claim header != lines != remittance/cash. Preserve submitted version, payer response and claim type mapped through adapter |
| Claim procedure/line: linked procedure, billed/sent/received/payer status, fee, estimates, adjustments, payment, writeoff, provider/plan and claim linkage as documented | Claim line/adjudication/allocation | Need exact per-version table schema before all physical fields are frozen |
| ClaimPayment/check: check/EOB, issue/receive/deposit/posting dates, amount, method, payment batches and references | Remittance/payment posting event | Separate payer check date, receipt date, entered date, deposit/posting date; idempotent reconciliation and line allocation |
| Claim tracking/EOB attachment: status transition/communication and document attachment references | External claim communication and EOB artifact | Preserve external IDs, source payload and exact file/hash; no raw payer payload in general logs |
| Payment plans: terms, rate, principal, installments, due dates, down payment, signed agreement, closed/locked state and payment allocation | Payment agreement snapshot + installment obligations | Agreement terms and current derived balance distinct; older/dynamic vendor model names don't become global enums |

### 2.2 Procedure, treatment plan, periodontal, recall and documentation (B27–B28, B36)
| Source API/object and observed fields | Candidate mapping | Source-specific caveat / test |
|---|---|---|
| ProcedureLogs: patient/appointment/provider/clinic, procedure code/status, diagnoses, tooth number/surface/tooth range, fee, date, priority, planned appointment, place of service, prosthesis flags/dates, billing/claim links, quantity/base units, plan date/site, hidden graphic, start/end, prognosis, edit lock, SNOMED body site, multiple diagnostic codes/ICD version, ordering/referral provider and discounts | Clinical service/procedure, anatomical target, status event, provider/diagnosis/charge link | API update constraints and status enums differ by code; record code/version and validate target rules server-side |
| ProcedureCodes: code/descriptions/abbreviation/time pattern/category/treatment area, no-insurance-bill/prosthesis/hygiene/radiology flags, default notes, alternate/medical codes, taxable flag, paint/layman terms and provider/default details | Versioned procedure catalogue | Do not copy US billing/code enums as universal; target kinds depend on code version |
| Fees: procedure/clinic/fee schedule mapping and effective amounts as source API documents | Price catalog and effective price version | Catalogue fee is not historical invoice price; snapshot offered/issued amounts |
| TreatPlan: patient/date/heading/note/status (saved/active/inactive), plan type, presenter, responsible party, linked document, signing provider/patient, signed times/status | Treatment plan header/version and acceptance evidence | Signed plan is not completed treatment |
| ProcTP (saved-plan copy): source procedure reference, line order/priority, tooth/surface, code/description, fee, primary/secondary estimate, patient amount/discount, prognosis/diagnosis, provider, allowed fee/tax and clinic | Immutable plan-line snapshot | Changing live procedure/catalog/benefit must not change accepted offer |
| PerioMeasure API: tooth/exam, sequence type, six sites (MB/B/DB/ML/L/DL) and tooth-level value; source types Mobility, Furcation, Gingival Margin, MGJ, Probing, SkipTooth, packed Bleed/Suppuration/Plaque/Calculus flags | Typed periodontal site observation with explicit status/unit/source | Source encodes no measurement as -1 and certain negatives as >100; preserve raw and normalize with verified conversion, not naïve numeric copy |
| Recall: due date, prior date, interval, status, note, disabled, type, disable-until-balance/date, scheduled date, priority/time pattern; RecallType description/default interval/time pattern/linked procedures | Recall configuration + patient follow-up obligation + contact attempt | Due date policy/version distinct from message and appointment; source cardinality is not universal |
| AllergyDef/Allergy: definition description/hidden/edit time/SNOMED type/medication link/UNII; patient allergy has patient, definition or raw description, reaction, active state, adverse date/edit time | Allergy reference + patient allergy statement | Preserve unrecognized raw text and missing-code semantics |
| Medication/Generic: brand/display name, generic link/name, notes, hidden/edit time | Medication concept/product catalog | Do not treat catalogue row as patient therapy |
| MedicationPat: patient/medication link, note/free-text dose/frequency, start/stop, provider | Medication statement/history | Not proof of current prescription or dispense |
| RxPat: patient/date, raw drug text, directions/Sig, quantity, refills, prescriber, notes, pharmacy, controlled flag, eRx state/legacy marker, pharmacy info, procedure required/link, days' supply, patient instructions, clinic/edit time | Prescription artifact/line(s), prescriber snapshot and transmission | Freeze issued version; exact NDC notice fields are separate validation controls |
| Patient notes: summarized text, date/owner-related details as API provides | Versioned note/read model | Summary update must not erase underlying structured history |
| Documents API: document ID/patient/date/category/type/provider/description/tooth associations; file bytes handled separately | Document metadata plus binary asset | Metadata GET is not the payload; authorization, hash and source storage separate |
| Lab cases (manual/schema references): laboratory, patient, provider, due date, appointment link, instructions, fee, sent/received/quality-check times; turnaround API published/actual turnaround | Lab case/products/events and lab policy | Direct API field extraction remains unverified; no candidate material/shade field should be called confirmed API column without source proof |

## 3. OpenEMR EHI export source families (B18, B23, B29–B30, B33–B34)

### 3.1 Patient, history, issues and identity mapping
| Source table/field family | Candidate mapping | Caveat / test |
|---|---|---|
| `patient_data`: title/name/preferred name/name history/suffix, language, DOB, multiple phones, address/country, email/direct/trusted email, occupation/employer/referrer/provider IDs, MRN, site, registration/first date, portal/communication permissions, care-team providers/facilities, guardian identity/contact/address, deceased data and many legacy/custom demographic columns | Person/patient, identity, identifier, contact point/address history, related person/authority, care team, accessibility/preference | US-only and sensitive fields (SSN, driver licence, HIPAA/CMS/VFC etc.) are not default requirements; purpose-minimize and pin source version |
| `history_data`: tobacco/alcohol/sleep/exercise/counseling, preventive exams/screening, tests/results, family history by relative/condition, prior surgeries and custom fields | Longitudinal reported history/context/condition/family history | Preserve source free text and date; family history != patient diagnosis; reported surgery != facility operative record |
| `lists`: begin/end, occurrence, type/subtype, title, UDI/raw device data, provider/practice, diagnosis string/codes, active/deleted, comments, patient, author/group, outcome/destination, reaction, verification, external allergy/eRx IDs, severity/update times | Typed condition/allergy/adverse-reaction/device issue and source mapping | Don't collapse heterogeneous issue types into unvalidated free text; preserve raw coded system values |
| `uuid_mapping`/`uuid_registry`: UUID, resource name/path, target table/UUID, table/table ID, vertical/flags/time | External ID mapping/registry | external UUID != internal key; support duplicate/conflict and source-system scope |

### 3.2 Medication, stock and immunization
| Source table/field family | Candidate mapping | Caveat / test |
|---|---|---|
| `prescriptions`: patient/pharmacy/provider/encounter, start/end/filled dates, drug name/ID/RxNorm, form/dosage/quantity/size/unit/route/interval, substitution/refills, medication relation, notes/active, created/modified times, user/site, prescription GUID, eRx source/upload/external ID, indication/PRN/usage category/request intent, instructions/audit actors | Prescription header/line, prescriber/pharmacy, issue/transmit/fill lifecycle | RxNorm and US source enums aren't sole canonical vocabulary; issue/send/dispense distinct |
| `lists_medication`: medicine and free-text dosage, usage category, intent, adherence value/source, asserted date, prescription relation, reported-primary flag and source record | Medication statement/adherence report | Statement doesn't prove prescription, dispense or adherence |
| `drugs`: product/code/NDC, form/size/unit/route, reactions, reorder thresholds, on-order quantity, lot handling, consumable/dispensable flags and timestamps | Medication/product catalog and stocking policy | NDC/US fields not universal; product state/version separate from stock |
| `drug_inventory`: drug, lot, expiry, manufacturer, on-hand quantity, warehouse, vendor, destruction date/method/witness/notes | Lot/location stock and destruction event | Current on-hand should be derived from movements and reconciled |
| `drug_sales`: inventory lot, prescription/patient/encounter, actor/date/quantity/fee/accounting flag, transfer source, notes/billing date, price level, sale/purchase/return/transfer/adjustment, UUID/audit | Stock movement/dispense/sale/purchase/return/transfer/adjustment | Sales != administration/clinical consumption/payment; quantities need unit/pack conversion and idempotency |
| `immunizations`: patient/administered time/code/CVX/manufacturer/lot/expiry/performer, education/VIS dates, amount/unit/route/site, erroneous-entry, external ID, completion/source/refusal/reason/provider/encounter | Immunization administration/refusal event | Include only if product scope supports it; maintain correction and lot traceability |

### 3.3 Orders, reports, results and observations
| Source table / named field family | Candidate mapping | Caveat / test |
|---|---|---|
| `procedure_order`: provider/patient/encounter, collected/ordered/transmitted times, priority/status, instructions, lab control ID/lab, specimen type/site/volume, clinical history, external ID, history-only marker, diagnosis, scheduled date/time, performer/location/facility | Order header + specimen + transmission + fulfillment events | Order status does not imply result/final/review |
| `procedure_order_code`: sequence/code/name, diagnoses, original-vs-added-after-send, do-not-send, title/type/transport, end/reason fields | Versioned order line and transmitted content | After-send edits must preserve sent version and new communication |
| `procedure_report`: order ID/sequence, collection/report time with timezone, source, specimen number, report status, review status and lab notes | Report artifact + report version + review | Imported final result stays unreviewed until reviewer acts |
| `procedure_result`: data type/result code/description/date/facility/units/value/reference range/abnormal/comments/document/status/end date | Individual typed result/observation | Preserve units/source/status/correction and raw report link |
| `form_observation`: form/patient/encounter, date/user/group, auth/activity, code/label/value/unit/description, code system/type/status, result/reason status/code/text, document target, end date, parent, category, questionnaire ID, UUID and value-code description | Observation with provenance, hierarchy, status and form/document context | Observation status/result status/review status distinct |
| `form_vitals`, `form_vital_details`: systolic/diastolic BP, height/weight/temp/method/pulse/respiration, BMI/status, waist/head circumference, oxygen saturation/flow, pediatric percentiles, O2 concentration, note, source units, interpretation/reason details | Typed observations and derived values/interpretation | Source uses inches/pounds/Fahrenheit on documented columns; preserve source units and conversion method |
| `form_vitals_calculation`: patient/encounter/time window/calculation identifier (e.g. average BP over interval) | Derived measure with formula/window/input references | Keep formula/version/input time window and recompute deterministically |

### 3.4 Finance/insurance/claims/accounting
| Source table/field family | Candidate mapping | Caveat / test |
|---|---|---|
| `insurance_data`: priority primary/secondary/tertiary, payer/plan/policy/group, subscriber identity/ID/DOB/relationship/address/phone/employer, copay, assignment acceptance/type/effective/end dates | Coverage/subscriber/patient-plan relationship | Covered patient != subscriber; coverage estimate != payer guarantee |
| `benefit_eligibility` / `eligibility_verification`: coverage level/type/period, plan, amount/percent, network/message/status, verification time/source | Eligibility/benefit response with freshness and history | Status can stale; preserve response/version and who checked |
| `claims`: patient/encounter/payer, version, payer/type/status/process dates/file/target/X12 partner/submitted payload | Claim header/version and transmission history | Claim header != actual payment |
| `billing`: code system/code/modifier/units/fee/provider/encounter/payer/billed/process state/external IDs/revenue code/charge category | Invoice/charge line and claim relation | Snapshot the issued/posted values; exact tax/localization needs review |
| `ar_activity`: fee/payment/adjustment/payer, posted date/time/user, posting batch/reason/account code/follow-up/payer claim number | Payment/adjustment ledger activity | Separate cash, contractual adjustment, deductible, patient liability |
| `ar_session`: EOB/check reference, check/deposit/posting dates, amount, adjustment code, post-to date, patient/method | Remittance/posting batch | Date types are different facts; idempotent reconcile |
| `payment_processing_audit`: provider action, ticket/transaction IDs, payload/reversal details | Gateway attempt/reconciliation/controlled evidence | Redact secrets/PHI; never trust webhook without signature/idempotency |

### 3.5 Audit, signed docs, messages and amendment
| Source table/field family | Candidate mapping | Caveat / test |
|---|---|---|
| `audit_master`: patient/user approval/denial/status/comments/time/IP/activity/flags; `audit_details`: table/field/value/parent/entry ID | Audit workflow and controlled field diff | Not a universal immutable audit contract; protect PHI and make corrections traceable |
| `amendments_history`: amendment ID/note/status/actor/time; `patient_history`: dated old-name/care-team changes and actor | Amendment chain and identity history | Keep separate from security audit and user-facing timeline |
| `documents_legal_master`: template/category/subcategory/document ID/name/path/file/facility/provider/signature layout/effective date/version/content/review and upload type | Template/version library | Template version != issued instance |
| `documents_legal_detail`, `onsite_documents`: patient/facility/provider/encounter, template relation, signature/ready/denied/upload state/time/signer, authorizing identity/status, review date, denial reason, content/document bytes/name/path/template data | Issued form instance/rendered artifact/signer authority | Store original bytes/hash under controlled access; old signed artifact immutable |
| `esign_signatures`, `onsite_signatures`: target row/table, signer/time, lock/amendment state/text, data hash/signature hash, status/type, patient/encounter, actor/authorizer, signer ID, signature image/string/hash/IP | Signature evidence and amendment link | Hash presence alone doesn't validate legal or cryptographic adequacy |
| `api_log`: user/patient, IP, method, URL, request/response body and time | Structured diagnostic log + secure payload evidence (where justified) | Do not create general-purpose PHI/secrets dump; separate redacted correlation data from restricted evidence |
| `notification_log`: patient/appointment event, SMS gateway info/message, email sender/subject/type, patient snapshot, event dates and sent timestamp | Outbound message/attempt/provider receipt | Legacy log isn't full retry/delivery/read/reply state; use outbox + attempts + provider callbacks |

## 4. ABDM, profile exchange, consent and legal obligations

| Source evidence | Candidate mapping | Contract/test |
|---|---|---|
| ABDM HI types/profiles: DiagnosticReportRecord, DischargeSummaryRecord, HealthDocumentRecord, ImmunizationRecord, OPConsultRecord, PrescriptionRecord, WellnessRecord, InvoiceRecord (B26) | Versioned mapping from internal clinical documents/entities to FHIR Document Bundle | Bundle/hash/source refs/mapping version/profile package/validator/purpose/recipient/time |
| M2 care context, HFR/HIP roles, ABHA address/link, request/callback correlation | Facility registration + care-context relation + exchange transaction/callback | HTTP accepted != completed; callback/ack linked using correlation IDs |
| M3 consent artifacts: request/decision, artefact IDs, scope/date range/purpose, consent validity/revocation, data transfer status | Consent request/artifact relation and data transfer event | Check live validity/scope before disclosure; multiple artifacts may be returned; expiration/revocation blocks continued access |
| NRCeS v6.5.0 stable package vs v7 preview | Pinned profile package, validator, mapping version, exchange audit | Keep stable package until official stable update review, profile diff and fixtures pass |
| DPDP Act G.S.R.843(E), Rules G.S.R.846(E), corrigendum G.S.R.892(E) | Effective-dated obligations register and purpose/data inventory | Test exact start dates; read corrigendum with Rules; legal reviewer maps actor/scope/exception |
| NDC M-2749 / M-2662, Telangana Gazette GO Ms.64 (B37) | Prescription rendering fields, dentist credential, dental mechanic qualification/registration, facility registration/category | Validate before issuing/assigning services as relevant; legal review and version-at-action evidence |
| CDSCO Drugs Rules 1945 consolidated document (B37) | Drug class/source/version and prescription/dispensing constraints | Map only after pharmacy/legal review; unreviewed class isn't permission to prescribe |

## 5. Normalization and null/unit/status rules

| Raw source example | Canonical mapping rule | Mandatory test |
|---|---|---|
| Nullable text/date/number fields with blank form input (DentalPin B25) | Blank-to-null only for explicitly nullable input; omitted field preserves existing value; explicit null clears only where permitted | Patch with omitted, blank and null and assert three intended behaviors |
| Open Dental periodontal -1 = no measurement; greater-than-100 encodes certain negative values; packed flags (B27) | Preserve raw source value/encoding and apply versioned, type-specific decoder to explicit no-measurement / signed value / individual flag records | Decoder roundtrip fixtures; no missing value becomes zero or negative mm |
| OpenEMR vitals source units inches/pounds/Fahrenheit (B34) | Keep original source unit/value and normalized value/unit with conversion method/version | Roundtrip known fixtures and verify measurement precision within defined tolerance |
| Vendor enums such as claim status, medication status, procedure status (B27–B29) | Store source enum/system/version and separate local canonical lifecycle; preserve unmapped state in a reviewable field | Unknown enum imports without silent fallback/default |
| Multiple diagnosis codes in one string or list (B29) | One coded concept per repeatable relation; source system URI/version/code/display each retained | Mixed systems remain separable and reversible |
| Date-only values vs time-zone-aware instants (B27, B29, B36) | Define date-only for clinical/administrative dates; timestamp+offset/zone for instants; retain raw source date/time | DST/zone shifts and import don't change calendar dates or acquisition chronology |
| IDs with no native FK (prototype, B25 optional reference IDs, B36 attachment owner registry) | Treat as an unresolved relationship until authoritative resolver validates parent/tenant/type | Invalid, missing and cross-tenant IDs denied/quarantined; no orphan silently treated as linked |
| Unknown source terminology (B25, B28, B29) | Retain original wording and mapping status; never claim a validated mapping where confidence is low | Unmapped medicine/allergy stays visible and doesn't generate false negative safety output |
| Signed/issued record followed by correction (B30–B37) | Preserve exact original artifact/hash/version and link amendment/new issue | Integrity verification detects mutation; old version reconstructs exactly |
| Stock/financial values (B20, B23, B27, B33) | Ledger movements and immutable issued snapshots are authoritative; balances are projections | Retry/reversal/reconcile/duplicate webhook and concurrent mutation tests produce exactly one effect |

## 6. Explicit source-to-target limitations
- This maps every major field family called out in the B17–B38 research addenda, but it does **not** enumerate every individual column in every underlying vendor table. Any implementation-target field not listed here must be backed by another pinned source extraction or explicitly marked as a ClearFlow candidate.
- Open Dental's full schema docs are deeper than API docs. Several B27 rows are API-field families, not full DDL. A later schema pass should pin a release/commit, record all exact column names/type/nullable/default/index/relationship/enum, and distinguish fields actually observed from inferred candidates.
- Open Dental LabCases/Laboratories API extraction remains unverified; laboratory product/material/shade fields cannot be called confirmed API columns without a directly verified source.
- FHIR/ABDM profile maps must be validated against the official published package at integration build time. Do not infer compliance from resource name similarity.
- Legal source fields are product requirements only after the target clinic's legal applicability and professional interpretation are approved. NDC public notices in B37 are included with current dates and exact source PDFs.
- Prototype fields are recorded from live Appwrite metadata and backup code, but no live patient rows were queried and no cross-tenant runtime attack test was run. See IMPLEMENTATION_GAP_REVIEW.md.

**Decision:** This file closes an important part of source-to-concept tracing, but completion of all physical-column mappings remains contingent on pinned full-schema extracts, real source fixtures and clinical/legal owners.


## 7. Official India operational sources added in B38

### 7.1 Dental X-ray equipment and radiation safety
| Source evidence | Candidate field group | Normalization/lifecycle/security rule | Test/status |
|---|---|---|---|
| AERB FAQ says registration for operation of dental X-ray equipment is mandatory; AERB guide documents eLORA workflow; national categories and shielding considerations differ across intra-oral, OPG and CBCT | Device/equipment identity, modality/category, manufacturer/model/serial, origin, location/room, registration application/ID, authority, certificate/hash, issue/expiry/status, maintenance/QC/decommission events, operator/training records when applicable | Device registration is distinct from facility registration. Preserve source and verification time. The 2019 process screenshots are not treated as current UI specification; configure requirement by reviewed current device category. Restrict occupational-monitoring records | Unverified required registration blocks compliance-cleared status; old device history remains after replacement. Current device-specific regulatory review pending |
| Open Dental/DICOM image provenance patterns (B36) linked with AERB device context | Source device ID, acquisition time, modality, image study/series/instance IDs when present | Never infer device serial or acquisition time from import. Original image distinct from processed rendition | Image import with missing DICOM/device metadata must retain missingness and source |

### 7.2 Biomedical-waste authorization and collection
| Source evidence | Candidate field group | Normalization/lifecycle/security rule | Test/status |
|---|---|---|---|
| CPCB/DGHS-hosted June 2018 healthcare-waste guideline describes authorization for non-bedded healthcare facilities and state Pollution Control Board/Pollution Control Committee role; current Rules/state directions require confirmation | Facility waste authorization/category/activity, authority, application/issue/renewal dates and status, CBWTF/operator link, waste stream/category under applicable version, collection/manifest/receipt, quantity/unit, handover actor/time, treatment/disposal evidence, incident/corrective action | Guideline date and subordinate status must be preserved; do not hard-code 2018 process as the full 2026 Telangana legal rule. Vendor authorization != per-pickup proof. Avoid unnecessary patient identifiers in manifests | Expired or unverified authorization flagged; schedule ≠ pickup; old pickup/authorization remains after provider replacement. Current TSPCB review pending |

### 7.3 Facility standards checklist
| Source evidence | Candidate field group | Normalization/lifecycle/security rule | Test/status |
|---|---|---|---|
| Government-hosted national dental-clinic minimum-standards template references service category, in-charge dentist credential, hours, infrastructure, fee display, safety signage, rooms, human resources and equipment | Facility category/scope, standard/template ID/version, checklist item, applicable/not applicable with reason, evidence, reviewer, verified time, deficiency/remediation/closure | Treat national template as reference unless current Telangana applicability is confirmed for a given facility category. Separate claimed, uploaded, verified, not-applicable and deficient states | Standard version change preserves old evidence and review result; clinic category/obligation mapping remains regulatory-review pending |

### 7.4 GST tax invoice and bill of supply
| Source evidence | Candidate field group | Normalization/lifecycle/security rule | Test/status |
|---|---|---|---|
| CBIC Rule 46 page identifies supplier legal name/address/GSTIN, unique serial number per financial year, issue date, recipient particulars, HSN/Accounting Code, description, quantity/unit for goods, supply value and additional applicable tax particulars; bill of supply has a distinct definition/particulars | Issuer/recipient legal identity snapshots, GSTIN/UIN if applicable, document type, fiscal-year serial series, issue date, goods/service code system/version/code, description, quantity/unit where applicable, discount, taxable basis, tax components, place-of-supply and reverse-charge fields where applicable, rendered snapshot/hash, credit/debit-note link | Tax invoice, bill of supply, advance receipt, payment, credit/debit note and refund are distinct objects. Keep an effective-dated tax adapter and professional-approved clinic-specific rule; no generic dental tax rate is inferred | Concurrent numbering collision prevented; issued artifact immutable; correct document type rendered; exact clinic/service taxability remains tax-professional review pending |

## 8. Cross-domain mappings retained without forced merge
- Facility registration, individual dentist credential, dental-mechanic credential and device registration are separate entities with separate authorities and lifecycle.
- A dental X-ray image is a media asset; device registration is regulatory metadata; the image is not evidence that the device registration remains valid.
- Waste authorization belongs to the facility/regulated activity. A pickup event has a separate recipient/operator and proof of handover/treatment.
- Tax invoice and bill of supply are different document types; both link to financial service/line data but do not collapse to the payment receipt or clinical service.
- A national standard checklist is not itself a certificate and cannot automatically assign legal obligation without jurisdiction/category mapping.
