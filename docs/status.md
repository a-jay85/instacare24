# Prototype status, 25 September 2026

Live demo: https://a-jay85.github.io/instacare24/ (open `/demo` and follow the script).

This page has the detail behind the status email. It checks the prototype against
the v1 Scope (25 August) and the five ElderLink workflow diagrams (Onboarding,
Family AI Assistant, Human in the Loop, Insurance EOB, Doctor visit transcription).

1. [What changed since 2 September](#what-changed-since-2-september)
2. [Decisions we need](#decisions-we-need)
3. [Gaps against the v1 Scope](#gaps-against-the-v1-scope)
4. [Gaps against the ElderLink workflows](#gaps-against-the-elderlink-workflows)
5. [What needs a real backend](#what-needs-a-real-backend)
6. [Demo shortcuts, no decision needed](#demo-shortcuts-no-decision-needed)

## What changed since 2 September

On 2 September the prototype was the sign-up flow and the family's profile page,
with a placeholder feed.

| Area | 2 September | Now |
| --- | --- | --- |
| Family app | Sign-up, profile | Five tabs: Today, Care, Talk to someone, Ask, Profile |
| Today feed | Placeholder | Today's state at a glance, open escalations and who has them, unchecked days marked |
| Care | None | Medications (today only), doctor visit summaries, insurance letters explained |
| Ask | None | Scripted family assistant that answers from her record, refuses medical advice and hands off to a person |
| Profile | Consent, care instructions, quiet hours, cancel | Adds pause, report a death, invite family to read along, per-person notification channel |
| Staff console | None | VA call queue, call screen, 60-second logger, escalation queue, consent calls, visit summary review, roster, metrics |
| The loop | Not connected | End to end: a call logged in the console shows up in the family app |
| Investor story | None | `/vision` page: problem, loop, people, model, metrics, the ask |

## Decisions we need

Numbers 1 to 6 match the email. Each row lists what the prototype does today, so
nothing is stuck while we wait. A decision may still change screens.

### In the email

| # | Decision | Options | Prototype today |
| --- | --- | --- | --- |
| 1 | How do we reach the parent? (CHN-001, blocked in the Scope) | Voice call, SMS, smartphone app, in-home device | Voice call to the phone she already has. CHN-002 rules out anything she has to install or set up. |
| 2 | How fast must a person answer an escalation, and in which hours? (blocked in the Scope) | A number of minutes, plus staffed hours | 15 minutes, around the clock. This drives the overdue flag, the queue order and the response metric. |
| 3 | Can a parent end the service for good, and what happens to billing? (blocked in the Scope) | Withdrawal ends service and billing; service pauses until someone talks with the family; only she can restart it, on a recorded call | Calls stop, the family is told without the reason, billing keeps running, and a later recorded "yes" restarts calls |
| 4 | Is the daily check-in a person or an AI? | Person only (v1 Scope); AI with a person as fallback; person, with AI scoring the call | A person calls. An AI risk score sits next to the log as a helper and never decides anything. The HITL diagram assumes an AI conversation. |
| 5 | Are Ask, visit summaries and insurance help part of the $69 launch? | In the $69 launch; roadmap tier later; demo only | Live for the $69 family in the app. `/vision` puts visit summaries in a $39 roadmap tier, and Ask and insurance help in a $99 tier. |
| 6 | Who calls 911? | The VA on the call; the US Care Specialist; the family | The VA is prompted to call 911 first. In Ask the family is told to call 911 themselves. Onboarding names the US specialist, HITL names an "AI Emergency Framework" and the assistant diagram names the offshore VA. |

### Smaller ones

| Decision | Options | Prototype today |
| --- | --- | --- |
| Does the 15-minute sign-up clock stop at the end of sign-up, or after her consent call? | End of sign-up; after the consent call | End of sign-up. The first call waits on her yes. |
| Quiet hours: exactly 8 hours, or at least 8? The Scope's default is 10. | Exactly 8; at least 8 | At least 8 |
| When does a parent who keeps saying no go to a specialist? | Any threshold | 3 turn-downs in 7 days. We made this number up. |
| Should sign-up ask whether she can consent for herself? | Add a "not sure" answer; leave it to the consent call | Handled only on the consent call |
| Is a missed check-in routine or an emergency? | Routine escalation (Scope); emergency trigger (HITL diagram) | Routine escalation |
| Do we keep a medication history? | Today only (Scope); full dose log with missed doses escalated (Onboarding diagram) | Today only, no history, misses never escalate |
| Do we collect insurance, doctor, prescriptions and conditions at sign-up? | Keep them out (Scope); ask after sign-up; optional | Kept out. Side effect: there is no doctor on file to notify on a High risk call. |
| Do parents or doctors ever log in? | Family only (Scope); patient and provider portals (workflow diagrams) | Family only |
| Is prior authorization in scope? | Drop it; a separate flow before care; explain only | Explain letters and help appeal a denial |
| Who signs off visit summaries, and does High risk need a nurse or social worker? | Care Specialist; RN or LCSW | Care Specialist signs off. No clinician on High risk. |
| When Ask can't help, who takes over? | Offshore VA (assistant diagram); US Care Specialist | US Care Specialist, or the clinical reviewer for medical questions |
| Do we record the family's own consent separately from the parent's? | Yes, as its own step; no | Implied by finishing sign-up |

## Gaps against the v1 Scope

Most of the P0 loop is built. What remains is either partial, missing, or only
real with live calls, staff and measurement.

| ID | Requirement | Status | Gap |
| --- | --- | --- | --- |
| CHN-002 | Reach her with no setup | Needs backend | The dialler is simulated |
| CHN-003 | Fall back to a second channel | Missing | Waits on decision 1 |
| ONB-001 | Sign-up under 15 minutes | Partial | Flow exists; the median uses sample data |
| CHK-001 | Call inside the window, 92% weekly | Partial | Queue follows the window; can't be measured yet |
| CHK-003 | Summary within 30 minutes | Built | Appears at once instead of within 30 minutes |
| FEED-003 | Notify in the family's timezone | Partial | Timed correctly, never actually sent |
| ESC-001 | Talk to someone, 15 minutes p90 | Partial | Opens a real escalation; the response time needs staff and decision 2 |
| ESC-002 | No escalation ages out | Built | After 2 hours it gets an owner automatically but stays flagged overdue |
| OPS-002 | Log a call in under a minute | Partial | Timer shown; the median uses sample data |
| OPS-004 | VA to Care Specialist handoff | Partial | Read-only family view; no explicit handoff step |
| OPS-005 | Rostering and shifts | Partial | Roster is fixed sample data |
| MED-001 | Reminders on the parent channel | Partial | Schedule works; delivery is simulated |
| BIL-003 | Pause instead of cancel | Partial | 14 or 30 day pause; no way to mark a hospital stay |

Everything else in the ten epics is built as the Scope describes. All six
metrics show targets and sample data only.

## Gaps against the ElderLink workflows

The v1 Scope wins wherever the two disagree. Several gaps below are deliberate
and are listed under decisions.

| Workflow | Built | Missing |
| --- | --- | --- |
| Onboarding | Save and resume, finish on another device, emergency contact | Login, voice or chat sign-up, appointment scheduling and reminders, calendar sync, refills and pharmacy, more than one parent per account |
| Family AI Assistant | Answers from her record, read vs edit access, medical guardrails, hand-off to a person, conversation log (metadata only) | Booking and refill actions, voice input, access requests and temporary access |
| Human in the loop | Four risk tiers as a helper, High and Critical routing, 911 prompt, incident report | Urgent care branch, doctor-response branch, detecting sudden silence or unusual patterns, insurance context for the specialist |
| Insurance EOB | Connect a plan, letters explained, denials flagged with appeal help, download and secure share with an access log | Pulling clinical records, medical coding, medical necessity checks, prior authorization, provider and payer roles |
| Visit transcription | Upload photo or PDF, file checks, human review queue, family notified, access log | Version history, search, patient portal fallback, patient portal access |

## What needs a real backend

Nothing in the prototype leaves the browser. Every "AI" step is scripted. These
parts can only be shown for real once there is a backend:

- Placing calls and sending texts, emails and push notifications
- Login, security and encryption, HIPAA controls
- Speech-to-text, OCR and the visit and insurance summaries
- Insurance and health record connections
- Staff rosters and live metrics

## Demo shortcuts, no decision needed

- A visit summary nobody approves goes out after about 20 seconds, marked as checked by the Care Specialist. It exists so a solo presenter sees it arrive, but it shows a human check that never happened.
- Cancelling wipes the account for every family member instead of ending billing.
- A payer who is not the decision-maker can't report a death.
- Quiet hours are one setting per account instead of one per person.
