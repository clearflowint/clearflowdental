# ClearFlow Dental Clinic — Research Addendum Batch 33

Reviewed 2026-10-27. Primary source: OpenEMR's published EHI table dictionary. This batch records exact fields and important boundaries for prescriptions, inventory, procedure/lab orders, results, immunization and signature evidence. OpenEMR is a general EHR reference; its US-specific fields must not be copied as Indian requirements.

## 33.1 Prescription record fields
Source: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/prescriptions.html

The documented prescription table includes patient, pharmacy, provider, encounter, start/end/filled dates, drug name and drug ID, RxNorm drug code, form, dosage, quantity, size, unit, route, interval, substitution permission, refill count/per-refill, medication relationship, notes, active state, create/modify times, user/site, prescription GUID, e-prescribing source/upload state, external ID, drug info for eRx, indication, PRN, usage category and request intent. Recent fields include drug dosage instructions, created_by, updated_by and diagnosis coding text.

Implications: keep catalogue drug identity, prescribed medication text, prescription line/sig, e-prescribing submission and pharmacy fill as separate concepts. Retain both coded and human-readable values, external prescription identifiers, send/upload state, indication and PRN details. Do not assume RxNorm is the only coding system or is sufficient for Indian drug catalogues. Model correction/cancellation history rather than overwriting an issued order.

## 33.2 Medication stock and sales
Sources: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/drugs.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/drug_inventory.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/drug_sales.html

Drug catalogue includes name, NDC number, on-order amount, reorder point/max level, reactions, form/size/unit/route, substitution, related code, active, lot-combination/multiple-lot controls, drug code, consumable/dispensable flags and timestamps. Inventory row includes drug, lot number, expiry, manufacturer, on-hand quantity, warehouse, vendor and destruction date/method/witness/notes. Sales/movement row includes inventory lot, prescription, patient, encounter, actor, sale date, quantity, fee, billed-to-accounting flag, transfer source, notes, billing date, price level, transaction type sale/purchase/return/transfer/adjustment, UUID and audit fields.

ClearFlow should treat current on-hand as a projection from immutable movements; preserve lot/expiry/location/vendor and destruction/waste evidence. A medication sale or dispensing event is not automatically the same as treatment consumption, patient invoice line, payment or procurement receipt. Model links between those facts explicitly, and keep unit of measure and pack conversion to avoid silent quantity errors.

## 33.3 Procedure order, code lines, report and result are distinct
Sources: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_order.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_order_code.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_report.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/procedure_result.html

Order header fields include provider/patient/encounter, collected and ordered times, priority/status, patient instructions, active flag, lab control ID, lab, specimen type/location/volume, transmitted time, clinical history, external ID, history-only marker, diagnosis, billing type, procedure type, fasting state, facility/account, provider number, order type, scheduled date/start/end, performer type and location. Several fields are generic for lab workflows and some are US-specific (e.g. ABN status); don't adopt those as universal dental fields.

Normalized order-code lines contain sequence, procedure code/name, original-vs-added-after-send source, diagnoses, do-not-send flag, title/type/transport, end date, reason code/description and reason date/status. Report records have order ID/sequence, collection/report timestamps with timezone offsets, source, specimen number, report status, review status and lab notes. Result rows have data type, result code, description, date, facility, units, result value, reference range, abnormal flag, comments, document link, result status (including preliminary/final/corrected/incomplete) and end date.

ClearFlow model rule: order request != transmitted request != specimen collection != report != individual result != clinician review/acknowledgement != patient communication. Preserve external lab control IDs, versioned line items, raw report artifact, timezone semantics, corrections and reviewer actions. Do not treat a result as clinically acted upon just because it was imported or marked final by the lab.

## 33.4 Patient reminder obligation vs message attempt
Source: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/patient_reminders.html

Reminder rows represent a due obligation with active/inactivated state and reason, due status, patient, category/item, creation/sent dates and channel-specific sent booleans for voice/SMS/email/mail. This is a useful legacy inventory, but booleans cannot represent repeated attempts, provider message IDs, delivery/read state, failure reason, retries or opt-out evidence. ClearFlow should keep recall/reminder obligation, scheduled notification job, individual attempt and provider delivery receipt as separate related entities.

## 33.5 Immunization event detail (general EHR pattern)
Source: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/immunizations.html

Fields include patient, administered time, immunization code, CVX, manufacturer, lot/expiry, administered-by user or text, education date, VIS date, notes, created/updated actor/time, amount + unit, route, administration site, erroneous-entry flag, external ID, completion status, information source, refusal reason, ordering provider, reason code/description and encounter link. Even if vaccination is not an initial dental module, this illustrates the importance of separating order, administration, refusal, lot traceability and erroneous-entry correction. Include it only if ClearFlow's scope supports it.

## 33.6 Signature and amendment evidence
Source: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/esign_signatures.html

Signature evidence includes target row ID and table name, signer user, signature time, lock/amendment state, amendment text, hash of signed data and a signature hash. This suggests that a signature should bind to a precise version of the data, not simply a boolean on a mutable form. ClearFlow should store artifact/version identity, signer and role, timestamp, method, exact content hash, signature evidence/reference, lock/amendment status and amendment chain. Validate the cryptographic algorithm and legal adequacy independently; copying a legacy hash scheme is not the goal.

## 33.7 Cross-domain tests to add
- Issued prescription and signed note cannot silently change when catalogue or profile changes.
- Medication movement from purchase/receive through lot allocation, dispense/use, return, expiry and destruction reconciles by quantity and unit.
- Duplicate external order/report/result IDs are idempotent; corrected result preserves prior version and reason.
- Result imported as final is not considered clinician-reviewed until a distinct review event exists.
- A reminder due item can generate multiple attempts; one failed or skipped attempt does not erase the obligation.
- Signature verification fails when signed content is changed; amendment creates a new linked version.
- All medical, order, report and attachment links enforce same-tenant/patient ownership and retain source provenance.

End of Batch 33. This remains research inventory, not final schema.