# ClearFlow Dental Clinic — Research Addendum (Batch 27)

Reviewed 27 October 2026. This batch adds direct Open Dental API documentation evidence for claims/payment posting, patient insurance enrollment, treatment-plan snapshots, clinical procedures, recurring patient accounts, recall, and document/EOB attachments. The API pages explicitly refer implementers to the product’s database schema docs for column semantics; this is API/model evidence, not a substitute for full DDL review.

## 1. Coverage is a multi-entity graph, not a patient insurance field
Official sources:
- Patients: https://opendental.com/site/apipatients.html
- Insurance plans: https://www.opendental.com/site/apiinsplans.html
- Subscriber enrollment: https://opendental.com/site/apiinssubs.html
- Patient plan/coverage: https://www.opendental.com/site/apipatplans.html
- Benefits: https://www.opendental.com/site/apibenefits.html
- Eligibility verification: https://opendental.com/site/apiinsverifies.html

Open Dental describes `InsSub` as linking an insurance plan to a subscriber; it does not itself define coverage. `PatPlan` is the person/family-member coverage link, with ordinal primary/secondary order, relationship, pending flag and patient-specific ID override. The plan has group name/number, plan note, fee schedules, plan type (percentage/PPO/flat copay/capitation), claim form, employer/payer carrier, UCR and substitution behavior, allowed/copay schedule, renewal month, coordination-of-benefits rule, orthodontic claim automation, billing type, PPO writeoff, exclusion fee and zero-writeoff overrides. InsSub stores subscriber/member ID, effective/termination dates, benefit notes, release-of-information authorization, assignment-of-benefits authorization and subscription note. The benefit records can be scoped by plan or patient-plan, coverage category, procedure code/group, type, percentage/amount/period/quantity, coverage level, treatment area and tooth range. API uses `-1` for an empty percent/amount; do not import that as a genuine numeric negative.

`InsVerify` separates patient enrollment verification from plan benefit verification. It stores verify type, FK to member plan or plan, verified date, status definition/note, actor/assignment and edit timestamps. The official API explicitly says historical verification entries are retained in `insverifyhist`. Therefore do not overwrite all verification evidence with one current boolean/date.

### ClearFlow decisions
- Normalize payer/carrier, plan contract, subscriber, patient enrollment, coverage priority, covered-member relation, benefit rule, fee schedule, eligibility check/response and preauthorization separately.
- Record who the covered person is, who the subscriber is, why this patient is related, validity dates, primary/secondary order and any authorization/assignment evidence. Do not conflate `relationship` to subscriber with guardian authority or patient identity.
- Store eligibility/benefit rule version, checked date, response provenance and freshness; any estimate should identify whether the value is entered, policy-derived, payer-confirmed or still unknown.
- Build country-specific plan/claim adapters; Open Dental plan types and IDs include US commercial, PPO, capitation, employer and orthodontic assumptions and must not be global clinical enums.

## 2. Claim header vs line adjudication vs payer check/remittance
Official sources:
- Claims: https://www.opendental.com/site/apiclaims.html
- Claim procedure lines: https://opendental.com/site/apiclaimprocs.html
- Claim payment/check: https://opendental.com/site/apiclaimpayments.html
- Claim tracking: https://www.opendental.com/site/apiclaimtrackings.html
- EOB attachments: https://opendental.com/site/apieobattaches.html

The claim header includes service/sent/received dates, status, payer plans 1 and 2, treating and billing providers, claim fee, estimated and actual insurance payment, deductible applied, prosthesis/original date, underpayment reason/note, claim type (primary/secondary/preauthorization/capitation/other), place of service, accident fields, orthodontic duration/date, subscriber/member links, write-off, authorization number, medical/dental type, custom status tracking, correction type, original reference, claim identifier, share of cost, edit timestamp and ordering/referral provider. Status includes unsent, held for prior claim, waiting, sent, received and in-process.

ClaimProc is used for several different claim-related functions: link procedure to a claim, attach insurance payment to a procedure, estimate insurance for a procedure without a claim, and adjustments/supplemental/capitation/history. It stores procedure/claim/patient/provider, billed fee, estimate and actual insurer amount, deductible, status, remarks, payer check/batch link, plan/subscriber, writeoff, code sent, allowed fee override, percentage/copay override, other-insurance paid, estimates and override fields, clinic, payment row, pay-plan link, tracking, entered/edited actor/time, supplemental-received and finalization dates, transfer/overpayment flags, and claim adjustment reason codes.

ClaimPayment is one received insurer check/remittance-level object. It stores check date, check amount, check number, bank/branch, note, clinic, deposit linkage, payer/carrier name, date issued on check, partial-payment flag, payment type, entry/edit actor/time, payment group/lockbox. EOB attachments link a file to ClaimPayment, with filename/creation time and file bytes/path handled separately. API docs say finalizing a claim payment requires the sum of unattached ClaimProc actual-insurance-amount lines to equal the check amount (unless a separate batch-only path is configured). This is a strong evidence point for batch balancing, line allocation and atomic finalization.

