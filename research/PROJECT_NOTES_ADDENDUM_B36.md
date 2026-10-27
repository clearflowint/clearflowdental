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

## 36.7 Dental-specific longitudinal record comparison (continued research, 2026-10-27)

This section extends the existing Batch 36 prosthetic-lab workflow research. It preserves the earlier findings and its explicit open point: direct LabCases/Laboratories API schema extraction remains unverified. The source observations below use additional first-party Open Dental manuals/API/database documentation and interoperability references. These are comparator observations, not universal clinical standards or Indian legal requirements.

### Source register for this continuation
- Open Dental current database documentation 26.2 (retrieved 2026-10-27): https://www.opendental.com/OpenDentalDocumentation26-2.html
- Open Dental ProcedureLogs API: https://www.opendental.com/site/apiprocedurelogs.html
- Open Dental Perio Chart: https://www.opendental.com/site/0_periochart.html
- Open Dental Perio Chart manual: https://www.opendental.com/manual/perio.html
- Open Dental Chart Module: https://www.opendental.com/site/0_chart.html
- Open Dental Treatment Plan Module: https://www.opendental.com/site/0_treatmentplan.html
- Open Dental Recalls API: https://www.opendental.com/site/apirecalls.html
- Open Dental Imaging Module: https://www.opendental.com/site/0_images.html
- Open Dental Image Info: https://www.opendental.com/manual/imageinfo.html
- Open Dental Documents API: https://www.opendental.com/site/apidocuments.html
- Open Dental Orthodontic Chart: https://www.opendental.com/site/0_chartortho.html
- HL7 FHIR Observation: https://hl7.org/fhir/observation.html
- DICOM Supplement 32, Digital X-Ray: https://www.dicomstandard.org/News-dir/ftsup/docs/sups/sup32.pdf

### 36.8 Odontogram and structured clinical events
**Observed:** Open Dental's Chart Module presents the graphical tooth chart as a time-aware view of restorative treatment planned or performed. Related chart areas distinguish procedure entry, missing/primary teeth, tooth movements, planned appointments, progress-note views, freehand drawing and orthodontic mode. Its manual warns that the white odontogram note field is not historically tracked in the described workflow.

**Interpretation:** A graphical chart is a projection, not a sufficient underlying record. Structured clinical events, a drawn annotation, and an unversioned note are different evidence types.

**Candidate requirements:**
- Represent tooth condition, existing/restorative finding, planned procedure, completed procedure, missing/primary status, movement and freehand annotation distinctly.
- Persist the tooth-numbering convention per record/import (e.g. FDI, Universal, Palmer), dentition context and the target tooth/site/surface/arch/quadrant. Never silently interpret a tooth number without its scheme.
- Store freehand annotations as separately versioned artifacts or layers with author, timestamp, target image/tooth/region and amendment history.
- Reconstruct chart state from retained source events and versioned rendering rules where practicable; do not treat a screenshot or chart view as a replacement for structured procedure records.
- Do not copy a comparator's lack of annotation history as a ClearFlow design choice.

### 36.9 Periodontal exams and measurements
**Observed:** The current Open Dental database reference describes a periodontal exam record for one patient and date, including provider and note, with associated measurement records. A measurement record represents up to six site values for one tooth and one measurement type. Types include mobility, furcation, gingival margin/recession, mucogingival junction, probing, skipped tooth, and combined bleeding/suppuration/plaque/calculus flags. Clinical Attachment Loss (CAL) and attached gingiva are described as calculated on the fly rather than persisted as measurement types. Measurement rows have entry/edit timestamps. Its manual describes comparing up to six recent exams and shows some earlier values in grey; in the described encoding -1 means no measurement, and some non-probing values can appear carried forward from earlier exams.

**Interpretation:** “Not measured”, “tooth skipped”, “not applicable” and numeric zero are not interchangeable. A carried-forward visual value is not a new clinical observation. A derived CAL value should be reproducible from its inputs and formula version.

**Candidate requirements:**
- Exam container: patient, clinic/tenant, provider, service time, entry/edit time, status, note, collector/source and review state.
- Measurement: exam link, tooth, site/surface, measure type, value, unit, observed time, collector/method and explicit missingness/skip semantics.
- Preserve raw/import values and mapping provenance. Do not hard-code the comparator's exact numeric ranges or six-site layout as universal standards without clinical validation.
- Derived CAL/indices/summary counts must be labelled derived, version their formula and preserve inputs or be deterministically recalculable.
- Comparison views must label the source date of each prior value; values carried forward for display must never be stored/exported as newly measured.
- Validate measurement topology, units, supported values and clinical formulas with qualified dental reviewers before implementation.

