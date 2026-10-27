# ClearFlow Dental Clinic — Research Addendum B38
## Dental X-ray governance, biomedical waste, facility standards and GST invoice fields
**Research date:** 2026-10-27  
**Status:** Current official-source review and candidate data requirements; not legal advice, not a clinical protocol and not a final schema.

## 1. Scope and source quality
This batch adds high-value operational data domains for a dental clinic. The source set includes official AERB guidance/FAQ, a Government of India-hosted biomedical-waste guideline, a national minimum-standards template for dental clinics, and CBIC GST invoice rules. A source being published by a government agency does not make every guidance statement binding on every clinic; classify statutory text, Gazette rules, regulatory FAQ and standards template separately. Verify current amendments, local/state implementation and each facility's actual registration/service category before treating a field as mandatory.

## 2. Dental X-ray registration and radiation safety

### Source register
- **S38-01 — Atomic Energy Regulatory Board (AERB), FAQ:** https://aerb.gov.in/hindi/transparency-open-government/rti/rti-faq-s  
  The published FAQ states that registration for operation of dental X-ray equipment is mandatory. It also notes operator precautions, including using TLD badges at chest level under lead aprons where specified, that dentists/dental surgeons/dental X-ray technicians should operate equipment, and that shielding requirements differ for intra-oral dental X-ray versus OPG/CBCT.
- **S38-02 — AERB eLORA / dental X-ray process guidance:** https://www.aerb.gov.in/images/PDF/dentalguidelines05082019.pdf  
  The guidance describes the eLORA workflow for registration of indigenous dental X-ray equipment, including the equipment origin and application type.
- **S38-03 — AERB eLORA portal / regulatory entry point:** https://elora.aerb.gov.in/  
  Confirm current registration steps, license/registration status and applicable category with AERB; don't hard-code 2019 UI screenshots as a current workflow.
- **S38-04 — National dental clinic minimum-standards template (government-hosted reference):** https://www.clinicalestablishments.mohfw.gov.in/sites/default/files/2022-06/833_0.pdf  
  The source describes minimum standards for dental-clinic categories, including scope of services, name/qualification/registration of in-charge dental surgeon, clinic timings, infrastructure, consultation/fee display, safety signage, biomedical waste, rooms/facilities, communication, human resources and equipment. Treat it as a national reference template; confirm its legal adoption/category applicability in Telangana rather than labelling the document alone binding on every independent clinic.

### Candidate requirements
- Model each diagnostic-radiology device as a distinct asset: modality/type (intra-oral, OPG/panoramic, CBCT or other), manufacturer/model/serial, equipment origin, location/room, acquisition and commissioning dates, current operational status, service/maintenance and decommissioning event history.
- Keep facility registration and AERB equipment registration as separate records. Store registration/application identifier, authority, applicable device category, submitted/issued/expiry/renewal dates when present, certificate/document hash, status, source and verification time/actor.
- Link a radiographic image to the equipment/device record where known; preserve the acquisition context, source timestamps and DICOM identifiers already covered by B36. Do not assume all systems export the same metadata.
- Where safety-record workflows are enabled, maintain staff operator/role, training/authorization evidence, quality-control/maintenance events and occupational-monitoring evidence only to the extent required by current AERB rules and the clinic's actual device category. Keep staff radiation-monitor records under restricted access.
- Never infer AERB registration from a device's mere presence in an equipment list, an uploaded image or a vendor invoice. A registration status is a verified evidence state, not a boolean manually asserted by any staff member.
- Keep current regulator rules and device-specific requirements versioned. The source PDF is dated 2019 and the FAQ may be updated; confirm current AERB directions before using specific room, shielding, operator or monitoring rules as hard validation.

### Acceptance tests
- A device with missing/unverified required registration evidence is flagged and cannot be represented as compliance-cleared; an explicit approved exception, if any, is separately audited.
- Device replacement/decommissioning preserves old registration and maintenance history.
- Image import records its source device and acquisition time where available without inventing missing identifiers.
- Staff with ordinary reception access cannot see unnecessary occupational monitoring details.
- Current requirements for intra-oral, OPG and CBCT are configured by reviewed device category rather than a single blanket rule.

**Evidence status:** AERB public guidance/FAQ located; category-specific current legal requirements need regulatory review.

## 3. Biomedical-waste authorization and evidence

### Source register
- **S38-05 — DGHS/CPCB-hosted, Guidelines for Management of Healthcare Waste as per Biomedical Waste Management Rules, 2016 (June 2018):** https://cpcb.nic.in/uploads/projects/bio-medical-waste/guidelines_healthcare_june_2018.pdf
- **S38-06 — CPCB biomedical waste portal:** https://cpcb.nic.in/bio-medical-waste-rules/  
  Confirm current Rules, amendments, forms and current Telangana State Pollution Control Board requirements with the official state board/regulator before release.
