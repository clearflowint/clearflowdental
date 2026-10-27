# ClearFlow Dental Clinic — Project Notes & Enterprise Research Notebook

**Last updated:** 2026-10-27  
**Status:** Living research notebook; source observations and design questions, not a final schema.  
**Repository reset:** At the user's request, the existing working files on main are being replaced by this notes file. A backup branch named backup/before-project-notes-reset-2026-10-27 preserves the previous application tree.  
**Research preservation:** Full long-form notes remain preserved in the workspace as ClearFlow_Dental_Enterprise_Schema_Research_Dossier.md and ClearFlow_Dental_Enterprise_Schema_Research_Batch_01.md. This notebook consolidates their findings for the repository. Continue appending new batches; do not overwrite earlier evidence.

---

## 1. Product intent and principles

ClearFlow Dental Clinic is a multi-tenant dental clinic SaaS. The user interface should be mobile-first, task-oriented, conversational and easy for clinic staff. That simplicity must not be obtained by reducing backend data coverage, history, relationships, controls or transactional safety.

The product goal is for AI to act as a competent structured-data operator: understand instructions and source documents, retrieve relevant context, extract candidate fields, validate constraints, detect ambiguity/conflict, ask questions and call deterministic business operations. The system—not probabilistic language generation—must own tenant authorization, validation, accounting, clinical-state transitions, concurrency, audit, idempotency and durable writes.

Operating principles:
1. Preserve justified enterprise domain breadth before narrowing the UI.
2. Research schemas, migrations, API contracts, application services, lifecycle rules and tests—not just product feature lists or table names.
3. Label observed source facts, interpretations, ClearFlow recommendations and unresolved questions separately.
4. Do not invent clinical, operational, fiscal or legal rules. Record jurisdiction and authoritative source.
5. Separate current state from immutable history; original payload from normalized facts; planned care from performed care; estimates from issued fiscal documents; payments from allocations and refunds.
6. Use relational constraints where they can enforce correctness. Service validation supplements rather than replaces database guarantees.
7. Use exact decimal/minor-unit representations for money, explicit currency and effective-dated pricing/tax rules.
8. AI proposes and interprets; deterministic code validates and executes. Privileged/destructive actions require appropriate authority and, where configured, explicit human confirmation.
9. Every AI-assisted write should retain the supervising user, source request/artifact, extraction/model version, candidate changes, validation results, approval, idempotency key, result and failure/correction history.
10. Public repositories are domain references by default, not code to copy. Review licence, terms, maturity, security and fit separately.

## 2. Architecture assumptions (not all final)

- Deployment goal: multi-tenant SaaS.
- Backend exploration: Appwrite for app data/auth/platform; Windmill/Python for deterministic business functions and jobs; n8n for integrations/communications/schedules; provider-neutral AI adapter/LLM gateway.
- Python should perform deterministic work whenever possible to reduce cost, latency and unnecessary model use.
- AI handles natural-language interpretation, extraction and dialogue. Deterministic services own calculations and validated execution.
- The front end should not own business calculations; it should display canonical saved state and deterministic projections.
- Data tenancy, transaction support, backup, migration, access policies, query capability and vector storage must be tested before finalizing backend choice.
- Mobile-first: no horizontal scrolling; focused cards and task flows are fine, but they should not eliminate backend detail.
- Interoperability should use explicit mappings/adapters for FHIR/vendor/country APIs, rather than forcing every internal table into an external resource shape.

## 3. Reference systems inspected

### Open Dental
Official, versioned dental-practice data dictionary; primary established dental reference for treatment plans, procedure codes, payments, claims, recall, charting, scheduling, imaging, labs and operations. Confirm the documented version before finalizing a field inventory. The checked-in source repository LICENSE is GNU GPL version 2; this corrects the earlier shorthand that described the source as proprietary. The terms of the official documentation/API materials are a separate question. Do not assume source-code or documentation reuse rights without reviewing the applicable terms.
- Main data dictionary: https://www.opendental.com/OpenDentalDocumentation26-2.html
- Treatment plans: https://www.opendental.com/site/apitreatplans.html
- Payments: https://www.opendental.com/site/apipayments.html
- Claims: https://www.opendental.com/site/apiclaims.html
- Procedure codes: https://www.opendental.com/site/apiprocedurecodes.html

### OpenEMR
Mature EHR/practice-management reference with a broad current EHI-export table dictionary and application services. Useful for identity/contact graph, encounters/forms, orders, observations, claims and AR activity, prescriptions, documents/signatures, access controls, notifications, audit and exchange identifiers. GPL-licensed; reference by default unless code reuse is separately approved.
- Repository: https://github.com/openemr/openemr
- Table dictionary: https://github.com/openemr/openemr/tree/master/Documentation/EHI_Export/docs/tables
- Exact schemas inspected include patient data, encounter, SOAP notes, vitals, observations, questionnaires, forms, appointments, patient-flow tracker, claims, AR activity/sessions, contact graph, notification logs/settings, signatures, document-template profiles and UUID mappings/registry.

### DentalPin
Modern modular dental application using PostgreSQL, SQLAlchemy/Alembic and distinct modules. Useful for implementation-level state machines, idempotency, event behavior, snapshots, payments, odontogram scope, multi-session care and fiscal-compliance hooks. Its BSL 1.1 licence has a commercial-use restriction relevant to dental-clinic SaaS; treat as research only unless a suitable separate licence is obtained.
- Repository: https://github.com/dentalpin/dentalpin
- Modules inspected: patients, patients_clinical, medical_reference, agenda, odontogram, treatment_plan, catalog, budget, billing, payments, clinical_notes, media/documents, India GST and Veri*Factu.

### LibreDental
SQLite/Go dental project, useful for country-scoped procedure codes, practice/provider fee overrides, insurance/subscriber data, appointments, claims/payments and reminder migrations. Its maturity is that of an early implementation; use for concept discovery, not as a proven enterprise reference.
- Repository: https://github.com/Cojekt/LibreDental
- Inspected patient, clinical, billing and provider schemas and migrations for clearinghouse IDs, reminders, reminder retries and payer-specific fee overrides. Re-check its current licence and maturity before any reuse.

### DentalERP
MIT licence stated in its package/license. Its Prisma schema declares 81 models and offers broad feature discovery: hospital/tenant, users/staff, appointments/reminders, medical history, dental chart, treatment plans/procedures, prescriptions, invoices/payments, insurance/preauthorization, inventory/purchase orders, labs, communications/CRM, sterilization, devices, audit, forms, imports and AI task/insight records.
- Repository: https://github.com/abinauv/dental-erp
- Schema: https://github.com/abinauv/dental-erp/blob/main/prisma/schema.prisma
- Broad coverage is not proof of design correctness; cross-tenant relationships, JSON claim details, duplicated balances/stock and audit/source history require further inspection.

### OpenDentist
MIT-licensed, smaller React/Hono/Cloudflare D1 project. Its DDL includes operatories, practitioners, treatment types, patients, appointments (including break/lunch/block), plan items, clinical notes, tooth conditions, invoices/items, waiting list, insurance plans, lab cases and appointments-to-make/recall.
- Repository: https://github.com/clawnify/OpenDentist
- Schema: https://github.com/clawnify/OpenDentist/blob/master/src/server/schema.sql
- Useful for spotting UX/features, but not an enterprise clinical/financial schema. It uses REAL for fees/balances, invoice-header amount-paid, simple plan items and basic patient safety fields.

### Standards and jurisdictional workstream
- FHIR: https://hl7.org/fhir/
- Code systems/terminology data need explicit version and licence review.
- India-specific areas to verify with current official sources: GST/e-invoicing, privacy/data protection and consent, clinical-record obligations, ABDM/health-information exchange, gateway/payment records and applicable dental council requirements. Do not set legal dates or retention periods based only on comments inside a repository.

---

## 4. Enterprise domain inventory — preserve breadth

This is a coverage register, not an instruction to put everything in one giant table. Normalize by ownership, cardinality, security, lifecycle and query needs.

### 4.1 Tenancy, facilities and administration
- SaaS tenant/account, clinic/practice, legal entity, branch/location, address, registration/licence IDs, locale, timezone, currency, fiscal settings and working hours.
- User/authentication subject, external identity/provider links, clinic membership, role, permission, grants/overrides, staff/employment profile, clinician qualification/licence/specialty/scope, custom roles, invites and session/refresh-token revocation.
- Keep separate: who can log in, who belongs to a tenant, who is a clinician, who is employed, which role they have, and whether they may perform a specific operation.
- Audit/access event: actor, tenant, action/object identity, before/after changes, occurrence time, request/correlation ID, reason, client/network metadata where justified, source and result.
- Tenant IDs alone are not enough. Parent and child references must be proven to belong to the same tenant using composite keys/FKs, equivalent database enforcement or carefully tested database policies.

### 4.2 Person identity, patient identity and relationships
- Person is not always a patient; patient is not a portal login, guarantor, emergency contact, insurance subscriber or referring clinician.
- Name fields: title, first/middle/last/suffix, preferred/display name, aliases/former names, language, birth/death dates and justified demographic attributes.
- Multiple phone/email channels with use (home/mobile/work), primary/rank, verification, preferred communication, active/inactive period and reason.
- Multiple addresses and address purposes (home, postal, billing, work), rank, effective interval, return/delivery status, normalized components, country and source.
- Identifiers: type, issuer/system, value, validity, verification, provenance, duplicate/merge handling and external-source ID. Do not assume name/email/phone is globally unique; families can share contact details.
- Related-person graph: contact/target, role, relationship, priority, primary/emergency flags, authority to make medical decisions, authority to receive medical information, effective period, status, notes and audit actors.
- Guardian/representative has legal basis, authority scope, identity verification, validity and revocation. Kinship alone is not authority.
- Patient registration fields: clinic-local patient number, referral source/type/identity, registration source, status/archive, do-not-contact and communication preferences.
- Duplicate detection requires candidate clusters, evidence, score/rules, operator decision, merge survivor/source IDs, moved related-record counts, retained identifiers, conflicting values and reversible merge history.
- Portal authentication uses an auth provider and explicit subject→person/patient entitlement, proxy scope, dates and revocation. Do not put portal credentials in the clinical patient row.
- OpenEMR source fields: person title, first/middle/last/preferred names, gender, DOB/death date, language/communication needs, active/inactive reason/date, notes; contact relation roles/authority/effective dates; telecom/address usage/rank/period; person-patient link method; UUID crosswalks.

### 4.3 Patient safety, history and consent
- Structured medical context: conditions/diseases, allergies/adverse reactions/severity/reaction, current/prior medications, anticoagulants and INR/date, pregnancy/lactation where relevant, tobacco/alcohol, bruxism, anesthesia reactions, surgery history, prior dental work, family history, anxiety and last dental visit/review time.
- Separate current patient-reported medication statement, medication reference/catalogue, prescription order, prescription line and medication administration/dispense where in scope.
- Reference catalogues retain codes/system/version/effective period/status; retirement must not erase history.
- Drug-drug interactions and disease-medication contraindications are distinct relations with source/version, severity, evidence and review date. A rule-generated warning is not automatically a confirmed diagnosis.
- Forms: template + version, field definitions, display rules, submitted answers, score/result, patient/encounter association, completion/attestation, signature and immutable submitted snapshot.
- Consent is purpose-specific/versioned: purpose, policy version, legal basis/authority, granted/denied/withdrawn, signer/representative, channel/time, scope, language, evidence, expiry and revocation. Treatment consent, communications, marketing and data exchange are separate purposes.
- Sensitive clinical writes require fine-grained permissions and audit. Each field may need provenance (patient report, staff observation, imported document, prior record or AI extraction), recorded/reviewed by, valid period and uncertainty.

### 4.4 Scheduling, resources and actual encounters
- Appointment, actual encounter/visit, procedure/treatment act, schedule rule, one-off exception, provider availability, leave/holiday, operatory/chair, equipment/resource booking, break/block, waiting list and recall due item are different entities.
- Appointment fields observed: patient, provider, room/cabinet, appointment type/reason/chief complaint, planned start/end/duration, status, confirmation, priority, notes, virtual/video relationship, wait time, checked-in/out/cancelled timestamps and cancellation reason.
- Keep status-event history (from/to, actor/time/note), not only the current status. Patient-flow/room tracker is its own event sequence.
- Prevent interval overlaps, not merely duplicate start timestamps. Validate provider and room/equipment conflicts with concurrency-safe operations. Document double-booking exceptions.
- Date/time: store instants consistently, retain IANA clinic timezone, distinguish local wall-clock values from absolute instants, resolve DST ambiguity and preserve clinic business date for reports/numbering.
- Public check-in tokens need expiry/signature/source claim/rate limits, anti-prefetch behavior, valid time window and the canonical state machine.
- Availability is a deterministic projection from schedules, effective dates, leave, blocks, appointments and resources; it is not a permanently editable fact.
- Reference state set: scheduled, confirmed, checked_in, in_treatment, completed, cancelled, no_show. Allowed transitions must be explicit and tested.

### 4.5 Clinical findings, dental charting and care delivery
- Longitudinal condition/current state differs from a point-in-time finding, assessment/diagnosis, treatment plan and performed clinical act. Preserve the timeline and correction provenance.
- Tooth chart: notation system, tooth number, dentition, general condition, surface conditions, tooth position/rotation/displacement and notes. Identify FDI/Universal/etc.; do not mix notation systems implicitly.
- Treatment act supports single-tooth, multi-tooth, whole-mouth and arch scope. Child rows capture tooth number, role (e.g. bridge pillar/pontic), surfaces and notes. Some treatments have no teeth; some span multiple teeth.
- Odontogram history: tooth/surface, old/new condition, change type, actor/time and reason/source.
- Clinical finding: patient/encounter, authored/effective/recorded times, status, code/system, value/unit, body site/tooth/surface, severity/interpretation, method/source and related questionnaire/imaging/document.
- Notes have type and owner (patient, diagnosis, treatment, plan, appointment clinical/admin), author, date, signed/locked/amended state and attachments. Notes are not the only representation for structured clinical facts.
- Planned and performed treatment are separate and linked explicitly to appointment/encounter/plan items.
- Multi-session care needs first-class sessions: sequence, label, amount snapshot, status, completion time/actor, notes and visit/treatment link. Snapshot catalogue template/price at plan creation; catalogue changes must not rewrite accepted plans. Completed session details are immutable except controlled correction.
- Terminology needs source/code/version/category/effective dates/deprecation/replacement and language mappings.

### 4.6 Treatment plan, estimate/budget and acceptance
- Plan parent: patient/clinic, stable number, status/version, title, professional, creator, diagnosis/internal/patient notes, creation/confirmation/closure dates and closure reason/note.
- Planned item: procedure/treatment, tooth/surface/arch, order, responsible professional, status, expected duration/price, quantity/scope, appointments, completion actor/time and sessions.
- Budget/estimate: parent version, number/version/status, validity, creator/professional, line/global discounts, subtotal/tax/total, internal vs patient notes, acceptance/rejection channel, signer/signature, public-link access attempts/lockout, status history and reason.
- A resent budget is a new version; prior accepted quote/version must remain reproducible. Record exactly what was offered and which version was accepted, by whom, channel and evidence.
- DentalPin observed state flow: draft → pending → active → completed; closed with reason (rejected_by_patient, expired, cancelled_by_clinic, patient_abandoned, other) and controlled reactivation. Reference only; not an automatic ClearFlow rule.
- Plan/budget acceptance, treatment completion and session completion can emit events for follow-up/recall and earned ledger. Idempotency must prevent duplicate side effects.
- Plan, estimate, preauthorization, invoice and actual treatment execution are not interchangeable.

### 4.7 Catalogue, procedure codes, pricing and materials
- Catalogue includes category hierarchy, internal/external codes, localized names/descriptions, default price/cost, currency, duration, tax reference, scheduling requirement, tooth scope, diagnostic/surface flags, billing phase and active/system/retired status.
- Pricing strategies seen: flat, per tooth, per surface/tier, per role (e.g. bridge pillar/pontic); optional session templates distribute treatment value across visits. Validate session sum within rounding tolerance.
- Fee schedules include country+procedure defaults, practice override, provider override, payer/insurance override and effective dates/versions. Historical quote/treatment/invoice prices and taxes must be snapshotted.
- Tax is jurisdiction-specific: category/rate, exemption/legal note/classification, place of supply, party IDs and issue-time profile.
- Material consumption should link to inventory movements where appropriate, rather than remain an unstructured material note.
- Inventory item: SKU/type/category/units, manufacturer, storage location/conditions, reorder/min/max thresholds, suppliers and tax/codes.
- Batch/lot: lot number, quantity/remaining, acquisition cost, supplier, received/manufacture/expiry dates and traceability. Stock movements include receive/issue/use/transfer/adjustment/waste/expiry/return, quantity, batch/location, before/after balance, reference document/treatment, actor/time/cost/reason.
- Stock quantity is a derived/maintained projection from movement history, not a manually editable separate truth.
- Purchasing: suppliers, supplier-item relationship, order/lines, requested/received quantities, partial receipts, tax/discount, status, receipt batches and returns.
- Sterilization fields: instrument, cycle number, machine, method, operator, temperature, pressure, duration, start/end, indicators, result and notes. Device telemetry is separate from clinical observations and needs device/type/unit/time/source/validation.

### 4.8 Imaging, documents, referrals, orders and laboratory
- Document metadata: patient/tenant/owner, type/media kind/category/subtype, title/description, original filename, object storage key/path, MIME type, file size, checksum, captured/created time, uploader, status/archive, tags, consent/retention and source/derived links.
- Imaging needs modality, capture/series/study, tooth/site, orientation, device/source, captured time, type, status and links between original/rendered/thumbnail; an attachment alone is not enough.
- Document types include clinical photos/X-rays, reports, consent, insurance and lab artifacts. Before/after pairing can be a self-relation.
- Generated documents preserve template version, data snapshot, renderer/version, language, author/approver/signature, issue time and checksum, plus correction/void/superseded relation. Do not recreate historical issued documents from current mutable data.
- Referral source/person/business, referral order, sent referral and returned report are separate concepts.
- Orders need type, patient/encounter, intent, line items, priority/status, required/expected dates, external IDs, instructions, documents/results and status history.
- Lab cases require vendor, work type, teeth/roles, shade/material, instructions, estimated vs actual cost, sent/due/received/delivered/seated dates, quality check and failure/rework history. Lab order history records from/to status, actor/time/note.

### 4.9 Insurance, eligibility, preauthorization and claims
- Coverage is effective-dated and subscriber-centric. Keep patient/dependent separate from subscriber/policy holder; capture payer/carrier and payer ID, member/group/policy ID, subscriber demographics/contact/address, relationship, effective/termination dates, priority, benefits, deductible, annual maximum, coverage status and last verification.
- Eligibility verification is a dated observation, not a permanent guarantee. Store payer/request/response IDs, transaction status, verified benefits, exclusions, request/response payload as appropriate, failure method and stale/expiry semantics.
- Preauthorization: request/coverage, proposed plan/procedure lines normalized, amount/units requested/approved, dates/auth number/expiry, status/denial reason and attached evidence.
- Claim: payer/billing-provider IDs, patient/subscriber/policy snapshots, service date, diagnosis/procedure coding, service lines, units, fee/allowed/paid/deductible/coinsurance/adjustments, attachments, submission version, clearinghouse tracking, state history, rejection/denial codes and appeal.
- Don't bury claim lines in opaque JSON if independently queried/adjudicated. Keep outbound/inbound raw payload alongside normalized service-line data.
- Secondary-payer coordination needs sequenced claims and remittance values. Distinguish submitted/allowed/insurer-paid/patient-responsibility/contractual adjustment/denial/write-off from actual cash received.
- Fee schedules need payer/plan/provider/jurisdiction scope and effective dates.

### 4.10 Billing, receivables, payments, refunds and accounting
- Quote/budget, invoice, fiscal document, credit note, claim, payment, allocation, refund, payment attempt, remittance and settlement are different entities.
- Invoice header: legal seller/clinic, recipient, issue/due dates/terms, unique series/number/fiscal year, status, totals/subtotal/discount/tax/currency, compliance payload, creator/issuer, and issue-time snapshot of billing name/tax ID/address/email.
- Invoice line: procedure/product/description snapshot, code, tooth/surfaces/service date, quantity/unit price, discounts, tax type/rate/base/tax, payer/claim link and total.
- Invoice numbering needs transactional counters plus DB unique constraint on appropriate series/fiscal-year/sequence dimensions; avoid SELECT then increment. Use clinic-local business date.
- DentalPin reference invoice states: draft → issued; issued/partial → paid or cancellation path; void only before issuance; post-issue correction through legal credit note/reversal instead of silent mutation. Jurisdiction-specific rules remain open.
- Credit notes reference original invoice and obey a creditable-amount ceiling including existing non-void drafts, protected by row lock/transaction. Preserve original and credit-note documents.
- India GST module observed: supplier GST profile, SAC defaults, CGST/SGST/IGST split per issued line, place-of-supply and party snapshots, FY-scoped sequence separate from calendar-year series, and e-invoice applicability/submission status. It splits already-authoritative line tax rather than independently recomputing it.
- Veri*Factu reference uses append-only fiscal records, SHA-256 hash chains, exact XML/response payload, encrypted certificate metadata and attempt snapshots. Accepted records are immutable; rejected records can be corrected under a state-specific flow while preserving the previous attempt.
- Payment is a gross money-received event with method/currency/date/external reference/recorder/idempotency key. It is not an invoice or allocation.
- Allocation applies receipt to one/more budgets/invoices/on-account credit. DentalPin invariants: payment amount > 0; allocations sum exactly to gross payment; target budget belongs to same clinic; refunds sum ≤ payment. A unique DB idempotency key prevents race duplicates.
- Refund is a separate record with amount, payment, method (can differ from collection method), reason, actor/time, provider refund reference/state. Refund, void, chargeback and credit note differ.
- Separate payment initiation/attempt/provider callback/receipt posting/allocations/settlement/bank reconciliation/cash drawer. Failed or unknown attempts must not fake a receipt.
- Receivables/balances are derived from authoritative invoice lines, allocations, refunds, adjustments and credit notes. A mutable paid/balance field is not the sole truth; caches must be recomputable.
- Use DECIMAL/NUMERIC or integer minor units, never floating-point REAL for monetary authority. Currency exponent, rounding, discount allocation, totals and tax reconciliation must be deterministic.
- Reports must state whether they reflect invoice/accrual, receipt/cash, refunds, settlement or bank reconciliation, and which timezone defines the period.

### 4.11 Communications, reminders, CRM and integration
- Communication preference: channel, purpose, language, consent/legal basis, opt-out, preferred contact point, quiet hours and timestamps. Marketing consent differs from care reminders.
- Reminder rules/settings: relative offset, channel/provider, template/version, enabled state, send window, timezone and effective dates.
- Delivery log: recipient snapshot, channel/provider/external message ID, template/version, message/content hash where suitable, appointment version/time, reminder kind, queued/sent/delivered/failed/skipped/bounced/unknown statuses, provider error, timestamps, correlation/idempotency key.
- A reminder is not proof of delivery. Persist provider result and attempt history. Retry after a fixable skipped error without a duplicate successful send.
- LibreDental example partial unique key: appointment_id + appointment_start + reminder_kind + channel, where reminder_kind is not null and status is not skipped. Scheduled start in key permits another reminder after reschedule.
- Separate appointment reminder, clinical recall, waitlist/earlier-slot request, treatment follow-up and marketing campaign.
- Integration records need tenant/provider/environment/API version, secure credential reference, connection state, inbound/outbound event, correlation ID, raw payload or hash where needed, attempts/retry, webhook signature verification and manual reconciliation.
- AI conversations/skill executions store tenant/user/agent session, purpose, context/source references, structured outcome, model/version, status, duration/cost, errors and linked approved operation. Restrict sensitive text; do not use conversation logs as canonical clinical truth.

### 4.12 Operations, forms, imports and analytics
- Staff profile separate from account; shift templates separate from actual availability; leave/holiday are dated exceptions; attendance/timecard is observed work. Payroll/bank/national identifiers require stricter access.
- Waitlist stores patient, desired procedure/provider, preferred days/times, priority/flexibility/validity, contact attempts, match result and booking.
- Import job stores file name/hash, source, tenant/user, entity, mapping/version, preview, row-level validation issues, duplicates, accepted/rejected counts, sign-off, status/retry/errors and rollback/reconciliation.
- Form: template/version, submission snapshot, patient/appointment/encounter, completion and sign-off, actor, score, amendments and output document.
- Audit log is not the AI execution log, workflow event log, clinical note or fiscal ledger; their security, retention and mutability differ.
- Risk score/insight/report is derived data with algorithm/version, input cutoff/as-of time, factors/explanation and expiration/recalculation state.

---

## 5. Important exact source findings

### OpenEMR identity/contact and portal
- contact has ID plus foreign table name/id and can point to patient_data or person.
- contact_relation has contact_id, target table/id, active, role, relationship, priority (1 highest), primary/emergency flags, authority to make medical decisions, authority to receive medical information, start/end dates, notes, created/updated actors and times.
- contact_telecom has rank, system, use, value, active/inactive, primary, effective period and inactivation reason.
- contact_address associates contact with address and stores priority, type/use, status/primary, validity dates and inactivation reason. Address includes line1/line2/city/state/zip/plus-four/country/district.
- person stores title, first/middle/last/preferred names, gender, birth/death dates, language/communication needs, active/inactive reason/date and notes; SSN comments call out application encryption.
- person_patient_link stores person/patient, linked date/by, link_method (manual, auto-detected, migrated, import), notes and active flag.
- patient_access_onsite has portal username/password hash status/login username/one-time key/time. Use dedicated auth rather than copying legacy credential fields.
- uuid_mapping/uuid_registry show resource/table/path/UUID crosswalks.
- form_soap has subjective/objective/assessment/plan plus patient/date/user/authorization.
- form_vitals captures BP, height/weight/temperature with unit conventions, pulse/respiration, BMI/status, waist/head circumference, O2 saturation/flow and pediatric percentiles; units must be explicit.
- form_observation stores code/value/unit/description/system, status/result/reason, date range, parent observation hierarchy, category/type, questionnaire linkage, documentation target, UUID and encounter.
- questionnaire_response stores questionnaire identity/content, patient/optional encounter, creator/audit user, version/status, submitted answers, scores and timestamps.
- patient_tracker_element is sequenced room/status/user flow history.
- claims + ar_activity/ar_session distinguish claim/billing state from posted payment/adjustment activity.
- notification_settings/automatic_notification vs notification_log separate rules/config from attempted message evidence.
- esign_signatures link signature to form/encounter, signer/time/lock/amendment and data/signature hashes.
- document_template_profiles can link template/profile to active/recurring event-triggered generation/notification.
- OpenEMR has legacy/general structures; inspect semantics and service behavior rather than clone everything.

### DentalPin normalized clinical and dental model
- Patient core includes name, phone/email/DOB/notes, active/archive and do-not-contact; extended demographics, national ID/type, language, address and separate billing identity/address/tax ID/email are represented.
- Medical history was normalized from JSON blobs into medical context, allergies, medications, systemic diseases, surgical history, emergency contacts and legal guardians.
- Medical reference includes allergies, medications, surgery, systemic diseases and explicit medication-medication interactions/disease-medication contraindications with active/retired state.
- ToothRecord has FDI number, dentition/type, general condition, surface state, notes and position flags. Treatment has patient, clinical type, scope (tooth/multi_tooth/global_mouth/global_arch), arch, planned/performed state, times/actor, optional catalogue link, price/duration/tax snapshots, notes and soft-delete. TreatmentTooth links each affected tooth with role and surfaces; OdontogramHistory records old/new condition and actor/time.
- Treatment plans have number/status/closure metadata/confirmed time/budget linkage/professional/creator. PlannedTreatmentItem has one treatment FK, order/status/completion actor/time/assigned professional; session rows have unique sequence, snapshotted label/amount/status/completion metadata. AppointmentTreatment bridges planned item and appointment.
- Catalog includes category hierarchy, localized names, internal code, price/cost, duration, tax type, pricing strategy/config and surface tiers, treatment scope, diagnostic/surface/billing flags, active/soft-delete. Optional session template is copied to plan; completed session label/amount are immutable.
- Appointment status and cabinet assignment both keep append-only histories. UTC stored instants and clinic-local display/input semantics need care. Unique index on exact start timestamp does not replace overlap detection.
- Payment has currency snapshot, positive gross amount, method/date/reference/recorder/idempotency key; allocation targets budget/on_account with CHECK enforcing valid target columns. Service invariants enforce allocation sum = payment and refund sum ≤ payment. Partial unique idempotency index is the concurrency backstop.
- Billing issuance snapshots billing identity; invoice sequential uniqueness is series+fiscal-year+number; credit-note ceiling locks original invoice; payment state is derived from allocations/refunds, not simply a stored paid amount.
- GST and Veri*Factu examples demonstrate tax snapshots, jurisdiction-specific numbering, hash chain, exact payload retention, failed-attempt history and correction rules.

