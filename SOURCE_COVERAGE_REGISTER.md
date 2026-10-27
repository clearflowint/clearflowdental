# ClearFlow Dental Clinic — Source Coverage Register
**Version:** 0.1 · **Review date:** 2026-10-27  
**Purpose:** Track what each research batch actually observed, what kind of evidence it provides and what remains unverified before schema freeze.

## Evidence classes
- **DDL/database reference:** documented table/column shape or live database metadata; strongest for physical field evidence within that source/version.
- **API contract:** documented external API fields/valid values/operation behavior, not necessarily the full underlying schema.
- **Service/source inspection:** code path or module behavior examined; statements apply to the reviewed paths, not all possible paths.
- **Test evidence:** reviewed tests or explicit test cases from source; mocks are not proof of live DB isolation.
- **User-facing workflow:** manual/UI behavior; useful lifecycle evidence but not proof of storage schema.
- **Official legal/regulatory source:** official Gazette/regulator/public notice; applicability/interpretation may still need counsel.
- **Candidate design:** ClearFlow requirement inferred from evidence/project principles; not confirmed source fact.

## Batch/source coverage ledger

| Batch | Sources / domain | Evidence classes available | Confirmed contribution | Remaining gaps before freeze |
|---|---|---|---|---|
| B17 | Dental ERP AI chat/command, import routes; AI approval and tenant relationships | Service/source inspection | Shows model-provided “requires approval” metadata is not an enforcement gate if route executes before returning; import validation/commit boundaries and tenant-linked ID issues | Re-scan every command/write route; live DB/transaction tests; enumerate all import source mappings |
| B18 | OpenEMR EHI prescription, drug sales/inventory, procedure orders/reports/results, docs | EHI export table dictionary/source documentation | Prescription and eRx fields; lot/stock movement; order/report/result separation; reminder vs message; document metadata | Not the entirety of OpenEMR schema; verify current upstream version and field availability/conditionality per EHI source |
| B19 | DentalPin agent approvals/tool registry, appointment/treatment plan tests | Service/source + test evidence | Approval vs execution, tool allowlist vs role, appointment state history, locking/QR constraints, quote versions, retention/legal holds | Mock tests do not prove deployed DB concurrency; scope and policy thresholds require decisions |
| B20 | DentalPin payments/gateway refunds/billing/inventory | Service/source/model/test evidence | PaymentRequest ≠ core payment; gateway refund vs Refund; decimal/ledger/allocation/idempotency; invoice snapshot; transactional stock movements | Re-run critical race tests against production-equivalent DB; no claim this is ClearFlow implementation |
| B21 | DentalPin periodontogram, orthodontics, recalls, media, imaging AI | Module source/test/docs | Dated periodontal snapshot, site records and calculated indices; ortho case/control; recall obligation/contact attempts; source media/derivatives; clinician confirmation for AI artifacts | Validate clinical semantics and source lifecycle behavior against current upstream branch; AI model/provider safety review pending |
| B22 | DentalPin migration import | Source/docs/tests | Hash/manifest/source IDs/raw payload/entity mapping/operator decisions/checkpoints/reconciliation; historical financial ledger not derivable from procedure catalog price | Direct source-system import fixtures and rollback/partial recovery tests for each future adapter |
| B23 | OpenEMR payer/claims/accounting; DentalPin reorder/outbox/media | EHI dictionary plus service/code/manual | Coverage/eligibility/remittance/AR lifecycle; reorder as projection; notification outbox retries/preferences; original-vs-derived media | Indian payer/tax applicability; live notification provider behavior; independent review of supplier/lot rules |
| B24 | DentalPin patient/context/appointment/coverage code | Service/source/test inspection | Separate contacts, clinical context, guardian/legal authority; appointment time-zone/locking/transition and interval-overlap concerns | Validate clinic local-time and DST edge cases relevant to deployment; broader guardian authority and clinical review policies |
| B25 | DentalPin patient-clinical and medical-reference models/services/tests | Direct model/service/test source | Fields for medical context, allergies, med history, disease/surgery, guardian/emergency contact; archive/blank normalization; clinic-local med interaction/contraindication references | Local reference lists not authoritative clinical rules; source evidence/version/validity and concurrent pair uniqueness need verification |
| B26 | ABDM/NRCeS FHIR, HIE-CM M2/M3, DPDP Gazette/Rules and GST localization leads | Official portal/profile/Gazette source; GST content retrieval incomplete | Pin versioned exchange profiles; separate clinical model from exchange bundle/care context; consent-based HIE callback/transfer states; DPDP phased commencement | Confirm published version at release time; reconcile Rules corrigendum; exact current GST/clinic applicability requires professional review |
| B27 | Open Dental API patient/insurance/subscriber/coverage/benefits/claims/payments/treatment plans/procedure/periodontal/recall/docs/schedule | First-party API contract | Coverage as linked graph, claim header/lines/remittance distinct, signed saved plan snapshot, code-based treatment area, source-periodontal sentinel, schedule/appointment richness | Vendor API reference isn't full DDL; US-centric enums/insurance assumptions and numeric IDs stay within adapter |
| B28 | Open Dental allergy definitions/patient allergy, medication catalogue/med list/prescription, patient notes, recall types | First-party API contract | Catalog vs patient allergy vs medication statement vs prescription; recall type policy vs patient obligation; exact prescription fields and eRx state | Vendor API may omit DDL specifics; medication safety and Indian prescribing rules require clinical/legal review |
| B29 | OpenEMR EHI patient_data/history_data/lists/medications/prescriptions/lab/result/vitals/encounter/signature | First-party EHI table dictionary | Broad patient/guardian/care-team and historical fields; problems/allergies, prescription/medication, order/report/result, observations/vitals; many source units and US fields | Need source version pin and line-by-line table coverage; sensitive/US-only fields excluded unless justified |
| B30 | OpenEMR audit master/detail, amendments, legal/e-sign documents, UUID mapping, API logs, notification log | First-party EHI dictionary | Different audit/timeline/provenance purposes; template vs signed instance; signature hash; mapping vs internal IDs; raw API logs can be PHI sink | Prove actual integrity/crypto semantics before adopting; implement access/redaction/retention policy and event coverage tests |
| B31 | DentalPin medical reference, prescription issue/freeze, privacy/erasure | Source models/service/docs | Prescription immutable issue semantics; archive/erasure workflow is legal policy, not generic delete; medical reference evidence quality | Current regulator status/version scope; data-class retention and exceptions need counsel |
| B32 | DentalPin medical-reference service/tests and tenant mutation/clinical context | Source/service/test evidence | Tenant-scoped mutation contract, relationship validation, medication warning lifecycle, prescription safety and required negative tests | Exact route-by-route implementation test still needed in ClearFlow; clinical reference rules require clinical source validation |
| B33 | OpenEMR EHI medication prescription/inventory/order/result/reminder/immunization/signature | First-party EHI table dictionary | Field-level prescription and lot inventory fields; order code/report/result; independent review; immunization lifecycle; signed-content hash and amendment | US-specific values are not India law; exact drug schedule/prescribing scope needs current Indian legal review |
| B34 | OpenEMR EHI patient, observations, vitals, medication statement, forms/signatures | First-party EHI table dictionary | Data category separation, source and units (source uses imperial units in described columns), derived calculations, forms/template/instance/signature | Do not copy source units; test lossless conversion and formula provenance; collect sensitive fields only with purpose/access review |
| B35 | DCI/ethics code, DPDP commencement/Rules, telemedicine and AI prescription leads | Official legal/regulator sources | Effective-date-aware obligations; professional judgment/AI assist vs authorized issuance; retention/disclosure process candidate | Confirm all provisions, amendment state and scope as of release; older DCI code/telemedicine scope/legal interpretation require counsel |
| B36 | Open Dental Chart/Perio/ProcedureLogs/TreatmentPlan/Recall/Images/Documents/Orthodontics/Lab cases; FHIR Observation; DICOM supplement | First-party API/database docs/manuals + interoperability standard supplement | Tooth numbering, typed periodontal measures/derived CAL, signed plan snapshot, recall separation, image metadata vs bytes/time, orthodontic timeline, lab sent/received/quality-check | Direct LabCases/Laboratories API extraction remains blocked/unverified; validate DICOM current edition/device coverage and clinical units/topology |
| B37 | NDC M-2749 prescription notice; NDC M-2662 lab mechanics notice; Telangana Gazette 2022; DPDP schedule; NRCeS v6.5 stable vs v7 preview | Official notice/Gazette/profile documentation | New prescribed output fields; mechanic qualification/registration verification; facility registration as separate record; staged legal dates; stable-vs-preview pinning | Legal counsel to scope requirements for exact clinic/practice; current DPDP effective date/Rules applicability calendar needs owner review |