### 36.10 Procedure target constraints and treatment-plan state
**Observed:** Open Dental's ProcedureLogs API exposes patient, appointment, provider, clinic, procedure code, status, diagnosis, tooth number, surface and tooth range. Treatment area support and required target fields depend on the selected procedure code; some fields for completed procedures cannot be updated, and links to appointments/claims can further restrict editing. The Treatment Plan Module distinguishes active, inactive and saved plans. Saved plans may be signed, printed, emailed or sent to a patient for review; planned appointments can be created from plans. The API uses distinct procedure statuses for treatment planned, complete, existing condition/current or other provider, referred out, deleted and inactive treatment plan.

**Candidate requirements:**
- Version the procedure-code catalog and define permitted target types per code: whole mouth, arch, quadrant, sextant, tooth, tooth range, surface or non-tooth site where applicable.
- Enforce code-to-target validation at the server mutation boundary. UI filtering alone is not a security or integrity control.
- Separate proposal, patient-facing plan, consent/acceptance, appointment booking and actual clinical service.
- A signed plan is evidence of acceptance of a specific version, not proof that the procedures were performed.
- Store an immutable content snapshot/hash for any signed plan/consent; subsequent changes produce a new version and preserve the originally displayed/signed content.
- Mark a procedure completed only via an authorized service event; do not infer completion from a saved plan or booked visit. Corrections to durable clinical records should use explicit amendment/reversal/replacement paths with provenance.

### 36.11 Recall calculation versus communication versus care delivered
**Observed:** The Recalls API includes due date, previous date, interval, recall type, disabled state, reminder communication status, scheduled date and priority. In that implementation, a patient should have no more than one recall per recall type. Its documentation explicitly distinguishes recall reminder status from the status of the resulting appointment; a reminder-status change can create a communication-log entry. Due dates may be calculated from completed procedures or insurance history in the comparator.

**Candidate requirements:**
- Keep follow-up eligibility/due calculation, outreach attempts, message delivery, patient response, appointment scheduling/cancellation/no-show and care completion as separate states/events.
- Record the due-date rule/version and the input event(s) used, so the date can be explained and recalculated.
- Treat the “one recall per type” constraint as comparator behavior pending clinical/product validation, not a universal model invariant.
- Reminder success must never change an appointment to booked or a clinical service to completed.
- Link communication to tenant, patient, purpose, channel, recipient-resolution result, consent/preferences where relevant, delivery status and provider receipt evidence.

### 36.12 Imaging: metadata, original bytes and derived renditions
**Observed:** The Open Dental Documents API says metadata reads do not return the actual file bytes. Document metadata can include patient, date/time, category, image type, provider, description and tooth numbers. The imaging UI supports image categories, drawing/annotations, windowing, crop, rotation, export and comparison. Image Info distinguishes an imported file's original date/time from import time, while its date/time fields can be edited to influence sort order. DICOM Supplement 32 describes an intra-oral digital X-ray information object organized around patient, study, series and image modules.

**Interpretation:** A metadata row, binary payload, acquisition context, rendered view and annotated/cropped derivative are different artifacts. An editable display/sort timestamp is not reliable evidence of acquisition time. Generic file upload is not equivalent to DICOM import/export conformance.

**Candidate requirements:**
- Separate asset metadata from object/file storage. Preserve stable asset ID, storage locator, checksum/hash, format/MIME, byte size, upload/import time, claimed acquisition time, source device/system and available DICOM identifiers.
- Store acquisition/effective time separately from import time and display/sort time; preserve timezone/precision and whether each timestamp is supplied, inferred or system-generated.
- Preserve original bytes where policy requires. Crops, rotations, contrast/windowing and annotations should be linked derivatives/layers with actor, time and transformation history, not silent overwrites.
- Link images to patient, encounter, acquisition modality, referring/ordering clinician, tooth/site/region, indication and interpretation/report when known; permit non-tooth images.
- When available and appropriate, preserve DICOM study/series/instance identifiers and relevant metadata; verify DICOM conformance separately from generic image handling.
- Patient portal display, staff access, external sharing and AI-analysis submission are separate tenant-scoped access decisions with audit events.

### 36.13 Orthodontic records and signatures
**Observed:** Open Dental documents orthodontic case fields such as banding, expected and actual debond dates, transfer and active status. Orthodontic chart information is recorded in dated rows; hardware can be viewed across exam dates. Its database reference describes a chart-row signature field whose source-specific hashed data is derived from ordered field names and values.

**Candidate requirements:**
- Separate orthodontic case lifecycle from dated visits, visit observations and per-tooth hardware changes.
- Preserve clinician/user, service time, chart content and the version that was signed; support reconstruction of the hardware/plan as it existed on a past date.
- Amendments create linked subsequent versions, preserving the earlier signed artifact.
- Do not assume a comparator's signature encoding meets ClearFlow's legal/evidentiary requirement. Verify signer identity, authority, intent, displayed content, timestamp, integrity mechanism and applicable jurisdictional requirements for each artifact.