### LibreDental / OpenDentist / DentalERP quality signals
- LibreDental procedure code identity is country_code + code. Fee schedule uses separate partial unique indexes for practice override (provider_id NULL) and provider override; payer override is insurance provider + country + code. Some amounts use integer minor units.
- LibreDental claims line_items JSON may limit normalized line-level adjudication; subscriber data was expanded through migration with payer ID, subscriber name/DOB/sex/relationship/address and provider NPI/taxonomy fields.
- LibreDental reminder key includes appointment version/time, rule and channel, and excludes skipped attempts to allow retry after the error is fixed. Delivery status/result is separate from reminder rule.
- OpenDentist defines appointment kind patient/break/lunch/block; plan item fields are patient/treatment/tooth/surface/fee/status; tooth condition is current chart state; invoice stores REAL total/amount_paid; insurance plan has carrier/member/group/subscriber/effective/termination/copay/deductible/annual maximum; lab case stores vendor/type/tooth/shade/fee/sent/due/received/seated/status.
- DentalERP has 81 declared models: Hospital, Subscription/SubscriptionPayment, User/Account/Session, Staff/Attendance/StaffShift/Leave, Patient/MedicalHistory, Appointment/AppointmentReminder, DentalChartEntry, Procedure/TreatmentPlan/TreatmentPlanItem/Treatment, Prescription/PrescriptionMedication/Medication, Invoice/InvoiceItem/Payment, InsuranceClaim/InsuranceProviderMaster/PatientInsurance/PreAuthorization, PaymentGatewayConfig/PaymentLink/PaymentPlan/PaymentPlanSchedule, inventory categories/items/batches/stock transactions/suppliers/purchase orders, LabVendor/LabOrder/LabOrderHistory/LabOrderDocument, Document, Notification/SMS/Email logs and communication preferences, Survey, BulkCommunication, AuditLog, FormTemplate/FormSubmission, AIConversation/AISkillExecution/AIInsight/PatientRiskScore, Device/DeviceDataLog, Instrument/SterilizationLog, CalendarIntegration, Waitlist, Referral/LoyaltyTransaction, DataImportJob and more.
- DentalERP candidates for deeper inspection: age duplicated with DOB; claim line items/documents JSON/string; invoice paid/balance denormalization; inventory currentStock plus movement ledger; some FK relations link by individual IDs without tenant-composite enforcement; insurance used/remaining/deductible counters may lack history. Confirm code/tests before calling these bugs.
- Source maturity/license matter: DentalPin BSL restrictions; OpenEMR GPL; OpenDentist and DentalERP MIT as declared in source; LibreDental licence must be rechecked; Open Dental is proprietary. No source code reuse assumed.

---

## 6. Lifecycle inventory to formalize

These are categories and reference examples, not final ClearFlow states. For each lifecycle specify valid transitions, permissions, side effects, immutable fields, cancellation/reversal, retries, event publication, timezone semantics and tests.

- Patient: intake/prospective → active; archive/restore. Do-not-contact gates outreach. Legal retention is not equivalent to app archive.
- Identity resolution: candidate → reviewed/matched/rejected → linked/merged; keep source IDs and reversible merge history.
- Appointment: scheduled → confirmed → checked-in → in-treatment → completed; cancellation/no-show separate terminal routes; reschedule event invalidates/recreates reminder occurrence.
- Encounter: started/in-progress/completed/signed/amended; support walk-in/urgent care independent of appointment. Signed notes/attested encounter cannot be silently rewritten.
- Finding/diagnosis: provisional/confirmed/resolved/entered-in-error as appropriate; preserve history.
- Treatment plan: draft/pending acceptance/active/completed; close with reason and controlled reactivation/versioning.
- Preauthorization/claim: draft → ready → submitted → acknowledged/in process → adjudicated (paid/partial/denied) → appealed/closed; preserve submission and response attempts.
- Invoice: draft → issued; issued/partial → paid or valid correction path; draft void differs from post-issue credit note/cancellation.
- Payment: initiation/attempt → provider confirmed/failed/unknown; only confirmed receipt posts money. Allocation/reallocation/refund separate; use idempotency.
- Message: queued/sending/sent/provider accepted/delivered/failed/skipped/bounced/unknown. Provider evidence and retries are durable.
- Lab order: created → sent → acknowledged/in progress → received → quality check → delivered/seated or remake/cancelled. Store every transition.
- Inventory: every quantity change is a movement. Lot/expiry/transfer/return/waste/adjustment need distinct reasons/source links.
- Document/signature: draft/template version → generated/issued/signed/locked/amended/superseded/archived; retain hash and issued artifact.
- Import/AI task: queued → running → needs review/failed/completed; task/row idempotency, validation report, source evidence, sign-off and rollback/reconciliation.

## 7. Platform-wide invariants

1. Every tenant-owned row and every parent-child relation must be tenant-consistent.
2. Internal primary keys are separate from display numbers and external IDs; business numbers are namespaced by tenant/module/series/fiscal year/code system.
3. Monetary authority uses exact decimal or minor units, currency snapshot and deterministic rounding.
4. Valid time (“when true”) is distinct from recorded time (“when known/entered”); preserve author/source/correction.
5. Derived values are recomputable; don't maintain unverified independent copies of balance, stock, status summary or analytics.
6. Enforce important state/domain invariants with DB CHECK/unique/partial unique/FK/exclusion constraints when feasible; service rules complement these.
7. Use idempotency keys and unique provider/event IDs for retries. A unique DB constraint plus safe conflict handling is required for concurrent duplicate requests.
8. Multi-row operations affecting money, claims, bookings, document issuance and stock must be transactional; define row-lock order. Use a transactional outbox/durable event handling where needed.
9. Historical snapshots are not overwritten when catalogue, patient, tax profile or template changes. Correction is an amendment/version/reversal with traceability.
10. Hard deletion/cascade for clinical/fiscal history must be exceptional; separately define archive, purge, legal hold, anonymization, retention and backup deletion.
11. Audit every write path including background jobs, integrations and AI tools; actor and correlation are not optional.
12. Secrets/certificates/tokens must be managed/encrypted outside ordinary clinical fields and redacted from prompts, logs and exports.
13. Access is purpose-sensitive: clinical history, allergy, note write/sign, billing, HR/payroll, representative authority, marketing, export, deletion and permission changes require specific grants.
14. Keep UI projections simple while preserving full data through APIs and canonical relations.

## 8. AI-assisted data-entry contract

AI input is a proposal, not a write. Model this workflow separately:
1. Raw source/message/document with stable URI/hash and tenant/user.
2. Extraction run: model/tool/version, extracted candidate fields, source spans, confidence/uncertainty and alternatives.
3. Validation report: required field missing, duplicates, wrong tenant, invalid code/ID, inconsistent dates/units, absent consent/authority, clinical ambiguity.
4. Clarification task and answers with provenance.
5. Authorized approval of the exact proposed changes where policy requires.
6. Typed deterministic operation with current permission check, object version/preconditions and idempotency key.
7. Result: created/updated IDs, side effects/events, errors/retries/reconciliation and audit.
8. Downstream outputs linked to source operation (document, reminder, invoice, claim).

Read tools are tenant-scoped, permission-filtered, PII-minimized and auditable. Write tools use proposal → validation → approval where required → atomic execution → result. Revalidate authorization and record version at commit. Identity merges, fiscal issue, deletion/purge, refunds, signatures/locks, claim submission and permission changes are high-risk/irreversible operations. AI cannot grant itself permissions. Vector search/cache must follow the same authorization, retention and provenance boundaries as relational data. Separate AI telemetry from business audit.

## 9. Open decisions — do not guess

- Tenant topology and Appwrite scoping/transaction/migration semantics.
- Global person vs tenant-local person; shared family contact and duplicate merge design.
- Encounter vs appointment vs treatment execution and unscheduled/emergency care.
- Dental notation and terminology/coding systems plus licensing/versioning.
- Jurisdiction-specific India fields/rules first, future jurisdiction plug-ins later.
- Insurance scope for India/private payers versus US electronic claims formats, preauthorization, remittance and eligibility APIs.
- Imaging/object storage/DICOM metadata/derivatives and PHI controls.
- Guardian/proxy/consent/portal/communication and marketing preferences.
- Audit retention, amendment/signature requirements, legal hold and deletion/anonymization.
- DB engine/migration strategy after testing Appwrite transaction, row-level access, query/relation constraints, vector and export/migration behavior.
- Module ownership, stable service APIs, outbox/events and avoiding dependency cycles.

## 10. Research method and acceptance checklist for future batches

For every source/domain, preserve source URL, release/commit/access date, licence/maturity, exact field/entity names, types/nullability/defaults/constraints/indexes, keys and FK targets, tenant scope, lifecycle behavior from services/tests, transaction/idempotency/rollback behavior, uncertainty and known shortcomings. Mark each point as observed, inferred, ClearFlow candidate requirement or undecided.

Eventually deliver:
- Field inventory matrix: canonical field/meaning/type/cardinality/sensitivity/authority/source/valid time/recorded time/FK/nullability/constraints/index/query/snapshot/retention.
- Entity relationship/ER model and cross-system coverage/mapping grid, including lossy mapping warnings.
- Lifecycle transition matrices, business-rule catalogue, authorization matrix, integration map, provenance matrix and retention matrix.
- Full canonical migrations with types/constraints/indexes, deterministic Python service layer and tests after the evidence pass.
- Every excluded concept gets a stated reason and an integration/migration plan.

Do not define completeness by table count. Reconcile clinical, financial, operational, interoperability and governance domains.

## 11. Research batches and ongoing work

The detailed workspace dossier contains longer-form evidence and source notes for:
- Batch 1: source landscape, patient/clinical context, scheduling, treatment and financial integrity.
- Batch 2: periodontics, imaging, medications, referral identity, terminology and jurisdictional questions.
- Batch 3: invoice issuance/numbering, credit notes, allocation/refund concurrency, payment attempts, pricing/tax and clinic-local dates.
- Batch 4: user/member/role/permission separation, person/patient authority and contact, communications and normalized clinical history.
- Batch 5: interoperability, FHIR and durable asynchronous work.
- Batch 6: inventory, procurement, laboratory, specialty treatment and recall.
- Batch 7/8: source-level claims/payment/audit, eligibility, fee schedules, patient-flow tracking, medication provenance and document evidence.
- Batch 10: OpenEMR patient, issue, medication, care-team, scheduling and order fields.
- Batch 11: FHIR dental mapping, longitudinal condition vs finding, referral order, terminology and source maturity.
- Batch 12: notification/delivery, rule-driven reminders, signatures and template automation.
- Batch 13: identity, contact authority, telecom/address validity, portal separation, staffing, shifts, waitlists, forms and imports.
- Further source passes: DentalERP's 81-model inventory; OpenDentist DDL; DentalPin patient clinical, odontogram, plan/session, catalog, appointment history, payments/refunds, India GST/Veri*Factu; LibreDental reminder/claim/fee schedule details; OpenEMR contact graph, notes/observations/questionnaires, AR activity, notifications and e-signature schema.

### Next research batches
1. Continue Open Dental table-by-table comparison for treatment plan/tooth/claim/payment/recall/imaging/lab/consent/staff/appointment resource entities and confirm current field definitions.
2. Deep-read OpenEMR migrations/services around claims, payment posting, insurance, prescriptions/refills, document amendments, audit and permissions; identify what is legacy and what is enforced in code/tests/DB.
3. Continue DentalPin tests/service logic for tenant-FK safety, appointment interval overlap, plan/quote acceptance/versioning, refund/reallocation and issuance.
4. Verify LibreDental and DentalERP maturity, migrations and constraints; map relationships and test findings before calling them reliable models.
5. Review current Indian official sources; separate law/standards from optional product functionality.
6. Create complete cross-system entity/field matrix and domain-coverage grid before committing to the final ClearFlow schema.
7. Only then write canonical migration/ERD, types/nullability/defaults/keys/indexes, lifecycle and authorization matrix, deterministic services and test suites.

### Additional source links
- OpenEMR contact relationships: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/contact_relation.html
- OpenEMR person: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/person.html
- OpenEMR telecom: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/contact_telecom.html
- OpenEMR address associations: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/contact_address.html
- OpenEMR questionnaire: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/questionnaire_response.html
- OpenEMR observations: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/form_observation.html
- OpenEMR signatures: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/esign_signatures.html
- OpenEMR notifications: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/notification_log.html
- DentalPin patient model: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/patients/models.py
- DentalPin odontogram: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/odontogram/models.py
- DentalPin plan model: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/treatment_plan/models.py
- DentalPin payment workflow: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/payments/workflow.py
- DentalPin billing workflow: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/billing/workflow.py
- DentalPin India GST: https://github.com/dentalpin/dentalpin/tree/main/backend/app/modules/india_gst
- DentalPin Veri*Factu: https://github.com/dentalpin/dentalpin/tree/main/backend/app/modules/verifactu
- LibreDental billing: https://github.com/Cojekt/LibreDental/blob/main/internal/storage/sqlite/schema/billing.sql
- LibreDental reminder migrations: https://github.com/Cojekt/LibreDental/tree/main/internal/storage/sqlite/migrations
- DentalERP schema: https://github.com/abinauv/dental-erp/blob/main/prisma/schema.prisma
- OpenDentist schema: https://github.com/clawnify/OpenDentist/blob/master/src/server/schema.sql

**Research is not complete.** This is a durable source-backed notebook and handoff. Append new observations, link each fact to evidence and never prune important fields solely to make the interface simpler.


## 10. Batch follow-up: OpenEMR field-level schema findings (27 October 2026)

These are observations from OpenEMR's table-by-table EHI Export documentation. They are source-system evidence, not a directive to reproduce its schema.

### Prescriptions
The prescription record includes patient, pharmacy, provider, encounter, start date, drug name/ID, RxNorm code, form, dosage, quantity, size, unit, route, interval, substitution, refills/per-refill quantity, filled date, medication reference, note, active flag, created/modified timestamps, user/site, prescription GUID, external e-prescribing source/upload state, external drug payload and external ID. One field is explicitly marked unused/for future removal, proving that field inventory must be paired with migration/lifecycle review. ClearFlow should separately represent the prescription order, medication details, transmission attempts, external IDs, renewal/cancellation and pharmacy acknowledgement/dispense evidence; a single active flag is not the full lifecycle.
Source: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/prescriptions.html

### Procedure orders and reports
The procedure_order model includes provider/patient/encounter, collection/order timestamps, priority/status, patient instructions, active flag, external lab control ID, lab ID, specimen type/location/volume, transmission time, clinical history, external ID, history-only flag, diagnosis, billing type, procedure type, fasting status, patient service centre hold, advance-beneficiary-notice state, collector, originating facility/account, provider number, order type, scheduled date/start/end and performer type.
procedure_report is separate: order ID and sequence, collection/report timestamps and timezone offsets, source, specimen ID, report status, review status and lab notes. Receipt of a result is not the same as clinician review. For dentistry, retain order/case, specimen or appliance identifiers, external lab control number, transmission, result/document, review acknowledgement and interpretation as distinct lifecycle facts.
Sources: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_order.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_report.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_type.html

### Clinical rules and provenance
clinical_rules includes global/patient applicability, alert/reminder/quality-measure flags, external measure IDs, citations, developer, funding source, release version, web reference, access-control context and descriptions of how demographic/health/social determinants are used. rule_filter, rule_action and rule_reminder hold include/exclude/required/optional filters, action groups and reminder methods/intervals. Rules should record author/source/version, effective status, tests, scope, access policy, execution results and review. Clinical rules must not be undocumented AI guesses.
Sources: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/clinical_rules.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/rule_filter.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/rule_action.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/rule_reminder.html

### Billing and accounts receivable
billing includes patient/provider/user/encounter/payer, code system/code/text, modifiers, units, fee, justification/target, authorization and billed/activity flags, processing state, process/bill timestamps and file, external ID, price level, revenue code and charge category. A billable line therefore needs clinical coding, attribution, authorization, units, price, payer and processing lifecycle—not just description and amount.
ar_activity stores per-activity sequence, patient/encounter, billing code/system, fee/modifier, payer type, posting time/user/date, payment session, memo, actual pay amount, adjustment amount, follow-up flag/note, account code, adjustment reason, void/deletion time and payer claim number. Payment can differ from fee due to adjustments/discounts. ar_session represents a remittance/payment batch with payer, user, open/closed state, check/EOB reference, check/deposit/posting dates, total/global amount, payment type/method, description, adjustment code and patient. This supports separate payer remittance batches and allocations to service lines; preserve posting, closing, deposit and adjustment reasons.
Sources: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/billing.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/ar_activity.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/ar_session.html

### Insurance and subscriber relationships
insurance_data records coverage priority (primary/secondary/tertiary), payer/provider and plan, policy/group numbers, subscriber names/relationship/identifier/DOB/address/phone/employer, copay, coverage start/end, patient link, subscriber sex and assignment acceptance. insurance_companies includes payer name/contact, CMS identifiers, insurer type, clearinghouse receiver/default partner, alternate IDs, active/inactive, eligibility configuration and timestamps. Model payer organization, patient coverage, subscriber/person, coverage priority and effective dates independently; the patient is not always the policy holder.
Sources: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/insurance_data.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/insurance_companies.html

### Patient and encounter breadth
OpenEMR patient_data documents 131 fields, including UUID, language, names, DOB, address, driver licence/SSN, occupation, multiple phone types, pharmacy, status/marital status, contact relationship, referral/referring provider, assigned provider, email/direct email, race/ethnicity and further demographic/medical/administrative fields. This is useful for discovery, not a normalization template: map fields to contacts, identifiers, relationships, preferences, medical history, referral and insurance entities as appropriate.
form_encounter includes date/reason/facility, patient/encounter number, onset date, sensitivity, billing note, category, last billed/closed payer levels, statement date/count, main/supervising provider, invoice reference, referral source, billing facility, external ID, place of service, parent encounter, class/type/description, referring/ordering provider, end date, collection flag and last update. An encounter can associate clinical, scheduling, facility, referral, billing and supervisory contexts; normalize each authoritative concern while preserving encounter-level links.
Sources: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/patient_data.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/form_encounter.html

### Documents, signatures and forms
documents contains UUID, storage type (URL/blob/web URL), size, creation/expiry dates, URL/thumbnail, MIME type/page count, owner, revision timestamp, foreign owner ID, logical document date, file hash, category, name, drive UUID, external storage IDs/revisions, storage method, path depth, import state, encounter link/check, audit approval status/ID, documentation-of/service context, encryption flag, metadata, deletion flag and generic external reference table/ID. Generic external references are flexible but weakly typed; use explicit document links or typed owner relationships for important entities.
onsite_documents includes patient/facility/provider/encounter, creation time, document type, patient signature state/time, authorization signature time/state, authorizing signer, review date, denial reason, signature payloads, document bytes/path/name and template data. forms includes date, encounter, form name/ID, patient, author, group, authorization/deletion status, subtype/directory, provider and related issue/therapy group. Separate document metadata/object storage, template version, form submission, signature/attestation and encounter link. Preserve hashes and immutable versions for signed consent and clinical artifacts.
Sources: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/documents.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/onsite_documents.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/forms.html

## 11. Updated implications
1. Orders, result artifacts, receipt and clinician review are distinct lifecycle records.
2. Rules need provenance: source, author, version, citation, effective state, tests, scope, permissions and execution evidence.
3. Billing is payer-aware and line-level. Preserve payer claim number, processing status, remittance batch, payment/adjustment amount, void time and reason.
4. Insurance belongs to a time-bound relationship between covered patient, subscriber and payer/plan; subscriber may differ from patient.
5. Encounter is a clinical/operational anchor, not a reason to flatten every related domain into one row.
6. Document metadata must include hash, MIME/size, storage IDs, revision, logical date, context, expiry, encryption, import validation, signature/review and retention.
7. A wide legacy patient table is a source for field discovery, not a design target.


## 12. Batch follow-up: DentalERP relationship and lifecycle review; license verification

### DentalERP relationship-level observations
Source: https://github.com/abinauv/dental-erp/blob/main/prisma/schema.prisma
The current inspected Prisma schema has 81 models and uses MySQL. Selected models reveal both useful breadth and risks that ClearFlow must not copy blindly.

**Hospital / tenant configuration.** Hospital fields include name/slug, email/phone/alternate phone, address/city/state/pincode, logo, registration/GST/PAN numbers, website/tagline, locale/country/currency/timezone, subscription plan/expiry, patient/staff/storage limits, active/onboarding state, email-verification tokens, working hours and bank details. This is a broad operational onboarding record. Sensitive bank/account data and verification tokens should be separated/protected, and subscription limits should not be mixed into clinical facts. Country-specific defaults must not hard-code the whole tax model.

**Patient.** Fields include hospitalId, local patientId, first/last name, DOB and separate age, gender/blood group, primary/alternate phone, email/address/city/state/pincode, Aadhaar number, occupation/referrer, emergency contact name/phone/relationship, locale, AI summary/summary time, active flag and timestamps. Relations connect medical history, appointments, treatments/plans, dental chart, prescriptions, invoices, documents, lab orders, risk scores and insurance policies.
Design cautions:
- Age duplicates DOB and becomes stale; compute age at the relevant clinical date or preserve a deliberately recorded age only when the source requires it.
- Aadhaar and other sensitive identifiers require purpose limitation, restricted access, masking/encryption and retention decisions.
- An AI summary is a derived projection with provenance/time/version, not a replacement for source clinical records.
- The emergency contact flattened into patient columns cannot support multiple contacts, validity periods or decision authority.
- Tenant ownership on parent and child rows does not by itself enforce same-tenant relations. Composite tenant keys/constraints or trusted DB-level controls are needed.

**Appointment.** Fields include clinic-local appointment number, patient, doctor, scheduled date plus a string scheduledTime, duration, optional chair, appointment type/status/priority, check-in/out times, wait time, chief complaint, notes, cancellation time/reason, virtual flag and video consultation relation. The model uses a date plus string time rather than a canonical zoned interval, and indexes but no interval exclusion constraint were visible in the schema excerpt. ClearFlow should represent start/end as unambiguous instants with clinic timezone semantics, maintain a separate local display context where needed, and enforce overlap/capacity under concurrency. Check-in/out and wait-time may be derived/recorded operational facts and need clear definitions.

**Dental chart.** DentalChartEntry has hospital/patient, tooth number and notation, individual mesial/distal/occlusal/buccal/lingual flags, condition/severity/notes, diagnosed/resolved dates and timestamps. This is a useful explicit surface model but may omit other surface systems, tooth/arch states and temporal chart history. Do not assume all tooth types share the same surfaces; version the notation/terminology and preserve change history.

**Treatment plan.** Header has plan number, patient, title/description/status, estimated cost/duration, start/expected end/completed dates, consent flag/date, notes and timestamps. Items have procedure, optional string toothNumbers, priority, estimated cost, status and notes. A string list of tooth numbers loses referential integrity, roles, surfaces and per-tooth details. ClearFlow should use normalized item-to-tooth/surface relationships, explicit consent evidence and price snapshots, and separate estimate from actual charges.

**Invoice and payment.** Invoice includes subtotal, discount type/value/amount, taxable amount, CGST/SGST rates and amounts, total, paid amount, balance, status, due date, insurance claim/amount, notes/terms and timestamps. Payment links directly to one invoice and stores amount/method/date, transaction/bank/cheque/UPI details, status, refund amount/date/reason and gateway/order/payment/status fields. This is convenient but can create competing authorities: invoice paid/balance values duplicate payment state; a payment tied to one invoice cannot natively allocate a single receipt across multiple invoices; refund fields embedded on payment are less expressive than separate refund/reversal events. ClearFlow should preserve provider attempts, provider IDs, settlement/reconciliation and independent refund records, then derive/reconcile balances from allocations.
Tax columns named CGST/SGST reflect a specific domestic tax pattern. Tax calculation should be jurisdiction/effective-date driven rather than assuming these exact two components universally. Verify current Indian GST invoicing rules with official sources before implementation.

**Insurance.** PatientInsurance records payer/provider, policy/member/group, subscriber name/relationship, effective/expiry, coverage type, annual maximum/used/remaining amount, deductible/met flag, copay percentage, active and last verification state/time. Storing used and remaining amounts as mutable fields risks divergence from adjudicated claim/benefit events; treat as verified snapshots/projections with source/time. PreAuthorization stores procedures as JSON, estimate, status, approved amount/date, expiry and denial reason. JSON can preserve an original request payload, but canonical procedure lines, decision lines, attachments and status history need relational representation for auditing and reporting.

**Inventory.** InventoryItem stores currentStock alongside InventoryBatch and StockTransaction tables. StockTransaction records type/quantity/previous/new stock, batch, supplier, reference type/ID, from/to locations, unit/total price, performer and time. Maintaining currentStock plus transaction ledger can be useful for performance, but it is a projection that must be updated atomically and reconciled. The free-form referenceType/referenceId pair is weakly typed; use typed links for core purchase, receipt, waste and treatment-consumption sources. Batch quantities and item stock need a defined unit of measure and concurrency-safe movements.

**Lab.** LabOrder has patient/vendor, work type, description, tooth numbers as string, shade, order/expected/sent/received/delivered times, estimated/actual cost, status/priority, quality-check status/notes, special instructions, creator, deletion time and relations to status history and documents. LabOrderHistory records status-from/to, actor, note and timestamp; LabOrderDocument links documents. This is a valuable lifecycle pattern. Extend it with structured tooth/arch/material/shade systems, remake lineage, external IDs, QC criteria/results, vendor communications and reconciliation of estimated versus actual cost where required.

**Audit and AI.** AuditLog stores tenant, user, action, entity type/ID, old/new values as text, IP/user-agent and timestamp. Free-text serialized old/new values may be hard to query and validate; consider typed audit envelopes with structured JSON diffs, request/correlation IDs and integrity controls. AIConversation stores messages/context as JSON and resolved state; AISkillExecution stores skill/input/output JSON, status, duration, token count, cost, error and timestamp. This makes AI execution observable but may retain large amounts of sensitive patient data. Separate conversation content from operation evidence, minimize raw PHI, capture provider/model/operation/schema versions, approval state, redaction/retention policy and verified result references.

**Forms.** FormTemplate stores field definitions as JSON; FormSubmission stores data as JSON, patient/appointment, signature and signed time, IP, status, reviewer and review notes. This supports dynamic forms but requires a versioned template snapshot and schema validation at submission time. Otherwise a template edit can make old submissions ambiguous. Signatures should bind to the exact submission/template/data hash and signer identity/capacity.

**Payment plans.** PaymentPlan and PaymentPlanSchedule represent total/down payment, installment count/frequency/rate, status/start/next due, and per-installment amount/due/paid date/amount/payment ID/status. A schedule is a useful independent obligation record; define recalculation rules, partial payments, missed installments, rescheduling, fees/interest legality, cancellation and payment allocation. Do not let the schedule's paid amount become an unverified duplicate of payment allocations.

**Sterilization.** SterilizationLog includes instrument, cycle number, method, machine, temperature, pressure, duration, operator, result, biological/chemical indicators, notes, start/end times. This is only a log skeleton: production traceability may require machine calibration/maintenance, load and instrument-set membership, indicator batch/expiry, release authorization, failed-cycle remediation, and links to patients/procedures where legally required.

### License/maturity check updates
- LibreDental LICENSE was directly fetched and confirms Apache License 2.0: https://github.com/Cojekt/LibreDental/blob/main/LICENSE. This is a permissive license, but license compliance and attribution obligations still apply if code reuse is ever considered.
- OpenDentist LICENSE was directly fetched and confirms MIT: https://github.com/clawnify/OpenDentist/blob/master/LICENSE. Its license is permissive, but the inspected financial schema remains too simple to be an enterprise completeness benchmark.
- License permissiveness is not an endorsement of clinical correctness, security or production maturity. Keep architecture reuse separate from code reuse.

## 13. New ClearFlow safeguards implied by this batch
- Avoid redundant mutable facts such as age, invoice paid/balance, insurance remaining benefits and stock balance unless clearly designated projections with reconciliation.
- Every projection needs an authoritative source, update transaction, stale-data behavior, reconciliation job and discrepancy alert.
- Store canonical appointment start/end instants and clinic timezone; don't model time as an unvalidated string.
- Replace string tooth lists with normalized tooth/surface relations; use JSON only for source payload preservation or genuinely flexible extension data.
- Dynamic forms require versioned templates and immutable submission snapshots.
- Payment plans are schedules of obligations, not proof of payment; payment allocations remain authoritative.
- AI conversation storage must have PHI minimization, access controls, retention and provider/model/version provenance.
- Audit records should be structured and tamper-resistant enough to answer who changed what, when, why, under which tenant/context, and which operation/result was involved.
- Lab and sterilization workflows need full history and QC/release evidence, not just a status column.


## 14. Batch follow-up: OpenDentist and LibreDental exact schema review

### OpenDentist schema inventory
Source: https://github.com/clawnify/OpenDentist/blob/master/src/server/schema.sql
The inspected SQLite DDL defines 15 tables: settings, operatories, practitioners, treatment_types, patients, appointments, treatment_plan_items, clinical_notes, tooth_conditions, invoices, invoice_items, waiting_list, insurance_plans, lab_cases and appointments_to_make.

Key details:
- settings is a key/value store with update time; defaults include day-start/day-end minutes and slot length. These are clinic configuration and should be typed/versioned where business meaning matters rather than kept as arbitrary strings.
- operatories have name, color, sort order and creation time.
- practitioners have name, role, color, email, phone and creation time.
- treatment_types have code, name, duration, default_fee stored as REAL, color and creation time.
- patients have name, DOB, email, phone, address, medical-alerts as comma-separated text, notes, referral source and creation time. Medical-alerts as comma-separated tags are weakly typed; don't copy.
- appointments allow patient/provider/operatory/treatment type, start/end, status, kind (patient/break/lunch/block), title override and notes. Status values include scheduled, arrived, in_chair, completed, no_show and cancelled. A break/block can be represented as a calendar reservation, but it should not masquerade as a patient appointment; use a resource-blocking event or explicit appointment kind. Patient and practitioner may be set null on deletion, while operatory deletion cascades to appointment records, which is a potential audit/history-loss risk for ClearFlow.
- treatment_plan_items are patient-associated single rows with treatment type, tooth string, surface string, fee REAL, planned/accepted/completed/declined state, notes and order. This is compact but lacks a plan header/version, alternatives, structured tooth relations, clinician assignment and immutable quote snapshot.
- clinical_notes have patient, practitioner, note date, body and created time; there is no signature/amendment/history structure visible in this DDL.
- tooth_conditions record patient, tooth, optional surface, condition and recorded time; history is additive by design in this table, but the schema shown has no normalized tooth identity, code-system/version or correction linkage.
- invoices contain patient, optional appointment, issue time, status, total REAL, amount_paid REAL and notes; invoice_items have description, quantity, unit_price REAL and treatment type. This does not establish a reliable subledger, allocation, tax snapshot, numbering, immutable issue document or reversal trail.
- waiting_list is separate from appointments and has patient, treatment type, preferred practitioner, duration, notes and created time. A separate waitlist entity is useful; a real waitlist may also need desired time windows, priority, expiration, contact attempts, availability offers, response and booking conversion.
- insurance_plans has patient, rank, carrier, member/group IDs, subscriber name/DOB, effective/termination dates, copay, deductible total/used, annual max/used and notes. Used/remaining amounts are mutable benefit projections and need source/verification timestamps.
- lab_cases include patient/practitioner/treatment type/lab, case type, tooth/shade/fee, sent/expected/received/delivered times and status (inspect remaining DDL for any additional fields before formal source inventory).
- appointments_to_make is a separate follow-up concept and should be compared with recall/recare and treatment-plan follow-up rather than assumed to be the same thing.
- README/schema seeding confirms this is a small local practice application; MIT license is permissive, but the financial/clinical schema is not enterprise-complete.

