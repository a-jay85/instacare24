<!-- Source: "InstaCare24 v1 Scope.pdf" (11 pages). Converted verbatim to markdown. -->

INSTACARE24 · VERSION 1 SCOPE · 25 AUGUST 2026

# One call out, one update back

The product is a reliable daily human touchpoint in front of the parent and an honest daily update in front of her adult child. Everything in this document exists to make that loop work at a cost that supports $69 a month. Scoped to the standard in InstaCare24_PRD_Best_Practices.

---

## The loop

*If this runs every day without failing, the company works*

| # | Step | Description |
|---|------|-------------|
| 01 | **Reach out** | A VA contacts the parent inside a window her family chose. |
| 02 | **Or fail to** | She does not answer. This branch matters more than the other one. |
| 03 | **Log the outcome** | Reached, not reached, or reached and something is off. |
| 04 | **Tell the family** | A short summary in their feed within thirty minutes. |
| 05 | **Escalate if needed** | A person picks it up, and it never closes itself. |

## Who this is for

*The buyer, the user, and the authorized agent are three different people*

### BUYER · PAYS — The adult child

Mid-forties to sixty, working, often out of state. Buying the end of a low background hum of worry. Churns the month she stops feeling informed, not the month the service gets worse.

### SUBJECT · DAILY USER — The parent

Mid-seventies to late eighties, living alone. Did not choose this product and may not want it. Her cooperation is the single largest delivery risk in the business.

### AUTHORIZED AGENT · LEGAL — The POA or healthcare proxy

Often the buyer. Often not. Sometimes a different sibling, sometimes an attorney. Holds the right to decide what is shared and who may act, which is not the same right as paying the bill.

### INTERNAL · DELIVERS — The check-in VA

Offshore, handling a roster of parents. Everything about the console is built to make her sound like she knows this family, because she does not start out knowing them.

### INTERNAL · ESCALATES — The US Care Specialist

Picks up what the VA cannot hold: escalations, hard conversations, post-discharge weeks, Concierge families.

### INTERNAL · ON CALL — The clinical reviewer

RN or LCSW, rarely in the product. Needs a read-only view and a hard stop that keeps advice with licensed providers.

---

## In scope for v1

*Ten epics. P0 carries acceptance criteria; P1 and P2 are named, not specified.*

### AUT — Consent and authorization

*Built first, because nothing else may run without it*

#### AUT-001 · P0 · Authorized agent

Store the authorized agent separately from the paying account holder, with different permissions.

> **GIVEN** an account where the payer is not the POA, **WHEN** onboarding completes, **THEN** both identities are stored with distinct permission sets, and the payer alone cannot change care instructions.

#### AUT-002 · P0 · Parent

Capture the parent's own consent to be contacted, separately from her family's consent on her behalf.

> **GIVEN** a new parent profile, **WHEN** the family finishes setup, **THEN** no check-in can be scheduled until the parent has consented on a recorded call, and the profile shows an unambiguous consent state.

#### AUT-003 · P0 · Parent

Let the parent withdraw consent at any time, through the VA, without going through her family.

> **GIVEN** an active parent, **WHEN** she tells the VA she wants the calls to stop, **THEN** check-ins stop within 24 hours and the family is notified that consent was withdrawn, without the reason.

#### AUT-004 · P1 · Authorized agent

Several family members with read access, exactly one agent with write access.

#### AUT-005 · P2 · Parent

Capacity flag. When the parent's ability to consent is in doubt, route to a Care Specialist instead of proceeding.

### CHN — Parent channel

*The largest open decision in the product*

#### CHN-001 · P0 · Parent · BLOCKED

Reach the parent on something she already uses, with no new device and no app install.

> **BLOCKED** pending the channel decision: voice call, SMS, a smartphone app, or a dedicated device in the home. Every estimate in the build plan assumes this is answered before work starts.

#### CHN-002 · P0 · Parent

Deliver a check-in with no setup action required from the parent.

> **GIVEN** a consented parent who has touched nothing, **WHEN** her first check-in is due, **THEN** it reaches her without her having installed, configured or logged into anything.

#### CHN-003 · P1 · Parent

Fall back to a second channel after the first fails twice.

### ONB — Onboarding and profile

*Fifteen minutes is a requirement, not an aspiration*

#### ONB-001 · P0 · Adult child

Complete setup unaided in fifteen minutes.

> **GIVEN** a new subscriber with no help, **WHEN** she completes onboarding, **THEN** median time from sign-up to first scheduled check-in is under 15 minutes across the last 20 sign-ups.

#### ONB-002 · P0 · Adult child

