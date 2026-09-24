# Source: `elderlink_prototype.html` (ElderLink — InstaCare24)

Single-file vanilla HTML/CSS/JS, ~800 lines, no framework. `<title>ElderLink — InstaCare24</title>`. Desktop "platform" demo: left sidebar + main content, 6 sections toggled by class. Everything is simulated client-side (setTimeout), state in one global `state` object, no persistence.

## 1. Layout & navigation

- `.app` = flex row, min-height 100vh.
- **Sidebar** (`.sidebar`): 250px wide, bg `--teal-900`, white text, padding 26px 18px, `position:sticky; top:0; height:100vh`, flex column.
  - Brand: square mark 34x34, radius 10, bg `--teal-600`, text "EL" + wordmark "ElderLink" (Poppins 600, 19px).
  - Brand sub: "InstaCare24 platform" (12px, `--teal-100`, left margin 44px to align under wordmark).
  - "Registered as" badge (hidden until onboarding complete): bg rgba(255,255,255,.08), border rgba(255,255,255,.16), radius 10. Label "REGISTERED AS" (10.5px uppercase, letter-spacing .06em, `--teal-100`); value = `<typeLabel> — <patientName>` (14px 600 white) + line 2 tier label (e.g. "Essentials — $39/mo") + line 3 `<method label> · <language label>` (both 12px 400 `--teal-100`).
  - Nav items (emoji/glyph icons, 14.5px, color #CFEAE0, padding 11px 13px, radius 10; hover rgba(255,255,255,.08); active bg `--teal-600` white 600; `.locked` opacity .4 + not-allowed cursor):
    1. `▤ Dashboard` (target `dashboard`)
    2. `✎ Onboarding` (`onboarding`)
    3. `💬 Family AI Assistant` (`assistant`) — locked initially
    4. `🛡 Insurance & EOB` (`insurance`) — locked
    5. `🎙 Visit Transcription` (`transcription`) — locked
    6. `⚠ HITL Escalation` (`hitl`) — locked
  - Sidebar footer (top border rgba(255,255,255,.14)): label "I'M REGISTERING AS" (11px uppercase), `<select id=roleSwitch>` options Patient / Family member / Caregiver (bg `--teal-800`, radius 8). Two-way synced with the onboarding step-2 chips.
- **Main** (`.main`): flex 1, padding 28px 40px 60px, max-width 1080px.
  - Topbar: left = h1 page title (22px) + subtitle (14px `--ink-soft`); right = global **risk pill** (`#riskPill`) reflecting HITL tier.
  - Page titles/subtitles (`titles` map):
    - dashboard: "Dashboard" / "Everything connected across the five ElderLink modules"
    - onboarding: "Onboarding" / "Set up your account once — it powers every other module"
    - assistant: "Family AI Assistant" / "Ask about care status, visits, meds, and insurance"
    - insurance: "Insurance & EOB" / "AI-assisted prior authorization and benefits"
    - transcription: "Visit Transcription" / "Capture a doctor visit and get a plain-English summary"
    - hitl: "HITL Escalation" / "Risk-based routing to VA, specialist, or emergency response"
- `go(target)`: if nav item is `.locked` → toast "Complete onboarding first to unlock this module." and abort; else show section, set active nav, update title/sub.
- Toast: fixed bottom-right 24px, bg `--teal-900`, white, radius 10, shadow 0 6px 18px rgba(0,0,0,.15), fade+slide 10px, 0.25s; auto-hide after 2600ms.
- Responsive: only `@media(max-width:800px)` collapses grid-2/grid-3 to 1 col; sidebar does not collapse.

## 2. Screens

### 2.1 Dashboard (`#dashboard`)
- **Onboarding nudge card** (bg `--teal-50`, border `--teal-100`; hidden after onboarding):
  - h3 "Finish setting up ElderLink"
  - p "Complete onboarding to unlock the Family AI Assistant, Insurance & EOB, Visit Transcription, and HITL escalation modules."
  - Primary btn "Start onboarding" → go('onboarding').
- **3 stat cards** (grid-3, clickable, hover border `--teal-400`). Each: key (12.5px uppercase 600 `--ink-soft`, ls .04em), value (Poppins 20px 600), muted hint.
  - "INSURANCE & PRIOR AUTH" / value `#dashInsurance` initial "Not started" (→ "Under review" → "Approved") / "Tap to view EOBs" → insurance.
  - "LAST VISIT SUMMARY" / `#dashVisit` "None yet" (→ "Reviewed <locale date>") / "Tap to transcribe a visit" → transcription.
  - "CARE RISK STATUS" / `#dashRisk` "No risk" (→ "Medium risk" / "High risk" / "Critical risk") / "Tap to open HITL panel" → hitl.
  - Note: clicking these while locked shows the lock toast.
- **Recent activity card**: h3 "Recent activity"; muted "A shared timeline across every module — this is what "integration" looks like end to end."; empty state "No activity yet. Complete onboarding to get started." Log = newest first, max 6 shown, rows padding 9px 0, bottom border, 14px, HTML with `<strong>` lead.

### 2.2 Onboarding (`#onboarding`) — 6-step wizard in one card
- Context pill at top (`pill-none` style): `<typeLabel> · <methodLabel>`; typeLabel = "Patient" | "Family member registering a patient" | "Caregiver registering a patient". Default "Patient · Self onboarding".
- Progress: 6 equal bars (height 6, radius 4, gap 6), `done` = `--teal-600`, else `--border`. Bars with index < current step are filled.
- Footer: "Back" (outline, disabled on step 1) left; "Continue" (primary) right; on step 6 label = "Complete onboarding".
- **Step 1 — method + language**
  - h3 "How would you like to onboard?"
  - muted "Choose whichever is easiest — this is remembered on the account and shown to anyone helping later."
  - Chips (single select): "✎ Self onboarding (forms)" [self, default], "💬 Guided chat onboarding" [chat], "🎙 Voice onboarding" [voice]. Selection is cosmetic only — all methods show the same forms.
  - Field "Preferred language" (max-width 280) select: English (en) / Español (Spanish) (es) / 中文 (Mandarin) (zh) / हिन्दी (Hindi) (hi) / Tiếng Việt (Vietnamese) (vi) / Tagalog (tl). Changing it live re-translates all onboarding copy (see §5).
- **Step 2 — account type**
  - h3 "Who's registering?"; muted "This is remembered across ElderLink and shown wherever the account appears."
  - Chips: Patient [default] / Family member / Caregiver. Syncs sidebar select.
- **Step 3 — plan** (grid-3 of `.tier-card`, 1.5px border; selected = border `--teal-600`, bg `--teal-50`)
  - h3 "Choose a plan"; muted "Pricing scales with the level of care coordination needed — this is remembered on the account too."
  - **Essentials** — $39/mo — "Medication reminders, visit summaries, basic alerts" (default)
  - **Active Care** — $99/mo — "Adds Family AI Assistant, insurance & EOB support, HITL escalation"
  - **Family Plus** — $199/mo — "Everything in Active Care, plus multi-member family access"
  - Price: Poppins 22px 600 + "/mo" 13px 400 `--ink-soft`.
- **Step 4 — personal info** (grid-2)
  - Heading "Personal information" (or "Patient's information" when account type is family/caregiver).
  - "Full name" (or "Patient's full name") placeholder "e.g. Margaret Chen"; "Date of birth" (date); "Phone" placeholder "(555) 123-4567"; "Preferred pharmacy" placeholder "e.g. CVS Main St".
- **Step 5 — emergency contact** (grid-2)
  - h3 "Emergency contact"; "Name" ph "e.g. David Chen"; "Relationship" ph "e.g. Son"; "Phone" ph "(555) 987-6543"; "Email" ph "name@email.com".
- **Step 6 — medications**
  - h3 "Current medications"; muted "Add each medication your care team should know about. This feeds the Family AI Assistant and Visit Transcription summaries."
  - Repeating `.med-row` (flex gap 10): input ph "Medication name (e.g. Metformin)" (flex 1) + input ph "Dosage / frequency" (max-width 180). One row pre-added. Outline btn "+ Add medication" appends a row (no remove).
- **completeOnboarding()**: collects meds rows with non-empty name → `state.meds[{name,dose}]`; `patientName = obName || 'Patient'`; unlocks all nav; hides nudge; renders sidebar badge; toast "Onboarding complete — welcome, <name>."; activity: "**Onboarding** completed for <name> via <method lower> in <language label> on the <tier name> plan (<n> medication(s) on file)"; seeds chat greeting; navigates to dashboard.

### 2.3 Family AI Assistant (`#assistant`)
- Card h3 "Family AI Assistant"; muted "Authenticated family access, ask about care status, visit summaries, medications, and insurance — routed with AI guardrails."
- Chat window: height 340, bg `--cream`, border, radius 14, padding 16, column gap 10, auto-scroll.
  - `.msg` max-width 75%, padding 10px 14px, radius 12, 14.5px.
  - `ai`: white, border, left-aligned, bottom-left radius 3.
  - `user`: bg `--teal-600` white, right-aligned, bottom-right radius 3.
  - `guardrail`: bg `--amber-50`, text `--amber-800`, border `--amber-400`, left, 13.5px.
- Intent chips: "Care status" (status), "Medication check-in" (meds), "Doctor visit summary" (visit), "Insurance / EOB" (insurance), "Is it serious?" (diagnosis).
- Input ph "Type a question for the assistant…" + primary "Send".
- Seed message after onboarding: "Hi, I'm the ElderLink assistant for <name>'s care. Ask me about care status, medications, the latest visit, or insurance."
- Free-text routing (`respondFreeform`, lowercase contains, checked in order, after 400ms):
  1. `diagnos` | `should i` | `is it serious` | `medicine dose` → diagnosis
  2. `med` → meds
  3. `insur` | `eob` → insurance
  4. `visit` | `doctor` → visit
  5. else → status
  - Quirk: free-text also posts the intent label as a second user bubble (askIntent always echoes the label).
- Intent responses (after 500ms):
  - diagnosis (guardrail bubble): "I'm not able to give a diagnosis or medical advice. I can share the doctor's documented notes and connect you with the care team if you'd like."
  - status: "Current status: <tier label>. " + ("Onboarding is complete and all records are up to date." | "Onboarding is still in progress.")
  - meds: "On file: <name> (<dose>), <name2>…." (dose parens omitted if blank) or "No medications are on file yet — add them during onboarding."
  - visit: "Latest visit summary: <summary>" or "No visit has been transcribed yet. Head to Visit Transcription to record one."
  - insurance: "Insurance status: not connected yet." or "Insurance status: under review. 0 EOB(s) on file." / "approved. 1 EOB(s) on file." (status with `_`→space).

### 2.4 Insurance & EOB (`#insurance`)
- Card 1: h3 "Insurance & prior authorization"; muted "OAuth 2.0 / SMART on FHIR pull, or manual upload — normalized, validated, and routed for AI-assisted prior auth."
  - grid-2: "Insurance provider" ph "e.g. Blue Cross Blue Shield"; "Policy number" ph "e.g. BCBS-88213" (values not read/validated).
  - Buttons: primary "Connect via FHIR", outline "Upload manually" — both call `connectInsurance()`.
  - Flow: status `under_review` → pill-medium "Prior authorization: under review", dash "Under review", activity "**Insurance** connected — prior authorization submitted for review", toast "Insurance connected. Prior authorization submitted." → after **2200ms**: status `approved`, pill-none "Prior authorization: approved", dash "Approved", push EOB `{date: today locale, service:'Annual wellness visit', status:'Approved'}`, activity "**Prior authorization** approved — EOB generated for annual wellness visit", toast "Prior authorization approved. EOB generated." Repeated clicks add more EOB rows.
- Card 2: h3 "Explanation of Benefits"; table cols Date | Service | Status | (action). Empty: "Connect insurance to generate EOBs." Rows: status badge (`badge-approved`) + small outline "View" button (no-op). Badge variants defined: approved (teal), review (amber), denied (red).

### 2.5 Visit Transcription (`#transcription`)
- Centered card: h3 "Visit transcription & summary"; muted "HIPAA-compliant capture of a doctor visit, transcribed and translated into a plain-English summary."
- Record button: 64px circle, bg `--coral-600`, white mic SVG; `.recording` = pulse animation (box-shadow ring coral rgba(216,90,48,.4) → 16px, 1.2s infinite).
- Label: "Tap to start recording a visit" → "Recording… tap to stop" → "Processing visit…" → back to initial.
- Waveform: 8 bars (4px wide, `--teal-400`, height 6 → 24 when active, 0.9s ease-in-out, odd bars delay .15s).
- Stop → after **1400ms** shows Transcript card (pre-wrap, 14px, `--cream` bg, max-height 180 scroll) and "Plain-English summary" card. Dash visit = "Reviewed <date>"; activity "**Visit transcribed** — plain-English summary generated"; toast "Transcript and summary ready."
- Escalation nudge (amber `.locked-note`): "Swelling and fatigue mentioned — consider a HITL check-in." + primary small btn "Open HITL panel" → hitl.

### 2.6 HITL Escalation (`#hitl`)
- Card: h3 "Human-in-the-loop escalation"; muted "Set a simulated risk score to see how ElderLink routes the case — this also updates the status pill across the whole app."
- Range slider 0–100, default 15, accent `--teal-600`; tick labels: "0 — No risk", "30", "60 — High", "90", "100 — Critical" (note: label says 60 = High but 60 routes to Medium).
- Routing box (radius 10, padding 16, bg by tier), thresholds `≤30 none`, `≤60 medium`, `≤90 high`, `>90 critical`:
  - none (bg teal-50): "**No risk.** Logged to daily check-in monitoring — no action needed."
  - medium (amber-50): "**Medium risk.** Routed to the offshore virtual assistant note-taking workflow. Added to the triage list for review."
  - high (coral-50): "**High risk.** Routed to a US-based care specialist. Primary physician and family are notified."
  - critical (red-50): "**Critical risk.** Emergency workflow triggered — 911/EMS notified, primary physician and family alerted simultaneously, incident report generated."
- Slider updates global topbar pill + dashboard risk value live.
- Primary "Log this escalation" → prepends `{time: localeTime, tier, score}`; log row: "<time> — score <n>" + tier pill; activity "**HITL escalation** logged — <tier label lowercased>"; toast "Escalation logged and routed."
- Card 2: h3 "Escalation log"; empty "No escalations logged yet."
- Tier labels (`tierMeta`, used on pill):
  - none: "No risk on file" (`pill-none`)
  - medium: "Medium risk — offshore VA notified" (`pill-medium`)
  - high: "High risk — US specialist routed" (`pill-high`)
  - critical: "Critical — emergency workflow active" (`pill-critical`)

## 3. State model

```js
state = { onboarded:false, onboardStep:1, onboardMethod:'self', language:'en', accountType:'patient',
  patientName:'', planTier:'essentials', meds:[], riskScore:15, riskTier:'none',
  insuranceStatus:'not_started' /* → under_review → approved */, eobs:[], lastVisitSummary:null,
  escalations:[], activity:[] }
tierLabels = {essentials:'Essentials — $39/mo', active:'Active Care — $99/mo', familyplus:'Family Plus — $199/mo'}
methodLabels = {self:'Self onboarding', chat:'Guided chat onboarding', voice:'Voice onboarding'}
languageLabels = {en:'English', es:'Español', zh:'中文', hi:'हिन्दी', vi:'Tiếng Việt', tl:'Tagalog'}
```
- Registered badge type labels: patient "Patient", family "Family member (registered a patient)", caregiver "Caregiver (registered a patient)".
- Timings: chat freeform 400ms + intent reply 500ms; transcription 1400ms; prior auth 2200ms; toast 2600ms. Activity log shows 6 most recent.
- Cross-module integration (the core demo idea): onboarding meds → assistant; transcription summary → assistant + dashboard; insurance → dashboard + assistant; HITL slider → global pill + dashboard + assistant status.

## 4. Mock / seed data (verbatim)

- Placeholders: patient "Margaret Chen"; emergency contact "David Chen", "Son", "(555) 987-6543", "name@email.com"; phone "(555) 123-4567"; pharmacy "CVS Main St"; med "Metformin"; insurer "Blue Cross Blue Shield"; policy "BCBS-88213".
- Plans: Essentials $39, Active Care $99, Family Plus $199 (per month).
- EOB: `{ date: today, service: 'Annual wellness visit', status: 'Approved' }`.
- Visit transcript:
  ```
  Dr. Alvarez: How have you been feeling since the last check-in?
  Patient: A bit more tired than usual, and my ankles have been a little swollen.
  Dr. Alvarez: Let's adjust your blood pressure medication and recheck in two weeks. Please continue the current diet plan and monitor your weight daily.
  Patient: Understood, thank you.
  ```
- Visit summary: "Mild fatigue and ankle swelling noted. Blood pressure medication adjusted; daily weight monitoring recommended; follow-up in two weeks."
- Default risk score 15.

## 5. i18n (onboarding only; `translations[key][lang]`, applied by element id)

| key | en | es | zh | hi | vi | tl |
|---|---|---|---|---|---|---|
| t_onboardHow | How would you like to onboard? | ¿Cómo le gustaría registrarse? | 您希望如何完成注册？ | आप ऑनबोर्ड कैसे होना चाहेंगे? | Bạn muốn đăng ký theo cách nào? | Paano mo gustong mag-onboard? |
| t_onboardHowSub | Choose whichever is easiest — this is remembered on the account and shown to anyone helping later. | Elija la opción más fácil; esto se recuerda en la cuenta y se muestra a quien ayude después. | 选择最方便的方式——该选择会保存在账户中，并显示给之后提供帮助的人。 | जो भी आसान लगे उसे चुनें — यह खाते में सहेजा जाता है और बाद में मदद करने वाले किसी भी व्यक्ति को दिखाया जाता है। | Chọn cách dễ nhất — thông tin này sẽ được lưu trong tài khoản và hiển thị cho người hỗ trợ sau này. | Piliin ang pinakamadaling paraan — naaalala ito sa account at ipinapakita sa sinumang tutulong mamaya. |
| t_methodSelf | Self onboarding (forms) | Registro autónomo (formularios) | 自助注册（表单） | स्वयं ऑनबोर्डिंग (फॉर्म) | Tự đăng ký (biểu mẫu) | Sariling pag-onboard (mga form) |
| t_methodChat | Guided chat onboarding | Registro guiado por chat | 引导式聊天注册 | निर्देशित चैट ऑनबोर्डिंग | Đăng ký qua trò chuyện có hướng dẫn | Ginabayang chat na pag-onboard |
| t_methodVoice | Voice onboarding | Registro por voz | 语音注册 | वॉइस ऑनबोर्डिंग | Đăng ký bằng giọng nói | Pag-onboard gamit ang boses |
| t_prefLanguage | Preferred language | Idioma preferido | 首选语言 | पसंदीदा भाषा | Ngôn ngữ ưa thích | Ginustong wika |
| t_whosRegistering | Who's registering? | ¿Quién se está registrando? | 谁在注册？ | पंजीकरण कौन कर रहा है? | Ai đang đăng ký? | Sino ang nagpaparehistro? |
| t_whosRegisteringSub | This is remembered across ElderLink and shown wherever the account appears. | Esto se recuerda en todo ElderLink y se muestra donde aparezca la cuenta. | 该信息会在 ElderLink 中保存，并在账户出现的任何地方显示。 | यह ElderLink में हर जगह याद रखा जाता है और जहाँ भी खाता दिखता है वहाँ दिखाया जाता है। | Thông tin này được ghi nhớ trên toàn bộ ElderLink và hiển thị ở bất cứ đâu tài khoản xuất hiện. | Naaalala ito sa buong ElderLink at ipinapakita saanman lumitaw ang account. |
| t_typePatient | Patient | Paciente | 患者 | मरीज़ | Bệnh nhân | Pasyente |
| t_typeFamily | Family member | Familiar | 家庭成员 | परिवार का सदस्य | Thành viên gia đình | Miyembro ng pamilya |
| t_typeCaregiver | Caregiver | Cuidador | 护理人员 | देखभालकर्ता | Người chăm sóc | Tagapag-alaga |
| t_choosePlan | Choose a plan | Elija un plan | 选择套餐 | एक योजना चुनें | Chọn gói dịch vụ | Pumili ng plano |
| t_choosePlanSub | Pricing scales with the level of care coordination needed — this is remembered on the account too. | El precio varía según el nivel de coordinación de cuidados necesario; esto también se recuerda en la cuenta. | 价格随所需护理协调程度而变化——该信息同样会保存在账户中。 | कीमत आवश्यक देखभाल समन्वय के स्तर के अनुसार बदलती है — यह भी खाते में सहेजा जाता है। | Giá thay đổi theo mức độ điều phối chăm sóc cần thiết — thông tin này cũng được lưu trong tài khoản. | Nag-iiba ang presyo depende sa antas ng koordinasyon ng pangangalaga na kailangan — naaalala rin ito sa account. |
| t_tierEssentialsDesc | Medication reminders, visit summaries, basic alerts | Recordatorios de medicación, resúmenes de visitas, alertas básicas | 用药提醒、就诊摘要、基础提醒 | दवा अनुस्मारक, विज़िट सारांश, बुनियादी अलर्ट | Nhắc uống thuốc, tóm tắt lượt khám, cảnh báo cơ bản | Paalala sa gamot, buod ng bisita, pangunahing alerto |
| t_tierActiveDesc | Adds Family AI Assistant, insurance & EOB support, HITL escalation | Incluye el Asistente de IA familiar, soporte de seguro y EOB, y escalamiento HITL | 新增家庭 AI 助手、保险与 EOB 支持、人工介入升级 | फैमिली एआई असिस्टेंट, बीमा और EOB सहायता, HITL एस्केलेशन जोड़ता है | Bổ sung Trợ lý AI gia đình, hỗ trợ bảo hiểm & EOB, và cơ chế chuyển cấp HITL | Nagdaragdag ng Family AI Assistant, suporta sa insurance at EOB, at HITL escalation |
| t_tierFamilyPlusDesc | Everything in Active Care, plus multi-member family access | Todo lo de Active Care, más acceso familiar multiusuario | 包含 Active Care 全部功能，另加多成员家庭访问权限 | Active Care की सभी सुविधाएँ, साथ ही बहु-सदस्य पारिवारिक पहुँच | Mọi tính năng của Active Care, cộng thêm quyền truy cập cho nhiều thành viên gia đình | Lahat ng nasa Active Care, kasama ang access ng maraming miyembro ng pamilya |
| personalInfoHeading | Personal information | Información personal | 个人信息 | व्यक्तिगत जानकारी | Thông tin cá nhân | Personal na impormasyon |
| personalInfoHeading_onBehalf | Patient's information | Información del paciente | 患者信息 | मरीज़ की जानकारी | Thông tin bệnh nhân | Impormasyon ng pasyente |
| fullNameLabel | Full name | Nombre completo | 姓名 | पूरा नाम | Họ và tên | Buong pangalan |
| fullNameLabel_onBehalf | Patient's full name | Nombre completo del paciente | 患者姓名 | मरीज़ का पूरा नाम | Họ và tên bệnh nhân | Buong pangalan ng pasyente |
| t_dob | Date of birth | Fecha de nacimiento | 出生日期 | जन्म तिथि | Ngày sinh | Petsa ng kapanganakan |
| t_phone / t_ecPhone | Phone | Teléfono | 电话 | फ़ोन | Điện thoại | Telepono |
| t_prefPharmacy | Preferred pharmacy | Farmacia preferida | 首选药房 | पसंदीदा फार्मेसी | Nhà thuốc ưa thích | Ginustong parmasya |
| t_emergencyContact | Emergency contact | Contacto de emergencia | 紧急联系人 | आपातकालीन संपर्क | Liên hệ khẩn cấp | Emergency contact |
| t_ecName | Name | Nombre | 姓名 | नाम | Tên | Pangalan |
| t_ecRel | Relationship | Parentesco | 关系 | संबंध | Mối quan hệ | Relasyon |
| t_ecEmail | Email | Correo electrónico | 电子邮箱 | ईमेल | Email | Email |
| t_currentMeds | Current medications | Medicamentos actuales | 当前用药 | वर्तमान दवाएँ | Thuốc đang dùng | Kasalukuyang gamot |
| t_currentMedsSub | Add each medication your care team should know about. This feeds the Family AI Assistant and Visit Transcription summaries. | Agregue cada medicamento que su equipo de cuidado deba conocer. Esto alimenta al Asistente de IA familiar y los resúmenes de transcripción de visitas. | 添加护理团队需要了解的每一种药物。此信息将用于家庭 AI 助手和就诊转录摘要。 | हर वह दवा जोड़ें जिसके बारे में आपकी केयर टीम को जानना चाहिए। यह फैमिली एआई असिस्टेंट और विज़िट ट्रांसक्रिप्शन सारांशों में उपयोग होता है। | Thêm từng loại thuốc mà đội ngũ chăm sóc cần biết. Thông tin này được dùng cho Trợ lý AI gia đình và bản tóm tắt ghi âm lượt khám. | Idagdag ang bawat gamot na dapat malaman ng iyong care team. Ginagamit ito ng Family AI Assistant at ng mga buod ng Visit Transcription. |
| t_addMed | + Add medication | + Agregar medicamento | + 添加药物 | + दवा जोड़ें | + Thêm thuốc | + Magdagdag ng gamot |
| obBack | Back | Atrás | 返回 | वापस | Quay lại | Bumalik |
| obNext_continue | Continue | Continuar | 继续 | जारी रखें | Tiếp tục | Magpatuloy |
| obNext_complete | Complete onboarding | Completar registro | 完成注册 | ऑनबोर्डिंग पूरी करें | Hoàn tất đăng ký | Kumpletuhin ang pag-onboard |

- Not translated: tier names/prices, placeholders, context pill, the rest of the app.

## 6. Design system

- Fonts (Google): **Poppins** 500/600 for h1–h3 + brand; **Inter** 400/500/600 body. Body 16px, line-height 1.55.
- Color tokens (CSS vars):
  - Teal: 900 `#04342C`, 800 `#085041`, 600 `#0F6E56` (primary), 400 `#1D9E75` (focus/hover/wave), 200 `#5DCAA5`, 100 `#9FE1CB`, 50 `#E1F5EE`
  - Coral: 600 `#D85A30` (record btn / high risk), 100 `#F5C4B3`, 50 `#FAECE7`, 800 `#4A1B0C`
  - Amber: 600 `#854F0B`, 400 `#EF9F27`, 50 `#FAEEDA`, 800 `#412402`
  - Red: 600 `#A32D2D`, 50 `#FCEBEB`, 800 `#501313`
  - Neutrals: cream bg `#F6F4EC`, ink `#20261F`, ink-soft `#5B6259`, ink-faint `#8A9086`, border `#DFE3D8`, card `#FFFFFF`; sidebar nav text `#CFEAE0`.
- Radius: `--radius` 14px (cards, chat window); buttons/inputs 9px; nav/toast/routing box 10px; chat msgs 12px; pills/chips/badges 100px.
- Card: white, 1px border, padding 22px 24px, margin-bottom 18; h3 16px; `.muted` 13.5px ink-soft.
- Grid gap 16px. Buttons: 14px 600, padding 10px 18px, active scale(.98); primary teal-600 → hover teal-800; outline white/border → hover border teal-600 text teal-800; disabled opacity .45.
- Inputs: padding 10px 12px, 1px border, radius 9, 14.5px; focus outline 2px teal-400 offset 1. Labels 13px 600 ink-soft.
- Status pill: padding 7px 14px, 13px 600, 8px dot. Tier colors: none = teal-50/teal-800/dot teal-600; medium = amber-50/amber-800/dot amber-400; high = coral-50/coral-800/dot coral-600; critical = red-50/red-800/dot red-600.
- Chips: teal-50 bg, teal-800 text, teal-100 border, padding 6px 13px, 13px; selected teal-600/white.
- Table: th 12.5px uppercase ink-soft, td padding 11px 10px, row borders.

## 7. Gaps / bugs to be aware of

- DOB, phone, pharmacy, emergency contact, insurance fields are collected but never stored/used; only name + meds persist.
- No validation anywhere; empty name → "Patient".
- Plan tier gates nothing (everything unlocks on Essentials) despite tier descriptions implying gating.
- Onboarding method choice is cosmetic (no chat/voice flow).
- Subtitle says "five ElderLink modules" — sidebar has 4 modules + onboarding (5 if you count onboarding).
- Slider tick "60 — High" contradicts the ≤60 = medium threshold.
- Onboarding can't be re-done cleanly (re-completing appends meds again).
- Only onboarding copy is i18n.

## 8. UX ideas worth keeping

- One onboarding powers every module ("set up once") + locked nav with explanatory toast until complete.
- Global risk pill in the topbar reflecting HITL tier everywhere.
- Shared cross-module activity timeline on the dashboard ("this is what integration looks like").
- Tiered human routing: none → daily monitoring, medium → offshore VA triage, high → US specialist + physician + family, critical → 911/EMS + all parties + incident report.
- AI guardrail bubble style (amber) that refuses diagnosis but offers documented notes / care team.
- Visit transcription → plain-English summary → contextual "consider a HITL check-in" nudge.
- On-behalf registration relabels form ("Patient's information", "Patient's full name").
- Account remembers method + language + plan and surfaces them in a sidebar "Registered as" card.
- Prior-auth status progression visible as pills (under review → approved) with EOB auto-generated.

## 9. Overlaps / conflicts

See `onboarding-offline-prototype.md` §6.