## Cross-source evidence-confidence guide

| Confidence | Use it for | Do not use it for |
|---|---|---|
| High within cited source | Explicit field or rule displayed in its source DDL/API/Gazette/manual; exact behavior described there | Universal healthcare requirements, India-wide legal status, or proof the same behavior is deployed in ClearFlow |
| Medium | Source code path, test files, UI workflow, a stable upstream source not pinned to a commit | Claims about every code path, live concurrency/security, or future version |
| Provisional | Third-party mirrors, inferred field necessity, product design proposal, unfinished source extraction | Hard mandatory schema constraints or unqualified compliance claims |
| Unverified / pending | Lab API schema extraction, live Appwrite listing/relationship test, source-to-target mapping with no fixture | Statements that something works, is safe or is fully implemented |

## Open cross-batch evidence gaps

### Priority 0 — resolve before handling real patient data
1. Enumerate all application write/read paths and test authenticated tenant A vs tenant B, including every relationship and background task. The preserved app's client code accepts parent IDs and uses direct Appwrite TablesDB calls; see IMPLEMENTATION_GAP_REVIEW.md.
2. Resolve the Appwrite row-security/listRows permission configuration with a sandbox. Official docs say table-level READ covers every row and that listRows requires table-level READ. Do not grant global table READ to fix a listing error without a least-privilege architecture.
3. Verify every signed/issued artifact's exact snapshot/hash, signer identity/authority, correction/amendment and revocation path.
4. Verify prescription issue validation for NDC M-2749 fields and lab mechanic verification flow against M-2662 with legal/clinical owners.
5. Define minimum data access, retention/legal holds, incident and safe export policies for any clinical pilot.

