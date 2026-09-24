import type { Account, Medication } from "../types";
import { medicalAdviceKind } from "./guardrails";
import type { Intent } from "./types";

/**
 * Scripted intent detection. Spec step D, "AI Identifies User Intent", with no
 * model behind it: an ordered list of keyword rules, first match wins.
 *
 * Order matters. Safety first (emergency, then medical-advice guardrail), then
 * the specific intents, then the broad ones. A question that matches nothing is
 * "low confidence" and gets a clarifying reply.
 */

export type Detected = {
  intent: Intent;
  /** The medication the question is about, if one was named. */
  med?: Medication;
  /** A word the user asked about that is not on her list ("what is X for"). */
  unknownWord?: string;
};

const EMERGENCY =
  /\b(fell|fallen|has had a fall|on the floor|can'?t get up|not breathing|isn'?t breathing|stopped breathing|can'?t breathe|trouble breathing|unresponsive|unconscious|passed out|collapsed|won'?t wake|chest pains?|stroke|slurr\w*|bleeding|seizure|overdosed?|took too many|911|ambulance|emergency(?! contact))\b/;

const RULES: [Intent, RegExp][] = [
  ["transcript", /\b(transcript|word for word|exact words|recording)\b/],
  [
    "insurance_denied",
    /\b(denied|denial|rejected|refused|appeal\w*|prior auth\w*|pre-?auth\w*)\b/,
  ],
  [
    "insurance_owe",
    /\b(owe|owed|bills?|pay|paying|copays?|costs?|charged?|balance|out of pocket)\b/,
  ],
  [
    "insurance",
    /\b(insurance|insured|eobs?|explanation of benefits|claims?|medicare|bcbs|blue cross|coverage|covered|deductible|member id)\b/,
  ],
  [
    "consent",
    /\b(consent\w*|agreed|agree|signed up|withdr\w*|opt(ed)? out|stop calling|said yes)\b/,
  ],
  [
    "escalations",
    /\b(escalat\w*|anyone (handling|on it|looking)|who('s| is) (handling|on it|looking into)|open (issues?|cases?|alerts?)|alerts?|is someone (on|handling))\b/,
  ],
  [
    "talk",
    /\b(talk to|speak (to|with)|call me|call back|callback|a human|real person|reach (someone|dana|priya))\b/,
  ],
  [
    "care_team",
    /\b(care team|team|who calls|who('s| is) (priya|dana|denise|michael|karen)|virtual assistant|care specialist|emergency contact|who('s| is) (her|his) doctors?|(her|his) doctors|which doctors?|poa|proxy|who decides|family members?)\b/,
  ],
  [
    "appointments",
    /\b(appointments?|follow[- ]?ups?|next (visit|appointment)|upcoming|recheck|coming up|calendar|physical therap\w*)\b/,
  ],
  [
    "med_today",
    /\b(next (reminder|dose|pill|med\w*)|did (she|he) (take|acknowledge|get)|(has|have) (she|he) taken|today'?s (meds|medications|reminders|pills)|miss(ed)? (a |any )?(dose|med\w*|pill|reminder)s?|reminders?|acknowledg\w*)\b/,
  ],
  [
    "meds",
    /\b(meds?|medications?|medicines?|pills?|prescriptions?|tablets?|refills?|pharmacy|doses?|dosage)\b/,
  ],
  [
    "visit",
    /\b(visits?|doctor|dr\.?|alvarez|okafor|physician|summary|knee|ortho\w*|what did (the|her|his) \w+ say)\b/,
  ],
  [
    "checkins",
    /\b(check[- ]?ins?|did \w+ (call|reach|speak to|talk to) (her|him|mom|mum|dad)|week|last (few|couple( of)?)? ?days|called|calls|recent(ly)?|history|yesterday|how has (she|he) been|lately|answer(ed)?)\b/,
  ],
  [
    "status",
    /\b(how('s| is) \w+|today|okay|ok|alright|all right|fine|status|update|doing|news|heard from)\b/,
  ],
  [
    "help",
    /^(hi|hello|hey|thanks|thank you|help)\b|what can you|how does this work/,
  ],
  ["care_team", /\bwho\b/],
];

/** Brand names families actually type, mapped to the generic on her list. */
const BRANDS: Record<string, string> = {
  tylenol: "acetaminophen",
  paracetamol: "acetaminophen",
  zestril: "lisinopril",
  prinivil: "lisinopril",
  glucophage: "metformin",
  lipitor: "atorvastatin",
};

function findMed(text: string, meds: Medication[]): Medication | undefined {
  const generic = Object.entries(BRANDS).find(([brand]) =>
    text.includes(brand),
  )?.[1];
  return meds.find((m) => {
    const name = m.name.toLowerCase();
    return text.includes(name) || name === generic;
  });
}

export function detectIntent(raw: string, account: Account): Detected {
  const text = raw.toLowerCase().replace(/[’‘]/g, "'").trim();
  const med = findMed(text, account.medications);

  if (EMERGENCY.test(text)) return { intent: "emergency" };
  if (medicalAdviceKind(text, Boolean(med)))
    return { intent: "guardrail", med };

  // "What is X for?" / "Why does she take X?"
  const purpose =
    text.match(
      /what(?:'s| is| are) (?:the |her |his |this )?([a-z-]+) for\b/,
    ) ??
    text.match(
      /why (?:does|is) (?:she|he) (?:take|taking|on) (?:the )?([a-z-]+)/,
    );
  if (purpose && med) return { intent: "med_purpose", med };

  for (const [intent, re] of RULES) {
    if (!re.test(text)) continue;
    // A named medication sharpens a general meds question.
    if (intent === "meds" && med) return { intent: "med_purpose", med };
    return { intent, med };
  }

  if (med) return { intent: "med_purpose", med };
  if (purpose) return { intent: "med_purpose", unknownWord: purpose[1] };
  return { intent: "fallback" };
}