### LibreDental exact schema observations
Sources:
- https://github.com/Cojekt/LibreDental/blob/main/internal/storage/sqlite/schema/patients.sql
- https://github.com/Cojekt/LibreDental/blob/main/internal/storage/sqlite/schema/clinical.sql
- https://github.com/Cojekt/LibreDental/blob/main/internal/storage/sqlite/schema/billing.sql
- https://github.com/Cojekt/LibreDental/blob/main/internal/storage/sqlite/schema/providers.sql
- https://github.com/Cojekt/LibreDental/blob/main/LICENSE
The LICENSE file directly confirms Apache-2.0. The patients table has first/last/preferred name, DOB, sex, email, primary/secondary phone, emergency contact, guarantor, insurer/policy/group/subscriber fields, preferred contact method/language, reminder opt-in, preferred provider, referral source, structured address parts, national ID type/value, medical-alerts/allergies JSON text, notes, version, status and timestamps. DOB and sex are NOT NULL in this schema, while DentalPin permits DOB to be nullable. This illustrates a product policy decision, not a universal truth: ClearFlow should decide how to handle unknown birth dates and demographic data without fabricating values.
- Documents are separate from patients and preserve file path, size, content type, description, type, timestamps and optional patient link. Storage metadata should be supplemented by cryptographic hash, object-store identity/version, retention/access and signature evidence where required.
- Appointments reference patient/provider/operatory with ON DELETE RESTRICT, preventing deletion of these linked records while appointments exist. By contrast, OpenDentist uses SET NULL or CASCADE in some relations. Referential delete policy materially changes audit/history guarantees and must be chosen per entity.
- Dental conditions use patient, tooth number, surfaces as JSON text, ADA code, description, status, integer fee, optional insurance provider and JSON pricing source. A JSON pricing source is useful provenance, but should not replace canonical fee schedule IDs and snapshot values.
- Claims use patient/provider/appointment, insurer/policy/group, date of service, status, notes, JSON line items and payer ID. Payments store integer amount, method/date/notes and optional claim ID with ON DELETE SET NULL. This is a simple receipt representation, not a multi-invoice allocation/remittance ledger.
- Procedure codes use composite country_code + code primary key; fee schedules support practice-wide and provider-level override uniqueness using partial indexes. This is a strong discovery point for jurisdiction-aware catalogs and pricing precedence.
- Providers include role, specialty, license, email/phone, hourly rate, NPI and taxonomy. Timecards snapshot hourly rate, store clock-in/out, total minutes, paid time/manual flag and calculate total pay using a generated expression; a partial unique index allows only one open timecard per provider. Generated calculations and partial unique constraints can be useful, but rounding policy and payroll correction/audit must be explicit.

### Cross-source cautions
- Deletion semantics differ: CASCADE can destroy clinical notes or appointment links; SET NULL preserves a child but loses attribution; RESTRICT protects relationships. Use deliberate per-entity policies and prefer archival/correction for legal/clinical/financial evidence.
- A string or JSON list of teeth is easy to build but hard to validate, query and join. Use normalized tooth/surface rows and retain raw source payload only as import evidence.
- REAL/float fees are unsuitable for authoritative monetary amounts. Integer minor units or exact decimal are better, provided currency exponent and rounding are explicit.
- Simple status values are not sufficient without transition history, actor, timestamp, reason and allowed-transition rules.
- Patient, treatment plan, treatment, appointment, invoice, payment, claim, lab case, waitlist and recall are separate entities even if a small UI combines their actions.


## 15. Batch follow-up: DentalPin application-level state machines and concurrency rules

Source files inspected:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/agenda/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/budget/workflow.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/budget/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/clinical_notes/models.py

### Appointment lifecycle is an explicit state machine
DentalPin's documented canonical transitions are:
- scheduled → confirmed, checked_in, cancelled, no_show
- confirmed → checked_in, cancelled, no_show
- checked_in → in_treatment, cancelled
- in_treatment → completed, cancelled
- completed/cancelled/no_show are terminal in this state machine.
The workflow rejects invalid transitions and same-state transitions. It appends an initial status event at creation, not only later changes, so the history is complete from the beginning. It updates current_status_since with the transition. A parity test checks the frontend's mirrored state machine against the backend definition.
Check-in has a defined time window: two hours before scheduled start until one hour after appointment end, evaluated using UTC instants. Moving to in_treatment requires a cabinet/operatory assignment.
On status transition, the service refreshes the status under a row lock (FOR UPDATE) and re-reads it before writing. This addresses a race where two operators could both read the old state and write conflicting transitions. ClearFlow should adopt server-owned state machines and transactional locking/optimistic concurrency for contested operations, not trust frontend transition options.
The source's partial unique index around clinic/cabinet/professional/start time is an additional guard but is not a substitute for arbitrary interval-overlap checking.

### Budget/estimate lifecycle and acceptance evidence
DentalPin budget workflow documents:
- draft → sent, accepted, rejected or cancelled
- sent → accepted, rejected, expired or cancelled
- accepted → cancelled
- rejected, expired and cancelled are terminal.
A legacy completed status remains a no-op terminal value for old persisted rows, but new transitions do not enter it. This is a strong migration lesson: status values that exist in historical rows may need compatibility handling without remaining valid in new workflows.
Budget records include budget number, version, parent_budget_id for version chain, validity period, creator/assigned professional, global discount type/value, calculated subtotal/discount/tax/total, internal and patient notes, plan snapshots, signatures and history. Budget items snapshot pricing and VAT at creation time. Version chain makes quote revisions explicit rather than overwriting accepted terms.
Acceptance creates a separate signature record with signer name/email, relationship to patient, signature method and method-specific signature data. Signature type can distinguish full acceptance/rejection; an external signature ID can be retained. Budget history captures actions and previous/new states.
Public-link acceptance has a bounded auth model: methods include last four phone digits, DOB, manual code or none; failed attempts are rate-limited in a rolling window, repeated total failures lock the token, and public sessions expire. These are source-system rules, not automatic ClearFlow defaults, but they show that patient-facing links require explicit authentication, expiry, rate limits and audit.
Patient-facing rejection reasons are a closed catalogue (price, time, second opinion, other) with free-text note for other. ClearFlow should consider structured reasons plus notes where they improve analytics.
Default budget validity and plan auto-close windows are configurable defaults (30 days each in this source). Do not hard-code these durations as universal dental rules; make jurisdiction/clinic policy configurable and record the effective policy.

### Clinical notes and polymorphic references
DentalPin clinical notes use owner_type/owner_id plus note_type to attach notes to patient, treatment, plan or appointment. An owner/type matrix is validated, but owner_id has no database FK because the relation is polymorphic; service code verifies the owner exists in the same clinic. This is a deliberate modularity trade-off. For ClearFlow, compare alternatives:
- separate typed FK columns or subtype tables for stronger DB integrity;
- an explicit record-reference/attachment relation with validated target type;
- polymorphic IDs only for extension points where DB-enforced integrity is not practical.
Never accept a client-supplied owner type/ID without verifying the target record and tenant. Clinical note attachments are moved to a media/attachment registry module, showing that file linkage can be generalized while preserving allowed owner types.
The note types distinguish administrative, diagnosis, treatment, treatment-plan, appointment-clinical and appointment-administrative. Clinical vs administrative classification should affect permissions, retention, visibility and audit.

### Additional rule-design implications
1. Every lifecycle needs a canonical server-owned transition map and a transition event/history row, including the initial state.
2. Contested transitions must lock/re-read the row or use a robust optimistic concurrency version; frontend state is not authoritative.
3. Terminal/legacy states need migration policy, not ad hoc exceptions in every UI.
4. Patient-facing acceptance links need expiry, authentication method, attempt rate limits, lockout, signer relationship and evidence.
5. Quotes and treatment plans should be versioned; accepted commercial terms and signature evidence must survive later catalog changes.
6. Clinic-configurable defaults need explicit policy provenance and snapshots where a past decision must be reproduced.
7. Polymorphic ownership weakens FK integrity; choose it only with tenant-scoped service validation, tests and a documented trade-off.


---

## 16. Batch follow-up: OpenEMR payment processing, insurance, document signatures, orders/specimens and operational evidence (27 October 2026)

This batch records additional exact table semantics from OpenEMR's published EHI table documentation plus implementation-level findings from DentalERP and LibreDental. It adds candidates to the canonical entity map; it does not automatically adopt legacy source-system shapes as ClearFlow rules.

### 16.1 OpenEMR payment, processor and accounts-receivable detail

Additional tables/fields inspected:

- `payments` is a patient/encounter-associated payment record with timestamp, user, method/source, two amount fields and two posted fields. Its older generic shape should be treated as a source-system representation, not directly as the ClearFlow payment ledger.
- `payment_processing_audit` is a gateway-operation/audit record: UUID, service, patient, success, action name, amount, ticket, transaction ID, audit payload, timestamp, mapping UUID/transaction, reversal flag, reversal action/transaction/payload/time. This illustrates why gateway transaction attempts and their reversals need a durable separate record, not just fields on a final receipt.
- `payment_gateway_details` stores provider service/login/transaction-key/MD5-like configuration fields. This legacy layout is not a recommended secrets design. ClearFlow should store encrypted credentials or a secret-manager reference, rotate credentials independently, separate sandbox/production, redact credentials from logs and have the application reference the configuration by ID.
- `fee_schedule` has insurance company, plan, code, modifier, type, fee and effective date. Candidate canonical model needs scope, country/code system, effective interval, currency, version, provider/network/plan context and conflict-resolution precedence; never assume an insurer's fee is a universal procedure fee.
- `insurance_numbers` links a provider and payer to provider number, rendering-provider number, group number and identifier types. This is distinct from the provider's personal professional license/NPI and from the payer's own clearinghouse identifiers.
- `insurance_companies` holds payer name, attention contact, CMS IDs, insurer type code, X12 receiver and partner IDs, alternate IDs, eligibility settings and active/inactive state. These are payer integration identifiers, not just payer display name.
- `eligibility_verification` is a narrow trace with response ID, insurance record, check datetime, copay, deductible, deductible-met and creation date. That is insufficient as a full modern transaction record, so ClearFlow should preserve request/response/correlation data and an explicit staleness/failure state around the normalized benefits.
- `claims` supports a version number, payer and payer type, billing status, billing/process timestamps and files, target and submitted claim-form payload. It is a claim header/tracking record, not the service-line adjudication ledger.
- `billing` represents charge/claim-coded service lines with patient, provider, user, group, authorized/billed/active, payer, claim process status, modifiers, units, fee, justification, processing fields, revenue code, NDC and external ID.
- `ar_session` is an overall receipt/posting session. It carries payer/user, open/closed status, check/EOB reference, check/deposit dates, payment total, global amount, payment type/method/description and posting date.
- `ar_activity` carries finer charge-level posting information: encounter/patient, sequence, code system/code/modifier, fee, payer, post date/time/user, session, pay amount, adjustment amount, memo/follow-up status/reason, account code, void/deleted timestamp and payer claim number.

**Canonical implication:** separate charge, claim/version, claim service line, payer adjudication/remittance line, receipt/session, receipt allocation/posting, adjustment/write-off, bank/deposit settlement and reversal. The difference between the fee/amount requested and payer amount actually received must be explainable through allowed amount, deductible/coinsurance, contractual adjustment, denial, patient responsibility, write-off and collection. Preserve the payer's claim/remittance identifiers and original response payload where appropriate. A payment session or a payment processing attempt must not automatically imply that a service-line receivable was settled.

Source links:
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/payments.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/payment_processing_audit.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/payment_gateway_details.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/fee_schedule.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/insurance_numbers.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/insurance_companies.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/eligibility_verification.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/claims.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/billing.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/ar_session.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/ar_activity.html

### 16.2 OpenEMR order → specimen → result is a richer workflow than one “lab order”

Additional entities inspected:

- `procedure_specimen`: FHIR-style UUID, order/code sequence, specimen barcode/internal ID, accession ID, specimen type code/display, collection method code/display, anatomical/location code/display, collected instant or low/high collection interval, volume value/unit, condition code/display, comments, created/updated actors/times and deleted flag.
- `procedure_order_relationships`: ServiceRequest/order ID plus resource type/UUID (e.g. Observation or Condition), relationship kind, created time/actor. This supports linking an order to the clinical context that justified it.
- `procedure_order_code`: one ordered procedure/code row per order sequence; original-line versus post-send-added line; code/name/type, diagnoses, do-not-send flag, title, transport, end date and reason/status/date window.
- `procedure_questions`: lab-specific question catalog by laboratory + procedure, question code/sequence/text, required flag, max length, field type, choices/options, tips and active state.
- `procedure_answers`: response sequence for each order/procedure/question and answer; supports multiple-choice answer rows instead of packing every answer into a single note.
- `procedure_report`: report envelope tied to order/code sequence, source, specimen number, collection/report dates with timezone offsets, report status, review status and lab notes.
- `procedure_result`: result data type (numeric/string/formatted/external/long text), result code/text, date/end date, facility, unit, result value, reference range, abnormal indicator, comments, source document and result status (preliminary/cannot be done/final/corrected/incomplete etc.).
- `procedure_providers`: lab/organization name, NPI, interface sender/receiver application/facility identifiers, debug/production mode, bidirectional/results-only mode, lab ID, protocol, remote host, credentials/path config, director, active flag and type. ClearFlow should not store remote login secrets as ordinary readable fields; use secret manager reference, endpoint metadata and deployment-environment separation.
- `external_procedures` and `external_encounters` are additional source concepts for importing/retaining outside procedures and encounters with their original IDs, dates, provider/facility and diagnosis context.

**Canonical implication:** define a generalized clinical service order with typed order lines; external organization endpoint; order transmission/acknowledgement attempts; order-specific questions and answers; specimens; reports; individual results/observations; corrected/superseding result history; review/acknowledgement; supporting clinical resource links; document attachments; external IDs/correlation keys. Laboratory manufacturing cases (crowns/aligners) remain a different domain from lab/test specimens and diagnostic results, even if both have a provider and status.

Source links:
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_specimen.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_order_relationships.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_order_code.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_questions.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_answers.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_report.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_result.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_providers.html

### 16.3 OpenEMR document provenance, retention, signatures and consent-like evidence

Additional source fields:
- `documents`: UUID; storage type (file URL/blob/web URL); byte size; creation date/expiry; original URL and thumbnail; MIME type/pages; owner; revision timestamp; foreign ID; logical document date; content hash; category/list ID; display name; storage method; import parsing state; encounter ID/check flag; patient-upload/approval audit link; documentation-of target; encryption indicator; metadata/document data (including DICOM action history in one use); deleted flag; foreign-reference ID/table.
- `clinical_notes_documents`: clinical-note ↔ patient-document link with creation time/actor.
- `clinical_notes_procedure_results`: clinical-note ↔ lab/result link with creation time/actor.
- `document_templates`: patient/provider/encounter assignment, profile/category/location, name/status, sent/end dates, size, template content and MIME type.
- `documents_legal_categories`: category/subcategory hierarchy.
- `documents_legal_master`: master template, category/subcategory, file, facility/provider scope, signature box coordinates, filename, effective date/version, content and configuration flags for saved signature/review/upload source.
- `documents_legal_detail`: patient/facility/provider/encounter, master template, signature state/time, file path/name, signing person/sequence, saved content/PDF form data, denial reason, move state and patient comments.
- `onsite_documents`: patient/provider/facility/encounter, document type, patient signature status/time, staff authorization signature time, accept/deny/review state and reason, signer, signature payload, full document binary, path/name and template data.
- `onsite_signatures`: patient portal signature status/type/author/time, patient/encounter, staff/patient actor, authorization/activity, signatory, signature image/data, hash and IP.
- `immunizations` with per-immunization `immunization_observation` are another example of a clinical event carrying administered time, drug/code/manufacturer/lot, provider, dose/unit, expiry, route/site, source, refusal/completion status, reason and encounter. Not a central dental requirement by default, but demonstrates how discrete clinical administrations deserve structured provenance.

**Canonical implication:** distinguish document file bytes/object from a document’s clinical/legal purpose, its assignment, template version, filled content, signer evidence, status/review/denial, and the clinical object(s) it documents. For a signed/issued artifact retain the exact bytes and checksum, signer identity/authority, timestamps, source template/version and amendment/supersession chain. A content link alone is not proof of consent. Consent should be its own purpose-specific model, with legal basis, notice version, scope, signer/representative authority, evidence, decision, channel, valid period, withdrawal and history. Document categories do not automatically prove the purpose or valid state of consent.

Source links:
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/documents.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/clinical_notes_documents.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/clinical_notes_procedure_results.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/document_templates.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/documents_legal_categories.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/documents_legal_master.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/documents_legal_detail.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/onsite_documents.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/onsite_signatures.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/immunizations.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/immunization_observation.html

### 16.4 DentalERP implementation evidence: identity, booking, gateway verification and data import

These findings are based on actual route/service source rather than README features.

**Authentication and tenant context**
- Global Next.js middleware allows API routes through so they can use bearer-token authentication. It is therefore essential that each API handler consistently invokes the authentication helper and does not trust a caller-supplied hospital ID.
- `getAuthenticatedHospital()` reads a NextAuth session first, then accepts a mobile JWT bearer token signed with `NEXTAUTH_SECRET`, returning user, role and hospitalId claims. The combined helper rejects missing user/hospital and can enforce role allowlists.
- This is a consistent context helper pattern, but the project needs to test token expiration, revocation, disabled-user/tenant changes after JWT issuance, role changes after token issuance and whether a stale mobile token retains old role/hospital privileges. JWT validation of signature/expiry alone does not prove current membership remains active.
- The API route source generally scopes queries by authenticated `hospitalId`. Appointment create explicitly verifies the patient and doctor/staff belong to that hospital, which is a better cross-tenant pattern than relying only on global middleware. This does not by itself prove every route and every foreign key is correctly scoped.

**Appointment create**
- Requires patient, doctor, scheduled date/time; validates HH:MM time and duration 5–480 minutes; refuses past date; verifies patient and doctor belong to hospital.
- Conflict check queries same hospital, doctor, exact scheduled date, exact scheduledTime, and excludes CANCELLED/NO_SHOW/RESCHEDULED. It does not use appointment duration to detect interval overlap in the reviewed predicate. Thus 10:00–10:30 and 10:15–10:45 would not necessarily be blocked by that check. Confirm whether any other route/database constraint covers it; do not assume.
- Appointment number uses a read-last-number + increment approach, while schema does have unique (hospitalId, appointmentNo). The unique index is a backstop but concurrent creators can still race and one can error unless sequence allocation/conflict retry is handled.
- Time code combines date and time using the server runtime's timezone; ClearFlow should use clinic IANA timezone, explicit local-wall-clock parse and DST rules. Keep date and time fields as input concepts if needed, but compute consistent UTC instants and never let server/device timezone silently decide the booking.
- For virtual visits, appointment is persisted before video room creation; a video-creation failure is logged and appointment still returns created. This is a useful pattern only if a retryable task/status is also durable; otherwise the appointment may be missing the video link indefinitely. ClearFlow can make follow-on integrations eventual with an outbox/job and visible retry state.

**Gateway payment verification**
- The route loads an invoice within the authenticated hospital, verifies with gateway, then creates a COMPLETED payment and updates invoice paid/balance/status in a transaction.
- `Payment` schema indexes gatewayOrderId but the reviewed Prisma schema's gatewayOrderId and gatewayPaymentId are not declared unique. The route has no prior payment lookup by unique provider payment ID/order ID before creating a new receipt; repeat invocation after the same successful gateway verification is a candidate duplicate-posting risk. The database should impose provider-scoped uniqueness/idempotency and the route should safely return the existing result on retry.
- Invoice paid/balance is updated by read-modify-write arithmetic. Concurrent successful callbacks can read the same old paid amount and race/lost-update unless row-locking/version checks/atomic update and unique callback idempotency are applied. A transaction around two writes does not by itself serialize all concurrent invocations.
- Payment number is also generated by scanning the latest value and incrementing; uniqueness constraint avoids duplicate identities but needs collision retry or a sequence service.
- The ClearFlow invariant is: payment provider event/attempt -> verify amount/currency/merchant/order against persisted checkout intent -> idempotent receipt -> allocation -> reconciliation; only the authoritative amount returned by provider can settle funds. Payment-attempt, receipt, allocation, refund and settlement remain separate. Do not update a summary balance as the only monetary evidence.

**Data import**
- The admin-only import flow loads a tenant-scoped job, stamps signoff and IMPORTING state, reparses the source file, maps/coerces fields, processes transformed rows by entity type, stores row errors/results and creates audit event.
- The import flow's visible top-level code processes entities and updates success/failure counts, but operations appear to be row/service writes with an outer failure handler rather than one all-or-nothing transaction. Partial import can be a legitimate product decision, but it must be explicit: every row needs an idempotency key/source row, outcomes must be durable, retries should skip successes, accepted edits/mapping version must be stored, and rollback/compensation/reconciliation should exist.
- Import job is not merely a file path and count. It needs original file/hash, uploader/tenant, exact mapping and template/schema version, validation preview, duplicate candidates, per-row errors, operator sign-off, commit results and retry status.

Source links:
- https://github.com/abinauv/dental-erp/blob/main/lib/api-helpers.ts
- https://github.com/abinauv/dental-erp/blob/main/app/api/appointments/route.ts
- https://github.com/abinauv/dental-erp/blob/main/app/api/payments/verify/route.ts
- https://github.com/abinauv/dental-erp/blob/main/app/api/data-import/commit/route.ts
- https://github.com/abinauv/dental-erp/blob/main/prisma/schema.prisma
- https://github.com/abinauv/dental-erp/blob/main/tests/api/payment-verify-link.test.ts

### 16.5 LibreDental: state validation and audit requirements

LibreDental's `AppointmentService` validates that start/end are present and end is later than start, and validates the status vocabulary. It intentionally permits editing a legacy appointment whose status is unrecognized if the status itself is left unchanged; this is useful migration compatibility but should be isolated from new status assignment. Its state set includes scheduled, confirmed, arrived, in_chair, complete, cancelled and no_show. However, the reviewed `AppointmentService` itself does not check slot overlaps; that must be sought in the storage/repository/DB layer before drawing a final overall conclusion.

LibreDental's audit design has a separate audit database/schema, session authentication and audit service. It logs reads and writes with actor, patient ID, resource/action, resource ID where available and timestamp. Audit-write failure for some appointment creates/updates is logged as a warning rather than rolling back the clinical write, which is an important trade-off to document: an application that cannot record audit may still proceed. For ClearFlow, define operation-by-operation whether audit failure aborts, queues/retries through an outbox, or triggers a high-priority alert; don't silently lose audit evidence.

Its project guidelines explicitly emphasize not weakening audit, money as integer cents, and migration/backwards compatibility. This reinforces that schema migration is not only DDL: it needs semantic versioning, backfills, compatibility windows, row-level error handling, and tests against existing data.

Source links:
- https://github.com/Cojekt/LibreDental/blob/main/internal/services/appointment_service.go
- https://github.com/Cojekt/LibreDental/blob/main/internal/services/appointment_service_test.go
- https://github.com/Cojekt/LibreDental/blob/main/internal/services/audit_service.go
- https://github.com/Cojekt/LibreDental/blob/main/AGENTS.md

### 16.6 Open Dental source-license correction

The checked-in source repository `OpenDental/opendental` includes GNU GPL version 2 in its LICENSE file. This corrects the earlier shorthand in this notebook that called the source proprietary. The repository README says the database tables are initially installed by the trial installer and points to official programming resources for database documentation. Treat separately:
- official documentation/table concepts used as domain research;
- source-code reuse and derivative-work distribution obligations under the applicable GPL license;
- the specific terms of the official documentation/API materials.

Do not reuse source code just because it is visible on GitHub, and do not describe the source repo as proprietary when the checked-in LICENSE is GPL-2.0. Legal review is needed before any code reuse or copying protected documentation content.

Source:
- https://github.com/OpenDental/opendental/blob/main/LICENSE
- https://github.com/OpenDental/opendental/blob/main/README.md
- https://www.opendental.com/OpenDentalDocumentation26-2.html

### 16.7 ClearFlow acceptance tests implied by this batch

Add explicit tests for:
1. Concurrent appointment requests for the same provider/operatory where time intervals overlap but start times differ.
2. Concurrent unique human-readable number allocation (patient, appointment, invoice, payment, claim) across one tenant, across midnight/year boundaries and at clinic timezone/DST boundaries.
3. Repeated gateway verify/webhook for the same provider transaction, duplicate callback with conflicting amount/currency, and two concurrent callbacks racing to settle one checkout.
4. Invoice settlement concurrency: two different payments applied simultaneously cannot lose an update or exceed the invoice's collectable balance except where legitimate overpayment credit rules explicitly allow it.
5. Partial import: fail midway, retry same job, re-run same row, modify mapping after sign-off, accept some rows and reject others, duplicate match and rollback/compensation.
6. Tenant consistency: create a record in tenant A referring to patient/provider/appointment/payer/resource in tenant B, through APIs and database paths; it must fail, including imported and background-job paths.
7. Audit sink unavailable during a sensitive clinical/financial write: verify the defined fail-closed or outbox-retry behavior and prove no silent loss.
8. Expired/revoked mobile JWT after a staff role, tenant membership or user active state changes.
9. Repeat lab transmission / repeated result payload, result correction and result-review acknowledgment are idempotent and retain source evidence.
10. Document template update does not change prior signed/completed documents; withdrawn consent/proxy access no longer authorizes new disclosure or writes while past audit remains.

### 16.8 Questions left open after this batch

- Does LibreDental repository/storage DB layer enforce overlap/tenant consistency beyond the service code inspected? Inspect `appointment_repository.go` and DB indexes/constraints next.
- Which OpenEMR billing rules are applied by legacy tables versus current service code and claims API? Need inspect posting/reversal service call paths and tests before canonicalizing exact states.
- Do OpenEMR and DentalERP store actual insurer EOB/remittance service lines elsewhere in schema? Inspect table inventory and workflows further.
- Open Dental's official full schema/docs need a versioned field extraction and feature-by-feature trace, not a guessed schema dump.
- Need official current Indian legal source review for GST, consent, retention, provider credentials and exchange standards before defining statutory business rules.


---

## 17. Batch follow-up: OpenEMR remittance idempotency and eligibility benefits; LibreDental repository concurrency (27 October 2026)

### 17.1 OpenEMR ERA / EOB posting: receipt, adjudication, reversals and retry identity

Source-level service files inspected:
- `interface/billing/sl_eob_process.php`: parses and posts X12 835 electronic remittance advice (ERA).
- `src/Billing/EraCheckPosting.php`: check/session/claim posting deduplication.
- `src/Billing/EraReversal.php`: reversal handling.
- `src/Billing/EraAdjustmentMemo.php`: adjustment/secondary payer memos.
- `src/Billing/EDI270.php`: 270 eligibility inquiry and 271 response flow.

Key observations:
- The check-level idempotency identity is not just a check number: it finds an earlier `ar_session` using payer ID + normalized check reference (bare value or “ePay - …”) + check date when available. The date matters because a payer may reuse placeholder check numbers. The session can be reused rather than duplicated.
- Posting is also claim-scoped within a check: `EraCheckPosting` remembers claims handled during the current request and checks prior `ar_activity` by patient, encounter, check reference, payer and check date. Denials may create no AR posting row, so the code separately checks whether the latest claim version already records the same payer denial/reason codes; otherwise re-running an ERA could create repeated denied versions.
- The payer's CLP claim status and payer claim number are durable inputs. A reversed claim status (CLP02 = 22) is not automatically treated as a payment posting. It may need to reopen the payer level so the remaining balance stays with the payer instead of being incorrectly assigned to the patient.
- The reversal logic identifies the insurance level using coverage effective on date of service and/or payer claim number. It checks whether the same check already posted a corrected payment before reopening the insurance level. A correction consists of a reversal plus corrected payment, and the resulting level should remain closed in either posting order.
- ERA patient responsibility adjustments are represented separately from actual payment. A zero-dollar `ar_activity` row/memo can retain the payer's deductible/coinsurance/copay/other patient-responsibility explanation or non-primary payer note without crediting the claim itself. ClearFlow should model adjustment/remark codes as structured adjudication detail, not require a text memo to be parsed later as the sole source of truth.
- The EOB UI has explicit authorization gates and CSRF protection. This is part of the operational evidence: financial-write endpoints need role/permission checks and request integrity, not just a correct data schema.
- Eligibility flow uses X12 270/271 and correlates the request/response partner and `verification_id`. `eligibility_verification` joins benefit rows through `verification_id`; this supports one verification response containing multiple benefits. Repeated eligibility checks are new dated observations rather than updates to a timeless insurer field.