Collect only what the loop needs: parent name, contact, timezone, check-in window, one emergency contact, and what a normal day looks like for her.

> **GIVEN** the onboarding flow, **WHEN** a field is proposed for addition, **THEN** it must be consumed by the check-in, the feed or an escalation, or it does not ship.

#### ONB-003 · P1 · Adult child

Resume a partly finished onboarding on another device.

#### ONB-004 · P2 · Authorized agent

Invite a sibling to the account.

### CHK — Daily check-in

*This is the product*

#### CHK-001 · P0 · VA

Deliver the check-in inside the window the family set.

> **GIVEN** a parent with a 09:00 to 11:00 window, **WHEN** the day starts, **THEN** the check-in completes inside that window at least 92% of the time, measured weekly across all parents.

#### CHK-002 · P0 · VA

Record the outcome as one of three structured states: reached, not reached, or reached and something is off.

> **GIVEN** a completed call, **WHEN** the VA logs it, **THEN** exactly one state is recorded, and "something is off" always creates an escalation.

#### CHK-003 · P0 · Adult child

Turn the call into a summary the family can read.

> **GIVEN** a logged call, **WHEN** 30 minutes have passed, **THEN** a plain-language summary is in the family's feed.

#### CHK-004 · P0 · Parent

Handle no-answer as a first-class outcome, not an error.

> **GIVEN** an unanswered attempt, **WHEN** the configured retries are exhausted, **THEN** an escalation opens automatically and the family is told before they notice on their own.

#### CHK-005 · P1 · VA

Show the VA the last three check-ins before she dials.

#### CHK-006 · P2 · VA

Route a parent to the same VA where rostering allows.

### FEED — Family feed

*The screen retention is decided on*

#### FEED-001 · P0 · Adult child

Answer "is my mother alright today" above the fold, without scrolling or interpreting.

> **GIVEN** the feed on a phone, **WHEN** it opens, **THEN** today's state is legible without scrolling, and five of five test users state it correctly within three seconds.

#### FEED-002 · P0 · Adult child

Never let an unchecked day look like a normal day.

> **GIVEN** a day with no completed check-in, **WHEN** the family opens the feed, **THEN** that day reads explicitly as not checked, never as empty and never as fine.

#### FEED-003 · P1 · Adult child

Notify on the outcome, in the family's timezone.

#### FEED-004 · P2 · Adult child

Reply to a summary, visible to the VA before the next call.

### ESC — Escalation

*What the family believes they are buying*

#### ESC-001 · P0 · Adult child

One always-visible route to a human being.

> **GIVEN** any screen, **WHEN** the family taps "Talk to someone", **THEN** a Care Specialist acknowledges within 15 minutes at the 90th percentile during staffed hours.

#### ESC-002 · P0 · Care Specialist

No escalation may age out silently.

> **GIVEN** an open escalation, **WHEN** two hours pass, **THEN** it is either resolved or carries a named owner and a recorded next action. There is no third state.

#### ESC-003 · P1 · Adult child

Let the family see that an escalation is open and who has it.

#### ESC-004 · P2 · Clinical reviewer

Route clinical questions to the on-call reviewer with a read-only view and an explicit non-advice boundary.

### OPS — Staff console

*Where the unit economics actually live*

#### OPS-001 · P0 · VA

A daily queue of check-ins due, ordered by closing window.

> **GIVEN** a VA starting a shift, **WHEN** she opens the console, **THEN** she sees her calls in the order they will expire, with no sorting or filtering required.

#### OPS-002 · P0 · VA

Log a call outcome in under a minute.

> **GIVEN** a finished call, **WHEN** the VA logs it, **THEN** median logging time is under 60 seconds measured across a full shift. Above that, cost to serve breaks the Premium margin.

#### OPS-003 · P0 · Care Specialist

An escalation queue showing owner, age and next action.

> **GIVEN** the escalation queue, **WHEN** any item exceeds its acknowledgement target, **THEN** it is visually distinct and sorts to the top.

#### OPS-004 · P1 · VA

Hand a family from VA to Care Specialist without losing context.

#### OPS-005 · P2 · Internal

Rostering and shift coverage.

### MED — Medications, minimal

*A list and a prompt. Not a record.*

#### MED-001 · P0 · Parent

Hold a medication list with schedules, and deliver a reminder on the parent channel.

> **GIVEN** a scheduled medication, **WHEN** its time arrives in the parent's local timezone, **THEN** a reminder is delivered on the same channel as the check-in.

#### MED-002 · P0 · Parent

Support medications with no fixed schedule.

> **GIVEN** an as-needed medication, **WHEN** it is added, **THEN** it is stored and shown with no reminder time, and it can never produce a missed-dose state.

