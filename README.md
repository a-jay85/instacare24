# InstaCare24 — investor prototype

**Live demo: https://a-jay85.github.io/instacare24/** — best on a phone, or a
narrow browser window.

Mobile-first web prototype. Next.js 16 (App Router) · TypeScript · Tailwind v4.
No backend: state lives in `localStorage`, seeded demo accounts live in
`src/lib/seed.ts`.

```bash
npm install
npm run dev     # http://localhost:3000
```

Best viewed at phone width. `/demo` is the switchboard for a walkthrough.

Every push to `main` redeploys the live demo via
`.github/workflows/deploy.yml` (static export, `PAGES_BASE_PATH=/instacare24`).

## What is built

Scoped to **ONB — Onboarding and profile**, plus the parts of **AUT** whose
acceptance criteria fire during onboarding.

| ID | Where it lives |
| --- | --- |
| ONB-001 | 7-step wizard, one idea per step, `src/app/onboarding/page.tsx` |
| ONB-002 | Field list closed in `src/lib/onboardingDraft.ts`; only additions are the agent (AUT-001) and the card (BIL-001) |
| AUT-001 | Step 3 of the wizard; roles on `Member`; read-only care instructions in `/profile`; `src/lib/permissions.ts` |
| AUT-002 | Onboarding ends on a pending-consent screen; consent state machine on the parent profile |
| AUT-003 | Withdrawn state renders in `/profile` and `/feed` |
| BIL-001 | Card step, and cancel-without-a-phone-call in `/profile` |
| ESC-001 | "Talk to someone" in the tab bar on every screen |
| FEED-001/002 | `/feed`, enough to land onboarding somewhere real |
| NTF-001 | Quiet hours in `/profile`, family-local, separate from `parentTimezone` |

Not built: ONB-003 (resume on another device, P1), ONB-004 (invite a sibling,
P2), and every other epic.

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
how you show AUT-001's read-only state.
