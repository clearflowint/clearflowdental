# ClearFlow Dental Clinic — Project Notes & Unstructured Research Findings

**Status:** Active evidence notebook; not the final canonical schema. Keep appending findings as research continues. No business rule is to be invented merely to fill a gap.

## Product intent and non-negotiables

ClearFlow Dental Clinic needs a complete enterprise-grade dental domain model. A simple mobile-first interface is not a reason to omit backend fields, relationships, history, compliance evidence or operational controls. The AI is meant to perform structured data entry and business operations that staff perform in conventional dental software: understand natural-language intent, retrieve authorized context, map documents/conversation to typed fields, resolve known identifiers, detect ambiguity, validate and propose operations, request missing details or confirmation, execute through trusted deterministic functions, and verify actual outcomes.

AI must not have unrestricted direct write/delete authority. Deterministic Python/Windmill functions enforce schema validation, business rules, permissions, tenant boundaries, transactionality, idempotency and result verification. Background reads and bounded background tasks are acceptable. Consequential writes require approval according to operation policy. Use deterministic code whenever generative reasoning is not genuinely needed to reduce cost, latency and variability. The frontend is mobile-first, card-based, task-oriented and has no horizontal scrolling; simplify interaction, not the data model.

Product is the primary boundary. Tenants and identities are product-scoped. Never trust a client-supplied tenant ID without resolving it through trusted authentication/authorization. Reference repositories are research sources, not code to copy without a separate license review.

## Research method

Inspect source DDL/ORM models, migrations, service/workflow code, permissions, transaction boundaries, events, idempotency, official documentation, interoperability standards, tests and license/maturity. For each candidate entity/field record source URL and pinned version, exact name/type/nullability/default, PK/FK, checks/unique/indexes, meaning, lifecycle, tenant scope, sensitivity, provenance, history, adoption decision and rationale. Label source facts, interpretations and ClearFlow proposals separately.

Keep distinct: authoritative fact; current-state projection; derived value; historical snapshot; external-source value; AI suggestion; user-confirmed fact; immutable evidence/audit event. JSON is appropriate for raw payloads and extension metadata, but should not hide core fields needed for joins, integrity, permissions, lifecycle or reporting.

## Reference systems and observed evidence

### Open Dental — strongest dental-specific breadth reference
Official data dictionary: https://www.opendental.com/OpenDentalDocumentation26-2.html
Official references: https://www.opendental.com/site/apitreatplans.html ; https://www.opendental.com/site/apipayments.html ; https://www.opendental.com/site/apiclaims.html ; https://www.opendental.com/site/apiprocedurecodes.html
Use for broad discovery across patients, family/guarantor relationships, scheduling, providers, operatories, tooth/procedure history, procedure-code catalog, treatment plans, insurance estimates/claims, payments, adjustments, documents, recall, prescriptions, lab cases, communications and audit. Proprietary system: documentation/reference use is separate from code reuse. Continue field-level review of high-risk domains.

### OpenEMR — mature general EHR and practice-management reference
Repository: https://github.com/openemr/openemr
Table-by-table export documentation: https://github.com/openemr/openemr/tree/master/Documentation/EHI_Export/docs/tables
The main SQL file is very large; table-specific EHI documentation is practical for targeted review. GPL license means reference-only unless legal review approves reuse.
Inspected table docs include patient_data, form_encounter, billing, ar_activity, ar_session, lists, insurance_data, contact, contact_relation, contact_telecom, contact_address, addresses, person, person_patient_link, notification_settings, notification_log, automatic_notification, rule_reminder, rule_action, rule_filter, esign_signatures, document_template_profiles, patient_access_onsite, uuid_mapping and uuid_registry.
Findings:
- Contact relations can encode relationship/role, active period, priority, primary/emergency flags, authority to make medical decisions and permission to receive medical information, plus notes and creator/updater metadata.
- Telecom/address entries support multiple ranked values, primary selection, active periods, inactivation reasons and audit fields. One phone/email/address field on the patient is not enough for all enterprise cases.
- Person identity can be separated from patient identity and linked with linked date/by, link method (manual, auto-detected, migrated, import), notes and active flag.
- E-signatures can record signed target table/row, signer, timestamp, lock/amendment, signed-data hash and signature hash. Preserve exact signed version/artifact rather than only a signed boolean.
- Notification logs preserve message content, channel/provider-related metadata, appointment/patient context, scheduled event date/time and actual send time. Separate communication intent, attempts, provider receipt and final delivery state.
- UUID mapping/registry supports durable external resource IDs and import/export mappings.
- Clinical rules are decomposed into filters, actions and reminders; consider rule versions, execution results and evidence.
- Portal credentials belong in a separate auth surface, not ordinary patient demographic payloads.

