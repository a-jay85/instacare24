# Source spec: Family AI Assistant workflow

Source: `relatestworkflowforreview/Instacare24 - ElderLink Workflow - Family AI Assistant.pdf`. The PDF is a single A4-landscape page containing one raster image (7659x8192) of a single whiteboard flowchart titled **"Family AI Assistant"** (mint banner).

**What the PDF is:** a flowchart only, with no wireframes. Node labels are quoted verbatim and keep the source typos. Anything marked **[inferred]** is my interpretation.

---

## Purpose
- A logged-in family member asks questions about their linked parent by text or voice, e.g. meds, check-ins, appointments, insurance/EOB, doctor visit summaries, or "talk to someone".
- The AI enforces authorization and consent, identifies intent, pulls and validates data, applies medical guardrails, and answers.
- The AI can also run an action workflow (e.g. book an appointment or request a refill).
- When needed, it escalates to a human (Offshore VA, INS Care Specialist, Clinical Team, Provider).
- Every path ends with conversation logging and an audit trail.

## Actors / roles
- **Family Member** (the "Start Family Member" pink ellipse). Uses the **"InstaCare24 Mobile App / Web Portal"**.
- **Parent** (the linked elder).
- **Parent Owner/Admin** and **Record Owner/Admin**. They approve access requests.
- **AI** (Family AI Assistant).
- **Offshore VA**.
- **Escalation targets:** INS Care Specialist, Clinical Team, Provider.
- **Support** ("Contact Support").

---

## Flow (in order)

### A. Authentication
1. **"Start Family Member"** → **"Family Member Opens InstaCare24 Mobile App / Web Portal"** → **"Login"**.
2. → **"Authenticate User Username/Password"** → **"MFA"** → decision **"Authentication Successful?"** (lime).
   - **NO** → **"Display Authentication Error"** → **"Retry Login?"**
     - **Yes** → **"Return to Login"**
     - **No** → **"Forgot Password"**
       - **Yes** → **"Reset Password"** → back to "Return to Login"
       - **No** → **"Contact Support"** → back to "Return to Login"
   - **Yes** → continue to B.

### B. Parent linkage
1. **"Load User Profile"** → **"Retrieve Linked Parent(s)"** → **"Parent Linked?"**.
   - **NO** → **"Display No Parent Linked"** → **"Request Parent Access"** → **"Notify Parent Owner/Admin"** → **"Access Request Submitted?"**
     - **Yes** → **"Notify User Request Sent"** → **End**
     - **No** → **"Display Error Retry Request?"** → **Yes** → **"Request Parent Access"** → **End**
   - **Yes** → continue to C.

### C. Authorization
1. **"Verify Authorization"** checks, verbatim:
   - Relationship
   - HIPAA Consent
   - Patient Consent
   - Family Sharing Permission
   - Access Role
   - Temporary Access
   - Permission Expiration
2. → **"Authorization Successful?"**
   - **NO** → **"Display Access Denied"** → **"Explain Restriction"** → **"Request Additional Access?"**
     - **No** → **"Log Audit"** → **End**
     - **Yes** → **"Notify Record Owner/Admin"** → **"Permission Approved"**
       - **Yes** → **"Refresh Authorization"** → **"Revalidate Authorization"** → back to "Authorization Successful?"
       - **No** → **"Notify User"** → **End**
   - **Yes** → continue to D.

### D. Conversation and intent
1. **"Launch Family AI Assistant"** → **"Family Member Enters Text or Voice Question"** → **"AI Processes Request"**.
2. → **"AI Identifies User Intent"**. Intent list, verbatim, two columns plus one:
   - General Wellness · Daily Check-in Status · Medication · Missed Medication · Medication Refill · Appointment · Family Calendar · Doctor Visit Summary · Insurance
   - EOB Explanation · Medical Records · Uploaded Documents · Caregiver Activity · Concierge Request · Post-Discharge Status · Talk to Someone · Emergency Concern · Notifications
   - General Information
