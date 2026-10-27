# ClearFlow Dental Clinic — Research Addendum B37
## India-first operational requirements: dentist prescriptions, dental laboratory qualification, clinic registration, DPDP timing and ABDM profile version
**Research date:** 2026-10-27  
**Status:** Current official-source research and candidate data requirements. Not legal advice; no canonical schema freeze or implementation change.

## 1. Purpose and evidence rule
B37 adds an official-source update that materially affects clinical artifact templates, prosthetic lab partner onboarding and clinic registration records. The public notices are primary-source evidence. Applicability to a particular clinic/provider, interpretation of scope and any later amendments should be confirmed by qualified counsel/regulatory staff before release. Preserve exact source versions and dates.

## 2. NDC/EDRB public notice of 23 October 2026 — mandatory particulars on dentists' prescriptions

**Primary source:** National Dental Commission / Ethics and Dental Registration Board, Public Notice F.No. NDC/EDRB/Public-Notice/2026/M-2749, dated 23 October 2026:  
https://dciindia.gov.in/Admin/NewsArchives/M-2749.pdf  
Official notices listing: https://dciindia.gov.in/Home.aspx

The notice directs practising dentists to ensure every paper or electronic prescription contains these particulars:
1. Dentist name as recorded with the relevant State Dental Council.
2. Active registration number as allotted by that Council.
3. Recognized dental qualification(s), including specialty when applicable.
4. Complete postal address of practice, including PIN code.
5. Functional emergency contact number.
6. Patient relevant particulars: name, age and gender.
7. Prescription date for each attendance.
8. Dentist signature: handwritten or legally valid digital signature, as applicable.
9. If the dentist's name, recognized qualifications and valid registration number are not preprinted, the prescription must carry a clear, legible stamp containing the stated particulars.

The notice asks practising dentists to review/update prescription pads, letterheads and electronic prescription templates. It also advises not to use prescription pads supplied, printed or sponsored by pharmaceutical companies; use compliant pads/letterheads instead.

### ClearFlow candidate requirements
- The prescription artifact generator must require/validate the prescriber's verified display name, active registration number, qualifications/specialty if applicable, clinic/practice postal address incl. PIN, emergency contact, patient name/age/gender, per-attendance date and signature evidence.
- Store qualifications, registration number and practice address as versioned provider/practice records; rendering must use the values applicable at the prescription's issue time. Do not infer registration validity only from a non-empty string.
- A digitally signed prescription must reference the exact rendered/presented content snapshot and signature evidence; support handwritten signature evidence only where the workflow legally permits and can retain it reliably. A boolean signature flag alone is inadequate.
- Validate before issuance; if mandatory fields are absent or registration is not verified/active, block issuance or route to a clearly defined authorized exception that counsel has approved. A draft may be saved but must not be represented as issued.
- The prescription layout must present the fields legibly on mobile-generated exports and printouts; if a stamp fallback applies, capture that the relevant stamp was applied and what fields it contained.
- Record the per-attendance issue date independently from drug start/end date, dispense/fill date, encounter date, transmission date and amendment/cancellation date.
- Do not use pharmaceutical-company-supplied template branding; maintain controlled first-party prescription templates with an effective version and audit history.

### Minimum acceptance tests
- Issue is denied when the dentist has no verified active registration number, missing qualification, incomplete practice postal address/PIN, missing emergency contact, or patient particulars/date/signature.
- Each issued version reproduces prescriber and clinic particulars that were effective at issuance even if their current profiles later change.
- Updating the prescription template does not change earlier issued content/hash.
- A second attendance receives its own date; imported legacy prescriptions can be retained with missing fields clearly marked as legacy/incomplete rather than silently completed with invented data.
- E-signature evidence is bound to the actual rendered version; changes after signing require a new version/amendment.
- A prescription template cannot be marked compliant merely because its fields exist in the database; rendered output must be checked.

**Evidence status:** Direct official notice reviewed in original PDF. Counsel should confirm implementation and signature interpretation in the clinic context.

## 3. NDC/EDRB public notice of 13 October 2026 — qualified and registered dental mechanics for laboratory services

**Primary source:** National Dental Commission / Ethics and Dental Registration Board, Public Notice F.No. NDC/EDRB/Public-Notice/2026/M-2662, dated 13 October 2026:  
https://dciindia.gov.in/Admin/NewsArchives/M-2662.pdf  
Official notices listing: https://dciindia.gov.in/Home.aspx

The notice states that dental laboratory services may only be availed from or outsourced to dental mechanics holding a recognized qualification approved by the erstwhile DCI/NDC. Those mechanics must hold a valid, subsisting registration with a State Dental Council/Tribunal. It advises registered dentists to ensure dental prostheses, appliances or laboratory work they prescribe are fabricated and supplied exclusively by qualified and registered dental mechanics meeting these criteria. It says engagement with unregistered/unqualified persons or laboratories for dental-mechanic services violates professional standards and compromises patient care.

