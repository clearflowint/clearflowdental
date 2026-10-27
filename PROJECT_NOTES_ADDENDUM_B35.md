# ClearFlow Dental Clinic — Research Addendum B35
## India-specific regulatory evidence gate: records, privacy, telemedicine and AI prescribing
**Research date:** 2026-10-27  
**Status:** Source-grounded research notes; not legal advice and not a final compliance determination.

### 1. Purpose and boundary
This batch adds India-specific primary-source leads to the cross-system evidence matrix. It does not translate a rule from a foreign EHR into Indian law and does not freeze the schema. Each legal requirement must be mapped to the applicable actor (dentist, clinic, software provider, pharmacy, telemedicine platform), jurisdiction, effective date, and source version before being labelled mandatory.

### 2. Primary-source findings

#### B35-F1 — Dental record retention and access
**Source:** Dental Council of India, *Dentists (Code of Ethics) Regulations, 2014*, official DCI-hosted Gazette PDF:  
https://dciindia.gov.in/Rule_Regulation/Gazette_Notification_reg_DCI_Revised_Dentists_Code_of_Ethics_Regulations_2014_27.06.2014.pdf

The text under 3.3.1 states that dental surgeons maintain relevant outpatient/inpatient records and preserve them for a minimum of three years from commencement of treatment. Section 3.3.2 says requested records may be issued to the competent authority within 72 hours after a valid receipt, and recommends keeping certified copies of submissions.

**Evidence classification:** Primary-source text observed; present applicability, amendments, interaction with other retention duties, and interpretation of the 72-hour clause require legal review. Do not hard-code three years as a universal deletion timer.

**Candidate requirements:**
- Retention policy is configurable by record class, clinic jurisdiction, legal hold and applicable rule version.
- Patient/authorized representative requests and lawful authority requests have an auditable request, identity/authority verification, disclosure scope, delivery timestamp, receipt and copy-of-disclosure record.
- Expiry of a default retention period must not automatically erase records under legal hold, active care, dispute, audit or another applicable obligation.

#### B35-F2 — DPDP Act commencement is phased
**Sources:**
- Official India Code PDF, Digital Personal Data Protection Act, 2023: https://www.indiacode.nic.in/bitstream/123456789/22037/1/a2023-22.pdf
- Official Gazette commencement notification G.S.R. 843(E), 13 November 2025: https://egazette.gov.in/WriteReadData/2025/267647.pdf
- DPDP Rules corrigendum, G.S.R. 892(E), Gazette published 11 December 2025: https://egazette.gov.in/WriteReadData/2025/268455.pdf
- PIB summary of DPDP Rules notification: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2190655&lang=2&reg=48
- Official Gazette, DPDP Rules, 2025, G.S.R. 846(E): https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf

The Act itself allows commencement on dates appointed by notification. The 13 November 2025 commencement notification stages provisions: some commence on publication, some after one year, and a larger group after eighteen months. Therefore, as of this research date, it is incorrect to describe every substantive DPDP Act duty as already in force merely because the Act and Rules have been notified.

**Candidate requirements:**
- Maintain a dated legal-obligations register with provision/rule, effective-from date, applicability assessment, evidence owner and review date.
- Consent and other processing-purpose records must be purpose-specific and versioned; do not assume consent is the only lawful basis in every situation.
- Build data-principal request workflows (access/correction/erasure/grievance where applicable), identity verification, response deadlines and outcome auditability, but apply the correct effective date and exceptions.
- Data minimization, least privilege, breach readiness and security controls remain sound architecture safeguards independent of a claim that a particular provision is currently enforceable.

**Decision pending:** Legal counsel must validate the Gazette documents, exact commencement schedule and rule-by-rule applicability before release. A privacy workflow must not promise deletion where another applicable law requires retention.

#### B35-F3 — Telemedicine guidance emphasizes practitioner judgment and identity
**Source:** Ministry of Health and Family Welfare, *Telemedicine Practice Guidelines*: https://www.mohfw.gov.in/pdf/Telemedicine.pdf  
Supporting government statement: https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1740756&lang=2&reg=48

The guidance describes professional judgment as central and identifies context, practitioner/patient identification, communication mode, consent, consultation type, patient evaluation and patient management as key elements. It emphasizes that a technology-mediated consultation must be appropriate to the clinical context and not compromise care.

