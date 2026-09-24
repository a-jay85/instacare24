# Source spec: HITL (Human in the loop) workflow

Source: `relatestworkflowforreview/Instacare24 - ElderLink Workflow - HITL.pdf`. The PDF is a single A4-landscape page containing one raster image (8192x7414) of a whiteboard.

**What the PDF is:** flowcharts only, with no wireframes. Node labels are quoted verbatim and keep the source typos. Anything marked **[inferred]** is my interpretation.

The canvas has two frames:
- **Left:** big title **"Human in the loop workflow"**, a risk-scored escalation tree, and a Legend.
- **Right:** "Emergency Detection Rules" leading to the emergency workflow and conversation close-out.

---

## Purpose
- After the AI check-in collects the patient's responses, score health risk.
- Escalate to the right human tier based on the score:
  - Offshore VA for medium risk
  - US-based specialist for high risk
  - AI Emergency Framework / 911 for critical risk
- Pull the relevant clinical and insurance context and notify the physician and family.
- Write everything back to patient history, with an audit trail.

## Actors / roles
- **AI**. Collects the response, runs the risk assessment, and runs the "AI Emergency Framework".
- **Caregiver**. Receives the "Caregiver Escalation Alert".
- **VA (offshore / outsourced)**. Medium risk; note-taking workflow.
- **VA (USA) / US based specialist**. High risk (the Onboarding doc names this role "RN or LCSW").
- **Primary Physician**. Notified; their response is a decision point.
- **Family Member**. Notified.
- **911 / EMS**. Critical risk.
- **Concierge**. Notified "(If Applicable)".

---

## Legend (verbatim; this is the scoring spec)
| Tier | Score | Action (verbatim) |
|---|---|---|
| **Green** | 0–30 | "Green- No Risk (0-30) score Daily checkin Monitoring parameters" |
| **Medium** | 31–60 | "Medium Risk - Talk to VA(Outsourse)(31-60) score VA note taking workflow" |
| **High** | 61–90 | "High Risk - Talk VA(USA) (61-90) score, walk in at Urgent care" |
| **Critical** | 91–100 | "Critical Risk- Emergency(call 911)(91-100) score Emergency" |

Risk score range: 0–100 (integer type [inferred]).

## Left frame: escalation tree (in order)
1. **"AI collects response"** → **"AI Health/risk assessment"** → **"Caregiver Escalation Alert"** (light blue).
2. → **"Human(VA) Escalation Initiation"** (large lime-green box).
3. → Diamond **"risk score"**, which has three branches. Green is not drawn.
   - **"Medium Risk" / "route to triage list"** (pale yellow)
     - → **"Route to VA(offshore)" / "Notetaking workflows"**
     - → (long edge) **"update Patient History/ DB"**
     - Thin two-way edges connect this box with the High-risk route box (hand-off / escalate between tiers).
   - **"High Risk" / "route to triage list"** (orange)
     - → **"Route to US based specialist" / "Notetaking workflows"**
     - → **"Full name, DOB, Insurance Info (eligibility,coverage,prior auth status) access from patient's Data Base"** (light blue)
     - → **"Doctor Visit Summary/Clinical Data (EOB,meds,allergies) (eligibility,coverage,prior auth status)"** (light blue)
     - → **"Pull Doctor Summary" / "Insurance Eligibility"** (orange)
     - → **"Notify Primary Physician"** (orange) → **"Notify Family Member"** (orange)
     - → Diamond **"Physician Response"**:
       - one edge → the critical path's "Pull Patient History…" (escalate to emergency)
       - one edge down → **"update Patient History/ DB"**
   - **"Critical Risk" / "Escalation"** (salmon)
     - → **"AI Emergency Framework"** (salmon; two-way thin edges with the US-specialist route box)
     - → **"Pull Patient History: Allergies, Meds, Insurance/ER Info"**
     - → **"Call 911/EMS"**
     - → **"Simultaneously Notify Primary Physician + Family Member"**
     - → **"Generate Incident Report"**
     - → **"update Patient History/ DB"**
4. All three branches end in **"update Patient History/ DB"** (wide light-blue bar).

