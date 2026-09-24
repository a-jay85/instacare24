# Source spec: Onboarding workflow

Source: `relatestworkflowforreview/Instacare24 - ElderLink Workflow - Onboarding.pdf`. The PDF is a single A4-landscape page containing one raster image (8192x5463) of a FigJam/Miro-style whiteboard.

**What the PDF is:** flowcharts only, with no wireframes. Node labels are quoted verbatim and keep the source typos. Anything marked **[inferred]** is my interpretation for building screens; the diagram does not state it.

The canvas has 6 regions:
1. **Top: app entry and tier routing**
2. **Onboarding (big title "On boarding")**: the registration steps
3. **Medication Reminder**
4. **Appointment Scheduling through App**
5. **Family/caregiver Calendar Sync**
6. **Left panel: "OAuth 2.0/OIDC Architecture"**, a data-integration diagram

A PRD link card and a Legend also appear.

---

## Purpose
- Get a new user (a family caregiver, or the patient themself) into the app.
- Register the elderly patient's details, credentials, insurance, doctor, prescriptions, pre-existing conditions and emergency contact.
- Route the user to the right service tier.
- Define core recurring features that start after registration: medication reminders with escalation, appointment scheduling with reminders, and a shared family calendar with consent.

## Actors / roles
- **User**. "User Opens App". This is the family member or caregiver doing onboarding.
- **Authorized family member / caregiver**. May care for more than one elderly patient (see the sticky note).
- **Patient**. The elderly parent. Can self-onboard (the "by patient" variant), acknowledges reminders, and "can call 911".
- **Caregiver (family or external)**. Verifies medication schedules.
- **AI / AI assistant / AI app**. Covers voice or chat onboarding, the calendar build, field extraction and follow-up questions.
- **VA**. Virtual Assistant; "Offshore Virtual Assistant" in Option 2. Makes calls to find the reason for missed meds and handles calendar-access requests.
- **HITL – US based Specialist (RN or LCSW)**. Handles emergency transfer (Option 3).
- **Primary Care Physician**. Notified in emergencies.
- **Pharmacy**. Receives refills and new prescriptions.
- **Doctor/specialist**. Selected when booking an appointment.
- **"DD"**. Confirms schedules. Undefined in the source; do not expand it.

---

## 1. Top flow: entry and tier routing
Nodes in order:
1. **"User Opens App"** (salmon ellipse), then **"Onboarding"** (grey rounded box).
2. Onboarding leads to a decision diamond (yellow) labeled **"Is Onboard ing Paused?"** (the line break is in the source).
   - **YES** → **"Auto-Save Progress & Exit"**.
   - **NO** → **"Active Caregiver Dashboard"**.
3. Active Caregiver Dashboard → decision diamond (yellow) labeled **"Feature Type / Tier? or User Request?"**.
   - Upper edge → **"Option 1: AI Engine Core (Med Reminders / Calendar Sync)"**. An edge from Option 1 also loops back up into Active Caregiver Dashboard.
   - Lower edge → **"HITL"** (purple border). HITL branches to:
     - **"Option 2: Offshore Virtual Assistant (Daily check ins, Paper work, Vendor coordination)"**
     - **"Option 3: HITL Operations" / "US based Specialist" / "(Escalations / Post-Discharge / Daily Calls)"**. This is 3 lines, with "US based Specialist" in large bold.
4. A separate vertical edge from "Onboarding" drops down into the Onboarding section, starting at "HIPAA Compliance".

**[inferred] UI:**
- A caregiver dashboard that shows the active plan tier:
  - Tier 1: AI Core (med reminders and calendar sync)
  - Tier 2: Offshore VA (daily check-ins, paperwork, vendor coordination)
  - Tier 3: US-based specialist (escalations, post-discharge, daily calls)
- A "Resume onboarding" state, because progress auto-saves on pause.

## 2. Onboarding / registration
Flow:
1. **"HIPAA Compliance"** (purple-bordered box) is the entry gate. It leads to:
   - A Jira card **"IE-1: Self - Onboarding"** with status "TO DO", priority "Medium". This is metadata; its edge runs to the step column and is labeled **"Mandatory"**.
   - **"Conversational Onboarding (AI/ VA - Chat/ Calling)"** (circle).
2. Conversational Onboarding forks into two light-blue boxes:
   - **"Voice based step by step AI assistant"**
   - **"Step by step Chat guidance"**
