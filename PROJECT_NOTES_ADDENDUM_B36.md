# ClearFlow Dental Clinic — Research Addendum B36

Reviewed 27 October 2026. Official Open Dental user-facing manuals and API documentation used to close the prosthetic lab workflow gap. LabCases/Laboratories API schema extraction was blocked earlier; this batch uses first-party manual/API evidence without claiming hidden database columns.

## 36.1 Prosthetic lab case workflow
Sources:
- Open Dental Lab Cases manual: https://www.opendental.com/site/0_labcases.html
- Open Dental LabTurnarounds API: https://opendental.com/site/apilabturnarounds.html
- Open Dental Sheets manual: https://opendental.com/site/0_sheets.html
- Open Dental Appointments Module manual: https://www.opendental.com/site/0_appointments.html

The Lab Cases manual confirms that cases can originate from the Chart Module, Treatment Plan Module or Edit Appointment window. Each case is associated with a specific laboratory and can include instructions, lab fees and a due date. A case may be attached to an appointment; workflow statuses track sent, received and quality checked. The outstanding-case list can filter by date and clinic, and the appointment screen shows cases expected for the selected date. Lab slips are generated from the case using customizable Sheet templates; a template can be associated with a particular lab to populate the correct outgoing instructions.

The LabTurnarounds API stores one service/turnaround descriptor associated with a laboratory, with a description, days published by the lab, and days actually observed. These are separate fields; a change in published turnaround should not silently rewrite existing case due dates or the historical observed time.

This is a prosthetic-restoration production workflow. It is distinct from a diagnostic specimen order/result, from a purchase order/goods receipt, and from an appointment booking. The case may link to each relevant record, but none is the other.

## 36.2 ClearFlow candidate model — distinguish confirmed fields from candidate extensions
Confirmed from the Open Dental manual: laboratory link, instructions, lab fee, due date, appointment association, sent/received/quality-check statuses, outstanding cases filtered by due date/clinic, and lab-slip generation/template association. Confirmed from LabTurnarounds API: laboratory, service description, published days and actual days.

Candidate broader enterprise fields to compare against other systems (not claimed as Open Dental fields): patient and treatment/plan references, tooth/tooth-range and arch, restoration/work-item type, material, shade system/code, impression/scan method, antagonist/occlusion instructions, due-date change history, status timestamps/actors, lab acknowledgment, shipping/tracking reference, receipt completeness, fit/quality acceptance, rejected reason, remake parent/reason, cost/quote and invoice attachments, exact rendered lab-slip artifact/hash, and source/external IDs.

Recommended normalized entities/relationships:
- Laboratory/vendor profile and contact points.
- Laboratory service catalogue / turnaround policy, with effective period and published-vs-actual time evidence.
- Lab case/work-order header linked to patient, encounter, treatment-plan item, appointment and laboratory.
- One or more work items for tooth/arch/restoration/required design instructions if the product supports multi-piece casework.
- Append-only stage/event history: draft, ready-to-send, sent, acknowledged (if reliable), in production (if exposed), dispatched, received, quality checked, accepted, remake/rework, rejected or cancelled.
- Lab slip template version + rendered document and delivery evidence.
- Receipt/quality/rework evidence, with replacement work orders linked to the original case.

## 36.3 Appointment operations: projections vs explicit obligations
The official appointment manual names operational lists for due-but-unscheduled recalls, upcoming confirmations, planned appointments needing scheduling, cancelled/missed appointments needing reschedule, ASAP earlier-opening requests, upcoming insurance verification, appointment history/family recall info, outstanding lab cases for a date, waiting room, staff/provider hours and reminders/tasks due today.

ClearFlow should derive queue tabs from canonical state where possible. When the item is a durable obligation with owner, due date, snooze, completion and evidence, model it as a task/obligation. Do not create extra writable status tables for list filters that simply project appointment, recall, insurance or lab status.

The manual states that completing an appointment can also mark attached procedures complete. ClearFlow should provide one authorized idempotent completion workflow to update appointment/procedure state atomically, and publish events after commit. It must not double-complete treatment or consume stock twice after a double tap/retry.

## 36.4 Boundary rules
1. Diagnostic service request/specimen/report/result is clinical diagnostics.
2. Prosthetic lab case/work items/receipt/quality/remake is restoration production.
3. Purchase order/receipt/invoice/stock movement is procurement.
4. Appointment is planned visit/resource booking; case due date is lab production target.
5. Treatment plan is patient-accepted clinical/financial proposal snapshot; production-stage changes do not rewrite it.
6. Lab slip is an instruction artifact; creating/printing/sending a slip does not prove the lab received or accepted the work.

## 36.5 Acceptance tests
- Case creation from chart, plan or appointment resolves to one canonical case and retries idempotently.
- Receiving a case without a prior sent/production event requires an explicit legacy/import exception.
- Requested due date changes append a reasoned event and preserve previous due dates.
- Turnaround policy changes do not rewrite active case dates; published and observed days are independently retained.
- Lab-specific template version and rendered slip remain unchanged after later template edits.
- Physical receipt is distinct from clinical fit/quality acceptance; remakes link to an original case and reason.
- Completing appointment and treatment is transactional/idempotent; stock consumption keys off the actual performed treatment event.
- Work queues are projections of canonical states or explicit obligations, not duplicate mutable state.

## 36.6 Evidence limitation
The official Lab Cases manual confirms the operational semantics above and the API confirms published vs actual turnaround fields. The direct LabCases/Laboratories API schema field list remains unverified because extraction was blocked. Keep this as an open item in the source-confidence matrix. Do not label candidate materials/shades/work-item fields as confirmed vendor columns until a first-party schema reference or another independently verified source confirms them.

End of Batch 36. This is research evidence, not final schema.