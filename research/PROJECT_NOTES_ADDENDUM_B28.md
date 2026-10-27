# ClearFlow Dental Clinic — Research Addendum (Batch 28)

Reviewed 27 October 2026. Direct Open Dental official API pages for allergies, medication reference data, patient medication history, prescriptions, patient notes and recall types. These fields help compare product choices; vendor enums and IDs are not the ClearFlow canonical model.

## 1. Allergy reference catalogue vs patient allergy event
Sources: https://www.opendental.com/site/apiallergydefs.html ; https://www.opendental.com/site/apiallergies.html

`AllergyDef` is a reusable allergy/agent catalogue: description, hidden state, edit timestamp, SNOMED type, optional medication link and UNII code. A patient `Allergy` is a separate row linking to the definition and carrying patient, reaction text, active state, adverse-reaction date and edit timestamp. A new allergy row can be created from a definition ID or original description; patient record can be marked inactive. The example reference table includes a SNOMED classification field that may be `None`, not a universal ontology mapping.

ClearFlow should preserve both the original reported term and normalized substance/concept mapping; source, reporter, recorded/verified time, reaction, severity, onset date, confidence and active/resolved status should not be flattened into a catalogue label. A retired/hidden reference term must not erase patient allergies. Unknown, no history asked, patient denies, and positive allergy must be distinct values. Map SNOMED/UNII only when the evidence supports a match; missing reference codes must not block retention of the original clinical fact.

## 2. Medication catalogue vs current medication statement vs prescription
Sources: https://www.opendental.com/site/apimedications.html ; https://www.opendental.com/site/apimedicationpats.html ; https://www.opendental.com/site/apirxpats.html

### Medication catalogue
`Medication` includes brand/display name, a generic-medication link (`GenericNum` or `genericName`), notes (only set for generic entries) and hidden state/edit timestamp. ClearFlow should represent medication ingredient, brand/product, strength/form/route/units, terminology IDs and valid identifiers separately; the vendor's generic link is only the catalogue's identity relation.

### Patient medication list
`MedicationPat` links a patient and a catalogue medication and stores patient note (the example uses free text for dose/frequency), optional start/stop dates and provider. Discontinued records are filtered on DateStop; the API can include them. This is a patient-reported/patient-context medication-list model—not a prescription order or proof of dispensing.

### Prescription
`RxPat` carries patient, prescription date, raw drug text, directions/signature (`Sig`), dispensed quantity, refills, prescriber, notes, pharmacy, controlled-medication flag, eRx send status, legacy-eRx marker, pharmacy info, procedure-required flag + procedure link, days' supply, patient instructions, clinic and edit timestamp.

ClearFlow should model the normalized medication order/prescription items and keep exact source/display string, strength/unit/dose/frequency/route/duration/instructions, quantity/refills/days' supply, prescriber/license snapshot, pharmacy identity, issue/sent/acknowledged/cancelled/superseded/discontinued states, prescription-document version/hash and transmission evidence. A new prescription may update a patient’s reported current medication list, but must not be automatically assumed dispensed or taken. A manually entered patient medication is not proof that ClearFlow prescribed it. Keep the raw and normalized versions linked. Any clinical medication safety logic must reference versioned reliable evidence and clinician disposition.

## 3. Patient note summary vs longitudinal records
Source: https://www.opendental.com/site/apipatientnotes.html

Open Dental `PatientNote` is 1:1 with patient and carries `FamFinancial`, `Medical`, `Service`, `MedicalComp` (complete medical-history text), `Treatment` (general/odontogram notes), emergency contact name/phone, and entry/edit timestamps. The API documentation says updates replace the existing note; to append, the caller must first read and manually concatenate. This is a legacy summary-note pattern and can lose text under concurrent updates.

ClearFlow must keep structured longitudinal clinical history and versioned encounter/clinical notes as source of truth. A formatted patient summary may be a read model or editable draft, but updating it must not erase underlying allergy, medication, diagnosis, surgery, risk context, contact or care history. If a user asks the AI to “add a note,” create a new attributed note/version, not append text by read-modify-write without locking. Store author, signed/finalized state, created/edited time, visibility/sensitivity, encounter/treatment references and amendment history.

## 4. Recall type configuration vs individual recall obligations
Sources: https://www.opendental.com/site/apirecalls.html ; https://www.opendental.com/site/apirecalltypes.html

`RecallType` is policy/config: description, default interval, time pattern, linked procedure codes and a setting to append the recall to another special instruction. A patient `Recall` holds due date, previous date, interval, status, notes, disabled flag, recall type, disable-until balance/date, scheduled date, priority and time-pattern override. The recall work list separately projects reminders count/date, preferred contact method and contact status. ClearFlow should store the interval/policy version that produced each due date; a policy edit should affect future computations predictably and not rewrite sent communications/history.

## 5. Domain distinctions and integrity tests added
1. Catalogue term retirement cannot erase patient history or issued prescriptions; source term and normalized mapping remain available.
2. The patient medication list can have discontinued historical medicines; active filters must not delete the source records.
3. Prescription issued/sent/accepted/dispensed/medication-statement states are distinct and only transition when supported by evidence; a generated PDF is not a pharmacy delivery receipt.
4. Prescription corrections are versioned or cancel-and-reissue; issued artifact, directions, pharmacy, quantity, refills, prescriber identity and authorization evidence remain snapshotted.
5. Allergy has explicit substance, reaction, adverse date, source and review status. Empty table alone cannot be interpreted as a negative allergy history.
6. A patient note summary refresh never deletes structured history and is concurrency safe. Append/amend creates a new revision/event rather than overwriting unseen concurrent changes.
7. Recall default-interval changes have clear effective-date behavior; existing due obligation, contact attempt, message queued, message delivered and appointment booked remain independent entities/events.
8. Medication safety warning ties to exact medicine/allergy/clinical context and evidence source/version, records clinician override/reason, and never issues or alters a prescription without authorization.

## 6. Source-quality caveats
- The reviewed pages are first-party Open Dental API documentation, but the vendor states that database schema docs have additional column semantics; treat these as API field evidence, not complete DDL.
- The Open Dental laboratory API pages were blocked by the content retrieval safety checker in this pass; no fields are claimed from that failed fetch. Previously recorded third-party mirror information about lab cases remains lower-confidence evidence and must be verified through a safe official source route before locking the model.
- The local medication and allergy fields are examples of one EHR's structure, not exhaustive clinical safety data requirements. ClearFlow must account for source, date, verifier, terminology, dose/unit and local clinical workflows before finalizing these entities.