### ClearFlow candidate requirements
- Separate the commercial laboratory organization from the individual dental mechanic(s) performing regulated dental-mechanic work. One lab may have multiple mechanics and qualifications.
- Maintain mechanic identity, qualification title, qualifying authority/source, credential evidence, registration number, registering State Dental Council/Tribunal, status, valid-from/to if available, verification time, verifier and document/hash/source.
- For lab partner setup and relevant lab-case assignment, require verifiable proof that involved mechanic(s) meet recognized-qualification and current-registration criteria. A lab name or vendor invoice alone is not proof.
- Distinguish “vendor registered in ClearFlow” from “professional qualification/registration verified”.
- Preserve verification snapshots/results used for each lab-case assignment. Later expiry/revocation must not erase who was verified for a prior case; it should prevent future assignment where policy requires.
- The lab case should link to lab organization, mechanic(s)/responsible fabricator when available, individual product/work item, prescribed appliance/prosthesis, dispatch/receipt events, clinical fit/quality review and remake.
- Avoid recording more identity/document data than needed; restrict credential evidence to authorized practice/admin roles.

### Minimum acceptance tests
- A lab partner without qualified/registered mechanic evidence cannot be selected for regulated prosthetic fabrication unless an explicitly approved legal exception exists.
- Expired, suspended, unverified or revoked credentials trigger a clear exception and block new regulated assignments as policy specifies.
- Historical lab case retains its credential verification snapshot and actor/time.
- Changing a laboratory contact or billing profile does not change the mechanic's credential record.
- A lab case cannot become “clinically accepted/fitted” solely because the vendor marked it shipped or received.

**Evidence status:** Direct official notice reviewed in original PDF. Counsel/regulatory reviewer to confirm operational scope, applicability and any subsequent guidance.

## 4. Telangana Clinical Establishments (Registration and Regulation) Rules, 2022

**Primary source:** Telangana Gazette, G.O. Ms. No. 64, Health, Medical & Family Welfare (D), 14 June 2022, “Telangana Clinical Establishments (Registration and Regulation) Rules, 2022”:  
https://clinicalestablishments.mohfw.gov.in/sites/default/files/2022-09/2381.pdf

The Gazette describes rules made under the Clinical Establishments (Registration and Regulation) Act, 2010 as adopted by Telangana, and states they supersede the 2007 Telangana allopathic private medical care establishment rules. The existence of this regime is verified; whether and how a specific independent dental practice, multi-specialty clinic, hospital or lab fits a registration category and which standards apply must be checked for the actual establishment.

### ClearFlow candidate requirements
- Clinic profile must not be the only record of regulatory registration. Use a facility registration/compliance record with registration/ID, regulator/authority, category/type, facility address and service scope, application/issue/expiry/renewal dates, status, certificate artifact, conditions/restrictions, verification source/time and owner.
- Support multiple registrations/permissions for one facility where the applicable regime requires it; do not assume one registration record covers all service categories.
- Preserve application, renewal, inspection, notice, suspension, cancellation and correction events rather than overwriting one status field.
- Keep facility registration independent of individual dentist registration. Facility permission does not prove a dentist is licensed; dentist registration does not prove the facility's registration.
- Do not hard-code requirements or expiry dates without a confirmed category/rule applicability mapping.

### Minimum acceptance tests
- Facility records distinguish draft/application/pending/registered/expired/suspended/cancelled states and preserve transitions.
- A certificate renewal updates current projection while keeping the former certificate/version and validity period.
- Registration status is displayed as verified only when evidence/source and verification time exist.
- A facility cannot mark a category/service as legally cleared solely because a generic clinic profile exists.

**Evidence status:** Gazette verified; exact applicability/categories and current compliance obligations require legal/regulatory review.

## 5. DPDP commencement schedule — effective-date register, not a generic compliance badge

**Primary source:** Gazette of India, G.S.R. 843(E), 13 November 2025, commencement notification under section 1(2):  
https://egazette.gov.in/WriteReadData/2025/267647.pdf  
Official MeitY landing page for Rules, corrigendum and timeline:  
https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa  
Rules, G.S.R. 846(E), 13 November 2025:  
https://egazette.gov.in/WriteReadData/2025/267646.pdf  
Corrigendum, G.S.R. 892(E), 10 December 2025:  
https://egazette.gov.in/WriteReadData/2025/267650.pdf

The Act commencement notification assigns provisions to three groups: provisions commencing on publication; section 6(9) and section 27(1)(d) one year after publication; and the listed core obligations including sections 3–17 and other provisions eighteen months after publication. From the Gazette date, the one-year date is 13 November 2026 and eighteen-month date is 13 May 2027. The Rules' own commencement is separately staged: rules 1, 2 and 17–21 come into force on publication; rules 3, 5–16, 22 and 23 eighteen months after publication. Read the Gazette text and corrigendum together; this batch does not replace legal advice.

