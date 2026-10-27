# ClearFlow Dental Clinic — Conversation & Decision Log

**Created:** 2026-10-28  
**Status:** Living project record  
**Purpose:** Preserve project discussions, decisions, proposals, rationale, unresolved questions, and changes of direction so that context is not lost between conversations.

> This file records product and architecture decisions discussed with the project owner. It is not a clinical protocol, final database schema, legal opinion, security certification, or implementation proof. Items are labelled **Decided**, **Preferred direction**, or **Open** to avoid treating suggestions as approvals.

## 1. Ongoing documentation rule

From 2026-10-28 onward, every substantive ClearFlow Dental Clinic project discussion must be recorded in this log or in a linked, topic-specific research note, and linked from the research index when appropriate.

For each discussion, record:
- date and topic;
- the owner's requirement or problem statement;
- the decision or current proposal;
- rationale and important constraints;
- safety, privacy, tenancy, clinical-authority or implementation implications;
- unresolved questions and verification tasks;
- links to related research or implementation records.

Do not silently overwrite earlier decisions. When a decision changes, append a dated superseding entry that explains what changed and why, then update the current-status summary. Distinguish the owner's explicit decisions from assistant recommendations. Do not claim a feature is implemented, tested, compliant, or production-ready unless there is evidence.

## 2. Medical scope and document-first clinical data approach
**Discussion date:** 2026-10-27 to 2026-10-28  
**Status:** Core product principles decided; detailed schema and workflows remain open.

### 2.1 Preserve the original clinical source

The system should be capture-first. Clinics already work with handwritten prescriptions, clinical notes, reports, scans, photographs, PDFs and digital files. ClearFlow should preserve the original source document unchanged and avoid forcing every doctor to rewrite their clinical thinking into a large predefined digital form.

- Preserve the captured original as an immutable source object, with relevant metadata and controlled associations.
- Do not silently rewrite, replace, normalize or overwrite the original content when extracting information.
- AI must not automatically restructure/group a doctor's handwritten prescription or clinical note into a predefined clinical model by default. Doctor-specific context and handwriting can be ambiguous, and the current AI may make mistakes.
- AI may process authorized source documents when a dentist explicitly asks for assistance. Responses should be grounded in identifiable source documents and dates, communicate uncertainty, and not replace the original clinical record.
- OCR or extraction can support operational work, but ambiguous instructions/dates must be confirmed before activating reminders or other actions.

### 2.2 Separate source, draft and approved clinical record states

Use three conceptual representations without requiring three duplicate physical copies of every file:
1. **Captured original** — immutable source document/file.
2. **Optional unapproved record** — draft or extracted/entered information, if the clinic chooses to maintain it.
3. **Optional approved record/version** — a version explicitly approved by an appropriately qualified and authorized dentist.

These representations can be linked through metadata and versioned records. Preserve a separately signed/approved snapshot where required by the workflow or applicable rules.

- Capture is not approval.
- Reminder extraction or approval is not clinical-record approval.
- Prescription drafting, authorization/issuance and record approval are distinct actions.
- Never silently create an approved clinical record from a capture or automation action.
- Clinic workflow preferences may determine whether optional draft/approved digital representations are maintained, but applicable professional/legal recordkeeping and retention duties cannot be disabled by a setting.
- Corrections, amendments, replacement, deletion and retention require controlled, auditable lifecycles and must preserve provenance.

### 2.3 One coherent visit story in the UI

A patient visit should be understandable in one place: a coherent encounter timeline showing the visit purpose, treatments associated with the visit, relevant original documents, optional draft/approved record, operational reminders and relevant history. The database may remain modular behind the scenes; the user should not need to navigate disconnected modules to understand one visit.

Keep the original document and business automation data separate. Do not make the clinical note the only source for structured operational records, and do not force all visit details into one unrestricted JSON blob.

### 2.4 Visit purpose is not treatment

**Explicitly clarified by the owner on 2026-10-28.**

Keep two distinct fields:
- `visit_purpose`: why the patient attended (for example, consultation, tooth pain, routine check-up, cleaning request or follow-up).
- `treatments`: an array of one or more treatments associated with the visit.

