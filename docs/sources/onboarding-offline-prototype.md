# Source: `instacare24-onboarding-offline (4).html` (InstaCare24 — Core Onboarding Prototype)

`<title>InstaCare24 — Onboarding Prototype</title>`. ~243KB, but ~140KB is inlined React 18.3.1 + ReactDOM UMD builds (production). App code (~100KB) is pre-compiled JSX (`React.createElement`) mounted via `ReactDOM.createRoot(#root).render(App)`. Icons are hand-rolled inline-SVG stand-ins for lucide-react (`mkIcon`, 24 viewBox, stroke 2, round caps): User, Users, Mail, Phone, Lock, Eye, EyeOff, Check, ArrowRight, ArrowLeft, ShieldCheck, Sunrise, RefreshCw, AlertCircle, MapPin, Calendar, ChevronRight, Sparkles, Globe, Mic, MessageCircle, Keyboard, Camera, Upload, RotateCcw, PauseCircle, WifiOff. A tiny set of Tailwind-like utility classes is inlined in a `<style>` (flex/grid/gap/mb/mt etc., 4px scale). No base64 of significance. Works offline except Google Fonts.

Scope: **account onboarding only** (registration wizard → stub dashboard). Mobile-first single card, no sidebar.

## 1. Layout

- Page: full-viewport, centered, padding 24px; bg `#F6F7F4` + 3 radial gradients:
  - `radial-gradient(1000px circle at 12% -8%, rgba(94,143,113,0.18), transparent 55%)` (moss)
  - `radial-gradient(900px circle at 105% 12%, rgba(226,121,90,0.16), transparent 50%)` (coral)
  - `radial-gradient(800px circle at 45% 115%, rgba(77,142,146,0.14), transparent 55%)` (teal); `background-attachment: fixed`.
- Card: **width 420px**, white, radius **22**, border 1px `line`, shadow `0 1px 2px rgba(28,43,46,0.04), 0 18px 40px -20px rgba(17,75,84,0.35)`, overflow hidden, position relative.
- Card header (padding 22px 24px 16px, bottom border `line`):
  - Left: logo tile 26x26 radius 8 bg `primary` with white Sunrise icon (15) + wordmark "InstaCare24" (Fraunces 700 16px, `primary`).
  - Right: "⏸ Save & exit" link (11.5px 600 inkSoft, PauseCircle 13) — hidden on `role` and `dashboard` steps.
  - Below: **Daybreak Arc** progress (all steps except dashboard) or, on dashboard, "Welcome, <preferredName || firstName || 'there'>" (Fraunces 600 18px).
- Card body padding 22px 24px 24px — renders the current step component.
- "Progress saved" toast: absolute top 14 right 14, pill (radius 20), bg `ink`, white 12px 600, Check icon 12; fades/slides 6px, 300ms; shown 1400ms after every successful `goNext`.
- Standard step footer: GhostButton "← Back" left + PrimaryButton (fixed width 180) right.

## 2. Step flow (source of truth = `STEPS` array)

`role → language → mode → account → password → verifyEmail → verifyMobile → capture → review → photo → dashboard`

- `STEP_LABELS` (shown under arc): role "Who's joining", language "Your language", mode "Your style", account "Your details", password "Secure it", verifyEmail "Check email", verifyMobile "Check phone", capture "About you", review "Review", photo "Add a photo", dashboard "Home".
- Arc text: "STEP {idx+1} OF 10" (Inter 11px, ls .04em, inkSoft) + label (Fraunces 600 16px). Fill = `idx / 9` (capped 1).
- **Order oddities (flag):** photo comes *after* Review/Confirm, so the review row "Profile photo" always shows "—" on a first pass. Mode step ("How would you like to finish up? … date of birth and address") is shown *before* account creation, so its copy reads early.
- `goNext(validate?)`: run validator → set errors → if none, flash toast + advance. `goBack` clears errors. `jumpToStep(key)` used by Review "Edit details" (→ account).

### 2.1 role — "Who's joining"
- Title (Fraunces 22/600): "How will you use InstaCare24?"
- Sub (13px inkSoft): "This shapes the questions and dashboard you'll see next."
- Two option cards (column, gap 12): padding 16, radius 14, 1.5px border; active border `primary` + bg `#EEF3EC`; 36x36 icon tile radius 10 (active: primary bg/white icon; inactive: bg `bg`/primary icon); title 14.5/600; desc 12.5 inkSoft; Check on right when active.
  - **Senior Patient** (User) — "I'm receiving care and want to manage my own health information."
  - **Family Caregiver** (Users) — "I'm coordinating care for a parent or loved one."