**Scope caveat:** The guidance refers to Registered Medical Practitioners and the medical regulatory framework. Do not automatically assume its precise scope or every provision applies identically to registered dental practitioners; confirm current Dental Council/state rules and any subsequent updates.

**Candidate requirements:**
- Consultation modality, participant identity, professional registration/authority, consent evidence where required, information available to the clinician, clinical decision and follow-up/referral plan should be representable as separate fields/events.
- A remote interaction must not be treated as clinically adequate merely because the software supports chat or video.
- Escalation to in-person assessment should be a clinician-controlled outcome, not an AI decision silently applied to the patient.

#### B35-F4 — AI cannot independently counsel or prescribe under cited NMC telemedicine-platform guidance
**Source:** Gazette-hosted National Medical Commission / Ethics and Medical Registration Board guidance, official Gazette PDF: https://egazette.gov.in/WriteReadData/2023/247951.pdf

The cited platform guidance states that AI/ML technology platforms are not allowed to counsel patients or prescribe drugs; AI may assist professional evaluation/diagnosis/management, but final prescription or counselling is to be delivered directly by the Registered Medical Practitioner.

**Scope caveat:** This is an important safety boundary for the cited medical telemedicine context, but legal review must determine its current status, precise scope, and applicability to a dental SaaS workflow. Do not label it a universal dental statute without that check.

**Candidate requirements:**
- AI-generated clinical text and prescription suggestions remain drafts with model/source/version provenance.
- Issuance requires an authorized clinician's affirmative review and action, with identity, professional credential, timestamp and a frozen content snapshot.
- The system must distinguish AI assistance, clinician adoption, final issuance, transmission, dispensing and cancellation.
- No autonomous AI route may issue, sign, modify or cancel a prescription or clinical record.

### 3. Matrix entries to add

| Domain | Evidence-backed candidate invariant | Testable acceptance condition | Open question |
|---|---|---|---|
| Retention | Retention is policy-driven, record-class-aware and subject to legal holds | A scheduled expiry cannot delete a held record; policy version and decision are logged | Which current rules apply to each record class and clinic type? |
| Record disclosure | Requests require verified requester authority and an auditable disclosure package | Unauthorised requester is denied; approved export records scope, actor, time and receipt | What deadlines and formats apply to each request type? |
| Privacy obligations | Legal obligations are effective-date-aware, not a single “DPDP compliant” boolean | A ruleset can represent staged commencement and its review history | Confirm each provision's commencement and clinic/vendor role |
| Teleconsultation | Modality does not replace clinician judgment, identity and adequate context | Inadequate context can be escalated; clinician identity and decision are captured | Dental-specific applicability and current regulator guidance |
| AI prescription | AI output cannot become issued prescription without authorized human action | Draft stays draft until authorized signer confirms exact version | Applicable dental, pharmacy and e-prescription requirements |
| Signed artifact | Signature binds to an immutable content version | Any post-signature change creates an amendment/new version and invalidates no historical evidence | Required signature standard and evidentiary requirements by artifact |

### 4. Research quality and next verification

**Source-link correction, 2026-10-27:** The original Rules link above now points to the verified MeitY-hosted G.S.R. 846(E) PDF; the corrigendum is separately linked as G.S.R. 892(E) at https://egazette.gov.in/WriteReadData/2025/268455.pdf. Read both together.
- Primary-source URLs above are official government/regulator hosts where available; the Gazette and regulator text should be preferred over secondary summaries.
- The DCI and telemedicine documents may have later amendments or scope limitations; perform current-status verification before converting them into compliance claims.
- For DPDP, use the official Gazette commencement notification and Rules, not the shorthand claim that notification means all provisions are already operative.
- Next India-focused research should verify current Dental Council of India / National Dental Commission transition status, state-level clinical-establishment obligations relevant to Telangana, prescription and pharmacy law, radiology/imaging requirements, biomedical waste, and applicable health-record standards. Keep each item tagged “confirmed”, “provisional”, or “legal review required”.
- No implementation schema is proposed in this batch. Preserve raw evidence and unresolved interpretations in the traceability matrix.
