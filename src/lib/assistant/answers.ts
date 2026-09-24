import type { Account } from "../types";
import { deniedReply, insuranceReply, oweReply } from "./answers-insurance";
import {
  callback,
  checkinsReply,
  consentReply,
  deceasedReply,
  statusReply,
} from "./answers-day";
import { medPurposeReply, medTodayReply, medsReply } from "./answers-meds";
import {
  careTeamReply,
  emergencyReply,
  escalationsReply,
  talkReply,
} from "./answers-people";
import {
  appointmentsReply,
  transcriptReply,
  visitReply,
} from "./answers-visits";
import { primaryDoctor } from "./format";
import { guardrailReply } from "./guardrails";
import { detectIntent } from "./intents";
import type { Reply } from "./types";

/**
 * The Family AI Assistant's answer step (spec E–G): intent → live Account data
 * → reply with provenance. Scripted and deterministic; nothing leaves the page.
 */

/** Suggested prompts, built from what this family actually has on file. */
export function suggestionsFor(account: Account): string[] {
  const name = account.parent.preferredName;
  // BIL-002: after a death, nothing about her day. Just the people and the bills.
  if (account.deceasedAt) {
    return [
      "Talk to someone",
      ...(account.eobs.length ? ["What do we owe?"] : []),
      "Who is on her care team?",
    ];
  }
  const out = [`How is ${name} today?`];
  if (account.parent.consent.state !== "granted")
    out.push("Has she agreed yet?");
  const scheduled = account.medications.find(
    (m) => m.schedule.kind === "scheduled",
  );
  if (scheduled) out.push("What's her next reminder?");
  const doctor = primaryDoctor(account);
  if (doctor) out.push(`What did Dr. ${doctor.split(" ").pop()} say?`);
  if (account.visits.some((v) => v.followUps.length))
    out.push("Any appointments coming up?");
  if (account.eobs.length) out.push("What do we owe?");
  if (scheduled)
    out.push(`Should she stop the ${scheduled.name.toLowerCase()}?`);
  out.push("Who is on her care team?", "Talk to someone");
  return out;
}

/** The opening bubble. Quiet and human-first after a death (BIL-002). */
export function greeting(account: Account, memberFirstName?: string): Reply {
  const name = account.parent.preferredName;
  const hi = `Hi ${memberFirstName ?? "there"}.`;
  const body = account.deceasedAt
    ? [
        `${hi} We are so sorry about ${name}. Her calls and reminders have stopped.`,
        `${account.careTeam.specialistName} is here for anything that is left, whenever you are ready.`,
      ]
    : [
        `${hi} I can answer questions about ${name}'s day, medications, doctor visits and insurance. I can't give medical advice, but I can get you to someone who can.`,
      ];
  return { intent: "help", tone: "default", body };
}

function helpReply(account: Account): Reply {
  if (account.deceasedAt)
    return { ...greeting(account), actions: [callback(account, "hi")] };
  return {
    intent: "help",
    tone: "default",
    body: [
      `I can answer questions about ${account.parent.preferredName}'s check-ins, medications, doctor visits, appointments and insurance, and I can get a person on the phone for you. I can't give medical advice.`,
    ],
    suggestions: suggestionsFor(account).slice(0, 4),
  };
}

function fallbackReply(
  account: Account,
  question: string,
  misses: number,
): Reply {
  if (misses >= 1)
    return {
      intent: "fallback",
      tone: "default",
      body: [
        "I'm still not sure what you need, sorry.",
        `${account.careTeam.specialistName} can answer it by phone instead.`,
      ],
      actions: [callback(account, question)],
      suggestions: suggestionsFor(account).slice(0, 3),
    };
  return {
    intent: "fallback",
    tone: "default",
    body: ["I'm not sure I followed. Is it one of these?"],
    suggestions: suggestionsFor(account).slice(0, 5),
  };
}

/**
 * `misses`: how many fallbacks in a row came just before this question. The
 * spec clarifies once, then offers a human.
 */
export function answer(account: Account, question: string, misses = 0): Reply {
  const d = detectIntent(question, account);
  if (
    account.deceasedAt &&
    [
      "status",
      "checkins",
      "med_today",
      "meds",
      "med_purpose",
      "appointments",
    ].includes(d.intent)
  )
    return deceasedReply(account, question);

  switch (d.intent) {
    case "emergency":
      return emergencyReply(account, question);
    case "guardrail":
      return guardrailReply(account, question, d.med);
    case "status":
      return statusReply(account, question);
    case "checkins":
      return checkinsReply(account, question);
    case "med_purpose":
      return medPurposeReply(account, d.med, d.unknownWord);
    case "med_today":
      return medTodayReply(account, question);
    case "meds":
      return medsReply(account);
    case "appointments":
      return appointmentsReply(account);
    case "visit":
      return visitReply(account, question);
    case "transcript":
      return transcriptReply(account, question);
    case "insurance_owe":
      return oweReply(account, question);
    case "insurance_denied":
      return deniedReply(account, question);
    case "insurance":
      return insuranceReply(account, question);
    case "care_team":
      return careTeamReply(account);
    case "escalations":
      return escalationsReply(account, question);
    case "talk":
      return talkReply(account, question);
    case "consent":
      return consentReply(account);
    case "help":
      return helpReply(account);
    case "fallback":
      return fallbackReply(account, question, misses);
  }
}
