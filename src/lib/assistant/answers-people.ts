import { openEscalations } from "../actions";
import { roleLabel } from "../permissions";
import { suggestRiskScore } from "../risk";
import type { Account } from "../types";
import { callback, FEED_LINK, me } from "./answers-day";
import { firstName, stamp } from "./format";
import type { Reply } from "./types";

/** Scripted answers about people: team, escalations, a human, emergencies. */

export function careTeamReply(account: Account): Reply {
  const { parent, careTeam } = account;
  const doctors = [
    ...new Map(account.visits.map((v) => [v.provider, v.specialty])).entries(),
  ];
  return {
    intent: "care_team",
    tone: "default",
    body: [`These are the people around ${parent.preferredName}.`],
    items: [
      `${careTeam.vaName}, Virtual Assistant. Makes her daily call.`,
      `${careTeam.specialistName}, Care Specialist. Takes anything that needs a person, and calls you back.`,
      ...doctors.map(([p, s]) => `${p}, ${s.toLowerCase()}.`),
      ...account.members.map(
        (m) =>
          `${m.name}, ${m.relationshipToParent.toLowerCase()}. ${roleLabel(m)}.`,
      ),
      `Emergency contact: ${parent.emergencyContact.name} (${parent.emergencyContact.relationship.toLowerCase()}), ${parent.emergencyContact.phone}.`,
    ],
    sources: [{ module: "Profile and care team", verification: "record" }],
    actions: [{ kind: "link", label: "Open profile", href: "/profile" }],
  };
}

export function escalationsReply(account: Account, question: string): Reply {
  const open = openEscalations(account);
  const now = Date.now();
  if (open.length === 0) {
    const last = account.escalations.find((e) => e.resolvedAt);
    return {
      intent: "escalations",
      tone: "default",
      body: [
        "Nothing is open right now.",
        ...(last
          ? [
              `The last one, "${last.title}", was resolved ${stamp(last.resolvedAt!)}: ${last.resolution}`,
            ]
          : []),
      ],
      sources: last
        ? [
            {
              module: "Escalations",
              at: last.resolvedAt,
              verification: "human_verified",
              by: last.owner,
            },
          ]
        : undefined,
      actions: [callback(account, question)],
    };
  }
  return {
    intent: "escalations",
    tone: "default",
    body: [
      `${open.length === 1 ? "One thing is" : `${open.length} things are`} open.`,
    ],
    items: open.map((e) => {
      if (e.owner)
        return `${e.title}. ${e.owner} has it. Next: ${e.nextAction}`;
      const late = now - new Date(e.openedAt).getTime() > 15 * 60_000;
      return `${e.title}. Waiting for someone to take it${late ? ", and it is overdue. The team has been flagged" : ""}. Opened ${stamp(e.openedAt)}.`;
    }),
    sources: [
      { module: "Escalations", at: open[0].openedAt, verification: "record" },
    ],
    actions: [FEED_LINK, callback(account, question)],
  };
}

export function talkReply(account: Account, question: string): Reply {
  const specialist = account.careTeam.specialistName;
  const pending = openEscalations(account).find(
    (e) => e.source === "family_request",
  );
  const body = [
    `${specialist}, ${account.parent.preferredName}'s Care Specialist, can call you back. Usually within 15 minutes during staffed hours. A person, not a chatbot.`,
  ];
  if (pending)
    body.push(
      `You already asked on ${stamp(pending.openedAt)}. ${pending.owner ? `${pending.owner} has it.` : "It is waiting for her to pick it up."}`,
    );
  return {
    intent: "talk",
    tone: "default",
    body,
    actions: [callback(account, question)],
  };
}

export function emergencyReply(account: Account, question: string): Reply {
  const { parent, careTeam } = account;
  const ec = parent.emergencyContact;
  const specialist = careTeam.specialistName;
  return {
    intent: "emergency",
    tone: "emergency",
    body: [
      "Call 911 now. I can't call for you.",
      `Then tap below and ${firstName(specialist)} will be alerted straight away. She will call ${ec.name} and you.`,
    ],
    items: [
      `${parent.preferredName}'s phone: ${parent.phone}`,
      `Emergency contact: ${ec.name}, ${ec.phone}`,
    ],
    actions: [
      { kind: "tel", label: "Call 911", href: "tel:911" },
      {
        kind: "escalate",
        label: `Alert ${firstName(specialist)} now`,
        title: `Emergency reported by ${firstName(me(account))}`,
        detail: `"${question}". Reported through the family assistant; ${firstName(me(account))} was told to call 911.`,
        riskScore: Math.max(suggestRiskScore(question), 91),
        confirm: `${specialist} has been alerted as an emergency. She will call ${ec.name} and you. Stay on with 911.`,
      },
      {
        kind: "tel",
        label: `Call ${ec.name}`,
        href: `tel:${ec.phone.replace(/\D/g, "")}`,
      },
    ],
    sources: [{ module: "Profile, emergency contact", verification: "record" }],
  };
}
