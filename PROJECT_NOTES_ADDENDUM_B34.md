# ClearFlow Dental Clinic — Research Addendum Batch 34

Reviewed 2026-10-27. Source: OpenEMR EHI table dictionary. Focus: patient demographics, observations/vitals, medication statements, forms and signature evidence. OpenEMR includes legacy and US-specific fields; use it to discover concepts, not to copy its complete schema unchanged.

## 34.1 Patient record: data categories should not be one flat patient form
Source: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/patient_data.html

The table dictionary lists a very wide patient record with identifiers, title and names, preferred language, DOB, address, multiple phone numbers (home/business/contact/cell), email and direct email, pharmacy link, status, sex, referring source/ID, primary/referring provider, public patient/MRN number, occupation, financial/billing notes and review date, marital status, interpreter, family size, income, homelessness and many other demographic fields. Some fields are explicitly US-specific or sensitive (e.g. Social Security number, race/ethnicity/religion and driver license).

ClearFlow should not reproduce this as one all-purpose patient row. Separate person identity and identifiers; contact points and address history; patient registration/clinic MRN; preferred language/interpreter and accessibility needs; referral source; responsible provider; emergency contacts/authority; financial/guarantor data; insurance subscriber data; and highly restricted demographic/sensitive fields only where purpose and law justify collection. Store source and effective dates, not only the current value. Do not infer missing values from defaults or use empty strings to mean unknown, declined and not applicable interchangeably.

## 34.2 Observations: coded value, unit, status, context and provenance
Source: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/form_observation.html

Observation fields include form/patient/encounter IDs, date, user, group, authorization/activity, code, observation label, value, unit, description, code system/type, table code, observation code/type/status, result status, reason status/code/text, documentation target table/ID, end date, parent observation, category, questionnaire response ID, UUID and value-code description.

Implications: a measurement/clinical observation is not merely name + value. Preserve code system and code, human label, datatype, unit, effective time, source/author, status, reason, parent/child relationship, encounter/questionnaire/document linkage and correction history. Support coded and narrative data without pretending free text is a standardized code. Distinguish result status from observation status and from clinical review status.

## 34.3 Vitals and derived measurements
Sources: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/form_vitals.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/form_vital_details.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/form_vitals_calculation.html

Vitals fields include date/patient/user/group, authorization/activity, systolic/diastolic BP, height, weight, temperature and method, pulse, respiration, note, BMI and BMI status, waist/head circumference, oxygen saturation/flow, pediatric percentiles, inhaled oxygen concentration, external ID and update time. The documentation explicitly says height/waist/head circumference are stored in inches, weight in pounds and temperature in Fahrenheit. Vitals detail adds interpretation list/code/title, reason code/description and reason status. Calculation table links a patient/encounter and time interval to a calculation identifier such as mean of last five BP readings, three-day mean or encounter mean.

ClearFlow requirements: canonical measurement stores numeric value + UCUM or other explicit unit + source unit + conversion metadata where converted. Do not copy imperial defaults. Keep observed raw values separate from derived BMI/averages/percentiles; store calculation definition/version, input window, inputs/as-of time and output if the value is used for clinical decisions. The current calculated value should be reproducible. Do not conflate normal/abnormal interpretation with the raw observation.

## 34.4 Medication history: prescription is not a medication statement
Source: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/lists_medication.html

Medication-list details add free-text dosage instructions, usage category, request intent, adherence information source, adherence value, asserted date, prescription link, primary-vs-reported record flag and reporting-source record ID. This is a valuable distinction: medication statements may be patient-reported, imported or clinician-entered and may not originate from a prescription authored by this clinic.

ClearFlow should model medication statement (what the patient says they take), prescription (what a prescriber ordered), dispense/fill (what a pharmacy provided), administration (what was given), and adherence report (what was taken) as distinct event/record types. Each can link to a medication concept but has separate author/source, time range, status and evidence. A medication stopped, completed or marked not-taking should preserve the prior period and reason rather than delete the row.

## 34.5 Form and signature linkage
Sources: https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/forms.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/onsite_documents.html ; https://github.com/openemr/openemr/blob/master/Documentation/EHI_Export/docs/tables/esign_signatures.html

Forms table links patient, encounter, form name/form ID, user/group, authorization, deleted state, form directory/subtype and provider. Onsite document record includes patient/facility/provider/encounter, creation time, document type, patient signature status/time, authorizing signature time/status/name, review date, denial reason, signature content, full document blob, filename/path and template data. E-sign table binds a signer/time/lock/amendment to a target table/row and data/signature hashes.

ClearFlow should separate template version, form response, rendered artifact, signer/representative identity, signing intent, signer authority, signature method, exact content hash, review/accept/deny decision and amendment chain. A generic signature field or boolean cannot prove which version was signed. Store large document bytes in controlled object storage with metadata/hash/retention and access policy, unless a justified transactional database storage design is selected.

## 34.6 Patient identity and data-minimization tests
- Same person may have several phone/email/address records; contact point is not a unique patient identifier.
- Do not collect or expose sensitive demographics unless purpose, permissions and applicable law justify it.
- Unknown, not asked, declined and not applicable remain distinct states.
- Unit conversion preserves original value/unit and records conversion method/version.
- Derived measurements can be recomputed from source observations and a versioned formula.
- Medication statement without prescription remains valid; prescription doesn't prove dispensing or adherence.
- Form signature is bound to immutable template/data version; later amendment links to original and preserves evidence.
- Every observation, medication, form and signature link is tenant-scoped and audit-logged.

End of Batch 34. Continue building the field-by-field cross-system matrix before canonical schema implementation.