3. → **"Intent Confidence Acceptable?"**
   - **NO** → **"Ask Clarifying Question Reprocess Intent"** → loops back to AI Identifies User Intent.
   - **NO** (second exit) → **"Offer Offshore VA"** → **"Family Member Offshore VA Accepted?"**
     - **NO** → **End**
     - **Yes** → **"InitiateOffshore VA(connects to Offshore VA workflow)"** (lime) → close-out (Z) → End
   - **Yes** → continue to E.

### E. Data retrieval
1. **"Determine Required Data Sources"**, verbatim:
   - Patient Profile · Medication Module · Appointment Module · Family Calendar · Daily Check-ins · Doctor Visit Summary
   - Concierge · Notifications · Emergency Events · Audit History · Medical Records · Uploaded Documents
   - Insurance
2. → **"Retrieve Latest Information (Connects to Doctor visit transcription & Summary Workflow)"**. In the source, "Doctor visit transcription & Summary" is bold.
3. → **"Validate Retrieved Data"**, verbatim:
   - Timestamp
   - Latest Version
   - Source System
   - Human Verified
   - AI Generated
   - Pending Review
   - Data Completeness
4. → **"Data Available?"**
   - **No** → **"Display Information Unavailable"**, bullets "Retry Retrieval" and "Retry Successful?":
     - **Yes** → back to Retrieve Latest Information
     - **No** → **"Offer Offshore VA"** → **"Family Member Offshore VA Accepted?"**
       - **No** → **End**
       - **Yes** → **"InitiateOffshore VA(connects to Offshore VA workflow)"** → close-out (Z) → End
   - **Yes** → continue to F.

### F. Permission and sensitivity
1. **"Permission Check"** → **"Sensitive Information?"**
   - **Yes** → **"Verify Additional Permission"** → **"Additional Permission Granted?"**
     - **NO** → **"Hide Restricted Information"**, with sub-lines "Display Privacy Message" and "Continue With Available Data":
       - **Yes** (continue) → Apply AI Guardrails
       - **No** → close-out (Z) → End
     - The Yes branch is not drawn.
   - **NO** → continue to G.

### G. Guardrails and response
1. **"Apply AI Guardrails"**, verbatim:
   - No Diagnosis
   - No Prescription
   - No Treatment Recommendation
   - No Lab Interpretation
   - Informational Coordination Only
2. → **"Generate Personalized Response"** → **"Present Response"**, verbatim:
   - Current Status
   - Medication Summary
   - Upcoming Appointments
   - Missed Activities
   - Doctor Visit Summary
   - Insurance Information
   - Outstanding Tasks
   - Recommended Next Actions
3. → a second **"Generate Personalized Response"** node that behaves as a decision (action needed?):
   - **No** → **"Display AI Response"** → close-out (Z) → End
   - **Yes** → continue to H.

### H. Action workflows
1. **"Determine Required Workflow"**, verbatim:
   - Appointment
   - Family Calendar
   - Medication Reminder
   - Medication Refill
   - Insurance Review
   - Upload Document
   - Daily Check-in
   - Talk to Someone
   - Concierge
   - Notify Family
   - Emergency
2. → **"Execute Selected Workflow"** → **"Workflow Successful?"**
   - **Yes** → **"Display Success Message"** → close-out (Z) → End
   - **No** → **"Need Human Escalation?"** (lime)
     - **No** → **"Display Failure Message"** → **"Retry Later"** → close-out (Z) → End
     - **Yes** → **"Generate AI Summary"** → **"Route Case"**, with targets verbatim: Offshore VA · INS Care Specialist · Clinical Team · Provider
       - → **"Emergency Detected Trigger Offshore VA workflow"** (lime) → close-out (Z) → End

### Z. Close-out (repeated on every terminal path)
**"Conversation Complete"** → **"Log Conversation"** → **"Update Audit Trail"** → **"Store Conversation Metadata"** → **"End"** (yellow ellipse).

---