Illustrative example only:
```json
{
  "visit_purpose": "Tooth pain consultation",
  "treatments": [
    "Dental examination",
    "Root canal treatment"
  ]
}
```

Important semantics:
- One visit can have one purpose and multiple associated treatments.
- Listing a treatment does **not** by itself assert that the treatment was performed. If the workflow needs to distinguish discussed/planned/recommended from performed, use explicit status or separate linked records rather than infer it from the array.
- These fields do not replace the original clinical source or a dentist-approved record.
- Fields can be optional where appropriate; authorized staff/dentists enter or confirm them under clinic workflow permissions.
- Do not have AI independently infer and finalize clinical meaning.

### 2.5 Clinical authority and non-interference

ClearFlow records professional decisions; it must not impose an automatic clinical treatment/diagnosis decision tree or interfere with a dentist's clinical judgment. The product may support operational reminders based on supplied instructions, with human review when ambiguous, but it must not invent a treatment decision.

Only an appropriately qualified and authorized professional can interpret/edit/correct/approve clinical meaning and finalize clinical records or prescriptions within their scope. Trusted assistants may be granted explicit, scoped, revocable administrative permissions (such as capturing files, organizing documents, scheduling or other permitted admin tasks). Delegation does not transfer clinical authority. Never use shared credentials or attribute an assistant's action to a dentist.

### 2.6 Patient identity, shared contacts and duplicate management

- A phone number is a contact channel, not a patient identifier or proof of family relationship.
- Each patient needs a stable internal ID; the initial design direction is tenant-scoped identity.
- One phone number can be associated with multiple patient records, such as a parent's number used for a child, or a caregiver's/receptionist's number.
- Search by phone may show multiple associated patient records for an authorized user, with available distinguishing details. These details are clues, not proof of identity.
- Relationship/family grouping is optional and explicitly recorded when known; do not infer kinship from a shared number.
- Never auto-merge patients because of a shared phone, name, age or gender.
- Distinguish unlinking a mistaken contact/relationship from unmerging patient identities.
- A merge must have a durable operation journal recording source and survivor IDs, approval/actor/time, records reassigned, conflicts and versions. Unmerge must be controlled; records created or changed after merge may need human review rather than an unsafe one-click rollback.
- The authoritative database remains the source of truth. AI must never decide or execute patient merges.

### 2.7 Vector memory and AI retrieval

- Vector indexes and AI summaries are derived, rebuildable retrieval aids—not authoritative patient records or access-control systems.
- Keep tenant/patient scope, source IDs, source versions and provenance with indexed chunks; minimize sensitive data in embeddings.
- After merge/unmerge, correction, deletion, revocation or access change, stale index entries must be marked unavailable promptly and then removed/reassigned/rebuilt by idempotent, retryable, version-aware jobs.
- Revalidate tenant, patient and user authorization against the authoritative database before returning retrieved content.
- Avoid showing stale or ambiguous patient-owned content if indexing is delayed.
- AI conversations may contain sensitive clinical data and need retention/access rules; they do not automatically become approved clinical records.

## 3. Frontend, PWA and realtime architecture discussion
**Discussion date:** 2026-10-28  
**Status:** PWA and no-TypeScript preference are clear; detailed frontend framework choice is a preferred direction, not yet proven in an implementation.

### 3.1 PWA is the product format

- ClearFlow is a browser-based **Progressive Web App (PWA)**.
- No separate Android or iOS application will be built.
- The PWA should be mobile-first, installable where supported, and responsive across phones, tablets and desktops.
- Keep the interface card-based and avoid horizontal scrolling.
- Cloudflare Pages can host a static PWA without requiring TypeScript. Java/Python backend services and Appwrite may be hosted separately.

### 3.2 Avoid unnecessary TypeScript/frontend complexity

The owner raised concern that the TypeScript codebase/approach can become too large and costly to maintain. The objective is structured, maintainable code with fewer unnecessary lines and abstractions—not unstructured code.