**ClearFlow candidate model:**
- `payer_remittance` / `remittance_file`: payer, clearinghouse, check/EFT reference, payment date, deposit date, received timestamp, original file/object ID and hash, raw interchange/control IDs, parse status and reconciliation state.
- `remittance_claim`: original payer claim number, submitted-claim reference/version, CLP status, paid amount, patient responsibility, claim-level adjustment codes, received amount and posting state.
- `remittance_service_line`: service/procedure reference, original billed amount, allowed amount, payer payment, patient-responsibility amount, adjustment/denial code groups and per-line posting result.
- `remittance_posting_attempt`: import/run, idempotency identity, session/ledger IDs, prior match, current status/error and actor/system/correlation.
- `remittance_reversal` / correction relationship: references original remittance/claim/line and exact prior posting, reason, replacement and outcome.
- Deduplication should key on provider/clearinghouse + payer + check/EFT reference + date/control number as available, plus line/claim IDs; do not use only one human-entered string. If a payer legitimately reissues a check or claim, the identity policy must permit it.
- The posting transaction must atomically persist session, claim/service adjudication entries, payment/allocation/adjustment records and dedupe state. Preserve raw source payload for audit and reprocessing.

Source links:
- https://github.com/openemr/openemr/blob/master/interface/billing/sl_eob_process.php
- https://github.com/openemr/openemr/blob/master/src/Billing/EraCheckPosting.php
- https://github.com/openemr/openemr/blob/master/src/Billing/EraReversal.php
- https://github.com/openemr/openemr/blob/master/src/Billing/EraAdjustmentMemo.php
- https://github.com/openemr/openemr/blob/master/src/Billing/EDI270.php

### 17.2 OpenEMR benefits table: response is a collection, not one coverage number

The inspected `benefit_eligibility` table is described as holding eligible benefits for a specific insurance as received from a verification. It includes:
- response ID and verification ID;
- type and benefit type;
- start/end dates;
- coverage level, type, plan type, plan description and coverage period;
- amount and percentage;
- network indicator and message;
- active/denied response state and response create/modify dates.

This confirms a single successful verification can return multiple differently effective benefits (e.g. service category/coverage level/plan terms) and is distinct from persistent patient insurance identity. A canonical eligibility design should hold a verification header/request/response and child benefit rows. It should preserve who/what/when was checked, provider transaction identifiers, response code/status, raw response where allowed, per-benefit effective periods and staleness. A current summary may be derived for UI, but must not erase past verification responses or pretend eligibility remains current indefinitely.

Source:
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/benefit_eligibility.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/eligibility_verification.html

### 17.3 LibreDental appointment repository: optimistic concurrency is present; booking conflict control remains unproven

Repository/service/test findings:
- Appointment model has patient/provider/operatory/start/end/status/reason/notes, timestamps and `version`.
- Create validates that ID and patient ID exist and persists UTC-formatted start/end times, status and version.
- Update writes `WHERE id = ? AND version = ?`, increments the database version and returns `ErrConflict` when no row matched. The service test proves that a stale version is rejected. This is a good optimistic concurrency pattern for concurrent edits.
- List queries use interval-aware range filtering (`end_time >= filter start`, `start_time <= filter end`), and the service rejects missing or inverted intervals.
- But the reviewed `AppointmentService` + `appointment_repo.go` do not calculate provider/operatory interval overlaps or prevent two overlapping active bookings. The schema has provider/operatory/start indexes but no exclusion/unique interval constraint. Until other paths are checked, do not treat LibreDental as a slot-conflict model. ClearFlow needs explicit interval conflict logic and concurrency-safe enforcement beyond timestamps/indexes.
- The service accepts any known status from its `UpdateAppointmentStatus` method rather than enforcing the strict transition graph used in DentalPin. A closed vocabulary alone is weaker than a state machine. For ClearFlow, a state transition API must validate both vocabulary and the allowed edge from the current state, retain the old/new status and actor/time, and use locking/version checks to prevent competing transitions.
- The repository's delete method removes the appointment row by ID. That may suit a small local product, but enterprise design should define cancellation, retention and history-preservation deliberately—especially when appointment history relates to patient care, notifications or audit. Hard-delete should not erase the history of clinical/financial actions without a policy.
- Audit is stored in a separately configured SQLite database/tree. Entries include ID/time/user ID/name/patient ID/action/resource/resource ID/details/IP. Keyset paging uses timestamp plus SQLite rowid as tie-breaker and validates that a cursor belongs to the requested patient. This is a useful pagination lesson, but a cross-database audit write isn't atomic with the clinical mutation; the service sometimes logs an audit failure and continues with the operation. ClearFlow should explicitly define fail-closed vs transactional outbox/retry per operation, especially for sensitive/financial writes.

Source links:
- https://github.com/Cojekt/LibreDental/blob/main/internal/services/appointment_service.go
- https://github.com/Cojekt/LibreDental/blob/main/internal/storage/sqlite/appointment_repo.go
- https://github.com/Cojekt/LibreDental/blob/main/internal/storage/sqlite/appointment_repo_test.go
- https://github.com/Cojekt/LibreDental/blob/main/internal/services/audit_service.go
- https://github.com/Cojekt/LibreDental/blob/main/internal/storage/sqlite/audit_repo.go
- https://github.com/Cojekt/LibreDental/blob/main/internal/storage/sqlite/audit_schema

### 17.4 DentalERP tenant foreign-key caveat confirmed in a migration

The MySQL migration shows `Appointment.hospitalId` separately references `Hospital.id`, while `Appointment.patientId` references `Patient.id` and `Appointment.doctorId` references `Staff.id` as independent FKs. The same pattern applies to invoice/payment ownership fields: hospital ID is a separate FK and patient/invoice links have separate single-column FKs. This protects that referenced row exists but does not by itself prove the referenced patient/staff/invoice belongs to the same hospital as the child record. Some routes explicitly verify tenant ownership before insertion, so do not characterize the entire system as unprotected; the gap is that such ownership equality is not established by those independent database FKs alone.
  
For ClearFlow, test and ideally enforce composite references such as `(tenant_id, patient_id)` → tenant-scoped parent key where relational database supports it, or equivalent database policies/transactional validation. An API helper that adds a tenant filter is valuable, but it cannot cover direct imports, admin tooling, background tasks, integrations or every future write route by itself.

Evidence:
- https://github.com/abinauv/dental-erp/blob/main/prisma/migrations/20260127152236_multi_tenancy/migration.sql
- https://github.com/abinauv/dental-erp/blob/main/prisma/schema.prisma
- https://github.com/abinauv/dental-erp/blob/main/app/api/appointments/route.ts

### 17.5 Additional high-value acceptance tests

Add to the earlier test catalogue:
- Reprocess the same remittance file twice and verify there is exactly one financial posting for each claim/service line, including denials with zero payment and adjustments that create no monetary credit.
- Import a reversal before its corrected payment and then in the opposite order; the final payer-level responsibility and balances should reconcile identically.
- Reuse a check number with a different date/payer and verify the dedupe key allows legitimate distinct transactions while preventing duplicate retransmissions.
- Eligibility response includes several benefit rows with different effective periods; historical result remains queryable after a later verification.
- Two appointment edits with the same expected version: one succeeds, the other returns a deterministic conflict; two overlapping new bookings for the same clinician/operatory must not both commit.
- Directly insert an appointment in tenant A linked to patient/staff/invoice of tenant B through DB/import paths; the tenant-equality protection must reject it.
- Audit database/outbox unavailable during a financial posting: the defined policy executes (rollback or durable pending audit) without silent evidence loss.


---

## 18. Batch follow-up: ERA source payload, claim-line semantics, retry safety and chart-to-claim atomicity (27 October 2026)

### 18.1 OpenEMR raw X12 835 parser and posting details

Source code examined: `src/Billing/ParseERA.php`, `src/Billing/SLEOB.php`, `src/Billing/InvoiceSummary.php` and the corresponding `interface/billing/sl_eob_process.php` flow.

The parser retains a much richer remittance context than the final posted totals:
- X12 interchange/group/transaction control identifiers: ISA sender/receiver/control number, GS date/time/control, ST transaction control and segment count.
- Payment/check header: BPR check/settlement amount, payment/check date, TRN check number and payer tax identifier; currency can also be present.
- Payer/payee identity and address details, subscriber identity/member ID, patient names, provider identity/member ID, payer claim ID, our claim identifier, claim date, date of service, payer insurance and corrected/crossover flags.
- Claim status, claim charge/approved payment/patient responsibility totals, remarks/comments and one or more service lines.
- Service lines include procedure/code/modifier, charge, paid amount, adjustment list; each adjustment carries group code, reason code and amount.
- Claim-level status/adjustments can exist without a service-line payment. The UI stores denial reason codes on a new claim version and avoids recording the same denial again for the same latest claim version/payer/payer level/reasons.
- The payer's CLP07 claim-control number is persisted on each AR activity row that is posted, including cases where the payer paid nothing, so later reversals can locate the affected payer/claim level.

Important parser caution: the code contains an optional `force_claim_balancing` mode which can add an artificial “Claim” service row and a balancing adjustment when service payments/adjustments do not sum to claim-level totals. This is an adapter-layer reconciliation technique for imperfect payer data, not a business fact that should be fabricated silently. ClearFlow should retain the original interchange/response, source-reported figures, normalized service lines, reconciliation difference, adjustment policy/version, actor/system, warning and review state. If a deterministic importer applies a balancing rule, the generated adjustment must be identifiable as system-derived, link back to the raw source, and not masquerade as a payer-reported service line.

The `InvoiceSummary` code derives totals from active billing service charges, product/drug sales and non-deleted AR activity; payment and adjustment amounts reduce the computed balance. This supports the design principle that a summary balance should be derived from underlying charges and payment/adjustment rows rather than be the sole monetary record.

Sources:
- https://github.com/openemr/openemr/blob/master/src/Billing/ParseERA.php
- https://github.com/openemr/openemr/blob/master/src/Billing/SLEOB.php
- https://github.com/openemr/openemr/blob/master/src/Billing/InvoiceSummary.php
- https://github.com/openemr/openemr/blob/master/interface/billing/sl_eob_process.php

### 18.2 LibreDental claim/payment schema and service workflow

Claim line fields in `internal/domain/billing.go`:
- stable line ID; optional pricing-source details;
- optional tooth-condition link, tooth number and surfaces;
- ADA/CDT code, description and fee;
- insurance-allowed amount and patient-portion amount.

Claim header fields include claim ID, patient/provider/optional appointment, carrier, policy/group/payer IDs, service date, status, notes, nested line items and create/update timestamps. The payment object has ID, patient, optional claim, amount in integer minor units, method, date, notes and created time. Its patient balance service computes total billed from claim-line fees minus total paid; it does not appear to implement a full adjustment/refund/unapplied-credit/claim-remittance subledger. The claim line representation is stored as JSON in SQLite, which is simple but weak for relational query constraints, per-line adjudication history, partial correction and claims reconciliation.

The payment method vocabulary includes `write_off` alongside actual payment methods. In ClearFlow, write-offs, contractual adjustments and denial adjustments should be accounting adjustments/reconciliation records—not fake cash receipts or payment methods—so that cash collection totals remain correct.

A deterministic patient control number (PCN) is calculated from the claim ID using SHA-256 then Base32 encoding to produce a short uppercase alphanumeric identifier suitable for payer X12 control-number constraints. This is a useful example of separating a stable internal ID from an external-format identifier. ClearFlow should persist the external PCN/crosswalk and its generation/version when actual submitted documents need to reproduce the value, even if the derivation remains deterministic.

LibreDental's submission path:
- allows only draft or rejected claim submission;
- builds claim submission from stored claim, patient, practice and rendering-provider data;
- checks the provider supports the practice country;
- uses the provider config through a secrets abstraction and a 30-second request timeout;
- audits failed and successful transmission attempts because a failed network response may still mean protected data was sent;
- updates claim status after the external provider returns success.

There is an important partial-failure window: external submission can succeed, then re-fetching or persisting the local new status can fail. The service reports that state, but no separate durable submission-attempt ledger is obvious in the reviewed `Claim` structure. ClearFlow should create a persistent claim-submission attempt *before* network I/O, record request/correlation/idempotency/external IDs and payload hash, then transition it on response or reconcile an unknown outcome. An external API timeout must not be treated as proof of non-submission; retries need provider idempotency or status lookup.

Claim-from-chart workflow:
- checks the patient's current chart and existing claims to avoid billing a tooth condition already represented on a claim;
- skips nonexistent, already billed or ineligible-state conditions; deduplicates repeated condition IDs in the same request;
- creates claim lines with tooth/surface, procedure code, description, fee and optional pricing-source snapshot;
- persists the claim before marking planned tooth conditions completed;
- if a later condition update fails, it manually rolls back already changed conditions and deletes the claim.

This is more thoughtful than an unguarded write, but a process crash between claim creation, condition updates and compensating rollback can still leave a partial state; a process-local mutex also doesn't coordinate another process/client. ClearFlow should use one database transaction for the claim+condition state changes, with row locks or optimistic version conditions and idempotency key. Where true cross-system operations cannot share a transaction, use an outbox/saga with resumable compensations and a reconciliation queue. A local mutex is a performance aid, not data integrity.

Additional risks observed in this reference:
- Some claim audit logging is written after the claim creation; if the service returns an error because audit failed after the write committed, the caller may retry and generate another claim if it used a generated ID. Use transactional audit/outbox, stable request ID and idempotency.
- The claim/payment structures lack complete line-level claim submission history, remittance adjudication, refund reason/reference/state and reversal history, based on the model/service files reviewed. This is a limitation of the inspected implementation, not a claim that no other module can ever supply those records.
- Chart states are mutated to completed when a claim is generated in this workflow. ClearFlow should distinguish “billed”, “planned”, and “clinically performed”; a claim or invoice may be generated before treatment is complete, and billing a service is not evidence that it was actually performed. Define each transition and link it to the correct clinical event.
- Date generation uses runtime `time.Now()` for the service date; multi-timezone SaaS requires the clinic business timezone or explicit service-date input.

Sources:
- https://github.com/Cojekt/LibreDental/blob/main/internal/domain/billing.go
- https://github.com/Cojekt/LibreDental/blob/main/internal/services/billing_service.go
- https://github.com/Cojekt/LibreDental/blob/main/internal/storage/sqlite/schema/billing.sql

### 18.3 ClearFlow payer-reconciliation model — candidate entity relationships

Based on the OpenEMR remittance workflow and LibreDental claim model, compare the following separate records in the canonical design:

`Claim`
→ `ClaimVersion` / `ClaimSubmission`
→ `ClaimServiceLine`
→ `ClaimSubmissionAttempt`
→ `PayerResponse` / `ClaimStatusHistory`
→ `Remittance`
→ `RemittanceClaim`
→ `RemittanceServiceLine`
→ `RemittanceAdjustment` / `DenialCode`
→ `PaymentReceipt` + `PaymentAllocation`
→ `Reversal` / `Correction` / `Appeal`.

This should not become one huge row/table with a status and JSON blob. Some raw payload JSON/XML is justified for interchange fidelity, but normalized, frequently queried items need relational rows. Use source code system and raw code, description/version, code group and effective policy; preserve any payer interpretation instead of translating only to one free-text note. Keep payer-paid amount distinct from receipt amount and bank-cleared amount.

### 18.4 Reproducible remittance arithmetic and reconciliation conditions

For each payer claim/service line, preserve enough information to recompute the reconciliation state:
- original billed fee and units/modifiers;
- payer's allowed amount;
- payer-paid amount;
- patient-responsibility amount and subtype;
- adjustment code group/reason/amount;
- contractual/other adjustment amount;
- payer-claim status (including denied/zero-pay/reversed/corrected);
- allocated actual receipt/session and reversals;
- original source payload and parser/mapping version.

The system should detect rather than hide:
- claim-level charge/paid/responsibility that disagrees with service-line totals;
- paid amount exceeds submitted/allowed amount without a recognized adjustment/correction;
- duplicate check/control number or repeated claim line;
- a reversal without a matching previous claim/payment/claim version;
- mismatch between payer payment total and bank deposit/processor settlement;
- line items that cannot be matched to a submitted claim because the payer rewrote the control number;
- unknown or ambiguous provider/payer identity.

Use deterministic balancing rules only when documented, versioned, and disclosed. Do not overwrite source-reported figures with computed values; preserve both original and reconciled outcomes with actor and time.

### 18.5 Open Dental research boundary and next source acquisition attempt

The Open Dental GitHub repository `OpenDental/opendental` contains a GPL-2.0 license and README, but the repository root does not include the complete database schema as a directly inspectable SQL file; its README says initial table creation comes from the trial installer and points to separate programming/data-dictionary resources. Therefore, the canonical field-level Open Dental pass must rely on versioned official table/API documentation or a legally obtained schema export, not an invented dump or guesses from UI names. This is an explicit source-coverage limitation.

The next Open Dental batch should request or inspect the official versioned schema/reference for:
- `Patient`, `PatPlan`/subscriber and plan benefit history;
- `Appointment`, `Schedule`, `Operatory`, blockouts and recall;
- `ProcedureLog`, `ProcTP`, `TreatPlan`, `TreatPlanAttach`;
- `Claim`, `ClaimProc`, payment/payment split and adjustment records;
- `Document`, images, signatures/consent, labs and supply history.
Do not guess column names/types or mark these domains complete until backed by the actual current version document.

### 18.6 New acceptance tests implied by this batch

- Ingest the same ERA twice; ensure no duplicate session, payment activity, adjustment, or denial version.
- Ingest a payer reversal, then corrected payment; reverse the order and verify equivalent final balances/state.
- Verify a 835 header total that conflicts with service-line totals raises a reconciliation exception and stores the source; if a configured rule synthesizes a balancing line, mark it as system-derived and versioned.
- Verify secondary-claim generation can read primary-payer adjustment codes from structured remittance rows rather than parsing only memo text.
- Simulate external claim submission timeout after the remote server accepted the claim; mark outcome unknown and reconcile without submitting a duplicate.
- Fail a local claim status update after remote submit success; claim attempt and external ID must remain durable and visible.
- Fail chart condition mutation after claim creation and crash the service; transaction rollback must leave no orphan claim and no partial chart state.
- Simulate audit persistence failure after a claim/payment create; no ambiguous “failed” response should be returned after a committed write unless the outcome includes a stable idempotency key and recoverable result.
- Billed status, completed clinical treatment, invoice issuance, payer submission and payment receipt remain separate facts; test that none incorrectly implies another.


---

## 19. Batch follow-up: dental-specific periodontal, orthodontic, prosthodontic, inventory, imaging-AI and prescription domains (27 October 2026)

This batch expands the canonical coverage map using DentalPin's actual models, services, module contracts, migrations and tests. These are implementation observations from a BSL-licensed reference, not a proposal to copy source code. Some data semantics (especially clinical index calculations and imaging model weights) must be clinically/licensing validated before ClearFlow uses them.

### 19.1 Periodontal charting is a dated clinical exam, not a mutable “periodontal status”

Inspected:
- `backend/app/modules/periodontogram/models.py`
- `indices.py`
- `CLAUDE.md`
- `docs/technical/periodontogram-plan.md`
- lifecycle and calculation tests.

**Observed schema**
- `PeriodontogramSnapshot`: clinic/patient; status `draft|closed`; recorded time/user; closed time/user; notes; persisted `indices` JSONB. CHECK constraints couple status and close metadata. Closed snapshots are immutable. Partial unique index permits at most one draft per patient in a clinic. A new draft is seeded from the then-current odontogram with a row for each permanent FDI tooth 11–48.
- `PeriodontogramTooth`: one tooth row per snapshot/tooth; tooth number, present/missing state, implant flag, mobility (0–3), prognosis (good/fair/poor/hopeless), buccal and lingual furcation grade (0/I/II/III), keratinized gingiva (mm). FDI-range and value-range CHECKs exist. Missing/extracted teeth are removed from metric denominators; implants count as present.
- `PeriodontogramSite`: at most one row per snapshot + tooth + site; tooth reference/number, one of six SEPA sites `MV,V,DV,ML,L,DL`, probing depth (0–15 mm), gingival-margin position (-5 to +10 mm), bleeding on probing, plaque and suppuration. Rows are created lazily; in the source implementation bleeding/plaque/suppuration default false even if probing depth is not set.

**Lifecycle and integrity**
- Draft open is idempotent and returns the same draft on repeat. Draft creation seeds 32 permanent teeth; site values may remain absent.
- Draft edits occur per tooth/site; close computes an index bundle and freezes the state. Closed record cannot be reopened; corrections mean a new dated exam. Draft can be discarded; closed snapshots cannot be deleted through normal API.
- At close, derived BoP %, PI %, mean CAL and number of teeth with a pocket above threshold are stored in JSONB as a performance cache; source code includes a recompute function for backfill. Preserve raw site rows as authority and treat cached indices as recomputable output, with formula version/time if these ever change.
- Cross-module decoupling: no FK to odontogram tooth records; the service pre-fills from the odontogram at draft time and refreshes active draft tooth flags from performed-treatment events. This protects optional-module uninstall behavior, but creates a synchronization contract that must be tested.
- Source table only supports permanent dentition (FDI 11–48); deciduous numbering is rejected. For ClearFlow this is an intentional scope choice only if pediatric-periodontal requirements are out of scope; otherwise the schema needs an explicit dentition/notation profile and age-appropriate sites.

**Important metric caveat—do not copy blindly**
- Current source `indices.py` defines total_sites as six multiplied by every present tooth. BoP and plaque numerators count site rows with true flags, so absent/unmeasured site rows effectively count as negative for the percentage. The unit tests explicitly assert this.
- CAL adds probing depth + gingival-margin only where both values are non-null, but then divides by the *theoretical total site count*, not the number of valid measured CAL observations. The tests explicitly expect this denominator.
- That means a half-completed exam can produce a lower BoP/plaque percentage and a lower mean CAL than the measured-only values would suggest. A clinical standard may legitimately require a known denominator rule, but “not measured” is not biologically equivalent to “negative.” ClearFlow should preserve three states at each site (measured positive, measured negative, not assessed) and store measured/evaluable counts and formula/version. Do not call a metric complete or compare exams unless coverage rules are explicit and validated against a current authoritative periodontal standard / clinician review.
- Explicit absent tooth vs tooth/site not assessed vs healthy finding must never collapse to the same null/false value.
- The periodontogram’s fields should be compared with the full intended periodontal examination: gingival recession/CEJ reference, CAL, pocket depth, bleeding/plaque/suppuration, mobility, furcation, keratinized tissue and other clinical measures vary by exam model. Do not imply this particular SEPA slice is an exhaustive worldwide periodontal chart.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/periodontogram/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/periodontogram/indices.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/periodontogram/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/docs/technical/periodontogram-plan.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/periodontogram/test_indices_calc.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/periodontogram/test_snapshot_lifecycle.py

### 19.2 Orthodontics: longitudinal case, repeated controls, appliance state and plan-session financing

Inspected `orthodontics/models.py`, `schemas.py`, `service.py`, `CLAUDE.md` and detailed tests.

**Observed model**
- `OrthoCase`: clinic/patient, responsible professional, appliance type, status, start date, estimated months, diagnosis notes, current upper/lower wire, finish time, reopen time, status note and optional unique treatment-plan link plus plan-item link.
- Appliance types: metal/esthetic brackets, self-ligating, aligners, functional appliance, retention.
- Case statuses: active, paused, finished, transferred_out. Allowed transitions: active → paused/finished/transferred_out; paused → active/finished/transferred_out; finished → active; transferred_out is terminal. `finished_at` is retained when reopening and `reopened_at` timestamps the return to active. A transfer-out suggests closing the linked plan but does not automatically close the financial record.
- `OrthoControl`: case/clinic, performed time/actor, upper/lower arch wire, procedures list (JSONB), free-text other-procedure notes, aligner number, hygiene state, notes, weeks to next control, appointment ID and optional plan-session ID.
- `OrthoSettings`: clinic-level default wires/procedure labels. Seeding is idempotent.
- Control registration checks staff membership; the named orthodontist must be a professional member. Appointment link must match the case patient and clinic. Plan/session links must exist under the case’s own treatment-plan item. Controls are refused on terminal cases.
- Next due date is calculated from the latest control, not a denormalized due-date counter; recall creation is duplicate-guarded and is skipped while case is paused. Editing a control re-derives current wires from latest controls, avoiding stale cached wire state.
- Optional payment plan integration is deliberately through treatment-plan item sessions. Schedule generation checks exact Decimal equality between down payment + (months × monthly amount) and existing pending amount; it refuses if any session is already completed, adds the new sessions through the plan service and removes replaced pending sessions. Orthodontics itself never writes payments or paid/earned deltas.
- Tests cover illegal status edges, non-professional rejection, tenancy, idempotent defaults, conflicting second case for one plan, plan-item/session foreign relationship, appointment scope, installment total mismatch, editing controls, recall upsert and a transferred-out close suggestion.

**Canonical implications**
- Orthodontic treatment requires more than an `orthodontic` procedure enum. Preserve a case-level longitudinal record with appliance type/status, treatment goals/diagnosis, planned duration, repeated control visits, current and prior archwire/aligner stage, actions performed, hygiene, findings/photos, progress measures, compliance, breakage/remake events, retention and follow-up.
- If aligner cases are supported, do not rely only on one `aligner_number`: potential entities include aligner system/series, stage number, planned vs actually delivered tray, wear/replace date, attachment/IPR changes, lost/replacement tray, adherence issue and outcome measure. Mark these as candidate future fields until source and clinician review.
- JSONB procedures is flexible but limits relational reporting and code validation. Consider normalized control-procedure rows referencing a versioned catalogue, with `other` detail retained separately.
- Monthly money schedule belongs to the patient’s accepted treatment/financial plan, with each session/instalment link, not a parallel amount counter hidden in the orthodontic module.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/orthodontics/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/orthodontics/schemas.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/orthodontics/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/orthodontics/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/orthodontics/test_orthodontics.py

### 19.3 Prosthodontic lab work order vs diagnostic laboratory/specimen order

DentalPin's `lab_orders` module describes manufacturing work sent to an external dental laboratory—not an EHR diagnostic specimen order. It stores:
- `LabOrder`: clinic/patient/lab contact; work type; tooth reference; impression type; antagonist information; shade; status; sent/expected/received dates; notes; created_by; timestamps.
- Work types include crown, bridge, denture, implant, veneer, orthodontic, repair and other.
- Status vocabulary includes sent, in_progress, ready, received, cancelled. Receipt date is stamped on transition into received and repeated PATCH with received status leaves original received date intact. There is no DELETE endpoint: cancel the order to preserve patient linkage. The service validates the patient and lab contact belong to the clinic and emits status-changed event within the transaction.
- A migration later adds impression type, antagonist info and shade. The fields represent actual dental fabrication inputs, not generic free-text lab order.
- The reviewed model/service has no separate first-class status history table, lab-order line/component table, fabrication attempt/rework or remake link, technical quality acceptance/rejection, vendor purchase/invoice reconciliation, or document/scan/surface-file relationship. Those are gaps to investigate/cover in ClearFlow when building a truly complete lab operations domain.
- The schema permits a status enum at the API layer, but the reviewed service mutates the supplied status directly; don't infer a strict transition graph from a closed set of allowed status strings. ClearFlow should define valid edges, status history, rework/remake transitions and actor/time.
- This domain must not be merged with the separate OpenEMR diagnostic `procedure_order → specimen → report → result` workflow. Manufacturing orders produce an appliance/device; diagnostic orders produce clinical results.

**ClearFlow candidate lab work objects**
1. `DentalLabOrder` header: patient/clinic, source treatment plan item/procedure, ordering professional, lab contact/vendor, order code/number, priority, sent/required/expected/received/delivered dates, state/version and communication/correlation IDs.
2. `DentalLabOrderItem`: one crown/bridge/denture/aligner/etc. component, FDI tooth(s), role (abutment/pontic/etc.), arch/site, material, shade system/value, impression/scanner source, antagonist/bite record, implant system/abutment/platform, custom instructions, version and expected cost.
3. `DentalLabOrderArtifact`: original scan/impression, STL/PLY/OBJ/DICOM/image/prescription/file hash, secure storage key, media type, created/uploader, link to the exact order revision.
4. `DentalLabStatusEvent`: from/to state, actor/system, time, external confirmation, reason/note.
5. `DentalLabQualityCheck` / `DentalLabRework`: trial/fit/occlusion/shade/finish check, accepted/rejected, measurement/note/evidence, defect and root cause, return/resend date, replacement/remake version.
6. Supplier/financial link: expected lab cost vs invoiced/actual cost; separate supplier invoice/payables from patient charge.
7. Clinical delivery/seating event: appointment/treatment performed, date, provider, fit/occlusion outcome, follow-up/corrective treatment. A lab package “received” is not evidence it was clinically delivered/seated.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/lab_orders/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/lab_orders/schemas.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/lab_orders/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/lab_orders/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/lab_orders/migrations/versions/labo_0002_add_prosthodontic_fields.py

### 19.4 Treatment consumables are a recipe; stock movements are the execution evidence

Observed `TreatmentConsumable`:
- Junction linking a catalog procedure to an inventory item with Decimal quantity, optional note and clinic ID.
- DB unique constraint on (clinic_id, catalog_item_id, inventory_item_id) closes duplicate-link race. Service validates both catalog treatment and stock item are active/present in the same clinic; duplicate insert returns 409. This is a good example of database enforcement plus tenant-scoped service checks.
- The link stores consumption rule only; it does not deduct stock. On `odontogram.treatment.performed`, a transactional event handler calls the inventory service's apply-consumption method with the treatment ID as the idempotency/reference identity and actor.
- Stock changes must always go through the inventory service rather than raw cross-module updates. The data must retain actual consumption movements and whatever stock lot/location/expiry/method was selected at performance time.