- Full-width PrimaryButton "Continue →", disabled until role chosen. No Back.

### 2.2 language — "Your language"
- 46x46 icon tile (radius 12, `#EEF3EC`) with Globe. Title "Choose your language".
- Sub: "Used for onboarding, AI conversations, and future communications. English shown by default; other content will follow as it becomes available."
- Options (padding 14, radius 12): "English" (default), "Español" (key Spanish). Check when active.
- If not English, note (11.5px, bg `bg`, radius 10): "Some content isn't translated yet — you'll see English there, marked accordingly." (No actual translation implemented; Spanish only affects speech recognition lang `es-US`.)
- Back / "Continue".

### 2.3 mode — "Your style"
- Title "How would you like to finish up?"; sub "We just need your date of birth and address — pick whatever feels easiest."
- Options (icon tile 34x34 r9):
  - `manual` Keyboard — **Self onboarding** — "Fill out a short form at your own pace."
  - `chat` MessageCircle — **Guided chat** — "Answer one friendly question at a time."
  - `voice` Mic — **Talk it through** — "Speak your answers — we'll confirm each one."
- Continue disabled until chosen. Choice determines the `capture` step variant.

### 2.4 account — "Your details"
- Title "Let's create your account"; sub "Registering as a **<role>**."
- Fields:
  - 2-col: "First name" ph "Jordan"; "Last name" ph "Alvarez"
  - "Preferred name (optional)" ph = firstName or "e.g. Jo"; hint "What we'll call you in the app."
  - "Email address" (email) ph "you@email.com"
  - "Mobile number" ph "(555) 010-0100"
  - "Username" ph "careteam01"; hint "6–20 characters, starts with a letter, letters and numbers only."
- Back / "Next →".
- Validation (`validateAccount`), messages verbatim:
  - firstName empty → "First name is required."; not `/^[A-Za-z\s'-]{2,50}$/` → "Please enter a valid name."
  - lastName empty → "Last name is required."
  - email not `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` → "Please enter a valid email address."; in existing list → "An account already exists with this email address."
  - mobile digits ≠ 10 → "Please enter a valid mobile number."
  - username: empty "Username is required." / contains space "Username cannot contain spaces." / starts with digit "Username must begin with a letter." / not `/^[A-Za-z][A-Za-z0-9]{5,19}$/` "Username must contain 6–20 letters/numbers." / taken "Username is already taken. Please choose another."

### 2.5 password — "Secure it"
- Title "Secure your account"; sub "Health information deserves a strong password."
- "Password" (ph "Enter a secure password") with eye toggle (Eye/EyeOff, absolute right 10) — toggles both fields.
- Live checklist 2x2 grid (11.5px; pass = `sage` color + sage check, else inkSoft + line-colored check): "12+ characters", "Upper & lower case", "A number", "A special character".
- "Confirm password" ph "Re-enter password".
- Validation: <12 "Password must contain at least 12 characters." / missing class "Include upper + lower case, a number, and a special character." / whitespace "Password cannot contain spaces." / equals username (case-insens.) "Password cannot be the same as your username."; mismatch "Passwords do not match."

### 2.6 verifyEmail / verifyMobile — "Check email" / "Check phone" (shared `VerifyStep`)
- Icon tile Mail / Phone. Title "Verify your email" | "Verify your mobile number".
- Sub: "We sent a 6-digit code to **<contact or 'your email'/'your phone'>**. (Demo code: `123456`)" (code in IBM Plex Mono).
- "Verification code" input: digits only, maxLength 6, ph "000000", IBM Plex Mono 18px, letter-spacing .3em, centered.
- Resend link (RefreshCw): "Resend code" or "Resend available in {n}s" (60s cooldown, disabled while counting).
- Back / "Verify" (ShieldCheck), disabled until 6 digits.
- Logic: `123456` → verified, clear errors, reset attempts, auto-advance after 350ms. Wrong → "The verification code is incorrect."; 5th+ wrong → "Too many attempts. Please request a new code." Resend resets attempts (but not the input).
- Quirks: attempt counter and cooldown are shared between email & mobile; `verified` prop is never rendered; lockout is NOT enforced — `123456` is checked before the attempt count, so the correct code still passes after 5 misses and Verify stays enabled (message only).