- TypeScript is not required for a PWA or for realtime behavior.
- Plain JavaScript can consume the same realtime SDK/events as TypeScript.
- HTML, CSS and browser JavaScript remain the browser-facing technologies; Java does not execute as the normal application language inside a browser.
- Java can be used for the application backend (proposed: Spring Boot).
- Python is intended for interpretation and deterministic processing.
- Do not add React/TypeScript merely to obtain reactive screens, live events or streaming text.

### 3.3 Frontend approaches considered

The following alternatives were discussed:
- **Vue with plain JavaScript:** component-based, reactive UI; preferred to evaluate for a structured interface with live AI streaming.
- **Svelte with plain JavaScript:** concise reactive components; alternative.
- **Java-rendered HTML + HTMX + minimal JavaScript/Alpine.js:** server-driven pages and partial HTML updates; alternative if minimizing client-side application code is the priority.

**Current preferred direction:** evaluate Vue + plain JavaScript for reusable, reactive components and streaming AI UI, without TypeScript. This is a recommendation based on the discussion, not a claim that the framework has been implemented or irrevocably finalized. Compare it against Java-rendered HTMX/Alpine if frontend simplicity remains the overriding criterion. Avoid making the final choice based only on assumed line counts; verify with a small representative prototype.

### 3.4 Realtime updates across users

The owner requires authorized users to see updates made by other users without refreshing the entire page, and wishes to avoid unnecessary polling.

- Prefer Appwrite Realtime's built-in change-notification capability where the chosen Appwrite product/version and permission model support the needed subscription.
- Use one shared, reusable frontend realtime integration, not a separate custom realtime backend/function for every module.
- On receiving an event, update only the affected patient card, visit timeline, appointment, reminder or status rather than reload the whole page.
- Events should carry only the minimum necessary information. For sensitive clinical content, use the event to trigger an authorized fetch of current data rather than broadcasting full clinical content.
- Realtime events are notifications, not the authoritative record. Handle reconnects and reconcile against saved state when necessary.
- Enforce tenant/patient authorization on subscription and data retrieval. Consider concurrent edits and prevent silent overwrites.
- Realtime avoids routine polling for change detection, but connections, reconnects and data fetches still use network resources.
- Exact channel syntax, event behavior and permissions must be verified against the deployed Appwrite SDK/version before implementation.

### 3.5 Live AI conversation and streaming

The owner requires a frontend capable of live AI interaction:
- microphone/voice input where supported;
- incremental text generation visible while the answer is being generated;
- spoken audio output when supported by the selected AI service;
- stop/interruption controls and clear listening/connecting/processing states;
- graceful error and reconnect behavior.

Streaming AI is distinct from database realtime. A text-streaming API or realtime voice API supplies the AI stream; the frontend renders it incrementally. Appwrite Realtime supplies database-change notifications. These should be separate integrations, coordinated through a consistent UI rather than one giant realtime function.

AI may retrieve authorized information and prepare candidate actions. It must not write/delete business or clinical data directly without the required authorization and user approval. Deterministic validation and controlled backend operations remain responsible for actual execution.

## 4. Current proposed technology stack

**Status: proposed baseline; verify each integration before implementation.**

| Layer | Current direction | Responsibility |
|---|---|---|
| Web client | PWA using HTML/CSS and JavaScript; evaluate Vue + JavaScript first | Mobile-first interface, reactive components, document capture, incremental AI rendering |
| Static frontend hosting | Cloudflare Pages | Serve frontend assets, manifest and service worker; no TypeScript requirement |
| Application backend | Java, with Spring Boot proposed | Business APIs, validation, authorization and controlled mutations |
| Interpreter / processing | Python | Document/OCR processing orchestration, deterministic validation and supported extraction |
| Workflow orchestration | Windmill | Run Python jobs, retries, schedules and background tasks |
| Backend platform | Appwrite | Authentication, database, file storage and realtime event delivery where supported |
| AI connectivity | Provider-neutral adapter/gateway to be designed | Streaming text/voice, model selection and controlled conversational execution |