**Canonical implication:** separate recipe/BOM (catalog treatment → consumable + expected quantity/unit/conditions/per-session vs per-treatment) from actual usage (treatment/session → item/lot/location, used quantity/unit, waste, actor/time, source event/idempotency key). A later recipe edit should not rewrite existing consumption. Record planned vs actual, substitutions and waste; ensure duplicate event retries cannot deduct twice. Verify whether the underlying inventory module enforces atomic lot depletion and handles insufficient stock/backorder, returns and corrections before treating the recipe integration as an end-to-end solution.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/treatment_consumables/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/treatment_consumables/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/treatment_consumables/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/treatment_consumables/events.py

### 19.5 Imaging index is not the image object; import identity needs a review/approval trail

DentalPin's imaging viewer uses separate entities:
- `ImagingStudy`: clinic/patient, document FK to original media file, StudyInstanceUID, modality, study date, extracted DICOM tags in JSONB, active/archived status. Pixel bytes stay in object/media storage; study row supports structured index/listing without reparsing the bytes. Unique partial index permits one active row per clinic/document (repeat indexing is idempotent while archived versions remain).
- `RvgLink`: approved DICOM PatientID → patient binding per clinic, unique per clinic + DICOM PatientID, actor who approved the identity link.
- `RvgImport`: one import queue record per file hash: clinic, optional patient/document/study, filename/hash, identity tags, suggested patient/score/reason, pending/approved/rejected/failed state and error. Same-byte rescans are no-ops. Failed files remain visible/retryable. Approve/reject twice is conflict, not silently treated as another decision. Reject retains the row for audit; unreadable sources remain discoverable.
- Matching implementation scores national ID +60, DOB +25 and tokenized name overlap up to +30, threshold 40; ties do not suggest a patient. A user approves one DICOM patient ID link, and later uploads carrying the same ID can then auto-import. Therefore the approved mapping is a security-relevant, auditable identity decision and must be revocable. DICOM PatientID should not be assumed globally unique or correct merely because it is present.
- `ImagingAnnotation`: study/patient/clinic, kind ruler/freehand/note, normalized coordinates (0–1), JSON payload, optional mm spacing and author. Millimeter values are computed only when spacing metadata exists; never guess. Original image content remains immutable; annotations/derived views are overlays.
- DICOM image render protects memory by bounding rows×columns before decoding (80 MP limit), refuses unsupported multi-frame/colour/encapsulated transfer syntaxes with actionable errors, uses DICOM LUT/rescale/VOI/windowing order and does not expose patient PHI in render URLs. The viewer is explicitly a visualization tool, not itself a diagnosis.

**Canonical imaging requirements**
- Store original file exactly, cryptographic hash, MIME/format, encrypted storage pointer, uploader/received time, patient/encounter/source, device/modalities, source and derived document relationships.
- Separate patient imaging study/series/instance metadata; DICOM UIDs; modality; acquisition time; pixel geometry/spacing/orientation; rows/columns; body part/tooth; view/projection; laterality/arch; machine/manufacturer; radiation exposure if applicable; operator; quality/status; export/import identifiers.
- Store identity-matching candidate evidence, chosen patient and approver, threshold/scoring/mapping version, link validity/revocation and auto-import source. An approved mapping remains traceable when future files auto-import.
- Keep annotations and AI findings separate from original images; include normalized location/ROI/coordinates, model version, author/actor, date and evidence link. No AI artifact should be treated as confirmed diagnosis without a clinical review state and provenance.

Source links:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/imaging_viewer/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/imaging_viewer/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/imaging_viewer/test_rvg_import.py

### 19.6 AI imaging outputs are versioned drafts, not clinical truth

Observed `AiJob`:
- Patient/clinic/source document; DICOM series document IDs; backend key, model ID/version; proposed/queued/running/done/failed/cancelled status; queued user; draft review status; reviewer/time; bounded log/error; artifact document ID list.
- Agent-generated unsupervised request becomes `proposed` with null queued_by and cannot execute until a clinician confirms (which stamps the responsible user). A supervised/authorized request can queue directly. Result artifacts are imported as ordinary media `document` records with an `ai-draft` tag, linked to job source; they do not overwrite source DICOM, do not create photo pairing, and remain reviewable. A clinician confirms the results; that confirmation records review metadata without mutating original output.
- Background scheduler claims queued jobs with row locking, runs in its own DB session, and reaps stuck running jobs after a bounded age. Job failures become durable rows with status/error rather than disappearing into logs.
- Source tests cover proposed→confirm→queued, executor skips proposed, done→reviewed, cancel restrictions, draft artifacts, foreign-patient/document rejection, series requirement, stale job reaping, runner command contract and tenant scoping.
- Backend is pluggable, with model ID/version recorded. One model is for single-frame panoramic dental findings; nnU-Net requires a DICOM volume. Model weights and third-party dependencies require explicit licence/terms review. The README NOTICE points out a S3 weights bundle with no stated terms and restricts it to evaluation until the clinic confirms the weight licence; Ultralytics dependency is AGPL-3.0, NNUnet CLI is Apache-2.0 and DentalSegmentator weights are cited as CC-BY-4.0. Never infer the weights have the same license as the inference code.
- Pano model output includes an FDI-related findings CSV and optional overlays. DICOM is rendered to PNG first; geometry/codec constraints may cause explicit failure. Failed model calls must preserve errors and not create an authoritative finding.

**ClearFlow AI output lifecycle**
1. Analysis job record, model/provider/version/weights digest, input study/series and source hashes.
2. Proposals (per finding) with code/label, tooth/surface/location, confidence or uncertainty, geometry, source artifact, inference timestamp and model output hash.
3. Human review decision per proposal: confirm, reject, defer/needs better image; reviewer, time, reason and amended values.
4. Only reviewed proposal can become a clinical finding/diagnosis or create a plan item, and then it must be linked to both AI proposal and approving person; preserve the AI original and clinician-edited record separately.
5. Log execution resources/errors, retries and outcome, while separating AI telemetry from patient clinical truth and minimizing PHI in application logs.

**Third-party licence boundary**
- The inspected DentalPin NOTICE describes nnU-Net CLI (Apache-2.0), DentalSegmentator weights under CC-BY-4.0 and dental-pano-ai code under MIT. It also warns the S3 model-weights tarball has no stated terms; production use needs independent confirmation. The upstream dependency list includes Ultralytics AGPL-3.0, which needs separate deployment/licensing review. Do not use source or weights merely because GitHub/URLs are reachable.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/imaging_ai/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/imaging_ai/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/imaging_ai/runner.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/imaging_ai/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/imaging_ai/NOTICE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/imaging_ai/test_imaging_ai.py

### 19.7 Medication catalogue vs prescription artifact

**Medication catalogue observed**
- One clinic-level entry with name, dose, unit, pharmaceutical form, `requires_prescription` and active status.
- Form enum includes tablet, capsule, syrup, suspension, injection, topical, drops, spray, mouthwash, gel, cream, paste, varnish and other.
- Case-insensitive unique index on `clinic_id + lower(trim(name))` prevents duplicates including concurrent insert races. Seeder has 56 dental-related medication items, idempotently invoked when clinic is created or manually.
- The catalogue is a small clinic-local autocomplete reference, not a drug knowledge base. It lacks fully normalized ingredient/combination, standard drug code, standardized strength/form/package, branded/generic status, contraindication/interaction literature, jurisdiction approval, supplier/lot/expiry and catalog version. ClearFlow should keep catalogue item separate from clinical medication statement and prescription; add terminology mappings as licensing allows.

**Prescription observed**
- Prescription header: clinic/patient/prescriber, draft/issued/cancelled, issue time, notes, locale; issue-time snapshot of prescriber name/license/signature-document ID; country-hook compliance payload JSONB.
- Prescription item: optional soft-linked catalogue UUID, medication name snapshot, dosage, unit, route, frequency, duration, instructions and order. Free-text works when catalogue module is uninstalled; there is deliberately no FK from the optional catalogue.
- Template stores clinic/name/items JSONB; prescriber profile separate from core user stores clinic/user/license/signature document.
- Only a draft can be edited; empty prescription cannot be issued. Issue obtains row lock/re-reads status to prevent two concurrent issues, runs country-specific validation, snapshots prescriber information and issues the legal artifact. Issued prescription is immutable; correction is cancel + reissue; no delete. Uninstall is blocked when issued prescriptions exist. AI has a tool to create a draft but does not issue it; issuance stays a human-authorized action.
- Allergy/interaction warnings are displayed but explicitly not blocking. This warning policy needs clinical/risk review for ClearFlow and must never be generalized without a clinician/regulatory decision.
- Country compliance follows a hook registry keyed by clinic country; required fields, label overrides, issue validation, structured compliance snapshot and PDF data can vary by jurisdiction without making the base schema assume one country. Hooks return structured data, not arbitrary HTML.

**ClearFlow candidate prescription and medication fields**
- Prescription header: patient, encounter/treatment/diagnosis indication, prescriber and licensing snapshot, issuer time, status/version, urgency, locale, country code, pharmacy/fulfilment target, signature/consent, regulatory artifact reference and amendment/cancel reason. Define permitted prescriber roles and any controlled-drug workflow by jurisdiction.
- Line: ingredient(s)/brand, medication standard/code+version, dose amount and UCUM unit, dose form/strength, route, frequency/interval, duration/start/end, quantity and quantity unit, renewals/refills, PRN flag/reason, max dose where legally/clinically meaningful, timing/food instructions, taper/schedule where needed, patient instruction text, substitution permission, pharmacy, line state, external Rx ID and dispensing/transmission records.
- Separate prescription from a medication list/statement (patient actually taking, start/end, source, status), dispense/fill, administration and cancellation/revocation. A prescription created doesn't prove it was dispensed or taken.
- Store each issued prescription snapshot/artifact and keep previous issue/cancellation versions traceable. Never regenerate a prior issued script using current clinician identity, label or mutable catalogue values.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/medication_catalog/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/medication_catalog/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/prescriptions/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/prescriptions/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/prescriptions/hooks.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/prescriptions/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/prescriptions/test_prescriptions.py

### 19.8 New ClearFlow acceptance tests derived from this batch

1. Periodontal site states distinguish not measured from measured normal/negative; BoP/PI/CAL denominator counts follow an explicitly approved formula and report coverage/number assessed. Partial exam cannot silently appear to have a complete normal index.
2. A closed periodontal snapshot cannot be edited/reopened; correction creates a new snapshot and preserves old exam and author. Draft open is idempotent. Patient archive handles draft/snapshot according to explicit retention rules.
3. Validate permanent vs deciduous tooth numbering using declared notation/dentition, not only numeric range. Mixed dentition and implants must behave as the selected clinical standard requires.
4. Orthodontic control update re-derives current wire state from latest control; deleting/reordering controls is protected or recalculated in a versioned transaction. Terminal transitions cannot be bypassed; transferred-out case does not delete plan/financial history.
5. Monthly installment schedule must sum exactly to outstanding plan/session amount, refuses rewrite after any completed session, and is idempotent under retries/concurrent scheduling.
6. Lab order transition sequence and event history: repeated received update cannot rewrite received date; illegal edge rejected; cancellation retains source references; remake/rework creates new linked attempts rather than erasing prior order.
7. Treatment consumption duplicate event must not decrement a lot twice; recipe snapshot/version and actual item+lot+quantity used remain linked to treatment/session; insufficient stock follows explicit transactional policy.
8. Same DICOM file re-scan does not duplicate a document/study. Failed import remains retryable. Ambiguous patient identity stays pending with no suggestion; approved identity link is actor-attributed, clinic-scoped and revocable.
9. Imaging annotations never mutate source pixels; millimeter geometry is absent (not invented) without pixel spacing and correctly uses rows vs columns for non-square images.
10. AI job proposed by autonomous agent cannot execute until authorized confirmation; artifacts stay drafts; confirmed/rejected per-finding review does not overwrite raw output. Record the exact model/weight version and license; inference failure creates durable state.
11. Two concurrent prescription-issue calls cannot both issue; issued script cannot edit/delete; cancel-and-reissue preserves prescriber and compliance snapshots.
12. Catalogue rename/retire does not rewrite existing prescriptions; prescription item has a frozen medication string/form/strength snapshot.


---

## 20. Batch follow-up: inventory/procurement, recall, schedules, relationships, staff, finance and lead intake (27 October 2026)

### 20.1 Inventory ledger and procurement details

**Observed inventory ledger**
- InventoryItem: clinic, name/category/unit, stock_quantity and min_quantity as Numeric(12,2), nullable unit_cost, active flag, notes and creator.
- StockMovement: clinic/item, signed delta, reason/note, loose reference type/ID, actor/time. Rows are append-only. A DB CHECK prevents negative stock quantity; every update uses SELECT FOR UPDATE and writes movement in the same transaction.
- Consumption idempotency is backed by a partial unique index on reference_type + reference_id + inventory_item_id for reason='consumption'. Duplicate treatment events do not deduct twice.
- A reference-specific policy uses clamp_at_zero for automatic treatment consumption: if stock is insufficient, it floors stock at zero and records only the applied delta. This avoids blocking clinical care but does not provide full material traceability by itself. The unmet amount must be recorded as a shortage/exception and reconciled. ClearFlow must not silently treat the requested quantity as fully consumed.
- Opening stock and absolute corrections are represented by ledger movements. Items with movement history are deactivated rather than deleted.
- The reviewed current inventory model lacks lot/batch/expiry/location/serial fields. This is a coverage gap for stock needing batch traceability, expiry/FEFO, recall, cold chain or implant/device lot tracking. Stock quantity is a projection that must reconcile to movements.

**Observed procurement**
- Supplier is a 1:1 extension of a generic clinic Contact. Supplier fields include website, payment terms, lead-time days and preferred flag.
- SupplierItem links supplier and inventory item with supplier SKU, quoted price, active flag and unique supplier/item pair. No price validity history, currency, MOQ, purchase pack size, conversion factor, expiry, taxes or delivery-quality history are shown in the reviewed model.
- PurchaseOrder has supplier, status, expected date, notes, creator and received timestamp. Each PO line stores inventory item, ordered/received quantity and unit-price snapshot; one item per PO is allowed.
- PurchaseReceipt and PurchaseReceiptLine represent partial delivery batches, receiver/time, quantity and good/rejected quality. Only good units increment line fulfilment and inventory. Rejected units stay in the receipt record for replacement. Receipt rows, stock movements and status transition commit/rollback together.
- Status graph: draft to sent to confirmed to received, with cancellation paths. Received is reached only automatically when every line is fulfilled; no manual mark-received bypass.
- Reorder suggestion policy is computed on demand. In the reviewed source it computes negative movement consumption over 90 days, average daily use, reorder point as max(minimum, ceil(daily usage × supplier lead time)), subtracts current stock plus open-order quantity, then suggests reorder point plus 30 days of cover. This is one policy, not universal: it omits seasonality, expiry, storage capacity, MOQ/pack size, service levels and purchasing budget.
- ClearFlow candidate extensions: InventoryLot/Batch, stock location, stock movement unit cost and valuation policy, supplier/manufacturer lot, receipt/usage/expiry/recall, unit conversions, reserved vs available stock, shortage exception, physical count, returns/waste, supplier quote history, minimum order quantity, purchase pack/currency/tax, supplier invoice and PO/receipt three-way match. Record actual usage per treatment/session including real lot/location/quantity, actor/time, substitutions and recipe version.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/inventory/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/inventory/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/inventory/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/purchase_orders/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/purchase_orders/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/purchase_orders/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/suppliers/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/supplier_items/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/inventory_reorder/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/treatment_consumables/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/treatment_consumables/service.py

### 20.2 Recall and recall-reminder workflow

- Recall fields: clinic/patient, due_month normalized to the first day of month, optional precise due date, reason/reason_note, priority, status, recommended-by/assigned professional, contact attempt count/last attempt, linked appointment, optional loose treatment ID/category snapshot, completed time.
- Reason vocabulary includes hygiene, checkup, orthodontic review, implant review, post-op, treatment follow-up and other. Statuses include pending, contacted-no-answer, contacted-scheduled, contacted-declined, done, cancelled and needs-review.
- RecallContactAttempt is append-only with server timestamp, actor, channel (phone/WhatsApp/SMS/email), outcome (no answer/voicemail/scheduled/declined/wrong number) and note. A staff phone call is different evidence from an automated message delivery.
- RecallSettings holds reason interval map, category-to-reason map and automation toggles per clinic. Seed intervals in the reference are examples only, not universal clinical rules.
- Duplicate guard for active recall for same patient+reason updates the existing pending row rather than inserting another. Consider concurrency-safe uniqueness and history for due date/priority/note changes.
- Patient archive moves active recalls to needs_review, not delete. Active call lists exclude archived and do-not-contact.
- Auto-link of a scheduled appointment only occurs if exactly one eligible recall for the patient/month; ambiguous matches do not silently link. Appointment completion marks recall done; cancellation unlinks and may reopen it.
- recall_reminders is glue: transactional recall-created event enqueues through NotificationGateway; consent/channel/template handling belongs to gateway; outbox worker sends after transaction commit. Recall record != message sent; enqueue != delivered.
- Reference module downgrade drops recall history despite being optional; ClearFlow needs a retention/backup plan that does not accidentally purge important patient follow-up history when disabling a module.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/recalls/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/recalls/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/recalls/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/recall_reminders/CLAUDE.md

### 20.3 Patient relationships vs contact/authority graph

- DentalPin PatientRelationship connects two patient records with a directed relation type (parent, child, spouse, sibling, guardian, ward or other); inverse label is derived on read. It has clinic scope and a unique ordered pair, but service validates both patients belong to the clinic and rejects self-relation/duplicates.
- Patient-to-patient social relationship is not a contact who is not a patient, guarantor, payer subscriber or legally authorized person. OpenEMR contact_relation records authority and effective dates. ClearFlow must keep social relationship, emergency contact, billing guarantor, insurance subscriber and legal authority distinct.
- If inverse relation is derived, establish allowed inverse mappings, symmetrical type behavior, direction/canonicalization and race-safe duplicate prevention. A single uniqueness constraint on ordered pair does not alone prevent concurrent insert of inverse pair.
- Never infer legal consent authority solely from a relationship label; store legal basis, scope, evidence, validity and revocation separately.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/patient_relationships/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/patient_relationships/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/patient_relationships/CLAUDE.md
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/contact_relation.html

### 20.4 External contacts and media attachments

- Generic Contact is a simple clinic directory for external labs/suppliers/delegates/other with name, one phone/email/address/notes and active flag; Supplier extends it 1:1. ClearFlow should support multiple endpoints and addresses, legal identity, roles/capabilities, service areas, licences, contracts and external IDs; supplier-specific payment information needs restricted permission.
- Document separates file metadata and storage pointer from patient/document purpose: original filename, MIME, size, media kind/category/subtype, capture time, pair to another document, tags, extra metadata, uploader and status. File bytes stay outside DB and service creates thumbnails/medium derivatives. Tenant-scoped storage and MIME validation are important.
- MediaAttachment links document to polymorphic owners using owner type/ID and a registry. Service resolves owner under clinic, verifies it belongs to same patient as document, and deduplicates links. Polymorphic owner IDs lack FKs because optional modules may be removed; the registry must be strongly typed, tenant-aware, tested and audited. For highly queried/high-risk owners, explicit relation tables may be better.
- Before/after pair needs atomic bidirectional update and tests for reassignment/unpair concurrency and archive/delete.
- Attachment does not itself prove consent or clinical relevance. Preserve checksum, upload provenance and source/derived lineage. Issued/signed documents need exact artifact bytes, template/issue context and signatures.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/contacts/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/media/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/media/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/media/CLAUDE.md

### 20.5 Schedules: normalized weekly templates and date overrides

- ClinicWeeklySchedule unique per clinic; ClinicOverride is a date range (closed/custom_hours) with end >= start. ProfessionalWeeklySchedule is unique per clinic/user; ProfessionalOverride records date range unavailable/custom_hours.
- ScheduleShift has four nullable candidate parent FKs (clinic weekly, clinic override, professional weekly, professional override) with DB CHECK exactly one parent. Another CHECK requires weekday XOR specific shift date. Checks validate weekday range and end_time > start_time.
- Availability resolver combines working windows and date overrides; free-slot resolution subtracts actual appointments and returns contiguous gaps rather than arbitrary fixed slots.
- Need tests for same-tenant professional membership, overlapping shifts, split/overnight shifts, DST, provider leave, clinic closure, rooms/equipment, appointments extending beyond close, and exact policy for cross-midnight intervals.
- The module depends on agenda, while agenda can function with a fallback if optional schedules is disabled. Actual appointments are source of truth; occupancy is a derived view.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/schedules/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/schedules/CLAUDE.md

### 20.6 Staff attendance, payroll, treasury and expenses are distinct

**Attendance**
- AttendanceEvent is immutable clinic/user in/out punch with time/note and actor who recorded it. Consecutive same-kind punches are rejected; correction is an opposite punch rather than rewrite. Attendance is separate from planned shifts, overtime and payroll.

**Payroll**
- PayrollProfile stores pay type, base amount/currency, encrypted bank/tax IDs, active and country.
- PayrollPeriod unique by clinic + YYYY-MM; draft -> closed -> paid.
- PayrollEntry stores period/user, gross/deductions/net, notes and unique period/user; net validated as gross minus deductions. Closed/paid periods read-only; changes only in draft. Admin-only/no AI tools; no country statutory calculations in this reference.
- Secret values are write/replace only, responses expose masked last4/has-value flags, and logs/events contain IDs rather than amounts/secrets. Rotating encryption key requires a re-encryption plan. Time-sheet facts are not automatically salary facts.

**Treasury**
- TreasuryAccount is named clinic cash/bank account with opening balance and active flag.
- TreasuryEntry is append-only with amount-positive, kind (opening, transfer out/in, correction in/out), timestamp, actor/memo. Transfer legs share group ID; balance derives from opening plus signed entry ledger.
- Reference lacks automatic payment/expense posting, bank-statement reconciliation, multi-currency accounts, recurring transfer and overdraft prevention. ClearFlow should model receipt, processor settlement, bank deposit and statement matching separately.

**Expenses**
- Simple row with clinic/category/amount/date/free-text description/creator and categories rent/utilities/salaries/supplies/equipment/insurance/maintenance/other. CSV import dry-run default; admin-only due sensitivity.
- Not a full accounts-payable process: no supplier invoice/line/tax, approval, recurrence, payment/bank posting, credit note, attachment, accrual period/cost center or reversal model appears in the reviewed schema. Keep this distinction explicit.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/staff_attendance/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/staff_attendance/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/payroll/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/payroll/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/treasury/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/treasury/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/expenses/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/expenses/CLAUDE.md

### 20.7 Leads, duplicate prevention and untrusted public intake

- Lead is for an inbound enquiry that did not match a current patient. Fields include full name, phone, email, motive/description, preferred days and time-of-day, state new/contacted/converted/discarded, linked patient on conversion and conversion timestamp.
- LeadIntakeKey stores per-clinic SHA-256 hash and visible prefix, not plaintext; plaintext is returned once at rotation. Daily intake cap/counter in settings (reference default 200, range 0–5000, 0 unlimited) and request body has bounded size. Public intake authenticates through X-Lead-Key rather than clinic JWT and does not trust caller-supplied tenant context.
- One routing function handles public and staff intake. If phone OR email matches a non-archived patient, the enquiry routes to a recall rather than creating duplicate lead/patient. Phone/email alone need canonicalization, shared-family safeguards and uncertainty/confirmation policy.
- Free-text motive/description is an untrusted prompt-injection/sensitive-data surface. Reference hides it from ordinary AI summaries and exposes only through a redaction-flagged tool. Key rotation is deliberately not an AI tool because it can break the clinic website.
- ClearFlow should also retain source/campaign/referral, channel, submission/request ID, consent/policy notice, timestamp/timezone, spam decision, duplicate-match evidence, follow-up history and conversion mapping. Ambiguous candidate must stay pending for staff review rather than silent merge.

Source:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/leads/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/leads/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/leads/CLAUDE.md

### 20.8 Patient timeline and segments are projections/grouping only

- Patient timeline is a chronological projection fed by about 22 cross-module events. It is append-only; deletion/archive results in a “removed” event rather than deletion. It deduplicates on event_type + source_id. It depends only on patient core; missing optional source module stops that event feed.
- Timeline is not canonical source of truth or replacement for financial/clinical audit. Mark tables/views as authoritative source, history, cache/projection, reference, raw payload or telemetry. Uninstalling optional functionality must not purge clinical/financial history absent explicit retention approval.
- Patient segments are clinic-local free labels and a separate patient membership link. Segment is grouping only; it does not establish marketing permission/consent.
- These patterns should be reflected in the ClearFlow entity map: canonical object and lifecycle event are primary; timeline/segment summaries are derived.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/patient_timeline/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/patient_timeline/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/patient_segments/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/patient_segments/CLAUDE.md

### 20.9 New acceptance tests implied by this batch

1. Inventory concurrent consumption/manual adjustment: ledger total reconciles to stock; duplicate event does not deduct twice; requested vs actually applied quantity and shortage are visible.
2. Partial PO receipts with rejected units, retried request and mid-transaction failure produce no duplicate inventory or partial receipt.
3. Supplier price, pack size or lead time update does not rewrite existing PO unit-price/terms snapshots; reorder suggestions recompute from current demand and open-order quantities.
4. Expired/recall batch traces to procedures/patients/sessions that consumed that lot; FEFO/lot-selection policy deterministic.
5. Multiple recalls for one patient are never auto-linked arbitrarily; ambiguous association waits for staff and all outreach paths honor do-not-contact/archive status.
6. Recall creation retries do not duplicate active rows; due-date/reason-note changes are audited.
7. Inverse patient relationship insertion concurrently cannot create two representations; social relation does not confer consent authority.
8. Paired before/after documents remain symmetric under reassignment/unpair; tenant and same-patient checks run on all link paths.
9. Schedule resolution handles overlapping shifts, split/overnight hours, DST, leave, clinic closure and resource capacity explicitly.
10. Payroll/treasury/expenses stay role restricted and excluded from AI tools unless an explicit typed policy permits safe projections. Bank/tax secrets never leak.
11. Public lead intake key rotation/revocation, concurrency-safe limits and untrusted prose redaction work as designed.
12. Disabling an optional module cannot purge legally/operationally retained history without a confirmed retention policy.


---

## 21. Batch follow-up: migration import, notification outbox, webhooks, consent/erasure and activity journal (27 October 2026)

### 21.1 DentalPin migration import: source fidelity, operator mapping and recoverable partial execution

The reviewed DPMF migration-import module is a useful implementation reference for importing legacy clinic systems; it is not proof that an import is all-or-nothing.

**ImportJob**
- Fields include clinic/tenant, creating actor, state, human-readable error, original filename/path/size, source system/adapter/exporter/format versions, source tenant label, declared and computed integrity hashes, total and processed entities, resumable checkpoint, explicit fiscal-compliance opt-in, execution options and start/completion timestamps.
- Lifecycle: uploaded → validating → validated → previewing → executing → completed or failed. Validate/preview/execute are background tasks; progress/errors are saved for polling. A row lock plus status check prevents two execute workers from starting the same job concurrently.
- File validation verifies format/magic, compatibility version, encrypted/compressed payload and integrity hash. The passphrase is kept in process memory rather than persisted.
- Preview returns entity counts and sample rows, warnings, binary manifest summary and detection of fiscal compliance records. Proposals are dry-run catalog matching and stored as MappingDecision rows for an operator to accept, re-link, create new or ignore. Bulk acceptance uses a confidence threshold; this is an explicit human approval point for ambiguous catalogue mappings.
- ImportJob has last_checkpoint and commits every 500 entities. The checkpoint enables near-resume after restart; idempotency is actually held by EntityMapping, not checkpoint alone.
- **No rollback in version reviewed:** failure halfway leaves successfully imported target records. It is explicitly documented that catastrophic recovery requires restoring backup. The UI must disclose this. For ClearFlow, if we adopt partial commit, each row must have stable source identity, result, retry behavior and reconciliation; ideally support a separate staging/commit plan, dry run, row-level transaction, compensation or a proven snapshot/restore procedure. Never tell operators a migration is atomic when it isn't.

**EntityMapping**
- Maps (clinic_id, source_system, entity_type, source_canonical_uuid) → target table/row UUID. This is the stable source-to-target crosswalk and primary dedupe control. Unique per clinic/source-system/entity type/source canonical UUID, not per job. This lets repeated imports into the same clinic find an already-imported source row instead of duplicating it; separate clinics can import the same source UUID independently.
- Target UUID is stored as a loose value, not a foreign key, because target tables live in other modules and modules can be optional. Runtime resolver controls reads. Source IDs are not used as FKs; cross-entity source references must go through MappingResolver.
- The entity-mapping uniqueness is a concurrency backstop only if inserts handle a uniqueness conflict by rereading the winner. Test it under concurrent imports, same source file and different jobs.

**FileStaging / ImportWarning / MappingDecision / RawEntity**
- FileStaging maps source file-manifest entry (canonical UUID, owning entity UUID, relative path, declared size, SHA-256, MIME hint) to a resolved media Document after an external agent uploads bytes. Unique per job+canonical file ID; file bytes are staged outside the media library until validated. Hashless files receive a warning and cannot be matched by hash.
- ImportWarning stores entity type/source ID, severity, code, message and raw data. These warnings describe parser/import compatibility and data that may be omitted/skipped.
- MappingDecision stores source catalogue label/code/type, automatic proposed action (link/fuzzy link/create), target/category, score and the operator's decision. When non-pending decision exists, it overrides automatic matcher.
- RawEntity persists source system/entity/source ID and original source JSON per job. It supports data provenance and investigations, but is sensitive: access, retention, redaction and prompt/export rules must be defined. A raw dump should never automatically enter AI context.
- The module writes into target modules by calling their services, so the target services remain responsible for local invariants, side effects and audit/events. Imported clinic_id always comes from authenticated job context, never the payload.