3. Both feed **"Language translator"** (light-blue box), which then leads into the step column.
4. Edges into the step column carry the labels "Mandatory", "Yes" and "Yes".
5. A **"NO"** edge from "Step by step Chat guidance" leads to a separate box: **"\*\*Step 3: Upload patient's registration details(by patient)"**.

### Step column ("Section 2", assignee tag "k S, +2")
`**` = mandatory, per the Legend. The labels are verbatim.
1. **"\*\*Step 1: Enter or Upload patient's registration details"**
2. **"\*\*Step 2: Set up Username and Password"** (lime-green fill)
   - Its edge leads to **"Forgot Password"**, which opens the "Section 6" group: **"Forgot Password"**, **"Reset Password"**, **"Forgot Username"** (mint-green pills).
3. **"\*\*Step 3: Upload Insurance Plan(by the user)"**
4. **"\*\*Step 4: Enter or Upload doctor's information(by the user)"**
5. **"\*\*Step 5: Upload Prescriptions(by the user)"**
6. **"\*\*Step 6: Upload Pre existing Conditions)"** (mint fill; the stray ")" is in the source). It branches to:
   - **"AI will pull infomration from Doctor's portal"** (typo in source)
   - **"Upload Manually"**
7. Unnumbered and with no inbound edge: **"\*\* Emergency contact information"** with fields **"Name, Phone number, Email"** (cream box). It leads to a diamond, **"Registered Successfully"** (pale lime, purple border).

Pink sticky note (verbatim): **"Authorized family member providing care for more than one elderly patient. If a caregiver registers multiple patients, the option should be a dropdown to view their records."**

**[inferred] screens:**
- Onboarding mode picker: Voice AI assistant, Chat guidance, or Call a VA, plus a language selector.
- A 6-step wizard with a progress indicator, followed by an Emergency Contact step and a "Registered Successfully" confirmation.
- Each step offers "Enter" (a form) or "Upload" (document or photo).
- Step 6 offers "Pull from doctor's portal" or "Upload manually".
- Login screen with "Forgot Password", "Reset Password" and "Forgot Username" links.
- A patient switcher dropdown in the header whenever a caregiver has more than one patient.

**[inferred] data fields** (only the Emergency contact fields are explicit):
- Patient registration details (name, DOB, address, etc.)
- Username and password
- Insurance plan (document)
- Doctor info (name, practice, contact)
- Prescriptions (document or list)
- Pre-existing conditions
- Emergency contact: Name, Phone number, Email *(explicit)*

## 3. Medication Reminder
1. **"Medication Reminder"** (circle) branches two ways.
2. **Reminder branch:**
   1. Diamond **"HIPAA Compliant"** (purple) → **"AI should create a calendar for medication reminders(AM/PM)"**.
   2. → **"Verify the schedules by caregiver(family or external)"** / sub-text **"Need to be confirmed by DD"**.
   3. → Diamond **"Schedules are confirmed"** → **"Reminder sent for medication"**.
   4. → Diamond **"Patient has to Acknowl edge"** (light blue; the split word is in the source).
      - **NO** loops back to "Reminder sent for medication".
      - **YES** → **"Section 5"** status group.
   5. **"Section 5" status group** (light-blue panel with 3 pale-lime pills) = the medication event states: **"Medication taken"**, **"Missed Medication"**, **"Missed acknowledgement"**. From the group:
      - **YES** → **"Record the instance to patients history"**
      - **NO** → **"Remind Again if not acknowledged or missed medication"** → **"VA calls to find the reason"**, which splits:
        - **"Non-Emergency"**. Loops back up to "Remind Again…".
        - **"Emergency"** → **"Emergency - Transfer to HITL - US based Specialist(RN or LCSW)"**. That box leads to:
          - **"Record the instance to patients history"**
          - **"Call 911 and caregiver"** → **"Text message sent to Caregiver"**, and also → **"Primary Care Physician"**, which feeds back into "Record the instance to patients history".
3. **Refill branch:** **"Prescription refill reminder"** → **"Sent to Pharmacy"** (both yellow).
4. **Standalone path:** **"Patient can call 911"** → **"AI app is notified"** → "Record the instance to patients history" (purple boxes).