Design rules:
- Use Python for deterministic supported operations wherever practical, to reduce unnecessary AI calls, latency, cost and resource usage.
- Use AI when language understanding or genuinely probabilistic interpretation is needed.
- Do not duplicate business rules across frontend, Java and Python. Establish clear service ownership and contracts.
- Frontend displays saved/canonical state; it must not be the authority for permissions, clinical status, financial logic or critical validation.
- Appwrite's suitability for required authorization, realtime, storage and database behavior must be tested; the architecture table is not proof of a production-ready configuration.
- No cloud/provider selection should be interpreted as permission to modify live deployments, database permissions, DNS or Cloudflare settings without explicit approval.

## 5. Cross-cutting security, safety and quality constraints

1. Tenant isolation must apply to every read and mutation, including realtime subscriptions, background jobs, vector retrieval, exports and file access.
2. Authentication identifies the user; application authorization determines what that user can do. Do not trust tenant or patient IDs supplied by the browser without server-side checks.
3. Preserve original clinical documents and provenance. Draft, approved, signed/issued, amended and revoked artifacts have distinct states.
4. Require qualified professional approval for clinical meaning and prescription issuance as applicable; admin delegation is scoped and revocable.
5. Use idempotency, audit history, version checks and recoverable jobs for consequential operations.
6. Validate clinical, privacy, retention, consent, prescription, imaging/radiation, biomedical-waste, tax and facility obligations with appropriate current Indian/Telangana authorities and qualified professionals. Research notes are not legal/clinical sign-off.
7. Do not claim full source schema coverage, legal compliance, successful live cross-tenant security testing or production readiness without evidence.

## 6. Open questions and validation tasks

- Finalize whether Vue + plain JavaScript or Java-rendered HTMX/Alpine is the frontend after a small prototype that includes forms, a patient visit timeline, Appwrite Realtime and streaming AI text.
- Choose the specific Java backend hosting/runtime and define Java↔Appwrite and Java↔Windmill service contracts.
- Verify current Appwrite SDK/API support for the intended realtime subscription model and tenant/patient access-control design.
- Select AI text-streaming and voice interaction APIs; test microphone permissions, interruption, mobile browser behavior, latency, failures and privacy.
- Define authoritative event/data contracts so that database updates, background Python jobs and UI state remain consistent.
- Specify document retention, optional digital clinical record workflows and required legal retention obligations by jurisdiction.
- Complete the canonical schema only after the existing research gaps, clinical validation, legal review and live tenant-isolation tests are addressed.

## 7. Related repository research

Use this log alongside—not instead of—the source research and traceability materials:
- [Project Notes](./PROJECT_NOTES.md)
- [Research Index](./RESEARCH_INDEX.md)
- [Cross-System Comparison](./CROSS_SYSTEM_COMPARISON.md)
- [Field-Level Inventory](./FIELD_LEVEL_INVENTORY.md)
- [Source Field Maps](./SOURCE_FIELD_MAPS.md)
- [Traceability Matrix](./TRACEABILITY_MATRIX.md)
- [Implementation Gap Review](./IMPLEMENTATION_GAP_REVIEW.md)
- [Research Completion Status](./RESEARCH_COMPLETION_STATUS.md)

**Maintenance note:** Add future project conversation decisions here as dated append-only entries, and update the relevant topical document/index rather than relying on chat history alone.


## 8. Database design discussion roadmap
**Discussion date:** 2026-10-28  
**Status:** Agenda proposed; topics must be decided individually before schema freeze.

After reviewing the research pack and the discussions already captured above, the next database design conversations should follow this order:

1. **Tenant, clinic/branch, staff membership and authorization:** multi-branch relationships; users who work at multiple branches; separate authentication, tenant membership, professional credentials, role grants and action-level permissions. Branch-aware records and tenant isolation are required design constraints.
2. **Patient, appointment, visit/encounter and performed service:** clearly distinguish a scheduled booking, actual attendance, clinical encounter, and a treatment/procedure actually performed. Define cardinalities and links.
3. **Clinical record and signed-artifact lifecycle:** original files, optional drafts, approved versions, prescription draft/issue, signatures, corrections, amendments, audit and retention.
4. **Patient medical context:** allergies/intolerances, conditions, medication statements, patient-reported history, verified information, provenance, uncertainty and review lifecycle.
5. **Dental clinical structures:** odontogram/tooth notation, findings, periodontal measurements, treatment plans, procedures, multi-session care and which parts are in initial scope.
6. **Next-visit, appointment and follow-up semantics:** separate a suggested date, booking, reminder, recall obligation, patient response and completed follow-up.
7. **Documents, imaging, labs and referrals:** file metadata and immutable originals, authorized links to patients/encounters, X-ray/image metadata, lab case and referral scope.
8. **Audit, consent, privacy and retention:** actor/action/time/source, consent and authority evidence, revocation, correction, access history and applicable legal retention.
9. **Integrity and processing mechanics:** tenant-safe relations and every mutation, concurrent editing, idempotency, outbox/retries, background job permissions, vector-index invalidation and rebuilds.

This is an agenda, not a set of final schema decisions. The owner and assistant should discuss one topic at a time, distinguish owner-approved decisions from proposals, record open questions, and update this log when a decision is made. Do not freeze the canonical schema until relevant clinical/legal review and the required runtime tenant-isolation tests are complete.

**Immediate next topic:** tenant → clinic/branch → user membership/role/authority relationships, because these boundaries affect almost every other table and permission rule.


## 9. Database design approach — derive standard enterprise relationships
**Discussion date:** 2026-10-28  
**Status:** Agreed working approach; canonical schema remains subject to research and validation.

The project owner clarified that routine enterprise relationships should be derived by the assistant from established enterprise architecture patterns rather than presented as a series of basic questions for the owner to decide. The owner’s time should be reserved for decisions that are genuinely product-specific, clinical, operational, legal, commercial, or materially affect user experience.

Use established patterns as the baseline and validate them against the ClearFlow Dental Clinic research, tenant isolation, clinical provenance, and operational needs. Do not copy another product’s schema uncritically and do not claim a proposal is frozen until validated.

Default principles to apply:
- **Tenant isolation:** tenant-owned data and every relationship/mutation must be tenant-scoped and enforced server-side/database-side, not only in the UI.
- **Organization hierarchy:** model the tenant/customer organization separately from legal entities where needed and from its clinics/branches.
- **Identity and authorization:** keep authenticated identity distinct from staff/person records, tenant memberships, roles/permissions, professional credentials, and branch scope. A role label alone must not imply clinical authority.
- **Patient continuity:** allow a patient to be served at multiple branches within a tenant, while maintaining branch/encounter provenance and appropriately scoped access.
- **Clinical provenance and lifecycle:** retain source documents, record authorship, approval/signature state, corrections, versions, and audit history where applicable; capture does not equal clinical approval.
- **Referential and transactional integrity:** use backend/database constraints and validated service operations for relationships, concurrency, idempotency, and sensitive mutations.
- **Extensible product scope:** separate core entities from optional modules; do not make every clinic adopt every workflow or module.
- **Explicit boundaries:** cross-tenant patient sharing/referrals, legal-entity arrangements, retention obligations, and other material exceptions must be represented deliberately rather than inferred from shared phone numbers or similar identifiers.

Workflow for future database design discussions:
1. Derive a recommended baseline from established enterprise patterns and the current research.
2. Identify only material alternatives and their trade-offs.
3. Clearly label decisions as established project requirements, recommended defaults, unresolved questions, or validated implementation facts.
4. Ask the owner only when a real product/business/clinical policy choice is needed.
5. Append new decisions to this log and update relevant research documents as the project progresses.

This agreement changes the discussion method; it does not itself approve a final physical schema, grant cross-tenant access, or authorize changes to live infrastructure.


## 10. Apply enterprise healthcare modeling to encounters and clinical workflows
**Discussion date:** 2026-10-28  
**Status:** Agreed design method; detailed mapping and validation remain in progress.

The project owner clarified that encounter, appointment, treatment, and related concepts should also follow established enterprise healthcare information-modeling logic. They are not to be invented ad hoc or presented as basic owner-choice questions.