### Candidate requirements
- Maintain a versioned legal obligations register with official source, provision, applicability scope (clinic/provider/SaaS/data fiduciary/data processor etc.), publication date, effective date, exceptions, owner, evidence/tests, last reviewed and next review.
- Distinguish controls already legally effective from controls under preparation for future commencement. Do not state that all substantive DPDP obligations are in force solely because the Act and Rules have been notified.
- Build minimization, access control, incident response readiness, data inventory and purpose-specific preferences as architecture safeguards independent of whether a particular provision is not yet effective.
- A consent/notice record should identify subject or verified representative, displayed version, purpose, categories/data scope, decision/effective period, source and evidence; do not assume consent is the only possible lawful basis.
- Privacy/erasure workflows must check other retention obligations, clinical-record duties, ongoing disputes and legal holds before deleting. A request is not synonymous with immediate hard deletion.
- The legal register should have dated change monitoring; each released build can identify the obligation baseline it was reviewed against.

### Acceptance tests
- Ruleset dates correctly represent publication, one-year and eighteen-month commencement groups; dates are tested with actual Gazette date.
- A legal change cannot silently be applied retroactively to previous consent or signed artifacts.
- Erasure does not bypass record-class retention or legal holds.
- UI and project documentation do not display an unqualified “DPDP compliant” badge without legal review and evidence.

**Evidence status:** Gazette sources identified; legal applicability and exact provision-by-provision obligations require counsel review.

## 6. ABDM FHIR profile version pinning

**Primary published guide:** NRCeS, FHIR Implementation Guide for ABDM v6.5.0, labels itself the current published version and provides a package, profiles/value sets and examples:  
https://www.nrces.in/ndhm/fhir/r4/6.5.0/downloads.html  
**Preview:** v7.0.0 local-development build, generated 15 July 2026:  
https://www.nrces.in/preview/ndhm/fhir/r4/downloads.html

The current published v6.5.0 page identifies package ndhm.in#6.5.0 based on FHIR R4.0.1. The v7.0.0 URL is a local development/preview build, not evidence that it supersedes the stable published package.

### Candidate requirements
- Pin published profile/package version per integration, plus mapping version and local validator version.
- Store generated bundle ID/hash, source references, profile version, mapping version, validation result, exported time, purpose/recipient and callback/acknowledgement outcome.
- Use official package/validator fixtures for contract tests; do not create exchange data from arbitrary free-form JSON.
- Evaluate preview versions in a separate compatibility pipeline; upgrade only after stable publication status and change review, profile diff, data mapping review and regression tests.
- Internal clinical records remain authoritative; FHIR exchange bundles are versioned projections, not the entire canonical data model.

### Acceptance tests
- Same pinned profile + same source data + same mapping version produces a reproducible/validatable bundle.
- Profile-version upgrade tests identify changed cardinality, terminology, extension and required-field behavior.
- Callback states distinguish request accepted/queued from final exchange success/failed/rejected.
- Historical sent bundle remains attached to the original profile and mapping version after a future upgrade.

## 7. Traceability additions

| Requirement ID | Source | Candidate field/data group | Lifecycle/security condition | Priority | Status |
|---|---|---|---|---|---|
| RX-IN-01 | NDC/EDRB M-2749, 2026-10-23 | Dentist display name, active registration, qualifications/specialty, practice postal address/PIN, emergency contact, patient name/age/gender, attendance date, signature and stamp fallback evidence | Validate mandatory content before issue; bind exact rendered version/signature; no profile drift | P0 | Official notice observed; legal/clinical implementation review pending |
| LAB-IN-01 | NDC/EDRB M-2662, 2026-10-13 | Mechanic identity, recognized qualification, authority, active registration number, registering Council/Tribunal, validity/status, evidence/source and verification timestamp | Verify at lab assignment; preserve historical credential snapshot; block invalid future assignment | P0 | Official notice observed; operational interpretation review pending |
| FAC-IN-01 | Telangana Gazette G.O. Ms.64, 2022-06-14 | Facility registration identifier/category/authority, address/scope, effective/expiry, status, certificate and event history | Keep facility registration separate from individual professional credentials; apply category-specific rules | P0 | Gazette observed; applicability pending |
| PRIV-IN-01 | DPDP Act commencement notification + Rules/corrigendum | Obligation/provision, source version, actor scope, effective date, exception, owner/evidence/review | Stage effective dates; retention/erasure checks with legal hold | P0 | Official notification observed; legal mapping pending |
| ABDM-VER-01 | NRCeS FHIR v6.5.0 stable / v7.0.0 preview | Package/profile version, mapping version, validator version, bundle hash, export/acknowledgement state | Pin stable package; preview tested separately | P1 | Official published/preview status observed |

## 8. Open decisions and next action
1. Obtain legal review of NDC prescription notice against the clinic's intended prescribing workflow and signature method.
2. Specify lab mechanic credential verification, renewal monitoring and responsible actor; determine how a lab organization proves the individuals fabricating each regulated product.
3. Confirm Telangana clinic establishment category and registration/standards for each target deployment.
4. Add the exact DPDP effective-date register and data-retention schedule with counsel; reconcile current dental professional record duties.
5. Keep stable ABDM package v6.5.0 pinned until official release tracking confirms a stable replacement and ClearFlow's mappings/tests pass.
6. These requirements belong in the traceability matrix and future schema mapping, but no database or application code is changed by this batch.

**End of Batch 37.**