### 2.7 capture — "About you" (variant by mode)

Shared validation (`validateFieldValue`):
- dob: required "Date of birth is required."; future "Date of birth cannot be in the future."; if role = Senior Patient and age < 60 → "Senior Patient accounts require an age of 60 or older in Phase 1."
- street: required "Street address is required."; if looks like a full address (ends in ZIP, ≥2 commas, or ", City, ST" pattern) → "Please enter just the street address — we'll ask for city, state, and ZIP separately."
- city "City is required."; state "State is required."; zip `/^\d{5}(-\d{4})?$/` else "Enter a valid 5-digit ZIP code."

**a) Manual (`ManualCaptureStep`)**
- Title "A bit more about you"; sub "Used to confirm eligibility and personalize your care profile."
- Fields: "Date of birth" (date); "Gender (optional)" select: Prefer not to say (""), Female, Male, Non-binary, Self-describe; "Street address" ph "123 Palm Ave"; "Apartment / unit (optional)" ph "Unit 4B"; 3-col "City" ph "Sarasota" / "State" ph "FL" / "ZIP" ph "34236"; "Country" (prefilled "United States").
- Eligibility banner once ZIP is 5 digits (12.5px, radius 10, MapPin):
  - eligible (bg `#EAF2EC`, text `#3F6B52`): "You're in a Phase 1 launch area — full services available."
  - not (bg `#FBEAE3`, text accentDark): "This ZIP is outside the initial Sarasota/Fort Myers launch area. You can still finish onboarding and join the waitlist."
- Continue runs `validateCapture`.

**b) Guided chat (`ChatCaptureStep`)** — asks `GUIDED_QUESTIONS` one at a time:

| key | prompt | type | help |
|---|---|---|---|
| dob | What's your date of birth? | date (sensitive) | We use this to confirm you're eligible for Senior Patient services and to personalize reminders. |
| street | What's your street address? | text | Just the street and number — you'll get a chance to add an apartment or unit later. |
| city | Which city? | text | The city for your home address. |
| state | Which state? (2-letter, like FL) | text | Use the 2-letter abbreviation, e.g. FL for Florida. |
| zip | And your ZIP code? | text | 5 digits, or 5+4 like 34236-1234. |

- Header icon tile MessageCircle 40x40; title "Let's chat it through" → "All set!" when done.
- History (max-height 220 scroll): bot bubble (bg `bg`, radius 10 10 10 2, 12.5 inkSoft) + user bubble (bg primary white, radius 10 10 2 10, indented 24).
- Current prompt bubble (13px 600 ink, bg `bg`). Input ph "Type your {label}…". Links: "Not sure? Get help" (toggles help box, bg `#EEF3EC`) and "Simulate connection drop" (shows 1.8s brick notice "Connection lost — your answers so far are saved. Reconnecting…" with WifiOff).
- "Send →": empty → "This information is required to continue."; else field validation; success appends history and advances.
- Done: success box `#EAF2EC` "✓ Thanks — that's everything for this part." + Continue.