Working method:
- Use established healthcare information models and mature dental/clinical system patterns as reference points, then map them to ClearFlow's researched scope and workflows. Where relevant, compare concepts against standards such as HL7 FHIR without assuming the application must implement every FHIR resource or adopt its entire model.
- Keep distinct concepts distinct: patient identity; appointment/scheduled service; actual clinical encounter; observations/findings; clinical notes and source documents; planned/recommended care; performed procedures; orders/prescriptions; and follow-up/recall.
- Derive cardinalities, lifecycle states, referential constraints, and provenance requirements from enterprise practice and the research. Avoid collapsing unrelated concepts into one table or forcing one-to-one relationships where real workflows require one-to-many or optional relationships.
- Do not infer that a scheduled appointment occurred, that a treatment was performed because it was listed, or that captured/extracted content is clinically approved.
- Use the simplest implementation that preserves clinical meaning, traceability, tenant isolation, and future extensibility. Standards are reference models, not an instruction to overbuild or reproduce a standard wholesale.
- Bring the owner only material unresolved choices that depend on ClearFlow's product policy, target workflow, clinical governance, legal requirements, or commercial scope.

This is a decision about the modeling approach, not approval of a final physical schema. Research mapping and clinical/legal validation remain required before production claims.


## 11. Recommended clinical artifact lifecycle baseline
**Discussion date:** 2026-10-28  
**Status:** Recommended enterprise baseline derived for research mapping; not a frozen schema or legal/clinical sign-off.

The next database-design topic is the lifecycle of clinical records and artifacts. Apply established healthcare record-management patterns and map them against the existing source research before implementation.

### Core modeling rules
- Give each clinical artifact a stable identity and explicit type, patient/encounter links where applicable, tenant scope, source/provenance, author or responsible actor, timestamps, lifecycle state, and version/correction relationships as appropriate.
- Keep original captured documents distinct from extracted drafts and approved clinical interpretations. Capture is not approval, and extraction is not a clinical decision.
- Store an original file once when practical and link derived drafts/approved records to it; avoid needless duplicate file copies. Preserve the content and provenance of approved/finalized versions.
- Model each artifact's lifecycle explicitly. Do not use one universal status enum for fundamentally different types.
- A correction to a finalized clinical record should create a traceable amendment/correction relationship or new version; it must not silently overwrite history. Legal retention, correction and deletion behavior must be validated for the applicable jurisdiction and record type.
- Prescriptions and other regulated clinical artifacts need a distinct draft-to-authorized/issued lifecycle, with signer identity/authority and appropriate cancellation/discontinuation history. Merely saving or uploading a prescription is not equivalent to issuing one.
- Audit history should record relevant actor, action, time, target, source/reason where required, and outcome. Protect it against ordinary user alteration and scope reads by authorization.
- Enforce every lifecycle transition in trusted backend logic. Validate current state, tenant/parent relationships, actor authority, and idempotency; handle concurrency so that two simultaneous operations cannot produce invalid state.
- AI may prepare draft extraction or summaries when explicitly requested, but must not approve clinical meaning, sign, issue prescriptions, or overwrite authoritative records. Authorized human review/approval remains a distinct operation.

### Illustrative lifecycle patterns (to be mapped to source standards and local requirements)
- Original uploaded document: captured and retained; restrictions, supersession, and disposal follow approved retention/access policy.
- AI-extracted content: draft → reviewed → approved or rejected.
- Clinical note: draft → signed/finalized → amended through a traceable correction.
- Prescription: draft → authorized/issued by an appropriately qualified professional → cancelled/discontinued when applicable.
- Treatment plan: proposed → accepted/declined → revised as care progresses.
- Audit history: append-oriented event history with controlled access and integrity protections.

These are conceptual patterns, not a commitment to these exact status names or a single shared state machine. Exact transitions, signatures, retention and deletion rules must be mapped to selected healthcare standards, applicable Indian/Telangana requirements, and qualified clinical/legal review. This does not close the existing legal, clinical or runtime-security gates.


