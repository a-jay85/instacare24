# Source spec: Doc's Transcription and Summary workflow

Source: `relatestworkflowforreview/Instacare24 - ElderLink Workflow - Doc's transcription and Summary.pdf` (1 page, one wide landscape flowchart, Figma/FigJam-style).

**Diagram title (verbatim):** "AI-assist App translating the Doctor visit transcription and plain-English summary"

**What the PDF is:** a flowchart only. It is not a wireframe. It shows no screen mockups, button labels, field labels, or real UI copy. Node labels are quoted verbatim below. Anything written as a screen is my inference for the demo and is marked **[inferred]**.

## Purpose
- A family member or patient uploads a record of a doctor visit: a photo, a PDF/file, or (implied by classification) an audio recording.
- The system validates it, secures it, then OCRs or transcribes it into a transcript.
- The AI turns that transcript into a **plain-English visit summary**. The summary covers diagnoses mentioned, medications, follow-up instructions, and care reminders.
- The summary goes through quality and governance checks, with human review when required.
- The family is notified, and the transcript and summary are stored in a versioned patient folder.

## Actors / roles
- RBAC roles (verbatim): **"Patient/Provider/ Caregiver/Admin"**.
- In ElderLink terms: Patient = the aging parent; Caregiver = the family member (the subscriber); Provider = the doctor; Admin = InstaCare24 operations.
- The AI system: OCR, speech-to-text, and the summarizer.
- A human reviewer: "Human Review Queue (When Required)" and "Manual Review/ User Notification".
- The Patient Health Portal: an external data source used as a fallback.

## Flow (in order, verbatim node labels)

### 0. Entry / Auth (HIPAA gate)
1. **"HIPAA Compliance Layer"** (yellow circle), then **"User Login"** (diamond).
2. **"OAuth"** (diamond), then **"Role Based Access Control (RBAC) (Patient/Provider/ Caregiver/Admin"** (the closing paren is missing in the source).
3. Decision **"Is User authorized to access file?"**
   - **NO** leads to **"Deny access and log the attempt"** (terminal).
   - **YES** leads to **"Allow workflow to processing services"**, then Epic 1.
- A second connector (from User Login or RBAC; ambiguous in the source) also feeds Epic 1. It is the same happy path.

### Epic 1: "Select upload method"
- The options sit in a container labelled "Section 3", which is a Figma artifact. **[inferred]** This is a picker screen with two large tap targets:
  - **"Option 1:  Capture photo"** (camera)
  - **"Option 2:  Upload PDF / File"**
- Next: **"File Type validation - for authenticity"**, then decision **"Is the file type and size allowed?"**
  - **NO** leads to **"Show upload error & retry options"**. A dashed arrow loops back to the upload-options box (retry).
  - **YES** leads to **"Accept file for secure processing"**, then **"Upload Progress & Confirmation"** (lime-green node; this is a user-facing progress/confirmation state), then Epic 2.
- The allowed types and max size are not specified. Classification later implies PDF, image, and audio.

### Epic 2: "Security Validation & Access Control" (backend; shown as sequential checks)
- "Malware Scan"
- "File Authenticity Check"
- "MIME Type Validation"
- "Suspicious File Detection"
- "Security Exception Handling"
- Then Epic 3.

### Epic 3: "Secure Storage & Audit Logging"
- "Encrypt data in transit (TLS)"
- "Encrypt at Rest (AES-256" (paren missing in the source)
- "Generate Audit Records"
- "Store Access History"
- "Compliance Log Retention"
- Then Epic 4.
- The arrows in this column point partly upward. Treat the order as listed.

### Epic 4: "Processing Orchestration"
- "Processing Authorization"
- "Create Processing Job"
- "Queue Management Engine"
- "Processing Status Tracking"
- "Failure Recovery Logic"
- Then Epic 5.
- **[inferred]** Job status is the source for a UI status tracker.

### Epic 5: "OCR & Transcription Processing"
1. "Document Classification (PDF / Image / Audio)"
2. Decision **"Is Text Already Available?"**
   - **YES** leads to:
     1. "Direct Text Extraction OCR Engine"
     2. "OCR Confidence Validation"
     3. "Text Normalization"
   - **NO** leads to "OCR Required", "Run OCR", then decision **"OCR Confidence OK?"**
     - **Yes** leads to "Text Normalization".
     - **No** leads to **"Manual Review/ User Notification"**, then **"AI gets the information from Patient Health Portal"**, then "Transcript Generation".
3. After Text Normalization:
   1. "Speech-to-Text (Audio Only)"
   2. "Speaker Identification"
   3. "Transcript Generation"
   4. "Secure Transcript Storage"
4. Then **"AI Governance & Compliance Layer"**. This node has two info cards and then leads to Epic 6.

**Allowed AI Actions** (checkmark list, verbatim):
- ✓ Summarize visit discussions
- ✓ Simplify medical terminology
- ✓ Extract medications mentioned
- ✓ Extract diagnoses explicitly documented
- ✓ Extract follow-up instructions
- ✓ Generate patient-friendly summaries

**Prohibited AI Actions** (hook-arrow list, verbatim):
- Diagnose diseases
- Prescribe medications
- Recommend treatments
- Interpret laboratory results
- Predict medical outcomes
- Generate medical advice
- Modify provider documentation

These make good demo UI copy: an "AI boundaries" disclaimer panel next to the summary.