## States / statuses
Enum identifiers are [inferred]; quoted labels are source.
- Auth: `authenticated | auth_error | mfa_pending`
- Parent link: `linked | none | access_requested`
- Authorization: `granted | denied | pending_owner_approval | expired`. "Temporary Access" and "Permission Expiration" are both attributes.
- Intent confidence: `acceptable | low → clarify | low → offer VA`
- Data record provenance flags: `human_verified | ai_generated | pending_review`, plus `timestamp`, `latest_version`, `source_system`, `completeness`
- Workflow execution: `success | failure → retry_later | failure → escalated`
- Escalation route: `offshore_va | ins_care_specialist | clinical_team | provider`

## Data entities and fields
- **User (family member):** credentials, MFA, profile.
- **Parent link / Access grant:**
  - relationship, HIPAA consent, patient consent, family sharing permission
  - access role, temporary access flag, permission expiration
  - owner/admin approver
- **Access request:** requester, parent, status, notified owner.
- **Conversation:**
  - messages (text/voice), detected intent, confidence, AI summary
  - metadata; logged + audit trail
- **Data source modules:** Patient Profile, Medication, Appointment, Family Calendar, Daily Check-ins, Doctor Visit Summary, Concierge, Notifications, Emergency Events, Audit History, Medical Records, Uploaded Documents, Insurance.
- **Escalation case:** AI summary, route target.

## Notifications
- "Notify Parent Owner/Admin" (access request)
- "Notify User Request Sent"
- "Notify Record Owner/Admin" (additional access)
- "Notify User" (permission denied)
- Privacy message
- Success/failure messages
- Escalation routing to humans

## [inferred] UI for the demo
- **Login** with MFA, plus Forgot password / Contact support.
- **Parent picker**, or an empty state "No parent linked" with a "Request access" CTA.
- **Access denied** screen that explains the restriction and offers "Request additional access".
- **Chat screen:**
  - text input plus mic button
  - suggested intent chips taken from the intent list
  - AI answers rendered as cards (Current Status, Medication Summary, Upcoming Appointments, Missed Activities, Doctor Visit Summary, Insurance Information, Outstanding Tasks, Recommended Next Actions)
  - provenance badges ("AI Generated", "Human Verified", "Pending Review", source, timestamp)
  - a guardrail disclaimer ("Informational coordination only — no diagnosis, prescription, treatment or lab interpretation")
  - a privacy banner when info is hidden
  - action buttons that launch workflows (Book appointment, Request refill, Upload document, Talk to someone, etc.)
  - an "Offer Offshore VA" handoff card
  - an escalation confirmation

## Style cues (the diagram tool's palette, not a brand palette)
- Canvas grey `#F0F1F3`-ish.
- Title banner mint `#97EDCA`.
- Step boxes light blue `#C6EDFC` with thin magenta borders.
- Key decision / success / escalation nodes lime `#BDE87C`.
- Start pink `#FDB6E2`.
- End yellow `#EFDD4D`.
- Font Inter-like sans.
- Brand strings: "InstaCare24 Mobile App / Web Portal", "Family AI Assistant".

## Cross-references (external workflows, not specced here)
- "Doctor visit transcription & Summary Workflow" (data retrieval step)
- "Offshore VA workflow" (VA handoff and emergency)
- The Route Case targets overlap with the HITL doc's tiers.

## Ambiguities / open questions
- **"Intent Confidence Acceptable?" has two NO exits.** One goes to clarify and reprocess; the other goes to Offer Offshore VA. Presumably it offers the VA after failed clarification attempts, but no retry count is given.
- **"Additional Permission Granted?" Yes branch** is not drawn. Presumably it goes to Apply AI Guardrails with the full data.
- **"Hide Restricted Information" Yes/No labels.** It is unclear whether the user chooses to continue with the available data.
- **Second "Generate Personalized Response" node.** It acts as an "action required?" decision but carries the same label as the first one.
- **"Emergency Detected Trigger Offshore VA workflow"** is reached from every Route Case target. It is unclear whether every human escalation counts as an emergency; it conflicts with the HITL doc, where Critical goes to the AI Emergency Framework / 911.
- **"INS Care Specialist".** INS probably means insurance; not defined.
- **"Request Parent Access" after "Retry Request? → Yes"** goes straight to End, with no re-submission check.
- **Offshore VA only.** The US-specialist tier is not mentioned; only Offshore VA is offered.