### DentalPin — modern modular dental reference; commercial-use limitation
Repository: https://github.com/dentalpin/dentalpin
Inspected models/migrations/workflow docs across patients, patients_clinical, medical_reference, agenda, odontogram, treatment_plan, catalog, budget, billing, payments and clinical_notes. Its BSL 1.1 license contains a commercial SaaS restriction that may apply when the service's primary value derives substantially from DentalPin; reference only until legal review.
Core/tenant findings:
- Clinics, users, memberships, roles, permissions, role-permission mappings, module-default permissions, clinic overrides and refresh-token rows are separate entities.
- Membership role and professional/agenda eligibility are distinct. An administrator can also be a treating professional.
- Clinic timezone and ISO currency are explicit configuration, not server-locale assumptions.
- Refresh-token family and per-token revocation are separate; token version can support global revocation.
- Permissions are granular. Medical history has stricter access than ordinary demographics.
Patient/medical findings:
- Patient fields include name, phone/email, DOB, status, do-not-contact, gender, national identity type/value, profession/workplace, language, address, photo URL, plus billing name/tax ID/address/email.
- Billing identity may differ from patient identity; invoice identity is snapshotted so later patient edits do not rewrite history.
- Patient archival is soft and restorable; clinical/financial history must not be orphaned.
- Medical JSON blobs were normalized into medical context, allergies, medications, systemic diseases, surgical history, emergency contact and legal guardian.
- Medical context includes pregnancy/lactation, anticoagulants/medication/INR/date, smoking/alcohol, bruxism, anesthesia adverse reactions/details, last-updated time/by.
- Allergy records have name/type/severity/reaction/notes/reference/status; medication records name/dosage/frequency/start date/notes/reference/status; systemic disease records type/diagnosis date/controlled/critical flags/medication notes; surgery records procedure/date/complications/notes.
- Reference catalogs include allergies, medications, diseases, surgeries, medication-medication interactions and disease-medication contraindications. Retire references rather than erase items used in historical records.
- Some optional-module reference IDs intentionally have no database FK to preserve modularity; this trades away referential integrity and must be a deliberate decision.
- Do-not-contact must suppress recall/outreach. A single boolean may be insufficient for channel, purpose, consent/legal basis, evidence and timestamp.
Dental anatomy/treatment:
- Tooth records capture patient, FDI tooth number, dentition type, general condition, per-surface JSON state, notes and orthodontic displacement/rotation. Unique patient+tooth.
- A treatment is one clinical act and may affect one or many teeth, whole mouth or arch. Fields include clinical type/scope/arch, catalog link, planned/performed status, recorded/performed time, performer, price/duration/tax snapshots, budget-item link, notes, source module and soft-delete time.
- Treatment-tooth children capture tooth, role (e.g. bridge pillar/pontic) and surfaces. Avoid assuming one procedure equals one tooth.
- Odontogram history stores change type, surface, old/new condition, note, actor and timestamp. Current state alone cannot explain clinical history.
- Scope checks constrain allowed values and require an arch for global-arch scope; cardinality rules may need transactional validation or DB triggers.
- Both tenant and patient IDs on a row do not prove they refer to the same tenant; enforce cross-tenant integrity.
Treatment plans:
- Plan header includes clinic/patient, plan number/title, status, closure reason/note/time, confirmed time, optional one-to-one budget, assigned professional, creator, diagnosis/internal notes and deletion time.
- Documented states include draft → pending → active → completed → archived, plus closed with a reason; reactivation to draft is allowed by documented workflow.
- Plan items link treatment uniquely to plan, have order/status, completion without appointment, completed time/by, assigned professional snapshot and notes.
- Planned item sessions represent billable/executable steps with sequence, label, amount, status, completion metadata and notes. Catalog session templates are copied at plan creation; catalog edits do not rewrite existing plans. Completed session label/amount are immutable.
- Plan-level clinician reassignment does not automatically cascade to every item unless explicitly requested. Such lifecycle rules belong in a rule catalogue.
- Clinical act, plan item, appointment and charge are related but not identical. Review whether ClearFlow needs flexible relationships where a finding is handled by multiple plans/episodes.
Catalog/pricing:
- Categories are hierarchical, localized, clinic-owned and ordered. Catalog items include internal code, category, localized names/descriptions, default price/cost, duration, appointment requirement, tax type, pricing strategy/config, tiered surface prices, scope, diagnostic flag, surface requirement, billing mode, material notes and active/system/deleted flags.
- Strategies include flat, per-tooth, per-surface and per-role pricing; support multi-session templates.
- Catalog session amounts must sum to item price within documented tolerance; plan instances snapshot sessions.
- VAT/tax is centralized and historical rates are versioned. One inspected VAT rate uses float even though prices use NUMERIC; ClearFlow should use exact decimal for money/rates.
- Catalog seed must be idempotent. System item identity fields may be locked while clinic-owned prices/names/tax/duration can be overridden.
- Distinguish omitted field from explicit null for fields that can be cleared. Soft-deleted catalog codes may be reused under a partial unique index; policy requires an explicit decision.
Billing/payments:
- Invoice series holds clinic, prefix/type/description/current number/year-reset config/active/default. History stores changes, actor, prior/new state and notes.
- Invoice snapshots patient/billing identity, number/series, budget, credit-note reference, status, issue/due dates, terms, subtotal/discount/tax/total NUMERIC, currency, notes, compliance metadata, document hash/previous hash, creator/issuer and deletion time.
- Paid/balance values are derived from payment records rather than competing mutable invoice authorities.
- Payment is gross patient cash-in with clinic/patient, exact amount, currency snapshot, method/date/reference/notes/idempotency key and recorder. Methods include cash, card, bank transfer, direct debit, insurance, UPI, netbanking and other.
- Payment allocations split one receipt across budgets or on-account credit. Target-type/ID consistency is checked and allocation sum must equal payment amount; budget must belong to same clinic.
- Refund is a separate reversal record; cumulative refunds cannot exceed payment. Refund method can differ from original method; reason, actor/time are preserved.
- Idempotency key is unique per clinic. Workflow handles concurrent retry via DB uniqueness/savepoint, not only a pre-check.
- Payment history stores old/new state and actor. Events are published transactionally so downstream billing failure rolls back the payment.
- Invoice-payment bridge belongs to billing to avoid circular module dependency; modules coordinate through transactional events.
- Reports include patient ledger, aging, collection method/provider and refund reporting. Some agent tools intentionally omit receivable/balance outputs; tool exposure should be permission/context-specific, not a mirror of every query.
- Check allocation reallocation history, credit-note rules and local legal numbering.
- OpenDentist's simpler amount_paid field and floating-point amounts are not an enterprise financial reference.

