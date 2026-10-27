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
Official, versioned dental-practice data dictionary; primary established dental reference for treatment plans, procedure codes, payments, claims, recall, charting, scheduling, imaging, labs and operations. Confirm the documented version before finalizing a field inventory. Commercial/proprietary reference; do not assume code reuse rights.
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