## 12. Duplicate uploads and records from external providers
**Discussion date:** 2026-10-28  
**Status:** Recommended baseline; implementation details and applicable retention rules require validation.

The owner raised the cases of a previously received file being sent again and patients bringing historical prescriptions/forms/reports from other hospitals.

### Separate the file, the receipt, and the clinical interpretation
- Model (a) the stored file object, (b) each upload/receipt event, and (c) any classification or interpretation as separate concepts.
- Use a cryptographic content hash such as SHA-256 to detect exact-byte matches within an authorized scope. Where safe, reuse the stored file while preserving each receipt's timestamp, actor/source/channel and context.
- Do not reveal to one tenant whether another tenant has matching content. Tenant-scoped duplicate detection is the safe default unless a reviewed storage design prevents cross-tenant existence disclosure and access leakage.
- A new photo, scan, crop, rotation, compression or PDF conversion may have different bytes despite showing the same document. Similarity signals may flag possible duplicates for human review, but must not silently discard them.
- Similar-looking prescriptions may differ in date, dose, prescriber, signature or instructions. Similarity alone must never merge or discard clinical records.

### Historical records from other providers
- Preserve the external document as received and identify it as externally authored/source material.
- Capture known source organization/practitioner, document type, date stated on the document, date received, receiving actor/channel, patient link, and optional encounter/review link. Keep document date distinct from receipt date; unknown values remain unknown.
- Keep authenticity/verification status separate from clinical review status. Uploading a document does not prove its source or make its contents current.
- Do not automatically turn an external prescription into an active medication list, an external diagnosis into a confirmed current diagnosis, or an outside procedure into a procedure performed by this clinic.
- Preserve the original and its provenance. In keeping with the capture-first requirement, do not automatically restructure handwritten clinical notes into a rigid schema. Any explicitly requested extraction remains a source-linked draft until reviewed and approved by an appropriately authorized clinician.
- A historical document can be linked to the patient without being forced into the current encounter. It may also be linked to the encounter where it was supplied or reviewed.

### Recommended intake sequence
1. Authorize the uploader and target patient/encounter links.
2. Validate the file and perform security checks.
3. Compute the content hash and check for exact matches in the authorized scope.
4. Reuse an existing stored object for an exact match where safe, but record the new receipt event; otherwise store the new original.
5. Save known provenance/metadata without guessing missing facts.
6. Flag probable near-duplicates for authorized human review; do not auto-delete based on similarity.
7. Keep optional extraction separate from the source, draft-only until approved, and traceable back to the original.

This extends the existing document-first and provenance decisions. It does not authorize automatic clinical interpretation, patient merging, cross-tenant disclosure, or bypassing applicable retention obligations.


## 13. Keep related clinical context within the draft/approved JSON workflow
**Discussion date:** 2026-10-28  
**Status:** Owner direction accepted as a workflow/design principle; exact JSON contract and clinical sign-off rules remain to be mapped.

The owner prefers past history and external records to be represented in clearly separated sections of the relevant draft or approved clinical JSON, rather than creating extra approval buttons and fragmented approval work for every item.

Working interpretation:
- Prefer a coherent clinical record/document structure with sections for current encounter content, past medical/dental history, external records/prescriptions, allergies/medication history and source references where relevant.
- Do not create a separate approval UI action for each ordinary section by default. Provide a consolidated review/approval action for the appropriate clinical record or artifact where the workflow and professional authority allow it.
- Preserve section-level provenance/metadata inside the JSON when needed: source document/reference, source organization if known, document date, received date, who entered/reviewed it, and whether information is reported, imported, verified, uncertain, historical or current. This can support traceability without multiplying screens or approval buttons.
- Keep the source original linked and preserved. Embedding a structured representation or summary in JSON must not replace or alter the original source file.
- A consolidated approval must not falsely imply that every imported historical fact has been independently verified. Approval semantics should be clear about what the clinician is attesting to (for example, approval of the authored encounter note versus confirmation of every item in an imported history).
- Avoid excessive normalization and approval ceremony, but do not flatten legally or clinically distinct artifacts into a single unversioned blob. Prescriptions that are actually issued, signatures, amendments and other regulated artifacts may require their own lifecycle or immutable/versioned representation even if they are surfaced through a unified review workflow.
- Keep this as a data-model and UX principle to validate against the research and applicable clinical/legal obligations before finalizing schema and approval semantics.