### Priority 1 — resolve before canonical schema freeze
6. Extract exact physical field types/nullability/default/enums/indexes for each source table used in the final comparison; record upstream commit/release or access date.
7. Build import fixtures for differing tooth numbering schemes, periodontal sentinel and flag encodings, medication codes/statuses, units/time zones, external identifiers, duplicate patients and historical signed artifacts.
8. Define clinic registration/category and professional credential applicability for actual Telangana target customers.
9. Finalize stable ABDM profile version/pinning and validation approach; test FHIR mappings using official package/profile fixtures.
10. Determine the MVP scope for insurance/claims, laboratory tests, imaging, stock, orthodontics, prosthetics, AI-assisted operations and external integrations without excluding extensible domain records from the research.
11. Confirm current Indian pharmacy/drug scheduling, clinical establishment, radiology, biomedical waste, GST and health-record retention obligations with the correct regulator/professional; treat vendor-specific US/EU fields as examples unless independently applicable.

### Completion rule
A batch is not “complete” just because an addendum exists. For every source-specific field intended to influence implementation, record the source/version, exact field or behavior, evidence class, source scope, raw-to-normalized mapping, missingness/unit/time semantics, lifecycle events, tenant and authority checks, tests, clinical/legal review owner, and decision status. Unused, uncertain or non-MVP fields can remain explicitly deferred; they must not be silently dropped or misrepresented.

**Conclusion:** The source coverage is sufficiently organized to continue model reconciliation, but it is not an assertion of exhaustive physical-column coverage, compliance or production readiness.


## Post-register update (same review date)
B37 includes current official NDC prescription and registered dental-mechanic notices, Telangana Clinical Establishments Rules, DPDP commencement/Rules/corrigendum and ABDM published-vs-preview profile comparison. It also links the official CDSCO Drugs Rules directory and July 2024 consolidated text; exact drug-class prescribing applicability remains a professional review item.

DPDP Rules link correction: use the MeitY-hosted G.S.R. 846(E) PDF (https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf) and G.S.R. 892(E) corrigendum (https://egazette.gov.in/WriteReadData/2025/268455.pdf). The commencement notice G.S.R. 843(E) remains https://egazette.gov.in/WriteReadData/2025/267647.pdf.