#### MED-003 · P1 · Adult child

Show in the feed whether a reminder was acknowledged. Deliberately not an adherence history.

### NTF — Notifications

*The layer no plan ever budgets for*

#### NTF-001 · P0 · Adult child

Respect quiet hours in the family's timezone, not the parent's.

> **GIVEN** a family three timezones from the parent, **WHEN** a routine notification falls inside their quiet hours, **THEN** it is held until the window opens.

#### NTF-002 · P0 · Adult child

Never hold a safety notification for quiet hours.

> **GIVEN** an escalation, **WHEN** it opens at any hour, **THEN** it is delivered immediately regardless of quiet-hour settings.

#### NTF-003 · P1 · Adult child

Per-family channel preferences.

### BIL — Subscription

*One tier at launch*

#### BIL-001 · P0 · Adult child

One monthly tier, card on file, cancel without contacting anyone.

> **GIVEN** an active subscriber, **WHEN** she cancels in the app, **THEN** it completes without a call, a chat or a retention gate.

#### BIL-002 · P0 · Authorized agent

Offboard on death without an automated indignity.

> **GIVEN** a reported death, **WHEN** it is recorded, **THEN** billing stops that day, every notification and check-in stops immediately, and the account routes to a Care Specialist. No automated message is ever sent to that family again.

#### BIL-003 · P1 · Adult child

Pause instead of cancel. In this population a pause is usually a hospital stay, and understanding which is which is worth real retention.

---

## Configurable values

*Defined, or explicitly blocked*

| Value | Who sets it | Allowed | Default |
|-------|-------------|---------|---------|
| Check-in window | Family, at onboarding | Any 2-hour window, 07:00 to 19:00 parent-local | `09:00–11:00` |
| No-answer retries | Ops | 1 to 3 | `2` |
| Gap between retries | Ops | 10 to 60 minutes | `20 min` |
| Family quiet hours | Family | Any 8-hour window, family-local | `21:00–07:00` |
| Summary delivery | System | Within 30 minutes of logging | `30 min` |
| **Parent channel** *(blocked)* | **Blocked** | **Voice, SMS, app, or in-home device. Not decided.** | **None** |
| **Escalation acknowledgement SLA** *(blocked)* | **Blocked** | **Depends on staffing model and coverage hours** | **None** |
| **Permanent consent withdrawal** *(blocked)* | **Blocked** | **Whether a parent can end the service her family pays for** | **None** |

## Edge cases

*Written down, not left to the happy path*

- **Consent is two consents.** The family agreeing to monitor and the parent agreeing to be monitored are different events with different holders. Model them separately or the product is doing something to someone.
- **Two siblings, one profile.** Simultaneous edits, and worse, disagreement. One holds write access, and the product should make that visible rather than let the last save win.
- **Medications with no schedule.** As-needed doses must never generate a missed-dose state.
- **Split timezones.** Check-ins and reminders run parent-local. Notifications and quiet hours run family-local. Getting this backwards wakes people at 4am.
- **Capacity in question.** A parent with cognitive decline may not be able to consent. That path goes to a human, never to a checkbox.
- **The parent refuses.** Repeated hang-ups are a product outcome, not a failure state. The family needs to be told honestly, and there needs to be a plan that is not "keep calling".
- **The VA leaves.** The proposal expects 20% annual VA churn. A family who has trusted one voice for eight months meets a stranger. The handoff is a designed moment or it is a cancellation.
- **The parent dies.** The most likely way this subscription ends. Every automated message after that point is a wound. Build the exit before the entrance.

## Metrics

*Every one carries a number*

| Metric | Target | Why this one |
|--------|--------|--------------|
| Check-ins completed inside window | **≥ 92% weekly** | The check-in is the product. Below this, families are paying for an intention. |
| No-answer events resolved to a known state within 2 hours | **100%** | The only number here that cannot be a percentage below one hundred. |
| Escalation acknowledgement, p90, staffed hours | **≤ 15 min** | What the family thinks they are buying. |
| Feed opens per family per week, month 1 | **≥ 4** | Earliest reliable churn predictor in consumer health. |
| Day-30 retention | **≥ 85%** | Catches a bad onboarding before it costs a year of CAC. |
| Annual retention | **≥ 50%, stretch 70%** | From the proposal. The make-or-break number in the model. |

<!-- End of source PDF. The PDF ends at page 11 mid-way through the Metrics table (rendered page is visually clipped after "make-or-break number in the"; the text layer completes it as "model."). The source contains no "Open questions" or "Non-goals" sections. -->