**ClearFlow migration design candidate**
1. Import source bundle and cryptographic manifest/hash; capture source software/version/export time.
2. Staging job, source entities/raw payload and file manifest.
3. Schema/version validation plus required-field and integrity report; retain row-level errors.
4. Identity resolution/dedup suggestions, catalog crosswalk proposals and mappings; per-decision human acceptance.
5. Preview aggregates and samples, including data that will be skipped/retained.
6. Commit authorization and explicit options for legal/fiscal artefacts.
7. Per-entity/row processing state, stable idempotency key, target IDs, warning/error, retry/compensation status; source mapping saved transactionally with each successful target write.
8. Final reconciliation counts and financial/clinical control totals, unmatched attachments, source-to-target mapping export, and immutable audit.
9. Rollback only where explicitly supported by a reversible row operation/snapshot; otherwise label partial import and provide recovery plan.
10. Imported records must retain source provenance and not be misattributed to the current user as the original clinical author; actor who imported and original source author are distinct.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/migration_import/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/migration_import/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/migration_import/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/migration_import/events.py

### 21.2 Notification outbox: request, send attempt, delivery receipt and inbound response are different

The reference Notification module has these core records:
- NotificationTemplate: system-wide or per-clinic template keyed by notification type, locale and channel. Email has subject/HTML/text; WhatsApp uses a provider-approved template name/status and ordered variables. Clinic override is separate from system default.
- NotificationPreference: clinic + patient or user; email/SMS/WhatsApp/push enable flags, channel opt-in timestamps, last inbound message time for a WhatsApp 24-hour session window, per-event-type preferences and preferred locale. The schema supports both patient and user.
- ClinicNotificationSettings: which notification types are enabled/auto-sent and their timing, plus preferred channel, fallback policy, manual channels and SMS daily limit.
- ClinicChannelSettings: one row per clinic/channel with adapter name, enabled/verified flags and non-secret config; provider secrets live in their vendor/integration config.
- ClinicSmtpSettings: per-clinic provider/host/port/user/encrypted password/TLS/SSL/from address/name, active/verified state/time. Secret plaintext is not serialized.
- CommunicationMessage is both outbox row and broad audit record: tenant, channel/direction, destination snapshot, optional patient, template key/message kind, optional literal body for inbound/session sends, status, attempts/max attempts/retry time, provider/provider message ID/error, dedup key, sent/delivered/read timestamps, triggering event/user and sanitized context. Unique partial index on (clinic_id, dedup_key) protects duplicates.
- PushSubscription: clinic/patient, endpoint, p256dh/auth keys, user agent, active state and a unique tenant/endpoint identity; endpoints returning 404/410 are pruned.
- Outbound lifecycle: queued → sending → sent → delivered/read, or failed/retried, or skipped because of opt-out/unavailable channel. Request transaction only enqueues; no network is sent before commit. Dispatcher uses FOR UPDATE SKIP LOCKED for concurrent workers and exponential backoff capped at an hour.
- Before queueing it hard-blocks patient.do_not_contact even when force_send is requested; a per-event-type opt-out and explicit channel opt-out also cannot be bypassed by force_send. Force_send only bypasses clinic's enabled/auto_send gate. This is an important permission invariant.
- Channel resolution tries configured channels in order, checking a viable adapter, target address, patient channel preference and provider policy. SMS quota is per clinic; exhausted preferred channel can fall back to another channel or skip visibly. Proactive WhatsApp requires approved provider template; free-form session replies allowed only within a 24-hour window opened by patient inbound message.
- Provider delivery callback updates message state using tenant + provider message ID, and writes delivered/read timestamps. Read implies delivered. Inbound replies are stored as inbound CommunicationMessage with provider message ID idempotency, opens the 24-hour session window and publishes a reply event. That event payload includes reply text, which is untrusted user-provided prose; downstream AI ingestion must classify/redact it and protect against prompt injection.
- Provider message ID currently isn't itself the queue's original stable identity for every channel; it is provider evidence. Keep our own dedupe key/event ID and provider message ID distinct.

**Important limits and ClearFlow requirements**
- One CommunicationMessage combines queue row and audit data, but only counters/current status are stored for repeated send attempts. If per-attempt request/response evidence is required, add NotificationAttempt with attempt number, provider, request/event correlation ID, timestamps, HTTP/provider result, error code and retry decision; avoid overwriting the first failed attempt.
- "Sent" means provider accepted/sent request, not necessarily delivered; "delivered" relies on provider callback. Unknown state after timeout needs reconciliation, not false failure/success.
- SMS cap should count by defined clinic-local business day or explicit UTC day as policy; reference counts UTC day. Country/legal/business communication rules must choose and disclose.
- Do not use Boolean preference alone as a legal consent proof. Store exact notice text/version, purpose, channel, source, who/when, opt-in mechanism and withdrawal history; distinguish absence of stored preference from affirmative consent if legal policy requires opt-in.
- Default type-preference in reference includes all supported types set true; missing key reads as consent. Treat this as reference-specific behavior, not a universally safe default. In ClearFlow, central consent/communication policy must specify type-level default, channel opt-in and lawful basis, especially for marketing vs care reminders.
- Dedup key must be stable per logical notification occurrence. Rescheduling must create a new reminder occurrence, but retry of the same occurrence should not resend a delivered message. Queue idempotency should be part of the event/notification occurrence model.
- Notifications can be subject to erasure/redaction, but financial/clinical message evidence can have retention obligations. Preserve message status/ids while redacting only categories that policy allows.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/notifications/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/notifications/gateway.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/notifications/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/notifications/CLAUDE.md

### 21.3 External webhook integrations and API tokens

- WebhookSubscription stores clinic, description, target URL, ordered subscribed event types, encrypted HMAC signing secret, active state, consecutive failure count, disabled time/reason.
- WebhookDelivery doubles as outbox and delivery audit: subscription/clinic, event type/payload, stable event_id shared across subscriptions for one emitted event, queue status, attempt/max attempts/next attempt, response status/error/sent time. Retry backoff is exponential and subscription auto-disables after repeated consecutive failures.
- Enqueue is database-only inside publisher transaction; scheduled dispatcher uses FOR UPDATE SKIP LOCKED, commits state before network call and uses raw-body HMAC signing. Event ID lets receivers deduplicate across retries/subscriptions.
- Target URL is supplied by tenant admin and server POSTs to it, so the module applies SSRF protection at create/update and again before delivery: HTTPS, DNS resolution and rejection of private/loopback/link-local/reserved/multicast IPs and unsafe IP literals. DNS/rebinding and redirects should also be evaluated in ClearFlow's actual HTTP client; URL validation only at creation is insufficient.
- Webhook secret is high-entropy, encrypted at rest and revealed once; API token is high-entropy, SHA-256 hashed for indexed lookup (appropriate for random high-entropy secrets, unlike passwords), shown once and soft-revocable, with scopes. A scope catalog alone is not enforcement; every read endpoint must verify requested scope, tenant and actor. Never assume token issuance means future data endpoint enforces all intended scope.
- Public data-read integrations are rate-limited per token (ref: 60/min and 1000/day), tenant-scoped from resolved token rather than URL/body, and last_used_at is updated.
- Stable event IDs, HMAC signature, timestamp tolerance, retry queue and receiver idempotency contract should all be part of ClearFlow integration spec. Keep event schema version and canonical payload version to prevent incompatible replay after deploy.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/integrations/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/integrations/gateway.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/integrations/CLAUDE.md

### 21.4 Consent, data-subject requests, retention, erasure and breaches

The inspected GDPR module is an EU-specific reference. Do not treat its 30-day deadline or legal categories as universal rules for India/other jurisdictions.

**Observed models**
- GdprRequest: tenant, optional patient, requester name/email, request type (access, rectification, erasure, portability, restrict), state received/in_progress/completed/rejected, received/deadline/resolved times and notes. It is a ticket tracker in v1; rectification/restriction request does not necessarily mutate the underlying record in that module. Request rows are not deleted.
- PatientConsent: append-only grant/withdraw record per patient/purpose, exact text shown to subject, granted bool, grant/withdraw times. Current consent is latest row per patient+purpose; previous grant/withdraw event remains. Purpose vocabulary is canonicalized. More fields are needed for ClearFlow: notice version, source/channel, representative authority, identity verification, scope, version, language, evidence/hash, withdrawal actor and exact event time.
- RetentionPolicy: clinic/category, retention years, legal hold date, active. A unique partial index permits one active policy per clinic/category, leaving superseded policy rows as history.
- ErasureAuditLog: patient/request reference, categories erased, fields blanked, rationale, execution time/actor. Append-only.
- DataBreach: description, involved data, affected people, status, authority/subject notification timestamps and notified subject count.
- Partial erasure sets permitted identity/contact fields NULL while retaining the patient and legally retained clinical/fiscal records. For each module an ErasureContributor declares what can be redacted/retained; all contributors run within one transaction; a failure rolls back; post-commit event announces outcome.
- The reference determines erasure category eligibility using active retention policy, legal_hold_until and age relative to patient.updated_at. This is a particular implementation shortcut: updated_at is not necessarily the valid or collection date of every category. ClearFlow needs category-specific retention anchors (record creation/collection, last clinical activity, document issuance, legal requirement) and authoritative legal review. Never choose the age anchor from convenience.
- The module says invoice snapshots, clinical notes, documents, timeline and fiscal evidence may need retention under other obligations. Erasure is not necessarily hard deletion; retaining information should be justified, access restricted and logged.

**ClearFlow requirements**
- Consent state/event, request ticket, identity/representative verification, jurisdictional policy, per-category retention rule/version, legal hold, export job and erasure job/report each need separate model/state.
- Data request lifecycle should track deadline, extension/clarification, identity check, scope, communication with requester, per-system completion, reviewer/approver and outcome evidence. Request status cannot be equivalent to the actual completion status of every contributor.
- Erasure must enumerate first-party databases, object storage, backups, search/vector indexes, caches, external processors, logs and third-party integration copies. Define how deletion/tombstone propagation, backups and legal holds are handled.
- Each erasure run should record category, fields/entities processed, retained/deferred reason and policy version; do not state “fully deleted” if data remains in a legal hold or backup. Retention categories are jurisdiction-specific.
- Data breach register should track discovery time, nature/scope, affected systems/categories/subjects, risk/severity, containment, evidence, decisions/approvals, notification deadlines/outcomes, external reference and postmortem tasks; not only free-text description and count.

Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/gdpr/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/gdpr/service.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/gdpr/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/notifications/CLAUDE.md

### 21.5 Activity journal vs audit trail vs timeline

- ActivityJournalEntry is an append-only subscribed-event log: clinic, event type, optional actor and patient IDs, source module/table + entity ID, complete event payload JSONB and occurred_at. Cross-module IDs are loose so optional module removal does not break schema FKs. Event subscribers write transactionally inside source publisher transaction.
- This is different from a patient timeline (patient-centric derived feed), a field-level security audit (who read/wrote what and before/after), a fiscal ledger, a provider delivery log, or an AI execution log. Full event payload can contain sensitive prose/amounts; access, retention and redaction need per-event schema rules. Do not treat the generic event journal alone as a sufficient clinical access audit.
- For ClearFlow, keep independent retention/data-classification contracts for: business event/outbox, activity journal, patient timeline projection, field change/audit, notification/webhook delivery, AI execution, import trace, access log, fiscal records and clinical artifacts. Correlate with common request/correlation/source event IDs without flattening them into one unrestricted log.

Source:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/activity_journal/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/activity_journal/events.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/activity_journal/CLAUDE.md

### 21.6 Acceptance tests implied by batch 21

1. Import one source bundle twice, concurrently, and after failure at entity 500; mapping table prevents duplicates; warning and processed counts do not double; imported target data remains linked to original source identity.
2. Retry failed import job after an operator resolves catalog mappings; accepted/relinked/create_new/ignored decisions win over fuzzy matching. Same source identity imported into a different tenant does not collide.
3. Verify hash mismatch, unsupported major version, wrong passphrase, missing binary hash, corrupt binary, and cross-tenant staged attachment each produce durable warning/failure without creating an unvalidated document.
4. Repeat notification enqueue for same logical occurrence: one message row. Repeat webhook event: same event_id and receiver can dedupe; separate subscriptions each get their own delivery row. A failed attempt keeps error/retry evidence.
5. Explicit do_not_contact or channel/event opt-out blocks even forced/manual sends. Template fallback respects locale/channel/provider approval. Missing adapter/invalid destination results in visible skipped/failed state, never fake sent.
6. Provider accepts send then worker crashes before commit; delivery is unknown and reconciled by provider ID/idempotency, not blindly resent without policy.
7. Incoming webhook/message duplicate event ID is a no-op; verify HMAC against raw body/time tolerance, scope token, revoke token and tenant filters, SSRF/DNS-rebinding/redirect safeguards.
8. Consent withdrawal appends a new row and blocks future applicable processing while old evidence remains. Marketing and care reminder have distinct purposes; missing purpose key behavior follows explicit ClearFlow policy.
9. Erasure with a failing contributor rolls back all redactions; a retention/legal hold causes category to be retained and documented; timeline/invoice/note redaction coverage is explicit; vector/search/media copies receive same policy.
10. Changing retention policy does not rewrite prior policy evidence; concurrent policy creations have one active row; different retention anchors are tested per category.
11. Patient timeline/event journal duplicates are idempotent, append-only, tenant-scoped and do not include unredacted sensitive payload in LLM summaries.
12. Privileged AI tools cannot rotate a public intake/webhook key, run irreversible erasure or change permissions without the policy-defined human approval path.

---

## 22. Supplemental source-research appendices (27 October 2026)

The full continuing reference inventory and detailed source observations are also kept in repository addenda so none of the material is dropped between deep-dive sessions:
- PROJECT_NOTES_ADDENDUM_B17_B22.md — AI command execution approval gap; tenant-composite FK concerns; row-idempotent import; OpenEMR prescription/order/report and clinical document lifecycles; DentalPin approval/tool registry/transaction patterns; authoritative payment versus gateway attempt/refund; invoice issue snapshots and credit note constraints; stock movement ledger; specialty periodontal/orthodontic/recall/media/imaging AI; legacy migration provenance.
- PROJECT_NOTES_ADDENDUM_B23_B24.md — OpenEMR insurance and subscriber/effective dates, eligibility checks and benefit response lines, provider identifiers, claim/billing line and X12 processing fields, AR/EOB posting sessions, payment-processing/reversal audit; DentalPin on-demand reorder policy and supplier-specific prices; notification preferences/outbox/retry/delivery evidence and strict do-not-contact/per-purpose opt-outs; media taxonomy/owner registry, patient clinical context and appointment lock/timezone findings.

### 22.1 Reconfirmed payer accounting model
Keep plan/policy/subscriber, eligibility request/response, preauthorization, claim header/version, normalized claim lines, payer response/remittance batch, line-level payment/adjustment postings, actual receipt/allocation/refund, and bank/deposit reconciliation distinct. OpenEMR's AR activity exposes fee vs pay_amount vs adj_amount, payer type, posting batch, reason code and payer claim reference; AR session separately stores check/EOB reference, check date, deposit date and post-to date. A benefit verification is point-in-time evidence, not permanent coverage.

### 22.2 Reconfirmed communication safety model
Patient do_not_contact and per-purpose/channel opt-outs remain hard blocks even when manual or forced send is requested. Force-send only bypasses clinic auto-send/enable settings in the inspected DentalPin path. Notification queue row, provider request/attempt, provider sent/delivered/read evidence and patient reply are separate states. Enqueue dedupe needs a database uniqueness backstop; dispatcher uses locked, skip-locked claim of due outbox rows, retry limits and explicit failure/skip reasons.

### 22.3 Reconfirmed AI execution and data-ingestion model
An LLM-generated requiresApproval field is not authorization. Server policy must require a persistent approval tied to exact proposed payload/version, tenant/user/permissions, target IDs and current record version. Invoice/payment/stock side effects must be transactional/idempotent. Import rows need source hash/mapping/edited-value signoff, stable source identity, row-level outcome, restart-safe retry, reconciliation and explicit opening-balance semantics. A source system's model/table count is not evidence of completeness or integrity.

### 22.4 Specialty-care model coverage
Periodontal charting is a dated snapshot with tooth/site rows and immutable closed state; orthodontic treatment is a longitudinal case with repeated controls and next-due derived from latest control; recall is an outstanding care obligation with append-only contact attempts; clinical photo/X-ray objects require taxonomy, original/derivative metadata, capture time, same-patient pairing and scoped storage; AI imaging output remains a draft until clinician review. These should be represented separately from generic notes, appointments or message delivery.

Research is ongoing. Keep the existing addenda and long-form workspace dossiers together with this main project notebook. Do not remove or merge away source evidence merely to simplify the UX.

---

## Batch 18 — OpenEMR payer/eligibility/claims/AR and DentalPin lifecycle tests (2026-10-27)

### OpenEMR insurance and eligibility fields
Sources: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/insurance_data.html ; insurance_companies.html ; insurance_numbers.html ; benefit_eligibility.html ; eligibility_verification.html.
- Coverage includes primary/secondary/tertiary order; payer/plan/policy/group; subscriber name/identifier/relationship/DOB/sex/contact/address/employer; copay; effective/end dates; assignment flag.
- Payer organization stores payer/CMS IDs and aliases, payer type, X12 receiver/partner/eligibility identifiers, inactive state and timestamps. Provider enrollment identifiers distinguish provider versus rendering-provider number, group number and identifier type.
- Eligibility verification stores coverage, external response ID, check timestamp, copay, deductible and deductible-met state. Benefit response rows include benefit type/subtype, coverage dates/level/type, plan text/period, amount/percentage, network indicator, message and response status.
ClearFlow: normalize payer, plan, subscriber/member, covered person, coverage period, provider enrollment, each eligibility request/response and benefit observation. Retain the exact raw payer response/hash as evidence. An eligibility response is a time-bound observation, not a guarantee of payment.

### OpenEMR claims and AR posting
Sources: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/billing.html ; claims.html ; ar_session.html ; ar_activity.html ; fee_schedule.html ; x12_partners.html ; x12_remote_tracker.html
- Billing service rows include date, code system/code/text, patient/provider/encounter, authorization, payer, billed/activity state, process state/date/files, modifier, units, fee, justification, target, clearinghouse ID, external ID, price level, revenue code/category.
- Claim records include patient/encounter/payer, version, claim status, payer type, processing status/times/files, clearinghouse partner/target and submitted claim payload. Preserve submitted versions if corrected/resubmitted.
- AR session groups posting with payer/user, open/closed state, check/EOB reference, check/deposit/post dates, total/global amount, payment method and adjustment code. AR activity is line-level code/fee/modifier/payer type, post actor/time/session, received payment amount, adjustment, memo, follow-up flag/note, reason code, void timestamp, post date and payer claim number.
- Fee schedule has insurer, plan, code, modifier, fee type, fee and effective date. X12 partner config includes sender/receiver/submitter IDs, processing format, eligibility/claim-status/attachment endpoints, file transport and credentials. Remote tracker preserves outbound file/status/claims/messages/timestamps.
- Legacy payments contain patient/encounter/time/user/method/source and amount/posted amounts; payment processing audit holds processor, success/action, amount/ticket/transaction IDs, payload/time and reversal links. A gateway details table includes credential-like fields; ClearFlow should use secure secret references instead of ordinary settings.
ClearFlow: clinical care/charge, claim version, submission/acknowledgment, adjudication, remittance, AR posting batch/line, gross receipt, allocation and settlement are separate entities. Claim status is not cash collected. Model denials/appeals/replacements, patient responsibility, contractual adjustments, receipt distribution, clearinghouse correlation and reconciliation. Submitted payload versions are evidence.

### DentalPin financial and operational tests
Sources: https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/billing/test_credit_note_cap.py ; test_invoice_number_unique.py ; test_issue_billing_snapshot.py ; test_payment_bridge.py ; https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/payment_gateways/test_payment_request_lifecycle.py ; test_refund_lifecycle.py ; https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/inventory/test_stock_movements.py ; test_auto_deduction.py ; https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/prescriptions/test_prescriptions.py
- Credit-note ceiling counts live drafts as well as issued credits; deleted/voided rows do not count. Issue rechecks a draft’s ceiling. Lock and re-check transactionally to stop concurrent credits exceeding invoice total.
- Issued invoice number/series sequential are DB-unique; drafts may exist without numbers. Billing identity/tax data are snapshotted at issue. Identifier type matters; do not assume passport qualifies for domestic tax ID.
- A receipt must reconcile across payment ledger, patient account, invoice summary and accepted budget. On-account credit can later be allocated to invoices; downstream summaries need atomic updates.
- Gateway attempt is not a receipt until trusted amount/currency-verified confirmation. Initiation has an idempotency key; duplicate completion webhooks cannot double-pay. A refund in processing state is not a core refund; completed provider result creates exactly one, capped by remaining refundable amount.
- Opening stock is ledgered. Each stock change locks item and appends movement atomically; underflow is rejected without a movement; items with history deactivate rather than delete. Treatment material deduction uses idempotency keyed to treatment/reference + inventory item.
- Prescription is draft → issued → cancelled. Issued contents freeze; correction is cancel/reissue. Issue snapshots prescriber and locale, rechecks concurrent state, and requires clinician authorization. Agent tools may draft but cannot issue.
- Periodontogram is a dated draft/closed snapshot with per-tooth and six-site measures: probing depth, gingival margin, bleeding, plaque, suppuration, mobility, prognosis, furcation and keratinized gingiva. Explicit false is not the same as not measured. Closed snapshots are immutable; aggregate indices are recomputable. FDI/permanent-only checks specific to periodontogram must not apply to every tooth record.
- Orthodontic case captures appliance type/status/start/estimated duration/professional/plan; control captures performed time/by, wires, procedures, aligner number, hygiene, notes, next interval and appointment/session link. Next control is derived from latest control and may create a separate recall.
- Odontogram separates current tooth state from a clinical Treatment that may affect one/many teeth or global mouth/arch. TreatmentTooth records surfaces and roles. Treatment snapshots price/duration/tax and performer/time.
- Media document captures clinic/patient, document type, title/description, file key/MIME/size/name, kind/photo/X-ray taxonomy, EXIF/manual capture time, before-after pairing, tags, uploader/status. Polymorphic attachments require registry validation of owner and patient scope; retain original and derivative/hash lineage.
- Imaging AI job stores source/series documents, model/backend/version, proposed/queued/running/done/failed/cancelled state, queued-by, clinical review/confirmation, error and artifact IDs. Output remains draft until clinician review and is not diagnosis.
- Recall is a call-back task with due month/day, reason, priority/status, clinician, linked appointment/treatment snapshot. Append-only recall attempts store actor/time/channel/outcome/note. Recall != reminder delivery != marketing campaign.

### Migration import and AI approval concurrency
Sources: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/migration_import/CLAUDE.md ; https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/migration_import/models.py
- ImportJob retains file/source/exporter/format versions, declared/computed integrity hashes, tenant label, entity counts/checkpoints/progress. EntityMapping key is clinic + source system + entity type + canonical source UUID; external IDs map through resolver, not direct FKs. Binary manifest includes parent type/UUID, relative path, size/hash/MIME.
- Mapping proposals are reviewed as accept/relink/create_new/ignore with visible score; operator override wins over fuzzy matching. Clinical treatment history is independent from financial debt. Catalogue price is not evidence of performed charge/receivable; import actual source debt records instead of inventing debt from treatment fees.
- DentalPin agent tools use typed argument schemas, hard allowed-tool list, permissions, read/write/destructive categories, supervised queue and audit. The reviewed approval decision helper is select-then-update without visible row lock/conditional compare-and-set; sequential double-decision tests do not prove concurrent race safety. ClearFlow approval must bind to immutable proposal hash + target version and use atomic compare-and-set/row lock plus concurrent tests.
- Import v1 documents no whole-job rollback, leaving partial state possible. ClearFlow should use transactional row/parent-child chunks, stable idempotent source-row keys, durable checkpoint/restart recovery, row errors and reconciled completion counts.

### Canonical coverage additions from this batch
Payer/provider enrollment and effective coverage; eligibility request/response/benefit observations; claim versions and normalized lines; clearinghouse exchange/acknowledgment; remittance lines; AR sessions/activities/reconciliation issues. Clinical order ≠ result ≠ reviewed/acknowledged result. Prescription ≠ patient-reported medication ≠ dispense/administered medication. Add periodontogram/orthodontic snapshots, imaging-series and AI artifact lineage, recall attempt history, import file/entity mapping/proposal/reviewer/row outcome/checkpoint/reconciliation.

Evidence note: OpenEMR EHI export pages document schema fields but do not prove all current DB constraints/runtime behavior. DentalPin fake gateway adapters test workflow, not a live provider. Label each finding Observed-DB, Observed-service, Observed-test, Interpretation, ClearFlow candidate or Decision pending.

**Batch 18 status:** source fields extracted and targeted service/test comparison completed for this pass; overall schema remains under research. Next: Open Dental workflow comparison, OpenEMR medication/order/document amendment/security paths, and further DentalPin migrations/services.


---

## Batch 19 — OpenEMR medications, clinical orders/results, documents/signatures, patient flow (2026-10-27)

### Prescription schema
Source: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/prescriptions.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/drugs.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/drug_sales.html
- OpenEMR prescription (49 documented fields) includes patient/pharmacy/prescriber/encounter, created/modified/filled dates, start/end dates, drug ID/RxNorm/free-text name, form, dosage, quantity, size/unit, route, interval, substitution, refills/per-refill, active state, notes/site, GUID/external ID, eRx source/upload/raw data, indication, PRN, usage category/request intent, detailed SIG, diagnosis/justification and creator/updater.
- Drug catalogue includes NDC, form/size/unit/route, reaction text, reorder/max level, substitution/lot-combination flags, active/consumable/dispensable and timestamps. Drug sales links item/lot/prescription/patient/encounter, quantity/fee, bill state/date, price level, actor/time and transaction kind (sale/purchase/return/transfer/adjustment).
ClearFlow should separate patient-reported medication, clinician medication-list assertion, prescription, transmitted eRx, dispense, administration and discontinued medication. Preserve structured dose/frequency/duration and exact original SIG. Prescription is not a stock or sales transaction. eRx needs idempotency, exact sent payload/version, external correlation, response state, retry and cancel propagation.

### Clinical order and result schema
Sources: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_order.html ; procedure_order_code.html ; procedure_order_relationships.html ; procedure_report.html ; procedure_result.html
- Order header: patient/provider/encounter, order and collection times, priority/status, instructions, lab/facility, specimen type/location/volume, transmission time, clinical history, external control ID, history-only flag, diagnosis, billing type, fasting/PSC hold, collector, account/facility, provider number, order type/intent, scheduled time interval, performer type and location.
- Order line: code/name/sequence, original versus added after send, diagnosis, do-not-send, title/type, transport and reason date interval/status. Resource link uses typed FHIR resource + UUID + relationship/actor/time.
- Report: order/line, collected/reported times and timezone offsets, source, specimen number, report status/review status and notes. Result line: value type, code/display, date/facility/unit/value/range/abnormality/comments/document and preliminary/final/corrected/incomplete result status.
ClearFlow should normalize order lines and results with code system/version, value type, units, reference interval, interpretation, effective time and source. Order != result != clinician-reviewed/acknowledged result. Corrected result retains linkage to original. Preserve relevant source timezone. Dental lab workflows are similar in structure but require dental-specific validation; do not assume general medical labs are the same.

### Document, legal template, signatures
Sources: OpenEMR EHI dictionary tables documents, documents_legal_master/detail, esign_signatures, document_templates, document_template_profiles, clinical_notes_documents.
- Document fields include UUID, storage type (URL/blob), size/MIME/pages, created/expiry, owner, revision, logical document/capture date, hash, category/name, storage backend/revision IDs, import status, encounter link, deleted state and optional foreign table/ID reference.
- Legal template has category/subcategory, name/path, facility/provider, signature coordinates, filename, effective date/version, content, saved-signature/review flags and upload source. Instance records patient/facility/provider/encounter/template, signature status/time, signing person/stage, filled layout/PDF source, denial reason and patient comments.
- E-sign record stores signed target row/table, signer, time, lock flag, amendment text, signed-data hash and signature hash. Templates/instances preserve profile/category/location/status/send/end dates/content/MIME; reusable profiles add active/recurring and event/notification trigger/period. Note-document junction records link actor/time.
ClearFlow should store immutable source or object version/hash, derivative lineage, exact template version, merge-data snapshot, renderer version, language and issued artifact hash. Signature binds authenticated signer/representative authority to exact artifact/data hash, intent, method/time, sequence and signed/declined/unable state. A signature image or boolean alone is inadequate. Corrections reference original and preserve author/time/reason; no silent editing of signed records.

### Patient flow and audits
Sources: OpenEMR EHI dictionary tables patient_tracker, patient_tracker_element, audit_master, audit_details.
- Patient flow event stores actual timestamp, appointment date/time, patient/encounter/event, original user and sequence expectation; child stores timestamp, room, status, sequence and user. This is different from appointment lifecycle.
- Audit approval pattern records subject, approver, pending/approved/denied/cancelled state, comments, created/modified time, IP, event type/flags and changed table/field/value rows.
ClearFlow should separate appointment state from timestamped queue/room flow events. Audit should capture before/after diff or version, actor, approver, reason, tenant, session/correlation, source (human/agent/job/integration), operation and result. Separate security, clinical amendment, finance/fiscal, workflow and AI execution audit types.