**c) Voice (`VoiceCaptureStep`)** — real Web Speech API (`SpeechRecognition || webkitSpeechRecognition`), lang `es-US` if Spanish else `en-US`, interimResults, non-continuous.
- Unsupported browser → `VoiceCaptureSimFallback` with coral notice "Your browser doesn't support live dictation (this needs Chrome or Edge). Using a typed stand-in instead."
- Permission screen (micStatus null): Mic tile; "Allow microphone access?"; "Your browser will ask to use your microphone. We'll listen for real — speak your answer and we'll transcribe it. You can switch to typing anytime."; Primary "Allow microphone" (starts recognition); Ghost "Not now" (→ denied); Back.
- Denied screen (coral tile AlertCircle): "Microphone access needed"; "To use voice, enable microphone access for this site in your browser settings. In the meantime, here are two easier alternatives."; buttons "Switch to guided chat" / "Switch to manual entry".
- Interrupted screen (network error or "Trouble with voice?" link; WifiOff): "Voice service unavailable"; "Your answers so far are saved. Continue with another method to finish the rest."; "Continue via chat" / "Continue via manual entry".
- Active: header "Real dictation active" / "Listening…" / "All set!" + link "Trouble with voice?". Prompt bubble. 64px round mic button (primary; coral `accent` + `ic24MicPulse` 1.4s ring rgba(226,121,90,.45)→16px while listening); caption "Tap to speak your answer" / "Listening — speak now"; live transcript in Plex Mono in quotes; link "Type it instead" ↔ "Use voice instead" (typed input "Type your answer" + "Submit").
- Errors: no-speech "Didn't catch any speech — tap the mic and try again."; other "Something went wrong with recognition — tap the mic to retry, or switch methods below."; validation errors shown in brick.
- Confirm step: label "This is sensitive information — please confirm it's correct:" (dob) or "I heard:"; value in Plex Mono on `#EAF2EC`; if confidence < 90% → accentDark "Recognition confidence was low (NN%) — please double-check this before confirming."; buttons "✓ Confirm" / "Edit" (outline).
- Also defined (unused path): "I didn't catch that clearly (NN% confidence) — tap the mic to repeat, or type it instead."
- **Sim fallback**: title "Let's get your details"; "Your answer" input + "Submit"; confirm label "Please confirm it's correct:" / "Got it:"; low-confidence message "I didn't catch that clearly — please try again." (unreachable: `confidence` has no UI control); validation failure there is silent.
- Quirk: chat/voice keep `qIndex` in local component state, so any fallback ("Continue via chat") or Back/forward re-entry restarts at the DOB question despite "finish the rest" copy; answers already written to `data` survive (manual shows them prefilled; chat re-asks and overwrites).
- Quirk: voice → manual fallback passes `errors:{}` and `zipEligible:false`, so errors don't display (user blocked silently) and the banner always says "outside launch area".

### 2.8 review — "Review"
- Title "Review & submit"; sub "Confirm everything looks right before we activate your account."
- Zebra table (radius 12, border, rows padding 9px 14px, alt bg `#FAFBFA`, 12.5px; label inkSoft, value ink 600 right-aligned, empty "—"): Role, Language, Name, Preferred name, Email, Mobile, Username, Date of birth, Address (`street[, apt], city, state zip, country`), Service area ("Eligible — Phase 1" | "Waitlist"), Onboarding style (capitalized mode key: Manual/Chat/Voice), Profile photo (filename | "Default avatar" | "—").
- Checkboxes (accent primary): "I agree to the Terms of Service", "I agree to the Privacy Policy", "I authorize HIPAA-compliant data sharing for care coordination". Any unchecked → "Please accept all required agreements to continue."
- Buttons: outline "← Back" + outline "Edit details" (→ account) side by side, then full-width primary "✓ Confirm".

### 2.9 photo — "Add a photo"
- Camera tile; "Add a profile photo"; "Optional — helps caregivers and care specialists recognize your profile."
- 72px round avatar (image preview or initial of preferred/first name in Fraunces 22 primary). Coral soft button "Upload photo" / "Choose different photo" (bg `#FBEAE3`, text accentDark, radius 8); caption "JPG, JPEG, PNG, or HEIC — up to 10 MB".
- Errors: "Unsupported file type. Please use JPG, JPEG, PNG, or HEIC." / "The image exceeds the maximum allowed size (10 MB)."
- Replacing: "Replace your previous photo with this one?" [Replace] [Cancel].
- "Skip for now — use a default avatar" (only if no preview) sets `photoSkipped` (no visible feedback). Continue always enabled.

### 2.10 dashboard — "Home"
- Status banner: gradient 135° primary→primaryLight, radius 14, white: "Account status" (12px .85 opacity) / "🛡 Active — <role>" (Fraunces 600 17); if not ZIP-eligible: "You're on the waitlist for your area — we'll notify you at launch."
- Role-specific action cards (border, radius 12, padding 14; coral-soft CTA with ChevronRight):
  - Senior Patient: **Care Circle** "Invite a family caregiver to help coordinate your care." [Invite caregiver]; **Medications** "No medications added yet." [Add medication]; **Insurance** "Upload your card so we can track your benefits." [Upload insurance]
  - Family Caregiver: **Connect to a Senior** "Send an invitation to link with the person you're caring for." [Send invitation]; **Care Team** "Add physicians and specialists to build the care team." [Add physician]; **Emergency Contacts** "At least one emergency contact is required." [Add contact]
  - Click → sage note "✓ This step isn't built out in the prototype yet — noted for the next pass."
- Ghost Back.