**Statuses** (enum identifiers are [inferred]; quoted labels are source):
- Medication event status: `taken | missed_medication | missed_acknowledgement`
- Schedule status: `pending_verification | confirmed`
- Escalation classification: `non_emergency | emergency`

**Notifications:**
- Medication reminder (AM/PM slots)
- Re-reminder
- VA phone call
- 911 call plus caregiver call
- SMS to caregiver ("Text message sent to Caregiver")
- PCP notification
- Refill sent to pharmacy

## 4. Appointment Scheduling through App (labeled "Mandatory")
1. **"Appointment Scheduling through App"** (light-blue circle) → **"User Selects Annual or sick or follow up appointment"**. Drawn edges from it go to:
   - **"Annual or follow up appointment"**
   - **"Sick Visit"** (pink)
   - **"Calendar opens"** (direct)
   - Whether Annual/Sick each lead on to "Calendar opens" is **[inferred]**.
2. As drawn, this is a straight chain: **"Calendar opens"** → **"AI Extracts Appointment Fields"** → **"Select Doctor/ specialist"** → **"Select date and time"**. "Select date and time" branches to:
   - **"Sick visit under 24 hrs confirmation"** (pink)
   - **"Annual or follow up visit confirmation"** (light blue)
3. Side check off "AI Extracts Appointment Fields": diamond **"Are required details complete"**.
   - **No** → **"AI asks follow up question"** → **"User Provides missing details"** → (dashed, hand-drawn edge) → **"Check duplicate or conflict"**.
   - The **Yes** branch is not drawn. **[inferred]** Yes continues the main chain to Select Doctor.
4. Both confirmations → **"Send Reminders 1 day before, 4 hrs before and 1 hr before."**
5. → **"Outcome of the appointment"** (yellow) → **"Patient's medical history"** and **"Any new prescription to send to Pharmacy"**.

A hand-drawn circle and "?" mark sit around "Check duplicate or conflict". This is a reviewer annotation and means the step is unresolved.

**Statuses** (enum identifiers are [inferred]; quoted labels are source):
- Appointment type: `annual | follow_up | sick`
- Confirmation SLA: sick = under 24h
- Reminders at T-24h, T-4h, T-1h

**[inferred] Appointment entity:** type, doctor/specialist, datetime, status (requested/confirmed/completed/rescheduled/cancelled), outcome notes, new prescriptions.

## 5. Family/caregiver Calendar Sync
1. **"Family/caregiver Calendar Sync"** (lavender circle) → **"HIPAA ???"** (cream note; the question marks are in the source) → **"Open App Calendar"**.
2. → **"Select the family member/ caregiver to be added to the respective patient's calendar"**:
   - **YES** → diamond **"Access granted"** → **"Only show up the necessary appointments in the calendar"**. That box leads to:
     - **"appointment confirmation to the Email"**
     - **"appointment confirmation text"**
     - **"If the appointment is rescheduled or cancelled- it should reflect on the calendar"** (yellow). This box also feeds back into both confirmations.
   - **NO** → **"Access Denied"** → **"Get the consent from the patient and the primary family caregiver, both on the call simultaneously"** → sticky **"Integration part to the Patient"**.
3. Separate entry: **"Caregiver/family member requests calendar access"** (green) → **"call the VA and Request comes to AI app"** (yellow circle).
   - → diamond **"HIPAA"** → **"VA takes all the necessary and security questions before getting the consent from the patient"** → diamond **"Verified the new addition"**, which loops back to "Family/caregiver Calendar Sync".

**Rules:**
- Calendar sharing is minimum-necessary ("Only show up the necessary appointments").
- Adding a new member requires VA-verified, simultaneous consent from both the patient and the primary family caregiver.

**Notifications:** Email and text appointment confirmations; reschedules and cancellations sync to the calendar.

## 6. Left panel: "OAuth 2.0/OIDC Architecture" (verbatim)
1. **"Patient / Caregiver"** → **"ElderLink AI Care App"** → **"Validate User Identity & Consent"** → **"Secure Authentication & Authorization"** → **"OAuth 2.0 / SMART on FHIR"**. The flow then splits:
   - **"Doctor/EHR Portals (Epic, Cerner, AthenaHealth)"** → **"SMART on FHIR APIs"** → **"Retrieve FHIR Resources"** → **"Clinical Information"** → **"Document Reference Diagnostic Report Encounter"**
   - **"Insurance Portals (Aetna, BCBS, UHC)"** → **"CMS Patient Access APIs"** → **"Retrieve FHIR Resources"** → **"Insurance Information"** → **"Explanation of Benefits Coverage Patient"**