ClaimTracking is status/event-like tracking for a claim with tracking type, actor, timestamp, note, status definition and error definition. Although the API lets existing tracking entries be updated, ClearFlow should treat status-history events as append-only and make corrections by new events, not silently mutate past status evidence.

### ClearFlow financial invariants
1. A claim submission is not a receipt, a ClaimProc adjudication is not the claim header, and a ClaimPayment/remittance is not the patient’s cash payment.
2. Insurer amount, estimated amount, allowed amount, deductible, writeoff/adjustment, other-payer amount, patient amount and cash received are distinct fields/facts.
3. A remittance/check batch may contain multiple claim/service-line allocations; sum and reconciliation must balance before finalization. Preserve the original payer response/EOB file and any supplemental/corrected payment evidence.
4. Primary/secondary coordination is a sequence of payer adjudication, not a pair of text fields. Keep original and corrected/resubmitted claim versions, external payer claim references and denial/adjustment reason codes.
5. Record money in exact decimal or minor-unit amounts with currency and consistent rounding policy, not binary float.

## 3. Patient payments vs insurer claim checks vs account adjustments
Official sources:
- Patient payments: https://www.opendental.com/site/apipayments.html
- Account adjustments: https://opendental.com/site/apiadjustments.html
- Statements: https://www.opendental.com/site/apistatements.html
- Payment plans: https://www.opendental.com/site/apipayplans.html

Patient `Payment` records include patient, pay type, payment date/entry date, amount, check number, bank/branch, note, clinic, deposit number, receipt text, recurring-card flag, edit actor/time, payment source/status, recurring charge date/completion and merchant fee. Open Dental says patient-payment POST creates pay-splits and applies funds FIFO to outstanding charges; overpayment becomes unearned income. It can optionally mark money as a prepayment/unallocated prepayment, target a dynamic payment plan, target selected procedures, or route a payment to the person instead of family members. Insurance checks use ClaimPayment, a separate record. ClearFlow should never merge these payment event types.

Adjustments are separate patient account events with amount, type definition (positive/negative), transaction date, patient, provider, note, procedure, procedure date, clinic and audit fields. The API requires amount sign to agree with the adjustment type and does not allow future adjustment dates. These are not cash receipts and should not be represented as negative payments by convention.

Statements include patient/guarantor, sent date, date range, note/bold note, delivery mode, show/hide payments, single-patient/intermingled flags, sent flag, linked document, receipt/invoice/invoice-copy flags, family/superfamily, balance validity, insurance estimate, total balance and statement type. The docs explicitly state that creating a statement does not impact billing. Statements and communication delivery records should be separate from invoices, payments and balances; rendering/printing/sending is not posting a financial transaction.

Payment plans include patient, guarantor, agreement date, APR, notes/agreement text, insurance plan/subscriber link where relevant, schedule/number of payments/amount/down payment, closed/locked status, category, dynamic flag, charge frequency/start date/interest start, plan behavior, principal and agreement-sheet template. Open Dental identifies older patient payment plan APIs as deprecated and distinguishes newer dynamic plans. ClearFlow should avoid copying these version-specific type names into a global enum, but retain terms, rate, principal, schedule, due dates, payment allocation, signed agreement/version, status and computed remaining balance.

## 4. Treatment planning is not the live procedure ledger
Official sources:
- Treatment plans: https://opendental.com/site/apitreatplans.html
- Treatment plan attachments: https://opendental.com/site/apitreatplanattaches.html
- Saved-plan procedure copies: https://opendental.com/site/apiproctps.html
- Procedure log: https://opendental.com/site/apiprocedurelogs.html
- Procedure catalogue: https://opendental.com/site/apiprocedurecodes.html
- Fees: https://opendental.com/site/apifees.html

Open Dental’s official docs explain that treatment plans track accepted treatment, uncompleted charted treatment, or patient-denied treatment. Active/Inactive plans reference live procedures via attachment rows; Saved plans use copied procedure rows (`ProcTP`) that do not change when the source procedure changes. The plan holds patient, date, heading, explanatory note, status (Saved/Active/Inactive), plan type (Insurance/Discount), presenter, responsible party, linked document, signing provider/patient text and signed timestamps/status.

Saved plan line copies include source procedure reference, item order, priority, tooth/surface, code/description, fee, primary/secondary insurance estimate, patient amount, discount, prognosis/diagnosis text, provider, fee allowed, tax amount and clinic. This is a clear snapshot model: quotes that were actually offered and signed must not drift after catalogue, fee schedule, coverage estimate or treatment coding changes. A live treatment/procedure is separate from the plan-line snapshot; a completed procedure is separately dated and attributed.

Procedure logs include patient/appointment, procedure date and fee, surface/tooth/tooth-range, priority, status (treatment plan, completed, existing current/other provider, referred out, deleted, condition, inactive plan), provider, diagnosis, planned appointment, place of service, prosthesis flags/dates, claim and billing notes, clinic, catalogue code, unit quantity/base units, plan date, site, hidden-graphic flag, procedure start/end times, prognosis, edit lock, SNOMED body site, multiple diagnostic codes, ICD version, ordering/referral provider and discounts. Procedure catalogue includes code/descriptions/abbreviation/time pattern/category/treat area, no-insurance-bill/prosthesis/hygiene/radiology flags, default notes, alternate and medical codes, taxed flag, paint/layman terms, Canadian lab/base-units/substitution/revenue-code/provider defaults and diagnostic codes.