### 36.14 Prosthetic lab case workflow — connection to the earlier Batch 36 findings
The existing B36 notes already document the case/lab-slip boundary and important workflow events. Additional current database reference evidence describes a lab case linked to a patient and laboratory, optionally to scheduled/planned appointments, with distinct due, created, sent, received and quality-check timestamps. Product rows can contain product/material/shade/tooth-range details. One documented vendor-integration message table updates the latest response and does not itself preserve message history.

**Candidate requirements:**
- Distinguish lab case, one-or-many work items/products, lab slip/instructions, external transmission, acknowledgement, physical receipt, quality review, fitting, remake/rejection and closure.
- Append case events with actor/source/time and external reference; do not rely on a mutable last-response value for audit reconstruction.
- Returned/received does not equal reviewed/ready. Quality approval must be explicit, attributable and linked to the specific case/product/version.
- Keep lab case due date separate from the appointment time and actual lab turnaround measurements; later policy changes must not rewrite historical expectations.
- Use minimum-necessary tenant-scoped exports; preserve relevant export and communication evidence.

### 36.15 Traceability matrix additions

| Domain | Observed source behavior | Candidate invariant | Minimum acceptance test |
|---|---|---|---|
| Tooth identity | Numeric tooth/site conventions; code-dependent target support | Tooth-coded record declares numbering scheme and target compatibility | FDI and Universal values import without silent reinterpretation |
| Odontogram | Chart view projects planned/completed procedures; notes may not be historized in source UI | Structured evidence and annotations preserve distinct provenance/history | Edit annotation; prior version and author remain retrievable |
| Periodontics | Dated exam plus typed site measurements; CAL derived | Missingness, unit, site, time and source explicit; derived values reproducible | Missing measurement cannot become zero; recalculation records formula version |
| Treatment plan | Working/saved states; signature separate from service completion | Signed plan is immutable evidence, not proof of treatment | Change plan after signature; earlier snapshot reconstructs exactly |
| Recall | Reminder status is distinct from appointment status | Outreach, booking, attendance and care delivery are separate events | Delivery success cannot set appointment booked or care completed |
| Imaging | Metadata and file bytes differ; displayed date may be editable; derivatives supported | Original, metadata, acquisition/import/display time and derivatives remain distinct | Edit display date/add annotation; original provenance stays unchanged |
| Orthodontics | Dated chart/hardware and signed chart row | Historical treatment state is reconstructible | Current hardware edit does not alter prior visit snapshot |
| Lab case | Sent, received and quality-check timestamps differ | Append-only status history; receipt does not imply clinical quality approval | Received-but-unchecked case stays not-ready and enters exception queue |
| Tenant relationships | Entities reference patient/provider/appointment/clinic IDs | Validate ownership of every linked record at read and mutation boundary | Cross-tenant chart/image/lab/recall/procedure relationship is rejected |

### 36.16 Traceability metadata and open questions
For every matrix row, record requirement ID, entity/workflow, exact source URL/version/date, evidence class, source jurisdiction/product scope, licence/attribution, candidate requirement/rationale, fields/types/units/cardinality/null semantics/keys/constraints/defaults, lifecycle transitions, provenance/audit, tenant and role conditions, negative/concurrency/retry/migration/interoperability tests, evidence status (confirmed/provisional/clinical validation/legal review/decision pending), owner and review date.

Questions still open:
1. Which tooth numbering conventions and mixed-dentition rules should be supported first for Indian clinics, with lossless cross-system mapping?
2. Which periodontal nomenclature, site topology, units, missingness rules and derived formulas are validated by dental reviewers?
3. What acquisition/report metadata is available from target Indian radiography devices, and what DICOM conformance is required?
4. Which specialty workflows are MVP scope, and how can endodontics, orthodontics, oral surgery, implants, pediatric dentistry, oral pathology and other future modules be represented without schema rewrites?
5. What retention, access, consent, signing, lab disclosure and imaging privacy requirements apply to the target Telangana clinic/provider type? Batch 35 keeps these at legal review.
6. What is the boundary between the clinical record and financial/procedure-code record for the same service? They should link but not be collapsed.
7. How will migration preserve source IDs, raw status/text, timestamps and mapping decisions without silent reinterpretation?

### 36.17 Decision
Do not freeze the schema from this evidence. Consolidate B17–B36 into a requirement-to-evidence matrix and run coverage checks by entity, lifecycle and trust boundary. Prioritize lossless representation, tenant-safe relationships, event history and clinician-controlled decisions. The conversational interface should hide complexity without discarding it.