### Batch 19 derived model additions
Prescription lines/eRx reconciliation; clinical order/order lines/typed resource links/results/review/correction; immutable document object versions and hashes; versioned templates/rendered artifacts/signature authority/amendment; patient-flow events; field-level approval diffs. EHI table documentation confirms field inventory, not all runtime constraints—migrations, service code and tests remain needed. Research continues.

## 23. Batch 25 addendum — clinical reference mappings and patient safety warnings

See PROJECT_NOTES_ADDENDUM_B25.md for full source-derived findings from DentalPin patient clinical history and the medical-reference module. Highlights: allergy, medication, systemic disease and surgical history are repeatable soft-archived records; nullable blank form fields need explicit normalization; local plain-name reference lists are not authoritative terminology; interaction/contraindication warnings only use active patient entries with reference IDs; unstructured unmapped medications are excluded rather than guessed. ClearFlow must preserve such free-text facts and warn that automated matching coverage is incomplete, version and source every clinical rule, keep clinician review for safety-critical mapping, prevent cross-tenant reference links, and test reverse-order duplicate interactions under concurrency.

Repository research index now includes PROJECT_NOTES_ADDENDUM_B17_B22.md, PROJECT_NOTES_ADDENDUM_B23_B24.md and PROJECT_NOTES_ADDENDUM_B25.md. These supplement this main notebook with the intervening source-level evidence; the full long-form working dossier remains in the workspace.

---

## Batch 20 — Runtime/service cross-check, event transactions and AI tool boundary (2026-10-27)

### OpenEMR current schema metadata
Source: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/schemaspy/schemas/openemr.meta.xml
- Procedure order status is sourced from a controlled option list: pending, routed, complete, canceled. Order, report and result status remain separate.
- Prescriptions link patient default pharmacy and use drug ID/RxNorm plus free-text instruction fields and external eRx source/upload status.
- Documents support a polymorphic foreign-reference table + ID and logical capture/document date distinct from storage creation/revision date.
Schema metadata confirms field/FK descriptions; it is not proof of every runtime transition.

### DentalPin structured clinical history
Source: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/patients_clinical/models.py
- MedicalContext 1:1 patient records pregnancy/lactation/week, anticoagulant medication and INR/date, smoking/frequency, alcohol, bruxism and anesthesia reactions/details.
- Allergy is N:1 with name/type/severity/reaction/notes/reference ID and active/archive state. Medication stores name/dosage/frequency/start/notes/reference/state. SystemicDisease includes name/type/diagnosis date/controlled/critical/medications/notes/reference/state. SurgicalHistory stores procedure/date/complications/notes/reference/state.
- EmergencyContact and LegalGuardian have separate 1:1 rows; guardian includes identity/document/contact/address/notes. For ClearFlow, review whether enterprise needs multiple guardians/contacts, multiple scopes of authority, validity, support evidence, and separate “may make medical decisions” vs “may receive information”.
- Optional medical reference module IDs are plain UUIDs to preserve modular install/uninstall independence. This is a deliberate optional-module tradeoff; do not copy it to critical core relationships without an explicit integrity design.

### DentalPin lab orders
Sources: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/lab_orders/models.py ; backend/app/modules/lab_orders/CLAUDE.md ; tests under backend/tests/modules/lab_orders.
- Current LabOrder contains clinic/patient/lab contact, work type, tooth reference, impression type, antagonist information, shade, status, sent/expected/received dates, notes and creator. Clinic-scoped; no hard delete, cancellation is a workflow state, status changes emit events.
- It is a useful spine, not a complete enterprise dental prosthetic workflow. Research whether to add work-spec lines, tooth/role mapping, materials/manufacturer, shade system/lighting, scan/impression assets, opposing/occlusion, implant system/abutment, CAD/design assets, estimate/cost, shipping, try-in, QC, rework/remake reason, delivery/seated dates and warranty. These are candidates for dental-lab validation, not assumed requirements.
- Decide whether labs/suppliers/service vendors share a normalized organization + roles/capabilities or different entities, based on payment/accounting and compliance needs.

### Recall event transaction boundary
Source: https://github.com/dentalpin/dentalpin/blob/main/backend/tests/modules/recalls/test_auto_link_on_schedule.py
- A previous appointment-scheduled event handler opened its own DB session and could not see an appointment that was only flushed in the publisher's transaction. FK insert failed; the bus swallowed the error and the recall was silently not linked. Fix uses transactional handling.
- Essential internal side effects should run transactionally on the publisher session (handler failure aborts) or use a transactional outbox after commit. Fire-and-forget event handlers that swallow errors are unsafe for bookkeeping (invoice/payment bridge, recall links, inventory consumption, patient timeline).
- External/async effects need durable outbox jobs, unique event/idempotency keys, retries/dead-letter/reconciliation. Do not say “published” means downstream completed. Ambiguous recall matches remain unresolved, not randomly selected.

### DentalPin AI tool registry
Sources: https://github.com/dentalpin/dentalpin/blob/main/backend/app/core/agents/tools/registry.py ; backend/tests/test_agents_allowed_tools.py ; backend/tests/test_agents_approval.py
- The tool registry is a single invocation chokepoint: tool exists → allowed-tool subset → guardrails/rate limit/block/approval → RBAC → typed Pydantic parameter validation → execute → audit regardless of success/failure. Empty allowed-tools list means none; null means no subset restriction.
- A supervised write that needs review inserts an approval queue request and returns pending-approval without executing it. Tests cover allow-list refusal, approval queue and cross-clinic request access. This is preferable to a model-generated requiresApproval flag.
- The inspected approval decision helper selects a pending row and updates it, without visible row lock or compare-and-set; sequential double-decision tests do not prove concurrency safety. ClearFlow must atomically claim approval (conditional update or row lock), authorize reviewer, bind to exact immutable action argument hash + target version and test concurrent approve/reject.
- Typed IDs and dates in tool argument schema improve model output and fail fast at the operation boundary. Do not allow arbitrary tool names, untargeted free-form write parameters or hidden side-effect arguments.

### DentalPin media ownership validation
Sources: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/media/service.py ; backend/app/modules/media/attachment_registry.py
- Attachment service resolves polymorphic owner under clinic scope and verifies resolved owner patient ID equals document.patient_id; duplicate identical links are idempotent.
- Owner polymorphism has no ordinary owner FK, so its registry is a critical security/integrity boundary. ClearFlow should use typed junction tables or a strict registry with tenant/patient ownership validation, registration tests and orphan scans.

### Batch 20 requirements
Structured medical history should preserve source/validity/review; lab workflow needs validated scope; must-use transactional event handling for internal invariant side effects and outbox for remote work; agent operations must be typed and controlled at a server chokepoint; approvals need atomic single-winner resolution + immutable proposal/target binding; polymorphic attachments must verify owner/patient/tenant. Batch status: runtime/service cross-check complete for this slice; research remains ongoing.


---

## Batch 21 — Open Dental API workflow reference (2026-10-27; third-party documentation mirror)

Mirror: https://github.com/rbarfinezhadfeli0/open_dental/tree/25d68236cda608bd699296dfaeed9caee2bb9372/docs/www.opendental.com/site. Recheck current official Open Dental docs before implementation. Open Dental public source repository LICENSE states GPL v2; schema/workflow concepts used for research only, no code reuse assumed.

### Procedure log and treatment plan snapshots
API source mirrors: apiprocedurelogs.html, apitreatplanattaches.html, apiproctps.html.
- ProcedureLog fields include patient/appointment/date/fee, tooth/surface/tooth range, priority/status/provider/diagnosis/planned appointment, place of service, prosthesis/date, code/description, units/base units, treatment-plan date, site, timing, prognosis, lock, billing note, discount and audit timestamps.
- Statuses include TreatmentPlanned, Complete, ExistingOtherProvider, ExistingCurrentProvider, ReferredOut and Condition. On completed procedures, code/discount/tooth/surface/range become immutable; associations to certain appointments, claims or orthodontic cases further constrain edits. Keep status-dependent edits and amendment history.
- Active/inactive treatment plans link procedures via TreatPlanAttach + priority; saved plans use copied ProcTP rows linked to original procedure. Preserve accepted quote version/snapshots rather than live-link-only.

### Claims, claim procedures and claim payments
Sources: apiclaims.html, apiclaimprocs.html, apiclaimpayments.html.
- Claim can be primary/secondary/preauthorization and includes patient/procedure list/subscriber/other coverage, service/sent/received dates, claim status, treating/billing provider, fee, estimated/actual insurer payment, deductible, writeoff, place of service, accident/prosthesis/orthodontic facts, prior authorization, notes and custom tracking.
- ClaimProc lines include billed fee, estimated and actual insurer pay, deductible applied, status, remarks, claim-payment link, payment date, writeoff, code sent, allowed/percentage/copay overrides, no-bill-insurance, paid-other-insurance, base/total estimate, clinic/subscriber and audit fields.
- API payment workflow requires ClaimProc status updated to Received/Supplemental and InsPayAmt finalized before ClaimPayment. Check amount must equal sum of eligible line amounts not yet linked to a ClaimPayment; then claim status is set to Received.
ClearFlow should normalize claim header/version, claim lines, adjudication, remittance/EOB, receipt/batch, line allocations, adjustments and reconciliation separately. Keep partial/unapplied differences as exceptions, not silently force totals. Add idempotency and concurrency protections.

### Appointment, patient/guarantor and recall
Sources: apiappointments.html, apipatients.html, apiinssubs.html, apirecalls.html.
- Appointment includes status, time pattern, confirmation state, time lock, operatory, provider/hygienist, time, linked next appointment, unscheduled state, new-patient/hygiene flags, attached procedure description, clinic, arrival/seated/dismissed timestamps, requested-arrival, appointment type, priority and audit metadata. Slot API returns start/end/provider/operatory. Appointment status, confirmation state and patient-flow timestamps differ.
- Patient API exposes demographics/contact, guarantor, primary/secondary providers, fee schedule, billing type, individual estimated balance versus family total, family financial urgent note, chart number, payer identifier, employer, first visit, clinic, premedication, ward and preferred contact/confirmation method. Do not import balance summary as source-of-truth ledger data.
- Subscriber relationship links plan to subscriber and effective/termination dates, subscriber ID, benefit notes, release-information/assignment-of-benefits flags and subscriber notes. Coverage is time bounded; preserve issue/service snapshots.
- Recall fields include due/previous date, interval, status, note, disabled flag, recall type, disable-until-balance/date, scheduled date, priority and time-pattern override. “Mailed postcard” state is not provider-confirmed delivery. Recall task, suppression rule and delivery attempt are separate.
- Treat these findings as source evidence from a third-party mirror; verify against current official docs before locking model decisions.

### Batch 21 consequences
A clinical procedure's state and editability depend on completion and relations to claims/payments/appointments/orthodontic cases. Treatment plan acceptance needs historical snapshots. Claim envelope, line adjudication, remittance/payment and receipt allocation are distinct. Guarantor/family financial relationship differs from insurance subscriber. Appointment state differs from confirmation and real flow events. Recall workflow differs from message delivery.


---

## Batch 22 — Open Dental payments/splits, payment plans, procedure codes, insurance plan and document metadata (2026-10-27; third-party docs mirror)

Sources in third-party mirror: https://github.com/rbarfinezhadfeli0/open_dental/tree/25d68236cda608bd699296dfaeed9caee2bb9372/docs/www.opendental.com/site (apipayments.html, apipaysplits.html, apipayplans.html, apiprocedurecodes.html, apiinsplans.html, apipatplans.html, apiinssubs.html, apidocuments.html, apireferrals.html). Verify current official vendor documentation before schema lock. Open Dental repository LICENSE states GPL v2; research concepts only, no code reuse assumed.

### Payment and allocation
- Payment header includes patient, amount, type/date, check number/bank branch, note, clinic, entry date, deposit, receipt, recurring-card marker, creator/edit timestamp, source, processor state, recurring-charge date and card completion state.
- PaySplit is a separate allocation: amount, patient/payment/provider/plan, date, procedure, unearned type, clinic, adjustment, pay-plan charge and debit type. API can query splits by patient, payment or procedure. Payment may allocate to procedure(s) or be a prepayment/on-account balance.
ClearFlow should model gross receipt separately from allocations/unearned balance/reallocation history; reconcile gross amount = allocations + unallocated amount. Provider attribution and unearned state can affect editability. Processor attempt state is not cash-ledger state.

### Dynamic payment plan
Fields include patient/guarantor, agreement date, APR, plan/insurance references, completed amount, schedule/frequency/payment count/installment amount/down payment/start/interest-start dates, closed/locked state, category and dynamic plan option. Older patient payment plans were deprecated/renamed separately from dynamic plans. Do not conflate patient financing with prepayment, insurer payment, estimate or gateway checkout. Preserve contract and terms snapshot; model installments, interest, delinquency and payment history separately.

### Procedure code catalogue
Fields include code/category/description/abbreviation, time pattern, treatment area (None/Surf/Tooth/Mouth/Quad/Sextant/Arch/ToothRange), insurance-billing flag, prosthesis/hygiene/tax/radiology/lab flags, alternate/medical code, paint visualization type, layperson term, base units, substitution rules, NDC/revenue/provider defaults and Canadian code/time fields.
ClearFlow must separate stable clinical concept from jurisdiction/versioned code mapping; preserve the billed/performed code and description snapshot. Catalogue affects clinical visualization, valid tooth scope, appointment duration, claim coding and billing—not just a label/price. Vendor-specific fields should be optional adapters/extensions.

### Insurance plan / subscriber / patient coverage relation
- InsPlan: group name/number, notes, fee schedule, plan type, claim form, UCR, copay fee schedule, employer/carrier, medical flag, filing code/subtype, code substitution, hidden state, renewal month, COB rule, billing type, exclusion fee rule, manual fee schedule and benefit/max-related settings.
- InsSub links plan to subscriber with effective/termination dates, subscriber ID, benefit notes, release-information/assignment-of-benefits permission and notes.
- PatPlan links covered patient to subscriber plan with primary/secondary ordinal, pending state, relationship and audit times. The documented model treats membership row as coverage; effective dates must be preserved.
ClearFlow normalizes payer/plan/subscriber/member/coverage. Plan-level fee and COB configuration are different from person coverage, and both change over time. Snapshots on eligibility/preauth/claim reflect what applied at that date.

### Documents and referrals
- Document API metadata includes description/date/category/patient/filename/image type/tooth references/provider/print heading. Ingestion may be patient-folder scan, URL, API upload or SFTP; metadata GET can be distinct from binary download. Mounts/image groupings can differ from document rows.
- ClearFlow separates logical document, storage object/version/hash, image study/mount, tooth association, access log and attachment provenance; incomplete binary uploads must be staged/retried, not shown as a working image.
- Referral contact may be person/business, specialty, address/contact, tax/business ID type, preferred/hidden and physician flags. Referral source/contact is not the referral transaction; actual referral needs patient/purpose/state/dates/attachments/response.
  
### Batch 22 requirements
Distinct gross receipts, allocations, on-account/unearned credits and reallocation; financing agreements and installment history; catalogue concepts with code-system/version/treatment area; payer plan vs subscriber vs covered-person relation; documents vs binary/mount/attachment; referral directory vs referral order/response. Third-party documentation mirror warning remains.


---

## Batch 23 — Open Dental periodontics, lab turnaround, claim status history, statements and audit (2026-10-27; third-party API-doc mirror)

Reference paths under https://github.com/rbarfinezhadfeli0/open_dental/tree/25d68236cda608bd699296dfaeed9caee2bb9372/docs/www.opendental.com/site: apiperioexams.html, apiperiomeasures.html, apilabturnarounds.html, apilabcases.html, apiclaimtrackings.html, apirecalltypes.html, apistatements.html, apipaymentplancharges.html, apiadjustments.html, apisecuritylogs.html. Mirror is secondary evidence; recheck vendor’s official current documentation before final decisions.

### Periodontal examination model
- PerioExam stores examination ID, patient, exam date, provider, last measurement edit timestamp and note. POST can create exam and per-tooth/surface data via UpperFacial/UpperLingual/LowerLingual/LowerFacial strings; integer 0–9 represents probing measurement and following flags b/s/p/c represent bleeding, suppuration, plaque and calculus. This is an import/input encoding, not a suitable canonical storage representation.
- PerioMeasure stores exam ID, sequence type, tooth number (vendor-specific 1–32 notation), tooth-level value, six surface values MB/B/DB/ML/L/DL and edit timestamp. Sequence types include Mobility, Furcation, GingMargin, MGJ, Probing, SkipTooth and BleedSupPlaqCalc. -1 denotes unmeasured; 0 or other number is a clinical value and must remain distinct from missing. Type selects which tooth/surface value ranges are permitted; surface measurement types require at least one value. The API compares new rows with existing measures to prevent duplicate sequence-type per tooth in that exam.
- ClearFlow should define a canonical periodontal exam/snapshot plus observation rows, tooth-notation scheme, site code, metric, numeric/text value, unit, presence/absent/unknown semantics, provenance, examiner and measurement time. Preserve raw imported strings during migration and parsed structured measurements beside them. Model recalculation rules and methodology version for indices; never equate “not measured” with zero.

### Laboratory turnaround and case workflow
- LabCase stores patient/lab, actual and planned appointments, due/created/sent/received/quality-checked times, responsible provider, instructions, lab fee, invoice reference and audit time.
- LabFee is documented as informational and not used in any calculation. Do not treat a lab-case estimate/invoice reference as an accounts payable posting; actual supplier invoice, approval, payment and cost allocation are separate financial events.
- LabTurnaround is configuration per laboratory + work/service description, published turnaround days vs actual turnaround days. It is not an individual case promise nor evidence of delivery.
- ClearFlow lab candidate graph: lab/vendor master and capabilities → turnaround/service config → lab case → case procedures/tooth roles/material/shade/instructions + source scan/impression → sent/received/QC/try-in/seated status history → remake/rework → supplier invoice/payable. Preserve estimated vs actual timestamps and costs separately. Add vendor performance analytics from cases, not manually maintained counters.

### Claim status history and insurer corrections
- ClaimTracking rows store claim, tracking type (e.g. status history), actor, timestamp, note, status definition and error definition. A preference controls whether None status is allowed. This is a tracking event separate from current claim status; error code is distinct from status.
- ClearFlow should retain all claim submit, acknowledgment, rejection, rejection reason, corrected/resubmitted, pending attachment, status check, adjudication, appeal and closed events with payer/clearinghouse correlation and raw response artifacts. Current status is a projection; never overwrite the old event when a claim is resubmitted.

### Recall rule vs patient recall vs contact/delivery
- RecallType config contains description, default interval, appointment time pattern, linked procedure codes and whether to append to special instructions.
- A patient recall record separately has next due/previous date, interval, status, note, disabled flag, type, disable-until-balance/date, scheduled date, priority and time-pattern override.
- Keep rule version/config, due-care obligation, attempted contact, delivery-provider result and resulting appointment distinct. A provider may mark a letter “sent” without delivery confirmation; CRM outreach is not itself evidence the patient received notice or completed care.

### Statement, adjustment and financing event distinctions
- Statement stores patient/guarantor account, date sent/range, notes, mode/channel, hide-payment/single-patient/intermingled flags, sent state, associated document, receipt/invoice-copy flags and snapshot balances/insurance estimates. The API explicitly says statement creation displays it in the account ledger but does not affect billing. Model as a generated communication/document snapshot; it must not post or mutate a receivable.
- Adjustment stores patient, adjustment type, signed amount/date, provider, note/reason, procedure if applicable, clinic, actor, entry/edit timestamps. Examples include negative cash discount or positive finance charge. Adjustment is not a payment and should not be hidden in free-text account notes.
- PayPlanCharge stores payment-plan date, patient/guarantor, principal, interest, note, provider/clinic, debit/credit charge type, related procedure, statement association, generic link type/key, offset marker and audit timestamps. Schedule/charge ledger rows are separate from the financing agreement, actual receipt and allocation.

### Security log as operational provenance
- Open Dental SecurityLog example stores event permission/type, user, log timestamp, text, subject patient, client computer and source (API). API permission surface separately reports enabled API capabilities such as read-all/other modules/communications/documents/queries.
- ClearFlow audit requires subject + actor + effective permission, source (human, AI, API, job, integration), client/correlation, time, purpose, operation/result and stable target IDs. Do not rely on a human-readable text log as the only audit form. Secrets must never appear in audit payloads. Add field-level before/after diff and immutable clinical/financial amendment chain where applicable.

### Batch 23 requirements and evidence labels
1. Canonical periodontal observations need a typed “not measured” representation distinct from numeric zero; preserve tooth notation and measurement taxonomy.
2. Lab turnaround SLA/config vs actual case timeline vs vendor billing must remain distinct.
3. Claim status event history/errors/responses need a durable event stream and raw evidence.
4. Recall rule, due-care recall, outbound attempt, provider delivery and completed appointment are separate.
5. Statement snapshots and adjustments are not receipts; financing agreement and PayPlanCharge schedule rows are not cash movement.
6. API/security audit captures source and permission scope; retain structured audit in addition to display text.
These are source-derived candidates from a third-party mirror. Verify with official docs and/or source/runtime tests. Schema research continues.


---

## Batch 24 addendum — OpenEMR payer posting, DentalPin contact policy, transactional outbox and reorder semantics (2026-10-27)

This addendum preserves additional cross-reference findings from the workspace dossier. Sources include OpenEMR EHI export tables and DentalPin notification, inventory and agenda models/services/tests. These are implementation observations and ClearFlow candidates, not universal legal or clinical rules.

### OpenEMR payer posting refinement
Sources:
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/insurance_data.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/insurance_companies.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/insurance_numbers.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/benefit_eligibility.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/eligibility_verification.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/fee_schedule.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/claims.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/billing.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/ar_activity.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/ar_session.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/payment_processing_audit.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/x12_partners.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/x12_remote_tracker.html

Observed fields include coverage relationship and primary/secondary/tertiary priority; payer/provider/plan/group; subscriber identity, relationship, DOB/sex/address/phone/employer; policy copay/type/effective/end dates; payer aliases/CMS/X12/eligibility IDs; provider billing versus rendering identifiers; eligibility request/response IDs/timestamps and benefit rows; claim versions, payer and process state, submitted payload; billing service line code/modifier/units/fee/provider/authorization/payer/revenue category; AR session EOB/check/payment/deposit/posting dates and totals; AR activity payment and adjustment amounts, posting actor/session, follow-up/reason code, void timestamp and payer claim number; payer clearinghouse partner/file/status/messages and processing audit/reversal metadata.
ClearFlow requirements: normalize coverage, eligibility observations, claim submission versions, normalized claim lines, remittance/EOB, AR posting sessions and lines. Submitted fee, allowed amount, payer paid amount, contractual adjustment, deductible, coinsurance, write-off, denial, patient responsibility and actual cash receipt are different facts. Keep original raw exchange evidence but secrets redacted; no live credentials in ordinary settings. Fee schedule keys should include code system, code, modifier, payer/plan/provider scope and effective interval; snapshot the applied schedule.

### DentalPin notification preference and durable-outbox semantics
Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/notifications/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/notifications/gateway.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/notifications/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/tests/test_notifications_gateway.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/recall_reminders/__init__.py

Observed design:
- NotificationTemplate is channel- and locale-specific; global/system vs clinic-defined; includes key, email subject/HTML/plain body, provider-approved template name/status, variables, description and active/system flags. Uniqueness by clinic+key+locale+channel.
- NotificationPreference scopes clinic plus patient/user and stores channel toggles, some opt-in timestamps, inbound-message time for WhatsApp session-window rules, per-purpose choices and locale.
- ClinicNotificationSettings stores default/fallback channel policy, manual options, daily SMS cap and per-event enabled/auto-send/offset. Business event selection differs from transport channel.
- ClinicChannelSettings maps clinic/channel to adapter, enable/verified status and non-secret config. Provider credentials live in provider module/secret storage. SMTP has provider/host/port/username/encrypted password/TLS/SSL/from identity/active/verified state.
- CommunicationMessage is queue/outbox + current delivery audit row: clinic, channel, direction, recipient address, optional patient, template key, kind (template/session), subject/body for literal messages, status, attempts/max attempts, next retry, provider/provider message ID, error, dedup key, sent/delivered/read times, triggering event/user and sanitized context. Indexes support dispatcher polling and patient/channel/time message threads. Partial unique index enforces clinic+dedup key.
- Lifecycle separates queued/sending/sent/delivered/read/failed/skipped; network sends occur asynchronously after request transaction commit. Dispatcher uses row locks plus SKIP LOCKED, honors retry time/attempt limits and isolates individual failed messages. Provider accepted/sent is not delivered/read; retry uses bounded exponential backoff.
- Purpose vocabulary includes appointment confirmation/reminder/cancellation, budget sent/accepted/reminder, invoice sent, recall reminder, welcome. Unknown preference keys can fail to enforce opt-out, so vocabulary changes need migration/tests.
- Recall module emits event/glue into gateway; recalls store care obligation/contact attempts but do not send messages. SMS has daily cost cap; WhatsApp templates require approved provider templates and session policy; push requires registered subscription and stale 404/410 endpoints can be pruned.

ClearFlow requirements: enforce do_not_contact above every channel and even force-send; purpose-level and channel-level opt-out are separate checks. Save opt-in evidence/source/time and effective policy version. Transactionally create an outbox row beside the triggering business commit, then dispatch asynchronously. Never claim external send succeeded before provider response; delivery/read are separate provider observations. Keep marketing, recall, clinical reminder, appointment reminder and operational notices distinct. Do not expose unredacted message content or credentials to AI unless explicitly required and authorized.

### DentalPin inventory supplier-specific reorder evidence
Source modules: https://github.com/dentalpin/dentalpin/tree/main/backend/app/modules/inventory and supplier_items, purchase_orders, inventory_reorder.
Inventory stock row and movement ledger are not sufficient to model procurement. Enterprise scope candidates:
- Supplier-item catalogue with supplier SKU, manufacturer code, unit conversion/package size, lead time and minimum order quantity, effective unit price/currency, quote/contract validity, preferred status and last price provenance.
- Reorder policy/config with minimum/maximum/reorder point, safety stock, lead-time demand, forecast method/config version, pack rounding, expiry/lot constraints and explanation of recommendation.
- On-order quantities need purchase-order header/lines, receiving events and partial receipts. Reorder suggestion is a proposal, PO is a document/workflow, authorized PO is a commitment, receiving updates lots and stock, supplier invoice/payable is separate.
- Auto-generated POs remain drafts until authorized approval. Supplier preference is not a replacement for many-to-many supplier catalogue.
These are coverage candidates; inspect exact modules/migrations before assuming all are currently modeled.

### Appointment and patient-context boundaries
DentalPin AppointmentService normalizes naive clinic-local wall-clock time to UTC instants, records initial status history and re-reads current status under a row lock for transitions. Conflict backstop exists, but check the exact constraint/interval handling separately; exact-start uniqueness is not full interval overlap protection.
Patient core in the reviewed source has a single phone/email plus do-not-contact field. ClearFlow should keep multiple purpose-coded contact points with verification/validity rather than expanding only one phone field. Medical context needs field-level provenance/reviewer, controlled units/precision (e.g. INR), and separate guardian relationship from legal decision/information authority. Active/archive state and history should survive edits.

### Batch 24 matrix additions
- Payer: identifiers/type, eligibility partner, billing/rendering provider numbers, plan/member/subscriber snapshots.
- Eligibility: request/response ID, checked time, benefit lines, dates/type/level, amount/percent/network/status and freshness.
- Remittance/posting: EOB/check, payer, receipt/deposit/post dates, session totals, line allocation, adjustment/reason code, reversal and reconciliation actor.
- Communication: patient/user recipient, channel/purpose/opt-in proof, locale, inbound-session window, template/provider approval version, queue/backoff/dedup, delivered/read state/fallback rationale.
- Inventory procurement: supplier SKU/prices, lead-time source, partial receipts, reorder policy/config version and draft-PO review.
- Patient safety: source/reviewer for clinical context, units/precision, guardian authority, archive state and field-level provenance.
- Media: original/derivative, upload/capture times, taxonomy, checksum, paired assets, scoped storage and owner-registry validation.

Evidence classification: OpenEMR EHI export pages are dictionary evidence; DentalPin code/tests show implementation patterns that still require validation against current deployment and real provider integrations. Continue the Open Dental field comparison and authoritative India standards research before locking the schema.

---

## 23. Supplemental India-specific research (27 October 2026)

The detailed, source-linked addenda are maintained alongside this notebook:
- `PROJECT_NOTES_ADDENDUM_B25.md` — exact DentalPin patient clinical-history and clinic-managed medical-reference fields, active/archive behavior, clinical provenance and gaps in interaction/contraindication evidence.
- `PROJECT_NOTES_ADDENDUM_B26.md` — official ABDM developer portal and NRCeS FHIR R4 v6.5.0 profile coverage; M2 care-context/HIP linking and eight Health Information Types; M3 consent request/artefact/revocation/date-range/transfer acknowledgement; official MeitY DPDP Act/Rules commencement and corrigendum; India tax-invoice localization boundary and unverified CBIC extraction.

### 23.1 Integration contract vs canonical model
ABDM's published FHIR Implementation Guide describes record/claim profiles, terminology and validation rules. The profile catalogue includes patient, practitioner/role, appointment, encounter, condition, allergy, care plan, procedure, service request, specimen, lab/imaging report, imaging study, medication, medication request/statement, observation, document reference/media, charge item, invoice and document bundle. Keep ClearFlow's richer normalized internal schema as source-of-truth and build versioned, validated FHIR projections from it. Pin profile package version; a newer preview version is not automatically a production baseline.