2. Both branches join into **"Data Normalization Layer"** → **"AI Care Coordination Engine"** → **"Personalized Care Insights, Reminders & Care Recommendations"**.
3. This is the only place the product is named **"ElderLink AI Care App"**.
4. Useful demo copy: the named integrations are Epic, Cerner, AthenaHealth, Aetna, BCBS, UHC and CMS.

---

## Notifications (consolidated)
- **Medication:**
  - medication reminder (AM/PM)
  - re-remind if not acknowledged or missed
  - VA phone call ("VA calls to find the reason")
- **Emergency:**
  - "Call 911 and caregiver"
  - "Text message sent to Caregiver" (SMS)
  - Primary Care Physician notified
  - "AI app is notified" when the patient calls 911
- **Pharmacy:**
  - prescription refill "Sent to Pharmacy"
  - "Any new prescription to send to Pharmacy" after an appointment
- **Appointments:** reminders 1 day, 4 hrs and 1 hr before.
- **Calendar:**
  - "appointment confirmation to the Email"
  - "appointment confirmation text"
  - reschedule/cancel reflected on the shared calendar
- **Access requests:** VA consent call for calendar-access requests.

## Legend (verbatim, cream box)
- "Mandatory - \*\*"
- "Yellow -" (no meaning given)
- "Orange -" (no meaning given)
- "Red - ERROR or EMERGENCY"
- "Green - SUCCESS or NO-ERRORS"
- "Blue - HIPAA"

## Style cues (these are the diagram tool's palette, not a brand palette)
- Font looks like Inter/sans. Boxes are rounded rectangles; decisions are diamonds; entry points are circles.
- Sampled fills:
  - Light blue `#B1E4F7` (HIPAA / AI steps)
  - Lime `#BDE87C` (success / Step 2)
  - Decision yellow `#EFDD4D`
  - Pale yellow `#F6E989` (pharmacy / outcomes)
  - Pink / error `#FED5D1` (Sick visit, Access Denied)
  - Salmon `#FFB8B2` (User Opens App)
  - Lavender `#E3BDFA` / `#ECD6FC` (PCP, calendar sync)
  - Cream `#FFF5DA` (emergency contact, legend)
  - Mint `#97EDCA` (forgot-password pills)
  - Neutral grey box `#F0F1F3`
  - Borders are mostly purple (approx `#8A4FC0`); teal (approx `#1F6F8B`) on the appointment boxes.
- Brand strings: "InstaCare24" (PRD card: "Product Requirement Document (PRD) Project: InstaCare24 (v1.0) 1. Project Information Parameter", linked from Confluence) and "ElderLink AI Care App".

## Source meta (not UI)
- Whiteboard section tags "Section 2/5/6/8"
- "Assignee: k S, +2"
- Jira "IE-1: Self - Onboarding / TO DO / Medium"
- A "Create action" tag
- Confluence PRD card titled "Project Requirements Document(PRD"

## Ambiguities / open questions
- **Unexplained edge labels.** The meaning of the "Mandatory" / "Yes" / "Yes" labels between Voice/Chat/Language translator and the step column is unclear. "NO" from Chat guidance leads to "Step 3 … (by patient)", which suggests a patient self-onboarding path with only a partial step set.
- **Emergency contact has no inbound edge.** Presumably it is step 7 before "Registered Successfully".
- **Step 2 edge.** Its edge to "Forgot Password" likely means "login recovery exists"; it is not a real sequence.
- **Option 1 loop.** The edge from Option 1 back to Active Caregiver Dashboard is unexplained, and so is how the Feature Type/Tier diamond decides (plan tier vs. per-request).
- **"DD".** Undefined ("Need to be confirmed by DD").
- **"HIPAA ???".** An unresolved compliance question on calendar sync.
- **Duplicate/conflict check.** Circled with a "?" (unresolved). Its outcome is not drawn.
- **Legend gaps.** Yellow and Orange have no meaning.
- **Tier naming.** HITL Option 2 (offshore VA) vs. Option 3 (US specialist) lines up with HITL-doc Medium vs. High risk routing.