### LibreDental — supplemental schema/migration reference
Repository: https://github.com/Cojekt/LibreDental
Inspected SQLite patients/clinical/billing/providers schema and migration. Verify current LICENSE before relying on earlier indication of Apache-2.0.
- Patient has preferred name, DOB, sex, contact, emergency contact, guarantor, insurance/subscriber, reminders, preferred provider, referral source, address, medical alerts/allergies JSON, notes, version and status.
- Appointment has patient/provider/operatory, start/end, status, reason/notes, timestamps and version; indexes by patient, provider+start, operatory+start and date interval.
- Dental condition has patient/tooth/surfaces JSON, ADA code, description/status/fee, optional insurer and pricing-source metadata.
- Claim header contains patient/provider/appointment, insurer/policy/group, date of service, status, notes, JSON line items and payer ID. Compare with normalized service lines, diagnosis, adjustments and adjudication entities.
- Payments use integer minor units and may link to claim; define currency exponent rather than assuming all currencies have two decimals.
- Procedure code uses country+code composite key. Fee schedule has provider-level and practice-level overrides through partial unique indexes.
- Provider has role/specialty/license/contact/hourly rate/NPI/taxonomy. Timecards snapshot hourly rate, track clock-in/out and minutes/pay, and allow only one active clock-in via partial unique index.
- Version fields suggest optimistic concurrency for stale updates.