This direction supersedes any assumption that each imported-history section should automatically have its own approval button. It does not authorize automatic AI approval, erase source provenance, or remove mandatory legal/clinical signature requirements.


## 14. Keep clinical JSON classification to 3–4 broad sections
**Discussion date:** 2026-10-28  
**Status:** Owner direction accepted as a simplicity requirement; final field contract still to be validated.

The owner explicitly requests only 3–4 broad sections in the draft/approved clinical JSON, using core classification rather than splitting every line of a prescription or handwritten clinical document into individual structured fields.

Recommended starting sections:
1. **Current Visit** — concise encounter notes, findings and treatment context.
2. **Medical & Dental History** — relevant past history, allergies and medication context.
3. **External Records** — prior prescriptions, reports and documents from other providers, with basic source/date information and links to preserved originals.
4. **Review & Status** — record-level draft/approved state, responsible clinician, timestamps and version information, where suitable for the JSON contract.

Rules:
- Keep original documents intact and linked; do not require line-by-line prescription extraction.
- Any explicitly requested extraction should remain concise, source-linked, and draft until appropriately reviewed.
- Use basic classification and provenance only where useful; unknown information stays unknown.
- Do not add a new section or field taxonomy unless a demonstrated clinical, security, interoperability or regulatory need justifies it.
- Review/approval should be consolidated at the appropriate record level where allowed; preserve necessary distinctions for separately regulated artifacts such as issued prescriptions and signed amendments.
- This is a design direction, not a finalized JSON schema or legal/clinical approval.


## 15. Avoid reopening previously discussed patient medical context
**Discussion date:** 2026-10-28  
**Status:** Acknowledged; existing discussion retained.

The owner pointed out that patient medical context had already been discussed in prior project conversations, including reported versus verified information, medication history, allergies, provenance, and historical/external records. Do not present this as a new unresolved topic or ask the owner to repeat decisions already covered. Continue the database roadmap from the next genuinely open topic, using prior conversation and repository research as context.


## 16. Dental-specific clinical data — recommended enterprise baseline
**Discussion date:** 2026-10-28  
**Status:** Recommended baseline for source mapping; not a frozen schema.

Continue the database roadmap with dental-specific clinical structures. Derive from established dental information models and researched comparator systems, without imposing unnecessary structured entry.

Recommended conceptual boundaries:
- **Odontogram:** patient-specific chart over time, using a recognized tooth numbering convention configurable for the clinic's region. Chart state should not silently erase prior clinically relevant state.
- **Findings/observations:** findings may be associated with a tooth, surface, periodontal area, or broader oral region when appropriate. Support free-text notes and preserve provenance; do not require every finding to be converted into a rigid coded field.
- **Treatment plan:** proposed/accepted/declined care is distinct from a procedure actually performed. Plan items may evolve and can be linked to relevant findings and teeth/areas.
- **Procedure record:** represents care actually performed, linked to the encounter and relevant tooth/area when applicable, with responsible clinician and timing/provenance.
- **Longitudinal history:** preserve clinically meaningful prior findings/procedure records and traceable corrections; avoid treating the latest chart as permission to overwrite history.
- **Pragmatic structure:** optional structured charting should add value to a workflow; do not require every tooth, surface, or finding to be populated. Free-text clinical notes and original documents remain valid.
- Keep original capture-first rules and the simple clinical JSON preference: do not force line-by-line extraction of handwritten notes or prescriptions. Structured dental charting is for deliberate clinical entry when useful, not automatic reclassification of every source document.

Next validation: map these concepts and cardinalities to selected dental comparators and applicable tooth-numbering/clinical practice needs; distinguish well-supported patterns from product choices and unverified source coverage. No production schema is approved by this entry.