- **S38-07 — Telangana State Pollution Control Board:** https://tspcb.cgg.gov.in/  
  State authorization/operational instructions may change; use the current TSPCB process and facility-specific conditions.

The cited 2018 government-hosted guideline says a one-time authorization is required from the relevant SPCB/PCC for non-bedded healthcare facilities such as clinics, dispensaries and similar facilities, and discusses fresh authorization when activities change. This is strong evidence that a clinic's waste authorization and activities matter; because the guideline is dated and subordinate to the applicable Rules and later notifications, do not hard-code its exact process as the complete 2026 requirement without current TSPCB verification.

### Candidate requirements
- Keep a facility-specific biomedical-waste compliance record: facility/service category, authorization number, authority, application/issue/renewal dates where applicable, status, accepted activities/waste categories, linked common biomedical-waste treatment facility (CBWTF) or approved route, certificate/artifact, source/version, verifier and last-review date.
- Record operational events only where the clinic opts into or needs such tracking: waste stream/category as defined by the current applicable rule, generation/collection date, handover or pickup, quantity and unit, recipient/operator, manifest/receipt/reference, treatment/disposal confirmation, incident/spill/exception, responsible staff and corrective action.
- Store vendor/operator identity and authorization verification separately from each collection/handover event; a scheduled pickup is not proof the waste was collected or treated.
- Preserve authorization history when clinic services change, facility moves, the operator changes, or the authorization is amended/suspended/expired.
- Use a controlled waste-category reference version derived from applicable official rules; do not invent colour/category assignments from memory. Protect patient identifiers and unnecessary clinical detail in waste manifests.

### Acceptance tests
- Expired/unverified facility authorization appears as an exception and cannot be labelled current/compliant.
- A scheduled collection is not shown as completed until a pickup/receipt or other required evidence is recorded.
- Changing a waste vendor does not rewrite prior pickup events or authorization snapshots.
- Category or rule-version updates do not retroactively relabel historical events without a traceable migration.
- Clinic/service-type applicability remains a reviewed decision, not inferred from a generic dental-clinic label.

**Evidence status:** Older official guideline and current regulator portals identified; current Telangana authorization requirements and amendments require review.

## 4. Dental-clinic facility standards and staff/equipment register

### Observed coverage in the national template
The government-hosted minimum-standards template includes clinic category/service scope, in-charge dental surgeon qualification and registration, timings, consultation/fee display, safety signage (including fire safety and biomedical waste), infrastructure/rooms and drinking water, communication, electrical facilities, human resources, chairside assistant/dental technician, minimum equipment, staff salary/roster, and staff health-check/vaccination topics.

### Candidate requirements
- A clinic profile should not be the only source of truth for facility readiness. If the product includes a compliance/workspace module, use separate facility profile, staff/practitioner, room/resource/equipment, certificate/registration and compliance-evidence records.
- Track the standard/template identifier/version and the clinic category against which a checklist was evaluated. Every answer should have evidence/source, reviewer, verification date, issue/exception and remediation target where applicable.
- Separate (a) present/claimed, (b) evidence uploaded, (c) evidence verified, (d) applicable, (e) not applicable with reason, (f) issue found, (g) remediation pending and (h) resolved. A boolean “compliant” is not enough to describe evidence quality.
- In-charge dentist qualifications and registration are distinct from other staff roles; staff roster and clinic resource/equipment availability have their own effective periods and change history.
- Treat the national minimum-standards document as a reference framework until the legal owner confirms applicability to a specific Telangana clinic category. Avoid collecting staff health data unless a justified purpose and access model exist.

### Acceptance tests
- A standard change preserves the version and evidence from the prior review.
- A claimed equipment item without verification evidence does not become verified merely because it appears in inventory.
- Dentist registration expiry and facility registration expiry are separate alerts/decisions.
- Not-applicable and missing evidence are not indistinguishable.
- Any clinic-compliance status can be traced to the exact version, conditions, evidence and reviewer who approved it.

**Evidence status:** National template found; Telangana applicability and exact category criteria remain regulatory/legal review pending.

## 5. GST invoice/bill-of-supply particulars and financial snapshot

### Source register
- **S38-08 — CBIC, Tax Invoice, Credit and Debit Notes / CGST Rules, Rule 46:** https://cbic-gst.gov.in/gst-invoice-rules.html
- **S38-09 — CBIC sectoral FAQ (supporting explanation, not a substitute for Rules/notifications):** https://cbic-gst.gov.in/hindi/sectoral-faq.html