### DentalERP — broad India-oriented discovery source
Repository: https://github.com/abinauv/dental-erp
Prisma schema: https://github.com/abinauv/dental-erp/blob/main/prisma/schema.prisma
At inspection the schema declared 81 models. Candidate domains include patients, appointments, treatment plans/items, dental chart entries, medical history, invoice/items, payments, insurance/claims/preauthorization, inventory batches/stock movements/purchase orders, lab orders/history/documents, sterilization, communications, payment plans/schedules, forms/submissions, AI conversation/skill execution logs, data-import jobs and audit logs.
Use as breadth checklist, not proof of enterprise integrity. Audit relations, unique/check constraints, tenant enforcement, transaction services, history and tests. Validate India-specific GST, numbering, payer/TPA, UPI/bank/card reconciliation, prescriptions, privacy/consent, professional registration and retention against current official sources.

### OpenDentist — early/small feature reference
Repository: https://github.com/clawnify/OpenDentist
Inspected schema: https://github.com/clawnify/OpenDentist/blob/master/src/server/schema.sql
Observed patients, appointments, providers, treatment plans, invoices, payments, insurance plans, lab cases, recall items, waiting lists and appointment blockouts. The reviewed invoice uses amount_paid and floating-point values; it is a feature-discovery source, not a complete financial design. Verify license and maturity before reuse.

### Other candidates
- ROLA Dental: https://github.com/manfares/rola-dental — Go/Vue/Postgres/Redis, RLS and audit concepts; reported alpha/not production-ready.
- GNU Health dentistry: https://www.gnuhealth.org/
- Official standards to validate: FDI tooth notation; ADA CDT where relevant/licensed; SNODENT; ICD-10/ICD-11 where relevant; HL7 FHIR; DICOM where relevant; ISO 8601; ISO 4217; country-specific invoicing/privacy/consent/prescription rules.

## Full candidate domain inventory

### Tenant, clinic and people
Product/tenant, legal entity, branches/locations, operating hours, timezone/locale/currency/country, tax/billing settings, departments, chairs/operatories, rooms/equipment/resources; users/auth identities, memberships, professionals, specialties/credentials/licenses, assistants, contractors, roles/permissions/grants/overrides, service identities, working hours/leave/timecards; tenant lifecycle, suspension, closure, export and retention.

### Patient identity and contacts
Patient/MRN/local number, identifiers by type/issuer/country, external IDs, match/merge candidates and merge history; legal/preferred name, DOB/precision, clinically/legal relevant demographics, language and accessibility; multiple phone/email/telecom records with type/use/rank/verification/consent/period; multiple addresses with type/use/period/history; guardian, guarantor, family, caregiver, emergency contact, billing party, parent/minor and medical decision authority with validity dates/evidence; referral source, communication preferences, channel/purpose opt-outs, portal/proxy access and revocation.

### Clinical record and safety
Medical context/history, conditions/diseases, allergies with severity/reaction/source, current/historical medications with dose/route/frequency/start/end/prescriber, surgery history, pregnancy/lactation, anticoagulants/INR, anesthesia risks, smoking/alcohol and vitals where needed; versioned medical reference catalogs, medication interactions and contraindications with authority/review date; odontogram and tooth/surface history; periodontal chart with probing depth, recession, bleeding, mobility, furcation, plaque/calculus, gingival margin/attachment level, indices and exam/provider; diagnoses/findings/differential/rationale/severity/onset/location/evidence; clinical notes/templates/attachments/author/signature/attestation/amendment/addendum/lock/correction; encounter/visit with reason/history/exam/diagnosis/procedure/medication/instructions/follow-up; imaging/radiographs/photos/scans/DICOM object refs/acquisition metadata/location/series/annotations/report/hash; prescriptions, pharmacy, dose/route/frequency/duration/refills/transmission/cancellation/acknowledgement/allergy check/signature; forms/questionnaires/templates/submissions/answers/scoring/signature/version; alerts, review acknowledgements, incidents/adverse events.

