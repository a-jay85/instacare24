# InstaCare24 investor prototype — build plan

The v1 Scope (`docs/sources/v1-scope.md`) is the rulebook. The ElderLink
workflows (`docs/sources/*.md`) are the platform layer built on top of the
check-in loop. The brand is **InstaCare24**, never ElderLink.

## Stack and constraints

- Next.js 16 App Router, `output: "export"` (static, GitHub Pages). No API
  routes, no server actions, no dynamic `[param]` segments, no `next/image`.
  Avoid `useSearchParams` (needs Suspense); use in-page state for sub-views.
- Every page is a client component (`"use client"`), state in localStorage via
  `useAccount()` from `src/lib/store.tsx`. Mutations: `update((a) => fn(a))`
  where `fn` mutates the cloned draft and returns it.
- Navigate with `next/link` / `useRouter` only, never raw `window.location`
  or `<img src="/...">` (basePath breaks them).
- No real AI or network calls. Anything "AI" is scripted and labelled as such
  in code comments.

## Routes

| Route | Shell | Owner module |
| --- | --- | --- |
| `/` | PhoneFrame | Landing (exists) |
| `/onboarding` | PhoneFrame | 7-step wizard (exists) |
| `/feed` | AppShell, tab "Today" | Feed |
| `/care` `/care/medications` `/care/insurance` | AppShell, tab "Care" | Care |
| `/care/visits` | AppShell, tab "Care" | Visits |
| `/assistant` | AppShell, tab "Ask" | Assistant |
| `/profile` | AppShell, tab "Profile" | Profile (exists) |
| `/console` | Own desktop layout | Staff console |
| `/vision` | Own layout | Investor narrative |
| `/demo` | Own layout | Presenter switchboard |

`AppShell` (`src/components/AppShell.tsx`) wraps family pages: header, bottom
tab bar (Today · Care · **Talk to someone** · Ask · Profile), and on laptops a
phone frame with presenter links. Use `scrollAppTop()` from
`src/components/shell/PhoneFrame.tsx` instead of `window.scrollTo`.

## Shared files (owned by the lead — do not edit; ask instead)

- `src/lib/types.ts` — data model (Account, CheckInRecord, Medication, MedAck,
  Escalation, VisitSummary, Insurance, Eob, CareTeam).
- `src/lib/actions.ts` — pure mutations: `logCheckIn`, `openEscalation`,
  `takeOwnership`, `resolveEscalation`, `requestCallback`, `withdrawConsent`,
  `grantConsent`, `acknowledgeMed`, `canDeliver`, `openEscalations`, `todayIso`.
- `src/lib/risk.ts` — HITL tiers (0–30 / 31–60 / 61–90 / 91–100) and a
  scripted `suggestRiskScore(notes)`.
- `src/lib/seed.ts` — demo families. Rosa Reyes (consented, rich data; son
  Michael pays, daughter Denise is POA) and Margaret Whitfield (consent
  pending; daughter Karen pays and decides). Care team: VA Priya Nair, Care
  Specialist Dana Brooks. Doctors: Dr. Elena Alvarez (primary), Dr. Samuel
  Okafor (ortho). Insurance: BCBS Medicare Advantage PPO.
- `src/lib/permissions.ts`, `src/lib/config.ts`, `src/lib/timezones.ts`,
  `src/lib/store.tsx`.
- `src/components/ui.tsx` — Button, Field, TextArea, Select, RadioCard, Chip,
  Card, Banner, Pill, SectionTitle, LockNote, PageTitle, BackLink, Sheet,
  Provenance, `money()`. Tones: sage, amber, clay, moss, neutral, critical.

If you need a new shared primitive, put it in your module's own component file
and mention it in your report.

## Look and feel

Existing design system, keep it everywhere:
- Colours (Tailwind tokens): `cream` bg, `surface` cards, `ink` / `muted` /
  `faint` text, `line` borders, `sage` primary (`sage-dark`, `sage-soft`),
  `amber` caution, `clay` alarm, `moss` good. Each has a `-soft` tint.
- Type: `font-serif` (Source Serif) for page titles and hero sentences,
  Inter for everything else. Titles 28–30px, body 15–16px, meta 12–13px.
- Shapes: cards `rounded-2xl border border-line bg-surface p-5`, controls
  `rounded-xl`, pills `rounded-full`. Generous whitespace, no drop shadows on
  cards, no gradients inside the app.
- Voice: plain, warm, honest, short sentences. Talk about the parent by her
  preferred name. Never cheerful about bad news. No jargon ("EOB" gets
  explained). Mobile-first, one idea per screen, 44px touch targets,
  real `<button>`s and labels, visible focus.

## Hard rules from the scope (non-negotiable)

- **CHK-002** exactly one of three states per call: reached / not reached /
  reached and something is off. "Something is off" always opens an
  escalation (`logCheckIn` does this). The HITL risk score is an AI helper
  shown next to the log, never a replacement for the state.
- **CHK-004** no answer after retries opens an escalation automatically.
- **AUT-002** no check-in for a parent without granted consent. Pending-consent
  parents never appear in the VA call queue; they appear as "consent call
  needed" for the Care Specialist.
- **AUT-003** when the parent withdraws, the family is told, without the reason.
- **AUT-001** the payer who is not the agent cannot change care instructions
  (`canEditCareInstructions`). Medications count as care instructions.
- **FEED-001** today's state legible above the fold. **FEED-002** an unchecked
  day never reads as empty or fine.
- **MED-002** as-needed meds have no reminder time and never produce a missed
  state. **MED-003** show today's acknowledgement only; no adherence history,
  no streaks, no percentages.
- **ESC-002 / OPS-003** an open escalation has a named owner plus next action,
  or it is resolved. Overdue (unowned > 15 min) is visually distinct and sorts
  to the top.
- **OPS-001** VA queue ordered by window close, no sort/filter controls.
- **NTF-002** safety alerts ignore quiet hours.
- **BIL-001** one tier, $69/month (`PRICE_MONTHLY`), cancel without a call.
  ElderLink's $39/$99/$199 tiers appear only on `/vision` as roadmap.
- **ESC-004 / assistant guardrails** no diagnosis, prescribing, treatment
  advice or lab interpretation. Medical questions get a refusal plus a route
  to a human.

## Working rules for parallel agents

- Write only the files listed for your module.
- Do not run `git`, `next build` or `next dev`. Check your work with
  `npx tsc --noEmit` and `npx eslint <your files>`, then
  `npx prettier --write <your files>`.
- Keep files small and focused (< ~300 lines). Split sub-views into
  `src/components/<module>/*.tsx`.