### 23.2 India interoperability lifecycle
If ABDM is enabled, model ABHA number/address as separately typed/linkable identifiers; store HFR/HIP/HIU role/configuration evidence, care contexts, request/transaction/callback IDs, bundle mapping and FHIR validation/export evidence. M2 care-context linking and final success are callback-driven; HTTP 202 is not success. M3 data requests require consent artefact scope, multiple artefact IDs, purpose, allowed HI types/care contexts/date range, expiry/revocation checks, secure transfer status and receiver acknowledgement. Do not treat ClearFlow as a Consent Manager merely because it implements HIU/HIP interactions.

### 23.3 DPDP phase-in review
Official MeitY Rules notification G.S.R. 846(E) is dated 13 November 2025. Rules 1, 2 and 17–21 took effect on Gazette publication; Rule 4 has the one-year phase-in date; Rules 3, 5–16, 22 and 23 have the 18-month phase-in date. The separate Act commencement notification phases substantive data-fiduciary sections at 18 months. Calculated from the notified dates, the one-year date is 13 November 2026 and the 18-month phase date is 13 May 2027; re-check official updates/legal counsel before reliance. The December 2025 corrigendum should be retained with the original Rules, not discarded. Rule 4 concerns Consent Managers and does not mean every clinic must itself operate as one.

### 23.4 Tax localization boundary
CBIC's official tax-invoice rules page was found but could not be extracted successfully in this pass. Keep a versioned India GST/e-invoice adapter and snapshot the exact effective rule/registration eligibility used to issue each document. Invoice, credit note, tax line, tax code/system, taxable basis, jurisdiction/place of supply, issue series and compliance identifiers belong in a localized layer. Current invoice particulars, applicability thresholds, IRN/QR/signing and exemption details remain pending direct verification; do not encode one blanket rate into the clinical model.

Continue research before finalizing schema: vendor-level table inventories are not sufficient without field/constraint/index and workflow comparison; country-specific legal and tax rules must be derived from effective official sources, not from generic EHR implementation patterns.

---

## Batch 26 — Open Dental family account, full appointment snapshots, document/mount storage and unearned payments (2026-10-27; third-party API-doc mirror)

Reference paths in the mirror: apifamilymodules.html, apihistappointments.html, apiappointments.html, apipayments.html, apipaysplits.html, apidocuments.html, apistatements.html. Verify against current official documentation; the mirror is a secondary reference.

### Family and insurance presentation are not the same relationship
Open Dental FamilyModules insurance output is a denormalized view assembled from separate subscriber, patient-plan, carrier and insurance-plan records:
- covered patient, subscriber patient, subscriber ID, patient override ID, relationship to subscriber, pending/incomplete verification flag, primary/secondary ordinal, plan/subscriber/patient-plan IDs.
- carrier identity/name, group name/number, plan-specific and subscriber/family notes, practice fee schedule and copay schedule, plan type (percentage, PPO percentage, flat copay, capitation), employer and whether the plan is medical versus dental.
- A patient may have no current coverage; discount-plan subscriptions are surfaced separately.
ClearFlow must distinguish person/patient, legal guarantor, financial responsibility grouping, insurance subscriber, covered member, payer, plan, coverage period and discount membership. A family relationship does not automatically authorize someone to make clinical decisions or receive protected information. A payer plan note is not the same as member-specific note or consent evidence.

### Appointment history as a versioned snapshot
Open Dental documents HistAppointment as a historical copy created when an appointment is created, changed, missed, cancelled or deleted. One appointment number may have many history rows. Snapshot carries the historical appointment state, action, actor, timestamp, source, patient, appointment status, provider/hygienist, room/operatory, date/time, pattern, confirmation, planned order, clinic, arrival/seated/dismissed/asked-to-arrive times and other attributes.
ClearFlow should have a canonical current appointment plus append-only transition/change records sufficient to reconstruct old state. A log entry with only action and current target is insufficient to reproduce appointment history. Capture actor, time, source/automation, changed fields, old/new values and correlation. Appointment status, confirmation communication state, patient flow timestamps and changes to schedule/resource are distinct dimensions. Avoid silently overwriting old timestamps or deleting a cancelled appointment.

### Payment allocation policy: household, provider, procedure and unearned credit
Open Dental Payments API behavior:
- A gross payment header stores amount, patient, type/date, check/bank/note, clinic, deposit/receipt, entry/edit, payment source, processor state and recurring-card fields.
- By default, payment allocation follows the clinic's allocation preferences and FIFO across outstanding charges; applicable patient payment plans may be paid first. Procedures can be explicitly selected; procedure allocations can follow procedure date FIFO.
- The isPatientPreferred flag explicitly directs allocations to the individual patient rather than being split among family members. This is a policy input, not a cosmetic display preference.
- If payment exceeds outstanding eligible charges, excess becomes unearned income/prepayment, represented by separate PaySplit allocation records. A prepayment can target a dynamic payment plan. Unearned funds later allocated to a procedure or plan must remain traceable.
ClearFlow needs allocation-policy version, allocation targets, patient-vs-guarantor scope, split lineage, unapplied balance, reallocation, refund/void status and deterministic ordering. Every allocation must refer to a valid target in the appropriate tenant/family/account scope. A payment's gross amount is not the same as earned revenue or payment amount applied to an invoice/procedure.

### Appointment creation details and integration semantics
The API appointment creation requires patient, operatory and appointment time; supports status, pattern/time increments, confirmation definition, note, provider/hygienist, clinic, attached procedures/appointment type, source and scheduling metadata. Pattern is a five-minute increment string and is capped at nine hours. Open slots are computed using provider and operatory and can include room-specific gaps. Appointment time is not equivalent to clinical treatment date; actual procedures are separately recorded and may be attached to planned appointments.
ClearFlow should model interval start/end explicitly rather than retaining only a pattern string, while optionally preserving imported/vendor pattern and its coding/version. Resource availability is a derived query across schedules, closures, rooms/equipment and current bookings. Validate overlap under concurrent create/reschedule/reassign requests.

### Document, image/mount and binary file lifecycle
Open Dental document API states:
- Document metadata includes document number, description, creation date, category, patient, filename, image type, tooth numbers, provider, print heading and timestamp.
- Patient media can be inserted by watched patient folder, URL, API upload or SFTP. List/get responses may be metadata only; binary retrieval is a distinct transfer endpoint. Storage modes include local/AtoZ, database and cloud. SFTP download can overwrite an existing target filename, so secure exports need generated names and explicit target handling.
- A single patient document list can mix document rows and mount rows. Mount does not have all document fields (e.g. file path, tooth numbers and timestamp); mount is a grouping/printable view over images, not necessarily an independent source binary.
ClearFlow must distinguish patient document record, stored binary/object version, generated derivative, image series/mount/group and attachment/clinical tooth association. Keep capture time vs upload time, storage backend, hash, MIME/size, uploader, originating encounter/provider, explicit clinical relation and access history. Document list metadata must not be mistaken for possession of actual bytes.

### Statement reiteration
The 25.3.26 statement API describes a statement record displayed in the Account Module ledger and explicitly says it does not affect billing. Statement is a communication/snapshot (range, note, mode, sent state, attached document, balance/insurance estimate, receipt/invoice-copy flags), not an invoice, payment, adjustment or AR posting.

### Batch 26 requirements
1. Add financial-responsibility/guarantor grouping separate from family/person and insurance relationships; keep permission to receive information/authorize treatment separate.
2. Historical appointment snapshots must reconstruct state at the time of every create/change/missed/cancel/delete operation.
3. Payments support individual vs household allocation policies, FIFO, selected procedure targets, payment-plan allocation and unearned prepaid balances. Preserve allocations and reallocation history.
4. Appointment patterns from vendors must be mapped to explicit start/end and resources while preserving source field/provenance.
5. Distinguish document metadata, binary object, image/mount grouping and tooth/encounter/provider association.
6. Statement record never posts financial movement; account snapshots are computed evidence, not ledger truth.

Source note: these Open Dental behaviors are found in published API documentation preserved in a third-party mirror. Treat as vendor-pattern evidence, not universal law or permission to copy source code.

---

## 24. Supplemental Open Dental official API schema evidence (27 October 2026)

Detailed field and lifecycle evidence has been preserved in `PROJECT_NOTES_ADDENDUM_B27.md`.

### 24.1 Payer enrollment, benefit rules and eligibility history
Open Dental distinguishes insurance plan contract, subscriber enrollment (`InsSub`), person-specific coverage (`PatPlan`), benefit rule, and insurance verification. `InsSub` includes subscriber ID, effective/termination dates, benefits notes, release-of-information and assignment-of-benefits authorization; `PatPlan` has patient, subscription link, primary/secondary ordinal, covered-person relationship, pending state and patient ID override. Benefits include percent/amount/time period/quantity qualifier/coverage level/treatment area/tooth range and code/category scoping. `InsVerify` differentiates patient enrollment vs plan-benefit verification, with history retained separately. Do not reduce this to patient.insurance_provider.

### 24.2 Claim processing and real receipts
Claim header and claim line are separate. ClaimProc can model estimate, actual adjudication, adjustment, supplemental/capitation/history/other status; it carries procedure/claim/patient/provider, fee, estimates, actual insurance paid, deductible, allowed/percentage/copay overrides, writeoff, other-insurance paid, payer payment/batch link and finalization. ClaimPayment is the insurer check/remittance batch, with check amount/date/number/bank, carrier, clinic, deposit linkage, date issued, payment type/group and audit fields; EOB attachments belong to this batch. A final payment must reconcile to line-level payment amounts before closure.

### 24.3 Patient ledger and communication distinctions
Patient payments support FIFO application to outstanding charges, unearned/unallocated credit, procedure and payment-plan allocations and recurring-card/provider-processing metadata. Insurance claim payments are separate. Account adjustments are non-cash ledger events with required sign/type alignment. Statements store date-range, delivery mode, document link, balance/insurance estimates and sent/receipt/invoice flags; official docs explicitly state statement creation does not impact billing. Payment plan is a signed/dated financing arrangement, distinct from scheduled installment events and real receipts.

### 24.4 Signed treatment plans and procedure snapshots
Open Dental describes TreatmentPlan as tracking accepted, uncompleted, or denied treatment. Active/Inactive plans reference live procedures through attachment rows; Saved plans use copied procedure snapshots (`ProcTP`) that do not change when source procedure changes. Saved items include procedure/tooth/surface/code/description, item order/priority, fee, primary/secondary insurance estimates, patient amount, discounts, prognosis/diagnosis, provider, allowed fee, tax and clinic. Plan head stores status/type/notes, presenter/responsible party, document and both signature/time states. Therefore ClearFlow should retain current treatment/procedure state plus immutable accepted plan/price/signature evidence.

### 24.5 Reusable schema rules
- Keep schedule availability (practice/provider/blockout/employee), actual appointment, operatory assignment and actual arrival/seated/dismissed timestamps separate.
- Preserve patient account guarantor/family scope separately from individual patient identity and individual estimated balance; aging/total balances are projections, not raw financial transactions.
- Preserve claim/procedure/catalog code and fee schedule as different objects. Effective fees can vary by schedule, clinic and provider; store issue/performed snapshots.
- Canonical perio values must distinguish measured zero, missing/unrecorded, skipped tooth and vendor encoded missing values. Open Dental’s PerioMeasure API uses `-1`, >100 negative encoding and a bitfield for bleeding/suppuration/plaque/calculus; those are transport conventions, not ClearFlow domain values.
- Document metadata and file bytes are different; photos/X-rays, tooth annotations, mounts, lab PDFs and EOB attachments require preserved object/hash/provenance and separate lifecycle.
- For source imports, preserve source status/type/IDs and map through an adapter; do not let Open Dental's numeric definition IDs or US-specific enumerations become global ClearFlow enums.
---

## 25. Supplemental Open Dental clinical-history and recall research (27 October 2026)

See `PROJECT_NOTES_ADDENDUM_B28.md` for exact source-linked field observations.

### 25.1 Allergy and medication identity
Open Dental distinguishes an allergy definition catalogue from the patient's allergy record; the catalogue exposes description/hidden flag, SNOMED type, medication link and UNII code, while a patient allergy includes reaction, active status and adverse-reaction date. Medication catalogue separates brand name from a generic reference; the patient medication statement separately stores patient, medication, free-text usage note, start/stop date and provider. Prescription stores different facts: exact drug/directions, quantity/refills, prescriber, pharmacy, eRx status, controlled flag, procedure link and days' supply.

### 25.2 Longitudinal note and recall policy
Open Dental's 1:1 PatientNote summary has family-financial, medical, service, complete medical-history, treatment and emergency contact fields; API updates replace fields, with append implemented as manual read-concatenate-write. ClearFlow must keep structured clinical histories and attributed note revisions as the source of truth, and avoid loss-prone append read-modify-write. RecallType stores default interval/time pattern/procedure links; each patient Recall stores due/date/status/type/priority/disable rules, while reminder counts/contact outcome are projections. Retain interval/policy version at the time a due date is computed.

These fields strengthen the requirements for preserving unknown vs negative, current vs historical, catalogue vs patient fact, prescription vs medication statement and obligation vs communication delivery. See B28 addendum for test cases and source-quality limitations.
---

## 26. Supplemental OpenEMR EHI Export table research (27 October 2026)

See `PROJECT_NOTES_ADDENDUM_B29.md` for the source-linked field inventory and requirements.

Key findings: OpenEMR patient data includes preferred/name history, many contact channels, guardian details, care-team/provider/facility relationships, referral/work/financial context and purpose-specific portal/health-exchange/registry choices. `history_data` stores lifestyle, family history and prior examinations/surgeries; `lists` stores issues/problems/allergies with onset/end/occurrence, coded diagnosis, reaction/severity/verification, external eRx source/upload state and active/deleted status. Medication source is separated across catalog, prescription, patient medication/adherence record, stock inventory by lot/expiry and dispensing/sale transaction.

Clinical order architecture distinguishes order header, request code lines, specimen collection, report, individual result values and result review/correction; code lines may be amended after an order is sent, and the order can link to observations/conditions via a resource-type/UUID relation. Result records carry code/system, value/data type, units, range, abnormal indication, lab comments, status and attachments. Vitals and general observations hold typed values/units, interpretation, reason, status, encounter/parent observation and reviewer context. Encounter, billing party, patient-signed document, authorization signature, document binary and attachment links are different records.

OpenEMR table shapes include legacy fields and U.S.-specific concepts (SSN/HIPAA/VFC/CMS ABN/NDC and imperial measurement defaults). Preserve their meanings through localization/import adapters; do not make those codes or fields mandatory in ClearFlow's global schema.
---

## 27. Supplemental audit, signature and external identity mapping research (27 October 2026)

See `PROJECT_NOTES_ADDENDUM_B30.md` for source links and full observations.

OpenEMR EHI tables distinguish audit master approval/workflow from table/field value details, amendment history, and a limited patient history row for previous names/care-team. Legal document master template/version is separate from per-patient/encounter signed instance. Signature evidence includes signer/user/time, lock/amendment, data hash and signature hash; onsite signatures may include raw image/hash/IP. UUID mapping/registry tables map external resource identity to internal table/row; API logging stores request/response and may therefore become a sensitive-data sink. Notification log has sent/message/date fields but does not alone represent current multi-channel outbox/retry/delivery semantics.

ClearFlow needs separate entity audit history, security audit, clinical amendment/signature evidence, external ID mapping, import/interop provenance and a user-facing event timeline projection. Do not log unredacted tokens or unnecessary PHI; signed artifacts bind to immutable content hashes/versions, and corrections create linked amendments rather than mutating signed content.
---

## 28. Existing research addenda discovered during continuation (Batches 31–34)

These addenda already exist in the repository and remain part of the evidence set; they are indexed here to ensure the main notebook is a complete navigation point:
- `PROJECT_NOTES_ADDENDUM_B31.md` — DentalPin medical reference model, tenant mutation requirements, patient clinical context, prescription issue/cancel freeze, GDPR-like privacy/erasure workflow, India-specific applicability boundary.
- `PROJECT_NOTES_ADDENDUM_B32.md` — medical reference service/test semantics, clinic-scoped mutation/audit contract, medication safety and prescription lifecycle, candidate canonical entities, India law/standards research gate.
- `PROJECT_NOTES_ADDENDUM_B33.md` — OpenEMR prescription fields, inventory/product/lot/dispensing flows, order/result/review distinctions, patient reminder obligations, immunization fields, signature/amendment evidence.
- `PROJECT_NOTES_ADDENDUM_B34.md` — OpenEMR patient identity and care-team categories, unit-aware observations/vitals, medication statements vs prescriptions, dynamic forms, signatures and data-minimization tests.

The newer B27–B30 addenda contribute additional direct official Open Dental API evidence and first-party OpenEMR EHI table details; the B31–B34 addenda are retained rather than overwritten. Where material overlaps, use the combined source inventory and record the stronger-source/earlier-version decision explicitly in the reconciliation matrix.

## 29. India-specific regulatory evidence gate (Batch 35, 2026-10-27)

Source-specific detail is preserved in `PROJECT_NOTES_ADDENDUM_B35.md`; index entry is in `RESEARCH_INDEX.md`. This is not a legal opinion and does not freeze the schema.

- DCI-hosted Dentists (Code of Ethics) Regulations, 2014 text references a three-year minimum for dental records and a 72-hour response clause for record requests. Verify current amendments, applicability and interaction with other duties; do not implement a universal auto-delete timer.
- The DPDP Act/Rules commencement is phased under the official November 2025 Gazette notification. Do not claim every substantive provision is already in force solely because the Act/Rules were notified; maintain an effective-date-aware legal obligations register.
- MoHFW telemedicine guidance emphasizes professional judgment, identity, consent/context and appropriate patient evaluation. Verify dental-specific scope before asserting direct applicability.
- Cited NMC/EMRB platform guidance says AI may assist but final prescription/counselling is to be delivered by an RMP in its stated context. Keep AI outputs as drafts and require authorized clinician review/issuance; verify current status and dental applicability.

Candidate matrix requirements: policy-driven retention and legal holds; verified, auditable disclosure requests; effective-date-aware privacy obligations; separate teleconsultation context and clinician decisions; human authorization for prescriptions; immutable signed content snapshots and linked amendments. Remaining India-specific legal research includes current dental regulator status, Telangana clinical-establishment obligations, prescription/pharmacy law, imaging/radiology, biomedical waste and applicable health-record standards. Tag unresolved claims as provisional/legal review required.

---

### Companion addenda index: India legal gate and prosthetic laboratory workflow

- `PROJECT_NOTES_ADDENDUM_B35.md` — India-specific regulatory evidence gate covering dental records, DPDP applicability, telemedicine/AI prescribing and the need for exact official source/version/actor applicability checks before a rule is labelled mandatory.
- `PROJECT_NOTES_ADDENDUM_B36.md` — first-party Open Dental lab workflow plus continued database/API research on odontogram and tooth numbering provenance, periodontal exam/measurement structure and derived CAL, procedure target constraints, signed treatment plans, recall versus appointment lifecycle, image metadata versus binary assets and DICOM context, orthodontic chart versions/signatures, and lab case event history. Direct LabCases/Laboratories API schema extraction remains an explicit evidence gap.

## 30. Initial requirement-to-evidence matrix (v0.1, 2026-10-27)

`TRACEABILITY_MATRIX.md` now links B17–B36 research into an initial cross-batch scaffold. It covers tenant boundaries, identity, appointments/encounters, odontogram/periodontics, treatment plans/signatures, medication/prescriptions, orders/results, inventory, revenue-cycle records, imaging, orthodontics/lab work, communications, privacy/regulatory applicability, migrations and AI action authorization. It adds P0/P1 priorities, candidate lifecycle boundaries, minimum acceptance tests, domain coverage status and explicit open questions.

This matrix is not a field-exhaustive canonical schema, proof of implementation, clinical validation or legal compliance statement. Rows marked candidate/pending must remain so until direct source verification, code/test review, or the relevant legal/clinical owner resolves them. Next pass: extract exact source-field inventories, map source field → candidate concept → transformation → lifecycle → tenant/role constraint → acceptance test, and inspect the real implementation before marking anything implemented.

Do not overwrite earlier batch notes. When sources overlap, preserve each source’s provenance/quality label and reconcile in the canonical model matrix, rather than merging vendor-specific field names into a universal schema.

## 31. Field inventory, implementation review and current India notice update (B37, 2026-10-27)

- `PROJECT_NOTES_ADDENDUM_B37.md` adds current official primary-source evidence from the National Dental Commission / Ethics and Dental Registration Board: prescription particulars notice M-2749 (23 October 2026), dental-mechanic qualification/registration notice M-2662 (13 October 2026), Telangana Clinical Establishments Rules 2022, DPDP staged commencement and the stable ABDM FHIR guide v6.5.0 versus v7.0.0 preview. Candidate fields and release tests are explicit; legal applicability remains subject to expert review.
- `FIELD_LEVEL_INVENTORY.md` records the currently inspected 3-table prototype schema and organizes B17–B38 fields/concepts across patient identity, representatives, clinical context, dental workflows, observations, medication, imaging/signatures, laboratory, inventory/finance, communication, external exchange and regulation. It labels current app fields versus candidate domain fields; it is not exhaustive physical DDL extraction from every source system.
- `IMPLEMENTATION_GAP_REVIEW.md` documents observed client-side Appwrite writes, raw string relationships, no server-side parent-tenant validation in the inspected code, missing tests, pagination limits and unimplemented clinical domains. A current Appwrite documentation mismatch on private row permissions versus `listRows` table-level READ requirements is explicitly classified as runtime verification pending; do not grant global table READ without a safe permission design.
- `TRACEABILITY_MATRIX.md` is expanded to v0.3 with selected source-field mappings, normalized concept groups, transformations, lifecycle/security conditions, P0 acceptance tests, NDC prescription/lab mechanics and Telangana registration requirements, DPDP dates, ABDM profile pinning and prototype mapping. Completion criteria are defined; there is no claim every vendor column has been exhaustively transcribed or implementation is ready.

The preserved application code remains on `backup/before-project-notes-reset-2026-10-27`. Appwrite schema/settings metadata was inspected read-only; no patient rows were queried and no live data/permissions were modified. Research `main` stays notes-only. Keep source facts, candidate fields, legal/clinical decisions, runtime observations and implementation status separate.

Do not overwrite earlier batch notes. When sources overlap, preserve each source’s provenance/quality label and reconcile in the canonical model matrix, rather than merging vendor-specific field names into a universal schema.

## 32. Source coverage register (2026-10-27)

`SOURCE_COVERAGE_REGISTER.md` tracks B17–B38 by source type (database reference, API contract, service inspection, test evidence, workflow, official legal source, candidate design), records what each batch actually establishes and lists source-specific gaps. It explicitly differentiates high confidence within a cited source from universal/Indian applicability and from live ClearFlow implementation evidence.

Research now has a cross-batch traceability matrix (v0.3), field-level concept inventory, source coverage ledger and read-only prototype gap review. This is enough to perform a disciplined reconciliation pass, but it does not mean every physical vendor column is transcribed, the canonical schema is frozen, or the application is production-ready.

The preserved application code remains on `backup/before-project-notes-reset-2026-10-27`. Appwrite schema/settings metadata was inspected read-only; no patient rows were queried and no live data/permissions were modified in this review. Research `main` stays notes-only. Keep source facts, candidate fields, legal/clinical decisions, runtime observations and implementation status separate.

## 33. Source-to-concept field maps (B17–B38, 2026-10-27)

`SOURCE_FIELD_MAPS.md` adds named field families from the preserved source addenda and maps them to candidate ClearFlow concepts with normalization and lifecycle/security tests. It separately covers DentalPin service/model families, Open Dental API families, OpenEMR EHI source tables, ABDM/consent exchange, legal obligations, and raw sentinel/unit/time mapping rules. It is deliberately labelled not physically exhaustive: API field families and inferred candidate fields are not presented as complete source DDL.

The research pack now has these linked layers: source-specific evidence addenda B17–B38; consolidated project notebook; source coverage register; source-to-concept field maps; field-level domain inventory; traceability matrix v0.3; and read-only implementation gap review. Recent regulatory links were corrected to the MeitY-hosted DPDP Rules PDF and separately linked Gazette corrigendum. The latest current source directory checks confirm the CDSCO Drugs Rules page lists the 1 July 2024 consolidation, and the NRCeS FHIR guide identifies v6.5.0 as its current published version. See B37 for URL/version details.

**Research-phase completion boundary:** the structured comparison, traceability scaffolding and observed-prototype gap documentation are now saved. The task is not complete at the level of an exhaustive physical-column inventory, legal sign-off, clinical validation, live cross-tenant attack tests, production schema, or deployment. Do not describe those unverified layers as finished.


## 34. B38 and research completion status (2026-10-27)

- `PROJECT_NOTES_ADDENDUM_B38.md` adds official-source research for AERB dental X-ray registration/safety and eLORA, CPCB/DGHS-hosted biomedical waste guidance and TSPCB current-process review, the government-hosted national dental-clinic minimum-standards template, and CBIC tax invoice/bill-of-supply particulars. Each is labelled with source status and category-specific review gates.
- `SOURCE_FIELD_MAPS.md` and `FIELD_LEVEL_INVENTORY.md` now cover B38 candidate groups for radiation equipment, waste authorization and pickup, facility standards evidence, and tax documents.
- `TRACEABILITY_MATRIX.md` now includes the B38 P0/P1 traceability rows and explicit closure gates.
- `SOURCE_COVERAGE_REGISTER.md` tracks B17–B38 evidence classes and gaps.
- `RESEARCH_COMPLETION_STATUS.md` defines exactly what has been completed in the documentation/research pass and what remains pending: exhaustive source DDL extraction, dental clinical validation, counsel/tax/radiation/waste applicability reviews, real two-tenant Appwrite runtime tests, implementation tests, and deployment validation.

**Completion boundary:** The research pack is assembled and navigable through Batch 38; it is not an exhaustive copy of every physical field in every vendor system, final canonical schema, legal sign-off, clinical approval, runtime security proof, or production-readiness certification. The repository `main` remains documentation-only and the application remains on the preserved backup branch. No live data or permissions were changed.


## 35. Batch 37A workforce domain and matrix v0.4 (2026-10-27)

- Preserved and indexed `PROJECT_NOTES_ADDENDUM_B37A.md`: DentalPin attendance events (append-only in/out punches and correction behavior), clinic/professional schedule templates and date-range overrides, availability windows vs booked free slots, and sensitive payroll profile/period/entry lifecycle. These are comparator observations; Spanish/EU-oriented defaults are explicitly not Indian payroll law.
- `SOURCE_FIELD_MAPS.md` section 9 and `FIELD_LEVEL_INVENTORY.md` section 14 now map attendance, schedule, staff permission, employment/payroll profile, payroll period/entry and actual bank settlement as distinct concepts.
- `SOURCE_COVERAGE_REGISTER.md` records B37A evidence class and missing validation; `TRACEABILITY_MATRIX.md` is v0.4 and includes staff and payroll test rows.
- Workforce attendance/payroll is enterprise-domain research, not a confirmed MVP requirement. Indian labour, overtime, leave and statutory payroll configuration remain legal/HR review pending.

The current documentation set therefore covers B17–B38 plus the explicitly named B37A companion. Keep the source sequence and B37A link in the index; do not merge its source-specific payroll assumptions into an Indian canonical model without validation.


## 35. Cross-system comparison and workforce integration (B37A, 2026-10-27)

- `PROJECT_NOTES_ADDENDUM_B37A.md` documents DentalPin source observations for append-only staff attendance punches, clinic/professional schedule templates, date-range overrides, the distinction between availability windows and actual free slots, and role-restricted payroll period/profile/entry lifecycles. This is a comparator, not an Indian payroll implementation; keep the workforce domain optional until scoped and separately validate Indian statutory rules.
- `CROSS_SYSTEM_COMPARISON.md` consolidates the main coverage differences across DentalPin, Open Dental, OpenEMR EHI, ABDM/FHIR and the preserved ClearFlow prototype. It compares source strength, lifecycle distinctions and prototype gaps and explicitly notes that the comparators are not universal schemas.
- `TRACEABILITY_MATRIX.md` is now v0.4, with B38 radiation/waste/facility/tax items and a B37A workforce attendance/scheduling/payroll section. `SOURCE_FIELD_MAPS.md` and `FIELD_LEVEL_INVENTORY.md` include B37A source-qualified field groups; `SOURCE_COVERAGE_REGISTER.md` records B37A source/test evidence and country-scope limitations.
- The prototype remains a three-table clinic/patient/visit slice and the reviewed frontend uses direct Appwrite TablesDB operations. The matrix does not assert these controls are implemented. The private row permission vs listRows behavior and forged parent-ID defenses still require a two-account, synthetic-data sandbox run before any patient-data pilot.

**Research assembly status:** the core comparison, source-specific batch index, field-family maps, traceability matrix and implementation gap report are now connected. The research-documentation work is assembled through B38 plus B37A; full physical-source-column extraction, legal/clinical review, live security tests and schema implementation remain explicit gates.


## 36. Cross-system comparison integrated (2026-10-27)

`CROSS_SYSTEM_COMPARISON.md` was found in the repository root, inspected, and added to `RESEARCH_INDEX.md` and `RESEARCH_COMPLETION_STATUS.md`. It compares the domain contribution and limitations of DentalPin, Open Dental, OpenEMR, ABDM/NRCeS, India official sources and the preserved ClearFlow prototype. It covers tenant/role access, patient identity, workforce, scheduling, clinical context, odontogram/periodontics, plans/procedures, encounter notes, medications/prescriptions, lab and imaging, signatures, waste/radiation, facility compliance, inventory/finance/claims, communications, migration, audit and AI execution.

Use this comparison as the summary layer over the source-specific evidence. The source-field maps remain the field-family detail, the coverage register remains the evidence-quality ledger, and the traceability matrix carries testable candidate invariants. The comparison's “absent” label is limited to the inspected prototype paths/schema and never means that a domain is unnecessary; “explicit” in a source is only explicit within that source and does not confer universal/Indian legal authority.