### Consent, privacy, signatures and governance
Consent type/purpose/version/language/patient or representative/signer capacity/method/witness/time/expiry/revocation/scope; privacy notice/legal basis where applicable; e-signatures tied to immutable record version and signed hash; access audit with actor/tenant/patient/record/action/reason/time/outcome/source; append-only history with old/new values/reason/actor/AI source/correlation/import provenance; record-class retention, legal hold, export/redaction/anonymization/erasure request and exceptions; AI suggestions, source evidence, model/provider/version, human approval/rejection and execution outcome. AI confidence is not clinical truth.

### Scheduling and operations
Appointment/status history, patient/provider/operatory/visit type/reason/start/end/timezone/buffer/recurrence/booking source/notes/reminders/confirmation/cancellation/no-show/reschedule reason; provider schedule/leave/holidays, room/equipment availability, blocking events, capacity; appointment-procedure/treatment-plan bridge; waitlist/open slots/recall/overdue recall work/suppression; walk-in/emergency slot/queue/check-in/waiting/roomed/started/completed; notification template/version/channel/provider/attempt/provider ID/accepted/sent/delivered/read/failed/bounced/opted-out/retry/idempotency. Overlap is an interval/concurrency problem, not just unique equal start times.

### Catalog, codes and pricing
Hierarchical categories, localized labels, code system/version/jurisdiction/effective dates/billing eligibility/clinical meaning/required tooth-surface-arch-role/diagnostic/billable/duration; fee schedule by practice/branch/provider/payer/procedure/effective period/currency/source/override precedence; flat/per-tooth/per-surface/per-role/multi-session strategies, materials/lab costs, discounts/packages, tax category/legal note; versioned catalog, retirement, aliases/synonyms/search terms/import mappings and audit; snapshot price/duration/code description/tax/fee at quote, acceptance, service and invoice as appropriate.

### Treatment plans, procedures and laboratory
Plan header/version, items, alternatives, sequence/dependencies, acceptance/rejection/expiry/closure, assigned provider, visits and completion evidence; session templates and immutable completed session snapshots; performed procedure with teeth/surfaces/roles/provider/times/materials/lot/anesthesia/findings/outcome/complication/follow-up; lab case/order/provider/work type/tooth/arch/shade/material/impression/scan/sent/due/received/status history/correspondence/attachments/remake/cost/invoice/QC/acceptance; specialty-specific implant, orthodontic, prosthodontic, endodontic, periodontal and surgical detail where needed; postoperative care and outcomes.

### Insurance and claims
Payers/insurers/plans/policy/member/group/subscriber/relationship/coverage dates/coordination priority; eligibility request/response/time/limitations/exclusions/deductible/copay/coinsurance/annual maximum/source/version; preauthorization request/procedures/diagnoses/attachments/estimate/decision/authorized amount/validity/limitations/status history/correspondence; claim header/normalized service lines/date/provider/code/diagnosis/tooth/surface/fee/allowed/billed/adjustments/attachments/control number/status; submission batch, acknowledgements, rejection, corrected/resubmitted lineage, EOB/ERA/adjudication, denials/appeals/write-offs/patient responsibility; insurer remittance separate from patient receipt, allocated to claim lines and reconciled to bank.

### Financial subledger
Quote/estimate/budget versions and acceptance; service-to-charge; invoice header/lines/tax/discount/deposit/credit note/refund/void/number series; immutable issued document snapshots/hash/issuer; patient receipt/payment method/provider/reference/idempotency; allocation to one/many invoices/charges, on-account credit/reallocation history/refund/reversal; payer remittance, journal postings, adjustments/write-offs, bank/gateway settlement, chargeback/dispute; period close and posting/reversal authority. Exact Decimal/NUMERIC or integer minor units, explicit currency, historical fee/tax snapshots. Do not keep competing mutable totals as authority. Enforce allocation sums, refund caps, same-tenant references, positive/nonnegative values, state transitions, atomicity and concurrency-safe idempotency.