Fee records link procedure code + fee schedule + clinic override + provider override and keep actor/created/edited timestamps. Thus ClearFlow should have normalized procedure concept/code system, localization and validity, separate price schedule scope, and issue/performed snapshot values. A catalogue’s current price is not the price of a previously accepted plan or already-issued invoice.

## 5. Periodontal observations: source encoding cannot be the canonical domain
Official source: https://opendental.com/site/apiperiomeasures.html

Open Dental stores one `PerioMeasure` sequence type per tooth per exam and six site values (MB, B, DB, ML, L, DL) plus a tooth-level value. Types include Mobility, Furcation, Gingival Margin, MGJ, Probing, SkipTooth and bit-packed Bleed/Suppuration/Plaque/Calculus. The API uses `-1` for no measurement and values greater than 100 to encode negative values (100 minus stored value). CAL is not stored separately; it is computed as probing depth plus gingival margin. Those are vendor transport/database conventions, not canonical units.

ClearFlow should normalize a dated periodontal exam with tooth/site measurements, units, observation type, actual value/null, explicit no-measurement/skip status, source and reviewer. Do not import bit-packed flags as a single opaque value or treat `-1` as actual negative mm. Preserve the raw source payload/mapping for migration. Define domain validation per observation type and tooth notation system; keep derived indices (CAL/BoP/plaque/bleeding aggregates) reproducible and label calculated vs clinician-entered values.

## 6. Recall, document and schedule notes
- Patient recall API includes due date, previous date, interval, recall status, note, disabled flag, recall type, disable-until-balance/date, date scheduled, priority and time-pattern override. Its list projection adds reminders-sent count/date, preferred contact method, call outcome/status and administrative note. These are distinct from raw outbound message attempts/delivery. Recall configuration controls which recall types/procedures appear in lists; recall intervals need versioned/effective policy.
- Patient document API covers image/PDF assets, category, patient, filename, image type, tooth numbers, description, creation time, provider and print-heading. It returns document metadata distinct from binary file, and it handles stored images and imaging mounts differently. Some file APIs rely on SFTP paths/credentials, and deleting certain objects may remove stored files. ClearFlow should preserve original bytes/object-storage metadata, derivative IDs, checksums, MIME validation, retention and attachments, while never exposing filesystem paths or credentials in the standard UI/API.
- Appointment API includes status, appointment pattern and secondary pattern, confirmation status, locked time, operatory, note, provider and hygienist, appointment time, linked planned appointment, unscheduled status, new-patient flag, procedure description, assistant, clinic, hygiene flag, arrival/seated/dismissed timestamps, asked-to-arrive time, insurance plans, entry actor/date, priority, appointment type and last-modified timestamp. Schedule API distinctly represents practice, provider, blockout, employee and web-ASAP schedules, with date, start/stop time, op list, staff/provider, blockout definition, notes and last-modified timestamp. ClearFlow should preserve resource assignment and separate schedule availability from actual appointment status/arrival workflow.

## 7. New ClearFlow validation and schema backlog items
1. Reconcile insurer payment batches: sum of final line allocations must equal remittance/check amount or the batch stays open/inconsistent with a visible variance.
2. Record insurer payment receipt/check date, date received/entered, date issued, deposit and posting date separately. Do not collapse into one `payment_date`.
3. A patient's coverage link may be removed/ended without deleting the underlying payer plan or subscriber record, and historical claims must still point to the historical coverage and subscriber.
4. Benefit changes after plan signing never rewrite frozen quote line estimates, accepted discounts, tooth/surface/procedure scope or document signatures.
5. A statement/doc/communication may be generated, printed, or sent without altering invoice/payment ledger. An account adjustment is not a cash refund; refund event remains a separate cash flow.
6. Payment FIFO/unearned-funds behavior must be explicit and configurable; ClearFlow must support unapplied credit and controlled reallocation with an audit event.
7. Signed plan snapshot supports the accepted price, signature text/identity, signing date, patient/care plan version, clinic signature, linked document/hash and a reissue/supersession path.
8. Clinical procedure status distinctions (planned/completed/existing elsewhere/referred/condition/inactive plan/deleted) should not be reduced to one active boolean; use local canonical lifecycle with mapped source status.
9. Perio measurements preserve null/no-data/skip tooth as distinct from clinically measured zero and convert vendor-coded values to canonical units without losing raw import trace.
10. Use separate, versioned terminology/pricing/coverage catalogs; record who changed fee/benefit/priority and preserve old code/description/fee snapshots.

## Sources and confidence note
The pages above are first-party Open Dental API documentation at the cited URLs and include field examples and endpoint semantics, but the vendor itself cautions that the database schema documentation has additional column detail. Treat this batch as strong field/API evidence; before a final schema lock, compare the table schema pages and test important invariants against more than one system. Open Dental’s API model is not a globally applicable standard and its numeric IDs, US insurance types, claim statuses and vendor conventions must remain behind import/localization adapters.