### 2.11 Save & exit / Resume (`ResumeScreen`, replaces header+body)
- PauseCircle tile; "Your progress is saved"; "Continue your onboarding whenever you're ready."
- Primary "Continue onboarding →" (returns to saved step); Ghost "↺ Restart onboarding" → confirm box (bg `#FBEAE3`): "This clears everything you've entered so far. Are you sure?" [Yes, restart] (brick bg) [Cancel].
- Restart resets all fields except `language` and `country`; verification flags not reset. State is in-memory only (no localStorage).

## 3. State & mock data

```js
data = { role:"", language:"English", firstName:"", lastName:"", preferredName:"", gender:"",
  email:"", mobile:"", username:"", password:"", confirmPassword:"", emailCode:"", mobileCode:"",
  dob:"", street:"", aptUnit:"", city:"", state:"", zip:"", country:"United States",
  onboardingMode:"" /* manual|chat|voice */, photoName:"", photoSkipped:false,
  terms:false, privacy:false, hipaa:false }
existingAccounts = { emails:["taken@example.com"], usernames:["careuser01"] }
DEMO_OTP = "123456"; RESEND_COOLDOWN = 60s; MAX_ATTEMPTS = 5
FL_ELIGIBLE_ZIPS_PREFIX = ["342","339","941"] // comment: 342xx Sarasota, 339xx Fort Myers area (demo)
```
- Roles: "Senior Patient" (min age 60 in Phase 1), "Family Caregiver". Languages: English, Spanish.
- Placeholder persona: Jordan Alvarez ("Jo"), careteam01, (555) 010-0100, you@email.com, 123 Palm Ave, Unit 4B, Sarasota, FL 34236, United States.
- **ZIP bug:** "941" is Sarasota's *phone area code*; as a ZIP prefix 941xx = San Francisco. 342 = Sarasota, 339 = Fort Myers; 941 = SF ZIP prefix / Sarasota phone area code — drop it.
- Phase 1 geography: Sarasota / Fort Myers, Florida launch area; out-of-area users → waitlist.

## 4. Design system

- **Rendered tokens (`TOKENS` object — source of truth):**
  - bg `#F6F7F4`, surface `#FFFFFF`, ink `#20281F`, inkSoft `#647063`, line `#E3E7DF`
  - primary (moss) `#3F6B52`, primaryLight `#5E8F71` (hover/focus/gradient)
  - accent (coral) `#E2795A` (arc fill, listening mic), accentDark `#C15C3F` (coral text/warnings)
  - sage `#4D8E92` (actually a harbor teal; success text / checklist pass)
  - brick `#B8493B` (errors, destructive)
- Ad-hoc tints: `#EEF3EC` (selected option bg, icon tiles, help box), `#EAF2EC` (success / confirm value / eligible), `#FBEAE3` (coral soft bg: CTAs, warnings, restart confirm), `#FAFBFA` (zebra), disabled button bg `#D8DEDC` / text `#8A9694`.
- Header-comment palette ("Token system v2 — wellness + warmth") drifts from code: bg `#F5F7F6`, moss `#3F6B52`, coral `#E2795A`, harbor teal `#4D8E92`, brick `#C1503F`, ink `#1C2B2E`, line `#E2E7E5`. Prefer TOKENS values.
- **Type:** Fraunces (display; 500/600/700; titles 22/600, dashboard 17–18, wordmark 16/700), Inter (body 400–700; labels 13/600, sub 13, hints 12, small 11–12.5), IBM Plex Mono 500/600 (codes, OTP, transcripts/confirmed values).
- **Radius:** card 22; option cards 14 (role) / 12; inputs & buttons 10; icon tiles 12 (46px) / 10 (36–40px) / 9 (32–34px); small buttons 7–8; toast pill 20; banners 10–14.
- **Components:**
  - PrimaryButton: Inter 600 14.5, padding 12px 20px, radius 10, primary bg → hover primaryLight, white; icon after label, gap 8; full width by default (180px in footers).
  - GhostButton: 600 14, inkSoft, no bg, padding 8px 4px, icon gap 6.
  - Outline button: 1.5px line border, white, ink, radius 10.
  - TextInput: padding 11px 14px, radius 10, 1.5px border line (brick on error), 14px; focus border primaryLight (no outline).
  - Field: label 13/600 ink, mb 6; hint 12 inkSoft; error 12 brick with AlertCircle 13.
  - Option card: 1.5px border, selected primary border + `#EEF3EC` bg + trailing Check.
  - Spacing: 4px utility scale (gap 4/8/10/12, mb 4/6/8/12/16/20/24).