### Inventory, procurement and sterilization
Items/SKU/UOM/batch/lot/expiry/serial/storage/supplier/reorder threshold/regulatory status; immutable stock movement for receipt/use/waste/transfer/return/correction with quantity/cost/source/actor/reason; purchase requisition/order/vendor/lines/ordered/received quantities/tax/price/delivery/invoice/payment matching; material/lot linked to treatment where traceability required; sterilization cycle/instrument/equipment/load/operator/indicators/test/start/end/release/failure/maintenance/calibration/patient-procedure traceability. Balance is a projection over movement evidence.

### Documents, communications, integrations and imports
Document metadata/object URI/MIME/size/hash/owner/classification/consent/uploader/source/version/signature/retention/access audit; communication templates and versions, inbound/outbound messages, channel/participants/purpose/content/attachments/provider IDs/attempts/delivery; external ID mappings by system/resource/local entity/sync/error/idempotency/reconciliation; import jobs/source/upload hash/mapping/dry-run/row outcomes/duplicate candidates/errors/approver/commit summary; event outbox/inbox/webhooks/retries/dedupe/callbacks/dead-letter/replay; rules with trigger/filter/action/version/execution log/output/review.

### AI and deterministic execution
Conversation/session metadata separate from clinical record; actor/tenant/channel/context/source refs/retention; typed intent/operation request and schema version; missing-field prompts, validation errors, matched records and ambiguity candidates; proposed changes/diffs/evidence, approval/rejection actor/time; execution function/version/idempotency/correlation/start/end/status/input hash/result refs/validation/errors/retries/verified outcome; model/provider/version/token/cost/latency; privacy-aware prompt/PHI minimization. Tool catalog exposes approved operations and narrow DTOs. Never invent IDs, diagnoses, rules, prices or successful writes.

## Cross-cutting lessons

1. Patient is more than name/phone: contacts, historic addresses, guardians/guarantors, decision authority, language and consent can be independent/time-bound.
2. Current odontogram is not clinical history; retain observations and old/new changes with author/time.
3. A procedure can affect multiple teeth or a whole arch/mouth; model explicit relationships and roles.
4. Plan, clinical act, appointment and charge are different objects and have separate lifecycles.
5. Snapshots preserve historical truth when patient/catalog/tax/provider data changes.
6. Gross payment, allocation, on-account credit, invoice allocation, insurer remittance, refund and adjustment are distinct.
7. Cross-module events that affect financial consistency need transactionality or a reliable outbox/reconciliation design.
8. Idempotency must be safe under concurrent retries, not only preflight queries.
9. Tenant ownership is relational: composite FKs/unique keys and DB policies are safer than trusting repeated tenant IDs.
10. Sensitive clinical, signature, portal, financial and AI data require separate permissions/audit.
11. Soft delete is not universal; choose archival, amendment, reversal or erasure per record class and legal requirements.
12. Every status needs a transition matrix, allowed actors, required fields, side effects and reversal behavior.
13. JSON should not hide entities needed for joins, integrity, authorization, lifecycle and reporting.
14. Clinical/billing codes are jurisdiction/version-aware; preserve the code meaning used at service time.
15. Frontend must not be the rule engine; validation, pricing, scheduling, permissions and financial integrity execute in trusted services/DB.
16. A huge schema alone does not create AI capability. Field semantics, populated data, provenance, approved operation contracts and explicit confirmation policies do.

## Preliminary design hypotheses — not approved
- Normalized relational tables for first-class clinical, financial, scheduling, insurance, lab, inventory, consent and audit entities.
- Immutable internal IDs plus human-friendly clinic-local identifiers.
- Tenant context on owned records and same-tenant composite relationships.
- Exact numeric money/rates, explicit currency and timezone.
- Current-state projection separated from append-only events/history; corrections/amendments/reversals preserve original evidence.
- External ID mapping for import/export/interoperability.
- AI operation logs separate from clinical record and linked to evidence/results.
- Transactional outbox/inbox and idempotency for external integrations.
- Raw source payload supplemental to typed canonical fields.
- Schema/business rules versioned and controlled by ClearFlow; AI cannot implicitly alter schema.

## High-priority open questions

**Security/tenant:** classify global reference data vs tenant catalogs; enforce same-tenant FKs everywhere; decide Appwrite permissions vs trusted Windmill authority; scope/revoke service identities; field-level clinical restrictions.