### Epic 6: "AI Summary Generation"
- "Generate Visit Summary"
- "Simplify Medical Terminology"
- "Extract Diagnoses Mentioned"
- "Extract Medications"
- "Extract Follow-Up Instructions"
- "Generate Care Reminders"
- "Store AI Summary"
- Then Epic 7.

**[inferred]** Summary screen sections:
- Plain-English Summary
- Diagnoses Mentioned
- Medications
- Follow-Up Instructions
- Care Reminders

### Epic 7: "Transcript Quality Validation"
- "Transcript Completeness Check"
- "OCR Confidence Verification"
- "AI Summary Accuracy Validation"
- "Missing Information Detection"
- "Low Confidence Identification"
- Then Epic 8.

### Epic 8: "Compliance & AI Governance Review"
- "PHI Compliance Review"
- "AI Boundary Validation"
- "Hallucination Detection"
- "Prohibited Advice Detection"
- "Human Review Queue (When Required)"
- "Governance Approval"
- Then Epic 9.

### Epic 9: "Notifications & Delivery"
- "Summary Ready Notification"
- "Email / SMS / Patient Portal Alert"
- "Delivery Confirmation"
- "Notification Audit Logging"
- Then Epic 10.

### Epic 10: "Patient Folder & History Management"
- "Store Transcript History"
- "Store Summary History"
- "Version Management"
- "Search & Retrieve Records"
- "Secure Patient Portal Access"
- **END**

## Decision points (summary)

| Decision | YES | NO |
|---|---|---|
| Is User authorized to access file? | Allow workflow | Deny access and log the attempt |
| Is the file type and size allowed? | Accept, then upload progress/confirmation | Show upload error & retry options (loops to the upload picker) |
| Is Text Already Available? | Direct text extraction | OCR Required, then Run OCR |
| OCR Confidence OK? | Text Normalization | Manual Review / User Notification, then AI pulls data from the Patient Health Portal, then Transcript Generation |

- Implicit condition: speech-to-text runs only for audio.
- Implicit condition: the Human Review Queue is used "When Required". The trigger is unspecified; presumably low confidence, hallucination, or prohibited-advice flags from Epics 7-8.

## States / statuses [inferred from nodes]
- **Upload:** selecting method, then validating, then rejected (error + retry) or accepted, then uploading (progress), then uploaded (confirmation).
- **Processing job:** queued, then processing (security scan, OCR/transcribing, summarizing), then validating, then in human review (optional), then approved, then delivered. Plus "failed" with recovery.
- **Access:** authorized or denied (logged).
- **OCR confidence:** OK or low (manual review).

## Data entities & fields [inferred]
- **User:** id, role (Patient | Provider | Caregiver | Admin), OAuth identity.
- **UploadedFile:**
  - Source: photo or PDF/file (audio implied)
  - MIME type and size
  - Validation result
  - Malware/authenticity flags
  - Encrypted storage ref
- **ProcessingJob:** id, fileId, status, timestamps, failure/retry info.
- **Transcript:**
  - Text
  - Source method: direct extraction, OCR, STT, or portal fallback
  - OCR confidence
  - Speakers (for audio)
  - Version
- **VisitSummary:**
  - Plain-English summary
  - Simplified terms
  - diagnosesMentioned[]
  - medications[]
  - followUpInstructions[]
  - careReminders[]
  - Accuracy/confidence flags
  - Governance status (auto-approved, needs review, approved)
  - Version
- **AuditRecord:** actor, action, timestamp, file/record id. This covers access history, denied attempts, and notification logs.
- **Notification:** type "Summary Ready", channel (Email | SMS | Patient Portal), delivery confirmation.
- **PatientFolder:** transcript history, summary history, versions, search.

## Notifications
- "Summary Ready Notification" via "Email / SMS / Patient Portal Alert", with "Delivery Confirmation" and audit logging.
- "Manual Review/ User Notification" when OCR confidence is low.
- "Show upload error & retry options" when validation fails.

## Brand / style cues (sampled hex, diagram colours only; not necessarily product brand)
- **Font:** Inter-like sans.
- **Nodes:** rounded rectangles. Borders are approximate (not sampled): dark teal-green on the cyan, mint, and salmon nodes; purple on the auth nodes, the Epic 1 option boxes, the pink error/accept nodes, and the upload-progress node.
- **Fill colours:**

| Colour | Hex | Used for |
|---|---|---|
| Yellow | #F6E989 | HIPAA circle |
| Lavender | #EDD7FD / #E1BDFA | Login, OAuth, RBAC, File Type validation |
| Light cyan | #B1E4F7 | Main process nodes and decisions (Epics 4-10) |
| Mint green | #97EDCA | Epics 1-2 |
| Salmon | #FFB8B2 | Epic 3 (security/storage) |
| Pale pink | #FFECEB | Error/accept nodes |
| Lime | #D3F1A7 | "Upload Progress & Confirmation" |
| Pale blue | #C6EDFC | Upload-option container |

- The name "ElderLink" appears only in the filename. The diagram says "AI-assist App".

## Ambiguities
- There are no actual screens or copy. All UI is inferred from process nodes.
- Audio upload is never offered in Epic 1 (only photo and PDF/file), yet classification handles Audio.
- Speech-to-Text sits after Text Normalization in a linear chain. Logically it is a parallel branch for audio.
- The Patient Health Portal fallback is vague: which portal, and what consent is needed?
- The Human Review trigger criteria are undefined, as is what happens if governance approval fails.
- File type and size limits, confidence thresholds, and retention periods are unspecified.
- Typos and missing parens in the source (e.g., "(AES-256", RBAC label) are kept verbatim above.