The CBIC page's tax-invoice particulars include supplier name, address and GSTIN; a consecutive serial number unique for a financial year; issue date; recipient name/address/GSTIN or UIN where registered; specified recipient/address/state information in applicable cases for unregistered recipients; HSN code for goods or Accounting Code for services; description; quantity/unit for goods; total value; and further particulars in the full Rule 46 list (such as taxable value and tax details, subject to the applicable clause/condition). The same official page distinguishes a bill of supply for exempt supplies or composition-scheme cases and specifies a different set of particulars. Rule 46 and later notifications must be consulted for the relevant transaction.

### Candidate requirements
- Keep service/procedure charge, goods/consumables sale, advance/receipt, tax invoice, bill of supply, credit note, debit note, payment receipt and refund as separate document/business events.
- Store supplier/recipient legal identity snapshot, GSTIN/UIN if applicable, document type, financial-year-unique serial series, issue date/time, item/service code system and code, description, quantity/unit where required, gross/taxable/discount/adjusted values, tax component/rate/amount, place-of-supply/state details and reverse-charge/tax reason fields when applicable.
- Snapshot the legal identity, code descriptions, price/tax determination, applicable rule/configuration version and rendered document hash at issue time. Corrections use linked credit/debit note or other legally valid correction workflows, not silent mutation.
- Use an effective-dated tax adapter and clinic-specific registration/tax profile. Do not hard-code one tax rate or assume all dental services have the same GST treatment. Exact exemption/taxability and e-invoice applicability must be verified against current law and the clinic's actual registration/turnover/supply facts by a tax professional.
- Separate invoice issue time, service date, payment intent, actual settled receipt, accounting posting date and external gateway settlement; the invoice does not prove payment.

### Acceptance tests
- Issue fails or routes to the correct alternative document when required legal identity or invoice-series fields are missing for the applicable document type.
- Invoice numbers are unique within the configured financial year/series under concurrent issue.
- Issued document rendering remains identical after later price, catalog or tax configuration change.
- Bill of supply is not incorrectly rendered as a tax invoice; credit/debit note points to original document as applicable.
- The system will not assert a universal tax rate or legal exemption absent a reviewed rule and effective version.

**Evidence status:** Official CBIC Rule 46 page directly describes tax-invoice particulars; clinic-specific tax applicability and later notifications require professional review.

## 6. Cross-domain traceability additions

| Requirement ID | Domain | Source-backed concept | Candidate invariant | Priority / status |
|---|---|---|---|---|
| RAD-IN-01 | Dental X-ray | AERB FAQ says registration for operation of dental X-ray equipment is mandatory; device classes include intra-oral, OPG/CBCT with distinct safety considerations | Device-specific registration/verification and source equipment provenance; registration distinct from clinic registration | P0; current device/category applicability review pending |
| BMW-IN-01 | Biomedical waste | CPCB/DGHS-hosted 2018 guide covers authorization for non-bedded healthcare facilities and state board authority | Authorization, waste streams and pickup/treatment events are separately evidenced and versioned | P0; current Telangana requirements pending |
| FAC-STD-01 | Dental facility standard | Government-hosted national dental-clinic template covers staff, rooms, timings, equipment and safety | Standard/category/version and evidence-based checklist, not a global compliance boolean | P1; Telangana category mapping pending |
| TAX-IN-01 | GST invoice | CBIC Rule 46 and bill-of-supply provisions distinguish document types and required fields | Effective-dated tax-document rules, unique FY serials, issue snapshots and separate receipts/credits | P0 if invoicing shipped; tax applicability pending |
| RAD-MEDIA-01 | Imaging | B36 DICOM/image metadata plus B38 AERB device registration | Image links to source device/time when available; original and transformed images distinct | P1; supported device metadata survey pending |

## 7. Open items and next verification
1. Have a qualified AERB/radiation-safety owner verify current requirements for the actual device inventory: intra-oral radiography versus OPG/CBCT, operator qualification, room/shielding, maintenance/quality control, registration and occupational monitoring.
2. Confirm current Biomedical Waste Management Rules/amendments and TSPCB authorization, CBWTF and recordkeeping requirements for the intended clinic category and services.
3. Confirm whether the national dental-clinic minimum-standards template has been adopted or specified for the clinic's Telangana category and what certificate/evidence is required.
4. Map GST rules and exemptions to the actual clinic entity, registrations, service categories, patient/recipient cases and thresholds; retain a tax-professional-approved effective-dated rule set.
5. Map each verified requirement to exact facility/device/staff/document fields, role boundary, lifecycle and acceptance test in TRACEABILITY_MATRIX.md and SOURCE_FIELD_MAPS.md.
6. No database schema or application logic is changed by this research batch.

**End of Batch 38.**