**Clinical:** tooth notation and vocabularies; mixed dentition/implants/pontics/edentulous/supernumerary teeth; periodontal structure/units; code systems and licensing; uncertain/provisional/corrected diagnosis; note signing/amendment; prescription rules and clinician review.

**Scheduling:** interval overlap under concurrency; recurrence/time zones/DST; booking-to-completion status transitions; recall calculations and suppression; consent-aware notifications and delivery retries.

**Financial/payer:** India tax/invoice/credit note rules; rounding/currency policy; allocation/reallocation; claim adjudication/remittance granularity; reconciliation/chargeback/dispute; period close and reversal permissions.

**Operations:** inventory lot/expiry/material traceability; lab remake/QC/cost; sterilization traceability; HR/timecard scope; document retention/signature; import/export/patient merge; reporting/event retention.

**AI:** operation schemas and confirmation thresholds; role requirements; provenance without treating confidence as truth; timeout/unknown write outcomes; PHI minimization/provider terms; deterministic Python coverage and cost per completed operation.

## Next batches — continue without prematurely finalizing
1. Systematically enumerate Open Dental data dictionary tables/fields and inspect treatment plans, procedures, claims, payments, insurance, scheduling, recall, lab, imaging, prescriptions and audit.
2. OpenEMR: inspect clinical forms, medication/prescriptions, procedures, billing/AR, insurance/claims, documents/signatures, contacts, rules, audit, portal and interoperability; compare schema with service behavior.
3. DentalPin: budget lifecycle, agenda conflict checks, clinical note signature/attachments, patient merge/import, prescriptions, document/media, recall, inventory/lab, audit and event/outbox rules. Record shortcomings too.
4. LibreDental: verify LICENSE; complete schema/migration/tests, especially claims/insurance/inventory.
5. DentalERP: map all model relationships, tenant boundaries, constraints, services, audit and AI logging; distinguish field breadth from proven maturity.
6. OpenDentist/ROLA: verify license, tests and maturity.
7. Official interoperability and India jurisdiction sources: FHIR, terminology, tax, privacy, consent, prescriptions and professional obligations.
8. Produce source comparison matrix and entity catalogue with evidence.
9. Produce field-by-field candidate schema: type/nullability/default/PK/FK/check/index/lifecycle/provenance/sensitivity/rationale.
10. Produce relationship and tenant-isolation diagram, state matrices, business-rule catalogue, transaction/idempotency model and AI operation contract.
11. Only after review, create canonical migrations, seeds, deterministic operation implementations and adversarial tests.

## Evidence limitations
This notebook preserves research collected so far; it does not claim every table in each system has been inspected. Pin source commits/releases before formal comparison. Reverify paths, licenses, service behavior and country-specific requirements. Do not call a candidate a legal requirement without authoritative jurisdiction evidence. Do not infer production maturity from README or model count. Keep assumptions visible as open questions.

## Source index
- Open Dental data dictionary: https://www.opendental.com/OpenDentalDocumentation26-2.html
- Open Dental treatment plans: https://www.opendental.com/site/apitreatplans.html
- Open Dental payments: https://www.opendental.com/site/apipayments.html
- Open Dental claims: https://www.opendental.com/site/apiclaims.html
- Open Dental procedure codes: https://www.opendental.com/site/apiprocedurecodes.html
- OpenEMR EHI docs: https://github.com/openemr/openemr/tree/master/Documentation/EHI_Export/docs/tables
- OpenEMR: https://github.com/openemr/openemr
- DentalPin: https://github.com/dentalpin/dentalpin
- LibreDental: https://github.com/Cojekt/LibreDental
- DentalERP schema: https://github.com/abinauv/dental-erp/blob/main/prisma/schema.prisma
- OpenDentist schema: https://github.com/clawnify/OpenDentist/blob/master/src/server/schema.sql
- ROLA Dental: https://github.com/manfares/rola-dental
- GNU Health: https://www.gnuhealth.org/

**Rule for every batch:** preserve findings here first, continue research, and do not declare the schema complete until source comparison, field inventory, relationships, constraints, lifecycles, permissions and open questions have been reviewed.
