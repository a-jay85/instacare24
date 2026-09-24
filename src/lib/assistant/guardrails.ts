import { currentMember } from "../permissions";
import type { Account, Medication } from "../types";
import {
  firstName,
  latestVisit,
  primaryDoctor,
  restrictedNote,
  stamp,
  visitSource,
} from "./format";
import type { Reply, ReplyAction, Source } from "./types";

/**
 * ESC-004 / spec step G, "Apply AI Guardrails": no diagnosis, no prescription,
 * no treatment recommendation, no lab interpretation. Informational
 * coordination only. Medical questions get the boundary, what the doctor
 * documented, and a route to a human.
 */

export type AdviceKind = "diagnosis" | "dosing" | "treatment" | "lab";

const CHANGE =
  /\b(double|halve|increase|decrease|lower|raise|cut|skip|stop|quit|extra|another|more of|less of|take more|take less)\b/;
const MED_NOUN =
  /\b(doses?|dosage|pills?|tablets?|meds?|medications?|medicines?|acetaminophen|tylenol|ibuprofen|advil|aspirin|insulin)\b/;

const PATTERNS: [AdviceKind, RegExp][] = [
  [
    "lab",
    /\b(a1c|hba1c|labs?|blood (test|work)|test results?|results? mean|x-?ray (show|say|mean)\w*|glucose|what('s| is) (her|his) blood (sugar|pressure)|(sugar|pressure|cholesterol) (level|reading|number)s?)\b/,
  ],
  [
    "dosing",
    /\b(should|can|could|is it (ok|okay|safe)|safe to)\b[^?]*\b(stop|skip|start|double|quit|halve|mix|combine|come off|cut back)\b|\b(interact\w*|with alcohol|drink alcohol)\b/,
  ],
  [
    "treatment",
    /\b(what should (she|we|i) do about|how (do|can|should) (we|i|she) treat|treatments?|cure|remed(y|ies)|side effects?|surgery|should (she|we) (see|get|have) (a|an|the) (specialist|surgery|scan|test))\b/,
  ],
  [
    "diagnosis",
    /\b(diagnos\w*|is (it|this|that) (serious|bad|dangerous|normal|worrying|cancer|a problem)|should (i|we) (be )?worr(y|ied)|what('s| is) wrong with|does (she|he) have (cancer|dementia|alzheimer\w*|diabetes|parkinson\w*|an? (infection|condition|disease|tumou?r|clot))|is (she|he) (sick|dying)|prognosis|why is (she|he) (so )?(tired|swollen|dizzy|confused)|what causes|why are (her|his) \w+ swollen)\b/,
  ],
];

/** `namesMed`: the question names one of her medications. */
export function medicalAdviceKind(
  text: string,
  namesMed = false,
): AdviceKind | null {
  if (PATTERNS[0][1].test(text)) return "lab";
  if (CHANGE.test(text) && (namesMed || MED_NOUN.test(text))) return "dosing";
  for (const [kind, re] of PATTERNS) if (re.test(text)) return kind;
  return null;
}

const BOUNDARY: Record<AdviceKind, string> = {
  dosing: "I can't advise on starting, stopping or changing a medication.",
  diagnosis: "I can't say what is causing something or how serious it is.",
  treatment: "I can't recommend a treatment.",
  lab: "I can't interpret test results or readings.",
};

/** Seed has no practice numbers yet. Demo placeholder, 555 range. */
export const DOCTOR_OFFICE_PHONE = "(718) 555-0180";

export function guardrailReply(
  account: Account,
  question: string,
  med?: Medication,
): Reply {
  const kind =
    medicalAdviceKind(question.toLowerCase(), Boolean(med)) ?? "diagnosis";
  const name = account.parent.preferredName;
  const doctor = primaryDoctor(account);
  const me = currentMember(account)?.name ?? "The family";
  const specialist = account.careTeam.specialistName;
  const privacy = restrictedNote(account);

  const body = [
    `${BOUNDARY[kind]} That is a question for ${doctor ?? "her doctor"}, who knows ${name}'s history.`,
  ];
  const items: string[] = [];
  const sources: Source[] = [];

  const visit = latestVisit(account);
  if (med) {
    const change = account.visits.find((v) =>
      v.medicationChanges.some((c) =>
        c.toLowerCase().includes(med.name.toLowerCase()),
      ),
    );
    // The visit's own wording says the same as the instructions; show it once.
    const note = med.instructions && !change ? ` ${med.instructions}` : "";
    items.push(
      `${med.name} ${med.dose}, for ${med.purpose.toLowerCase()}.${note}`,
    );
    sources.push({ module: "Medication list", verification: "record" });
    if (change) {
      items.push(
        ...change.medicationChanges.filter((c) =>
          c.toLowerCase().includes(med.name.toLowerCase()),
        ),
      );
      sources.push(visitSource(change));
    }
  } else if (kind === "lab") {
    body.push(`There are no lab results in ${name}'s file here.`);
  } else if (visit) {
    if (privacy) items.push(visit.plain);
    else items.push(...visit.diagnoses, ...visit.reminders);
    sources.push(visitSource(visit));
  }

  if (items.length > 0) {
    const when = visit && !med ? ` on ${stamp(visit.date)}` : "";
    body.push(`Here is what was documented${when}:`);
  }

  const actions: ReplyAction[] = [
    {
      kind: "escalate",
      label: `Ask ${firstName(specialist)}`,
      title: `${firstName(me)} has a medical question about ${name}`,
      detail: `Asked the assistant: "${question}". Needs the doctor's office or a clinician, not the assistant.`,
      confirm: `${specialist} has your question and will call you back, usually within 15 minutes during staffed hours. She can reach ${doctor ?? "the doctor's office"} for you.`,
    },
  ];
  if (doctor) {
    actions.push({
      kind: "tel",
      label: `Call ${doctor}'s office`,
      href: `tel:${DOCTOR_OFFICE_PHONE.replace(/\D/g, "")}`,
    });
  }

  return {
    intent: "guardrail",
    tone: "guardrail",
    body,
    items: items.length ? items : undefined,
    privacy: items.length && !med ? privacy : undefined,
    sources: sources.length ? sources : undefined,
    actions,
  };
}