- **Signature element — "Daybreak Arc":** 56px SVG ring (r 34, stroke 6, track `line`, progress `accent`, round cap, rotated -90°, 500ms dashoffset transition) with a Sunrise icon in primary at center; "sunrise-shaped progress arc that fills segment by segment as the caregiving journey proceeds toward the full circle of the dashboard."

## 5. UX ideas worth keeping

- Role-first branching (Senior Patient vs Family Caregiver) that shapes copy and the post-onboarding dashboard.
- Three capture modes (form / guided chat / real voice) over the same question schema, with graceful fallbacks (denied mic, unsupported browser, network drop → switch to chat/manual; committed answers persist in data, but guided sequence restarts).
- Voice: confirm-before-commit, extra confirmation wording for sensitive fields, low-confidence (<90%) warning.
- Chat: per-question "Not sure? Get help" and simulated connection-drop resilience messaging.
- "Progress saved" micro-toast on each step + Save & exit / Resume / confirmed Restart.
- Real-time password checklist; OTP with demo code, resend cooldown, attempt-limit message (not enforced).
- Smart street-field validation that catches pasted full addresses.
- ZIP-based Phase 1 service-area eligibility with waitlist (never blocks onboarding).
- Review table + explicit Terms / Privacy / HIPAA consents.
- Honest "not built yet" feedback on stub dashboard CTAs.

## 6. Overlaps & conflicts with `elderlink_prototype.html`

| Axis | ElderLink prototype | Onboarding-offline prototype |
|---|---|---|
| Brand | "ElderLink" (sub: InstaCare24 platform), "EL" mark | "InstaCare24", Sunrise mark |
| Layout | Desktop app shell: 250px dark-teal sidebar + topbar + sections | Single 420px centered mobile card wizard, no nav |
| Scope | Onboarding + 4 product modules (AI assistant, insurance/EOB, transcription, HITL) | Account onboarding + stub dashboard only |
| Fonts | Poppins (headings) + Inter | Fraunces (display) + Inter + IBM Plex Mono |
| Primary | Deep teal `#0F6E56` (sidebar `#04342C`) | Moss green `#3F6B52` |
| Coral | `#D85A30` | `#E2795A` (dark `#C15C3F`) |
| Background | Flat cream `#F6F4EC` | `#F6F7F4` + radial gradients |
| Ink | `#20261F` / soft `#5B6259` | `#20281F` / soft `#647063` |
| Radius | cards 14, controls 9 | card 22, controls 10 |
| Roles | Patient / Family member / Caregiver (3) | Senior Patient / Family Caregiver (2) |
| Languages | 6 (en, es, zh, hi, vi, tl), live-translated onboarding | 2 (English, Spanish), no real translation |
| Mode keys/labels | self "Self onboarding (forms)" / chat "Guided chat onboarding" / voice "Voice onboarding" — cosmetic | manual "Self onboarding" / chat "Guided chat" / voice "Talk it through" — fully implemented |
| Step order | method+language → role → plan → personal info → emergency contact → meds (6) | role → language → mode → account → password → OTP email → OTP mobile → capture → review → photo (10) |
| Fields | name, DOB, phone, pharmacy, emergency contact, meds, plan tier | first/last/preferred name, email, mobile, username, password, OTPs, DOB, gender, address, photo, consents |
| Pricing | Essentials $39 / Active Care $99 / Family Plus $199 | none |
| Progress UI | 6 flat bars | Daybreak Arc ring |
| Geography | none | Phase 1 Sarasota/Fort Myers FL, ZIP eligibility + waitlist |
| Validation | none | extensive, verbatim messages |
| Auth | none | username/password + email/SMS OTP |
| Post-onboarding | unlocks modules, dashboard stats + activity log | Role-specific 3-card dashboard (Care Circle/Meds/Insurance vs Connect Senior/Care Team/Emergency Contacts) |
| Name collision | Dr. Alvarez (visit transcript doctor) | Jordan Alvarez (placeholder user) |

- Shared concepts: role-aware onboarding, method choice (form/chat/voice), language preference, medications + insurance + emergency contacts as core data, calm green + coral palette, Inter body font.
- Merge suggestion for the SPA: take onboarding-offline's flow/validation/voice-chat UX and visual language, append ElderLink's plan, emergency-contact and medication steps, then land in ElderLink's module shell (dashboard, assistant, insurance, transcription, HITL). Pick one brand/palette explicitly.

(Not covered here: `InstaCare24 v1 Scope.html` in repo root.)
