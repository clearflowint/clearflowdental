# ClearFlow Dental Clinic — Research Addendum (Batches 23–24)

Reviewed 2026-10-27. Source-derived observations, not a final schema. Companion to PROJECT_NOTES.md; the complete consolidated notebook is preserved locally in ClearFlow_Dental_PROJECT_NOTES_Complete.md.

## Batch 23 — payer posting, eligibility, reorder policy, notifications, media

### OpenEMR payer / claim / ledger tables
Sources:
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/insurance_data.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/benefit_eligibility.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/eligibility_verification.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/claims.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/billing.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/ar_activity.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/ar_session.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/payment_processing_audit.html
- https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/x12_partners.html

Observed insurance_data fields include priority primary/secondary/tertiary, payer/plan/policy/group, subscriber names/ID/DOB/sex/relationship/address/phone/employer, copay, assignment acceptance, policy type and effective/end dates. Payer master holds payer IDs, insurance-type code, clearinghouse/X12 receiver and eligibility integration IDs; insurance_numbers separates billing provider and rendering provider identifiers/types. Eligibility verification is a dated check; benefit_eligibility responses contain coverage level/type/period, plan information, amount/percent, network, message and response state. Eligibility is not a durable guarantee.

Claims have patient/encounter/payer, version, payer type, claim state, billing-process state/times, file/target, X12 partner and submitted payload. Billing lines have code system/code/modifier/units/fee, provider, encounter, payer, billed/process state, external IDs, revenue code and charge category. AR activity separates fee, actual payment, adjustment, payer type, posting date/time/user, posting batch, reason/account code, follow-up and payer claim number. AR session stores EOB/check reference, check date, deposit date, total/global amount, adjustment code, post-to date, patient and method. Payment-processing audit tracks provider action, ticket/transaction IDs, payload and reversal details. X12 remote tracker tracks file/status/claim references/messages.

ClearFlow requirements: normalize claim lines and responses; model eligibility response lines and timestamps; separate claim submitted amount, allowed amount, payer payment, contractual adjustment, deductible, coinsurance, denial, patient responsibility and actual cash; model remittance/posting batches and line activity separately; preserve outbound/inbound payload evidence and idempotent integration IDs; don't place gateway credentials in normal queryable configuration.

### DentalPin reorder policy
Source: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/inventory_reorder/CLAUDE.md
Reorder is a computed view from stock movements, items, suppliers/lead time, supplier-item prices and open PO lines; no table of recommendations. The reviewed implementation uses 90-day negative stock movement as demand, preferred supplier then deterministic fallback, daily usage, a lead-time reorder point and 30-day cover. Draft POs are created through the canonical purchase-order service grouped by supplier. These time windows/formula defaults are policy choices, not a universal norm. SupplierItem stores supplier SKU and quoted price with unique supplier-item scope and soft-deactivation to preserve PO history. ClearFlow should consider pack size/MOQ, expiry, seasonality, partial receipts, price validity/currency and approval.

### DentalPin notification model
Sources:
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/notifications/models.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/notifications/gateway.py
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/notifications/CLAUDE.md
- https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/recall_reminders/__init__.py

Templates are channel/locale-specific and may be system/global or clinic-specific; WhatsApp template IDs require approved status. Preferences have patient/user subject, channel toggles, opt-in timestamps, per-notification-purpose choices, locale and WhatsApp inbound-window timestamp. Clinic settings separately govern event enablement/auto-send/channel/fallback/SMS cap. Channel adapter config is non-secret; provider credentials are held by vendor modules. CommunicationMessage is an outbox row plus current audit projection with direction, destination, patient, template key, message kind, attempts/max, next retry, provider IDs, error, dedup key, sent/delivered/read times, trigger event/user and sanitized context.

Outbox dispatch is asynchronous after transaction commit; it selects due rows using FOR UPDATE SKIP LOCKED, respects attempt limits and next_retry times, and records failed/skipped/delivered states separately. Exponential backoff is capped at one hour in the reviewed code. Crucially, do_not_contact and patient per-type/channel opt-outs are hard blocks even when force_send is requested; force_send bypasses only clinic-level auto-send settings. Preflight dedup read requires a partial unique database index as the concurrency backstop. Recalls create care obligations; a separate recall_reminders module invokes notifications, so a recall is not proof of attempted/delivered communication.

### Media and attachment safety
Sources: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/media/models.py ; https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/media/CLAUDE.md
Document distinguishes administrative document_type from media_kind (document/photo/xray), category/subtype, original filename, scoped unique storage path, MIME/size, captured_at, paired-document relation, tags, uploader and active/archive. Thumbnails/medium are derivatives; original remains untouched; capture time may come from EXIF. Category/subtype matrix and same-patient before/after pairing are service-validated. Polymorphic attachment owner registry has no owner FK by design; only safe if every writer uses the registry and validates tenant/patient ownership. Soft archive/restore and retention rules should be class-specific.

## Batch 24 — patient context, consent gate, appointment and coverage details

### Patient and clinical context
Sources: https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/patients/models.py ; https://github.com/dentalpin/dentalpin/blob/main/backend/app/modules/patients_clinical/models.py
Patient core includes name, phone/email/DOB, notes, active/archive, do_not_contact, gender, national ID/type, profession/workplace, preferred language, address/photo and separate billing identity/address/email. The reviewed effective billing tax ID falls back to national ID except passport; this is a country-specific implementation rule, not an India rule to copy. MedicalContext is 1:1 and stores pregnancy/week, lactation, anticoagulant/name, INR/date, smoking/frequency, alcohol, bruxism, anesthesia-reaction flag/details and actor/time. Allergy, medication, disease and surgery history are separate repeatable records rather than one JSON blob. EmergencyContact and LegalGuardian are separate 1:1 entities in this source but do not fully model general contact authority, scope and validity.

### Appointment race/state rules
AppointmentService normalizes naive clinic-local times into UTC instants and records an initial status-history event. Transitions re-read the row under lock before validating allowed state edges; in_treatment requires a cabinet. Exact-start uniqueness is not enough to block all interval overlap. ClearFlow needs interval conflicts for provider, operatory and equipment plus concurrency tests and explicit allowed double-booking exceptions.

### New cross-domain matrix entries
- Insurance: payer IDs, coverage priority/effective dates, subscriber snapshots, billing/rendering provider IDs/types, eligibility request/response + benefit lines, plan-specific fee schedule and effective date.
- Accounting: remittance/EOB/check posting session, deposit/posting dates, line allocations, payer adjustments/reasons, reversals, payment processing audit and gateway/clearinghouse file tracking.
- Communications: patient/user subject, purpose and channel preferences, opt-in evidence, locale, provider approved-template status, retry/backoff, idempotency and actual delivery/read evidence.
- Inventory: supplier-item SKU/quoted-price history, lead-time provenance, open PO quantity/partial receipt, reorder algorithm version and draft PO approval.
- Patient safety: source/reviewer for clinical context and units/precision; guardian relationship is not automatically legal decision authority.
- Media: source/capture vs upload time, taxonomy validation, originals vs derivatives, checksum, same-patient pairing, scoped storage and owner registry validation.

Research remains ongoing; this addendum is not a final canonical schema. Keep official jurisdiction-specific requirements separate from design patterns.