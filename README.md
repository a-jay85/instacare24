# InstaCare24 — investor prototype

**Live demo: https://a-jay85.github.io/instacare24/** — best on a phone, or a
narrow browser window.

Mobile-first web prototype. Next.js 16 (App Router) · TypeScript · Tailwind v4.
No backend: state lives in `localStorage`, seeded demo accounts live in
`src/lib/seed.ts`.

```bash
npm install
npm run dev     # http://localhost:3000, then open /demo
```

On a laptop the family app shows inside a phone frame. `/demo` is the
presenter's switchboard: load a family, then follow the 9-step script on that
page (about 8 minutes).

Every push to `main` redeploys the live demo via
`.github/workflows/deploy.yml` (static export, `PAGES_BASE_PATH=/instacare24`).

## Giving the demo

1. Open `/demo` and press **Load** on "The Reyes family". This resets it.
2. Open the **Staff console** in a second window, side by side.
3. In the console, open Rosa's call and log "something is off". The family's
   Today tab updates on its own and says nobody has it yet. Then take it under
   **Escalations** with a next action. The family sees who has it and what
   happens next.
4. In **Ask**, try "How is Rosa today?", "What is metformin for?", then
   "Should she stop the lisinopril?" to show the hand-off to a human.
5. Finish on `/vision` for the market, model and the ask.

"The Whitfields — day one" shows a parent who has not agreed yet. Nothing
runs until she says yes on a recorded call.

Everything runs in the browser. Nothing is sent anywhere. The "AI" parts
(risk score, visit write-ups, insurance letters, the assistant) are scripted.

## What is built

The v1 scope (`docs/sources/v1-scope.md`) is the rulebook. The ElderLink
workflows in `docs/sources/` are the platform layer on top. `docs/PLAN.md` has
the route map, the design rules and the hard rules from the scope.

| Route | What it shows | Scope IDs |
| --- | --- | --- |
| `/` | Landing page | |
| `/onboarding` | 7-step sign-up, ends waiting on her consent | ONB-001/002, AUT-001/002, BIL-001 |
| `/feed` | Today's state above the fold, escalations with an owner, today's reminders, latest doctor visit, history where an unchecked day never reads as fine | FEED-001/002, ESC-003, AUT-003 |
| `/care` | Hub for meds, visits, insurance and the care team | |
| `/care/medications` | Today only, no history or streaks; as-needed meds never "missed"; payer is read-only | MED-001/002/003, AUT-001 |
| `/care/visits` | Record or photograph a visit, a person checks it, then a plain-English summary | Doc transcription workflow |
| `/care/insurance` | Connect a plan, every insurance letter (EOB) explained, denied claims flagged | Insurance / EOB workflow |
| `/assistant` | Scripted family assistant. Answers from her record, refuses medical advice, hands off to a human, handles emergencies | Family AI workflow, non-advice boundary from ESC-004 |
| `/profile` | Consent, care instructions, people and roles, inviting family to read along, quiet hours, $69 plan, pause, cancel without a call, reporting a death | AUT-001/002/003, NTF-001, BIL-001/002 |
| Tab bar | "Talk to someone" on every screen opens a real escalation | ESC-001 |
| `/console` | Staff console: VA call queue ordered by window close, 3-state logging with a risk score helper (High and Critical show who was notified), escalations (owner + next action, overdue on top), consent calls, visit summaries to check, metrics | CHK-001–004, OPS-001–003, ESC-002/004, HITL tiers |
| `/vision` | Investor narrative: problem, loop, people, human-in-the-loop, platform roadmap, business model, metrics, the ask | |
| `/demo` | Presenter switchboard and script | |

State lives in `localStorage` (`src/lib/store.tsx`). Two tabs stay in sync, so
a call logged in the console shows up in the family app. Shared data types are
in `src/lib/types.ts` and every change goes through `src/lib/actions.ts`.

## Assumptions the PM should confirm

1. **Parent channel is voice.** CHN-001 is BLOCKED, but CHN-002 requires no
   setup action from the parent — no new device, no app install. SMS assumes she
   reads and replies to texts; app and device both need an install. Voice to the
   phone she already owns is the only option left. It is one constant,
   `PARENT_CHANNEL` in `src/lib/config.ts`, and all channel copy reads from
   `CHANNEL_COPY`.
2. **AUT-002 gates *delivery*, not *scheduling*.** ONB-001 wants sign-up to
   first scheduled check-in under 15 minutes; AUT-002 wants a recorded consent
   call first, which cannot happen inside the subscriber's session. Read here as:
   onboarding sets the window, the first call waits on her yes. If the PM meant
   the 15-minute clock stops after the consent call, the terminal screen and the
   consent state machine both change.
3. **Escalation SLA copy is hedged.** ESC-001 says 15 minutes p90; the
   configurable-values table says the SLA is blocked. Copy reads "usually within
   15 minutes" until Ops fixes it.
4. **Onboarding does not ask about capacity.** AUT-005 (route to a Care
   Specialist when the parent's ability to consent is in doubt) is P2, so the
   wizard has no "not sure" branch. Worth revisiting — a subscriber who is
   unsure will pick one of the two answers anyway.
5. **The invited authorized agent has no timezone yet.** We copy the
   subscriber's. Their real quiet hours get set when they accept the invitation,
   which is not built.

## Prototype shortcuts

Anything a real user would never see is marked. `/profile` has a dashed
"Prototype shortcut" box for moving the consent state machine ("she said yes" /
"she withdrew consent"). `/demo` can switch which member is signed in, which is
how you show AUT-001's read-only state, and has quick buttons to log today's
call without opening the console.

## Known gaps

- The founders' email on `/vision` is a placeholder
  (`CONTACT_EMAIL` in `src/components/vision/Ask.tsx`).
- The doctor's office phone in the assistant is a placeholder
  (`DOCTOR_OFFICE_PHONE` in `src/lib/assistant/guardrails.ts`).
- Times follow the real clock. Load opens Rosa's call window at the current
  hour in New York, kept inside 7 AM–7 PM her time. Give the demo before
  3 PM Pacific, and press Load just before you start.
- A new visit summary waits for Dana in the console ("Visit summaries").
  If nobody approves it, it goes out in her name after about 20 seconds,
  so a solo presenter still sees it arrive.
