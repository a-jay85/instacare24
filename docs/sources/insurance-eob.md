# Source spec: Insurance EOB workflow

Source: `relatestworkflowforreview/Instacare24 - ElderLink Workflow - Insurance EOB.pdf` (1 page, one vertical flowchart, Figma/FigJam-style).

**Diagram title (verbatim):** "AI-Assisted Insurance & Clinical Data Retrieval or AI-Assisted Insurance Navigation & EOB Workflow"

**What the PDF is:** a flowchart only. It shows no wireframes, field labels, or real UI copy. Node labels are quoted verbatim below. Screen ideas are marked **[inferred]**.

## Purpose
- Gather the elder's **insurance information** and **clinical information**, either by automated pull or by manual upload.
- Normalize the data into structured, coded form (ICD-10 / CPT / HCPCS).
- Validate medical necessity and run an **AI-assisted prior authorization**.
- Get the payer's authorization decision, then generate an **EOB (Explanation of Benefits)**, store it encrypted, and let authorized users view, download, or securely share it, with audit logging.

## Actors / roles
- RBAC roles (verbatim): **"Owner / Care giver/ Provider / Payer Admin"**.
- Owner is presumably the patient or account owner. Care giver is the family member. Payer Admin is the insurer.
- "Patient / Provider opens EOB" names Patient and Provider as the viewers.
- The Insurance Payer makes the "Authorization Decision(Insurance Payer)".
- The "AI assisted app" does orchestration, OCR, normalization, and prior auth.

## Flow (in order, verbatim node labels)

### 0. Entry
1. **"OAuth2.0/ OCID"** (purple circle; underlined, likely meant "OIDC"). It has a two-way dashed link to **"HIPAA Compliance"** (diamond).
2. HIPAA Compliance leads to **"AI assisted app"** (large purple circle).
3. The app splits into two parallel intake branches.

### 1a. "Insurance Information"
- Automated path: "FHIR/OAuth Pull", then "Insurance Portal", then "Policy Extraction".
- **"Manual Upload"** path: "Insurance CArd" (sic), then "OCR → JSON".
- **[inferred]** Screen: "Add insurance" with two choices: "Connect insurer portal" (OAuth/FHIR) or "Upload / photograph insurance card" (OCR). After OCR, show the extracted fields for confirmation.

### 1b. "Clinical Information"
- Automated path: "Doctor/EHR Portal", then "Clinical Documents", then "FHIR/HL7/API Pull".
- **"Manual Upload"** path: "PDF / Image Upload", then "OCR → JSON".
- **[inferred]** Screen: "Add clinical records" with the choices "Connect doctor/EHR portal" or "Upload PDF/Image".

### 2. Merge and processing (linear)
1. **"Structured Insurance and Clinical Data"**
2. **"ICD 10 / CPT / HCPCS Normalization"**
3. **"Medical Necessity Validation"**
4. **"AI Prior Authoraization"** (sic)
5. "Authorization Decision(Insurance Payer)"
6. "Generate EOB"
7. "Store & Encrypt EOB"
8. "Patient / Provider opens EOB"
9. "Secure Access (Authenication)" (sic)
10. "Access Granted" (decision)

Steps 1-4 are bold in the source, i.e. the emphasized AI steps.

### 3. Access decision tree
- **Access Granted?**
  - **NO** leads to **"Access Denited"** (sic; terminal).
  - **YES** leads to **"Role-Based Access Control (Owner / Care giver/ Provider / Payer Admin"**, then **"Authorized"** (decision).
    - **NO** leads to "Access Denied" (terminal).
    - **YES** leads to **"View / Download EOB"**, then **"Share Document?"** (decision).
      - **YES** leads to "Generate Secure Link", then "Audit Log", then **"END"**.
      - **NO** leads to **"END Session"**.

## Decision points (summary)

| Decision | YES | NO |
|---|---|---|
| Access Granted (authentication) | RBAC check | Access Denied |
| Authorized (role permits EOB) | View / Download EOB | Access Denied |
| Share Document? | Generate Secure Link, then Audit Log, then END | END Session |

- The payer "Authorization Decision" has no branches drawn. Approved and denied outcomes are not modelled; flow always continues to Generate EOB.

## States / statuses [inferred]
- **Intake source:** connected (FHIR/OAuth, EHR/HL7/API) or manual upload (OCR → JSON).
- **Prior auth:** data collected, then codes normalized, then medical necessity validated, then AI prior auth submitted, then payer decision (approved / denied / pending, not shown in source), then EOB generated, then EOB stored (encrypted).
- **Access:** authenticated or denied; authorized or denied.
- **Sharing:** shared (secure link created, audited) or not shared (session ended).

## Data entities & fields [inferred]
- **InsurancePolicy:**
  - Payer
  - Plan
  - Member ID
  - Group #
  - Policy details (from "Policy Extraction")
  - Source (portal pull or card OCR)
  - Card image
- **ClinicalDocument:** type, provider/EHR source, file (PDF/image), OCR JSON, FHIR/HL7 payload.
- **StructuredRecord:** diagnoses (ICD-10 codes), procedures (CPT), supplies/services (HCPCS), linked policy.
- **MedicalNecessityCheck:** result, rationale.
- **PriorAuthorization:** request, AI-prepared status, payer decision, decision date.
- **EOB:**
  - id and claim/service info
  - Billed / allowed / paid / patient responsibility (typical EOB fields; not in the source)
  - Encryption/storage ref
  - Created date
- **AccessGrant / Role:** Owner | Care giver | Provider | Payer Admin.
- **SecureLink:** url/token, EOB id, created by, expiry (not in the source).
- **AuditLogEntry:** actor, action (view, download, share), timestamp.

## Notifications
- None explicitly drawn.
- **[inferred]** Useful demo moments: "EOB ready", "Prior authorization decision received", "Document shared" (audit).

## Brand / style cues (diagram colours only; sampled hex)
- **Nodes:** periwinkle-blue rounded rectangles, #D0E1FD fill with purple borders (approximate, not sampled).
- **Circles:** OAuth and "AI assisted app" are lavender, #E3BDFA.
- **HIPAA diamond:** light blue.
- **Text:** Inter-like sans. Bold labels mark the key steps.
- The ElderLink / InstaCare24 name appears only in the filename.

## Ambiguities
- The title offers two alternate names ("…Data Retrieval **or** …Navigation & EOB").
- Typos in the source: "OCID" (likely OIDC), "CArd", "Authoraization", "Authenication", "Denited".
- The source generates the EOB after an AI prior-auth step. In real life, EOBs come from payers after claims are adjudicated, and prior auth is a separate pre-service process. The diagram conflates the two; decide how literally to demo it.
- No payer-denial, pending, or appeal branch is drawn.
- The access check is a double gate (authentication, then RBAC). Only two Access Denied endpoints exist; there is no retry.
- Which roles may view, download, or share is unspecified. Secure-link expiry and recipients are unspecified.
- The Manual Upload branch of Clinical Information shows an upward arrow into "OCR → JSON" from the merge bus. This is likely a drawing artifact; treat it as flowing down into the merge.