## Right frame: emergency detection and close-out
1. **"Emergency Detection Rules"** (grey panel). Trigger list, verbatim:
   - Patient Reports Emergency
   - Family Reports Emergency
   - Missed Daily Check-in
   - No Response During AI Conversation
   - Sudden Silence
   - High-Risk Keywords
   - Abnormal Behavioral Pattern
2. → **"Trigger US Based Specialist/ Emergency Workflow"** (lime).
3. → Notify panel (grey), verbatim:
   - Notify Family
   - Notify Offshore VA
   - Notify Concierge (If Applicable)
4. → **"Conversation Complete"** → **"Log Conversation"** → **"Update Audit Trail"** → **"Store Conversation Metadata (No PHI Used for AI Training)"** → **"End"** (yellow ellipse).

---

## States / statuses
Enum identifiers are [inferred]; quoted labels are source.
- Risk tier: `green | medium | high | critical` (score 0–100)
- Routing target:
  - `monitoring` (green)
  - `triage_list → offshore_va` (medium)
  - `triage_list → us_specialist` (high)
  - `emergency_framework → 911` (critical)
- **[inferred]** Escalation case lifecycle: `open → assigned (VA/specialist) → physician_notified → family_notified → (physician responded | escalated_to_emergency) → resolved/logged`
- **[inferred]** Emergency trigger type: one of the 7 detection rules
- Conversation: `in_progress → complete → logged → audited → metadata_stored`

## Data entities and fields
- **Check-in response** (AI-collected), plus a risk assessment with its score and tier.
- **Escalation / triage item:** tier, route (offshore VA / US specialist / emergency), note-taking notes, timestamps.
- **Patient core:**
  - Full name, DOB
  - Insurance info: eligibility, coverage, prior auth status
- **Clinical data:** Doctor Visit Summary, EOB, meds, allergies, ER info.
- **Incident report** (critical path).
- **Patient History / DB record** (written on every path).
- **Audit trail entry.**
- **Conversation metadata.** Explicitly "No PHI Used for AI Training".

## Notifications
- Caregiver Escalation Alert (always, at the start of escalation)
- Notify Primary Physician (high)
- Notify Family Member (high)
- Simultaneously Notify Primary Physician + Family Member (critical)
- Call 911/EMS (critical)
- Notify Family / Notify Offshore VA / Notify Concierge (If Applicable) (emergency-rules path)

**[inferred] UI for the demo:**
- A VA/specialist triage queue sorted by risk score, with color-coded tier badges.
- A case detail panel showing patient core info, insurance, clinical summary, notes, and "Notify physician" / "Notify family" / "Escalate to 911" actions.
- An incident report view.
- An audit log.
- A family-facing alert banner.

## Style cues (the diagram tool's palette, not a brand palette)
- Sticky-note rectangles; decisions are diamonds.
- Sampled fills:
  - Light blue `#B1E4F7` (AI/data steps)
  - Lime `#BDE87C` (human-escalation initiation, emergency trigger)
  - Medium pale yellow `#FEF8C8`
  - High orange `#FBD779`
  - Critical salmon `#FFB8B2`
  - Physician Response diamond `#FCE4A6`
  - End ellipse yellow
- These map naturally to risk-badge colors: green / yellow / orange / red.

## Ambiguities / open questions
- **No Green branch.** The "risk score" diamond has no Green (0–30) branch even though the Legend defines one. Presumably Green means no escalation and continued daily monitoring.
- **Physician Response.** The diamond's branches are unlabeled; it is unclear what it branches on (responded vs. not? advises ER?).
- **Frames not linked.** The right frame (Emergency Detection Rules) has no drawn link to the left tree. It may be the Critical-path detail or a parallel trigger source.
- **Two-way edges.** Their meaning between Offshore VA ↔ US specialist ↔ AI Emergency Framework is unclear (tier up/down-grade?).
- **High-tier wording.** "High Risk - Talk VA(USA)… walk in at Urgent care" is ambiguous: is it a recommendation to the patient or a routing action?
- **"Caregiver Escalation Alert".** It fires before tiering, so it is unclear whether caregivers get an alert even at Medium.
- **Cross-ref.** Medium maps to Onboarding "Option 2: Offshore Virtual Assistant"; High maps to "Option 3: HITL Operations / US based Specialist" ("RN or LCSW" per the Onboarding doc).
