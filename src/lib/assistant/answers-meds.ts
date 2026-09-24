import { canDeliver, todayIso } from "../actions";
import { authorizedAgent, canEditCareInstructions } from "../permissions";
import { formatHour } from "../timezones";
import type { Account, Medication } from "../types";
import { firstName, list, parentHourNow, visitSource } from "./format";
import type { Reply } from "./types";

/** Scripted answers for medications. No model. MED-002 / MED-003 wording. */

function scheduleText(m: Medication): string {
  if (m.schedule.kind === "as_needed") return "as needed, no reminder";
  return list(m.schedule.hours.map(formatHour));
}

const MED_LINK = {
  kind: "link" as const,
  label: "Open medications",
  href: "/care/medications",
};
const MED_SOURCE = {
  module: "Medication list",
  verification: "record" as const,
};

function notRunning(account: Account): string | undefined {
  if (canDeliver(account)) return undefined;
  const name = account.parent.preferredName;
  if (account.deceasedAt) return `Every reminder for ${name} has stopped.`;
  if (account.parent.consent.state === "withdrawn")
    return `Reminders have stopped: ${name} withdrew her consent.`;
  return `Reminders are not running yet: ${name} has not agreed to calls.`;
}

export function medsReply(account: Account): Reply {
  const name = account.parent.preferredName;
  if (account.medications.length === 0) {
    return {
      intent: "meds",
      tone: "default",
      body: [`There are no medications on ${name}'s list yet.`],
      actions: [MED_LINK],
    };
  }
  const body = [
    `${name} has ${account.medications.length} medications on her list.`,
  ];
  const off = notRunning(account);
  if (off) body.push(off);
  if (!canEditCareInstructions(account)) {
    const agent = authorizedAgent(account);
    body.push(
      `Only ${agent ? firstName(agent.name) : "her healthcare proxy"} can change this list.`,
    );
  }
  return {
    intent: "meds",
    tone: "default",
    body,
    items: account.medications.map((m) => {
      const when = scheduleText(m);
      return `${m.name} ${m.dose}: ${m.purpose.toLowerCase()}. ${when[0].toUpperCase()}${when.slice(1)}.`;
    }),
    sources: [MED_SOURCE],
    actions: [MED_LINK],
    suggestions: [
      "What's her next reminder?",
      "Did she take her morning pills?",
    ],
  };
}

export function medPurposeReply(
  account: Account,
  med?: Medication,
  unknownWord?: string,
): Reply {
  const name = account.parent.preferredName;
  if (!med) {
    const names = account.medications.map((m) => m.name);
    return {
      intent: "med_purpose",
      tone: "default",
      body: [
        `I don't see "${unknownWord ?? "that"}" on ${name}'s medication list.`,
        names.length
          ? `Her list has ${list(names)}.`
          : "Her list is empty right now.",
      ],
      sources: [MED_SOURCE],
      actions: [MED_LINK],
    };
  }
  const body = [
    `${med.name} ${med.dose} is for ${med.purpose.toLowerCase()}. Schedule: ${scheduleText(med)}.`,
  ];
  if (med.instructions) body.push(med.instructions);
  const sources: Reply["sources"] = [MED_SOURCE];
  const visit = account.visits.find((v) =>
    v.medicationChanges.some((c) =>
      c.toLowerCase().includes(med.name.toLowerCase()),
    ),
  );
  if (visit) sources.push(visitSource(visit));
  return {
    intent: "med_purpose",
    tone: "default",
    body,
    sources,
    actions: [MED_LINK],
    suggestions: ["What's her next reminder?", "What did the doctor change?"],
  };
}

/** MED-003: today's acknowledgements only. No history, no streaks, no percentages. */
export function medTodayLines(account: Account): {
  items: string[];
  next?: string;
} {
  const today = todayIso();
  const now = parentHourNow(account.parent.parentTimezone);
  const byHour = new Map<number, Medication[]>();
  for (const m of account.medications) {
    if (m.schedule.kind !== "scheduled") continue;
    for (const h of m.schedule.hours)
      byHour.set(h, [...(byHour.get(h) ?? []), m]);
  }
  const items: string[] = [];
  let next: string | undefined;
  for (const hour of [...byHour.keys()].sort((a, b) => a - b)) {
    const meds = byHour.get(hour) ?? [];
    const states = meds.map(
      (m) =>
        account.medAcks.find(
          (a) => a.medId === m.id && a.date === today && a.hour === hour,
        )?.state,
    );
    const label = states.every((s) => s === "acknowledged")
      ? "Acknowledged"
      : states.some((s) => s === "no_response")
        ? "No response yet"
        : hour > now
          ? "Coming up"
          : "Not logged";
    items.push(
      `${formatHour(hour)}: ${list(meds.map((m) => m.name))}. ${label}.`,
    );
    if (!next && hour > now && label !== "Acknowledged")
      next = `${list(meds.map((m) => m.name))} at ${formatHour(hour)} her time`;
  }
  return { items, next };
}

export function medTodayReply(account: Account, question: string): Reply {
  const name = account.parent.preferredName;
  const off = notRunning(account);
  if (off || account.medications.length === 0) {
    return {
      intent: "med_today",
      tone: "default",
      body: [off ?? `There are no medications on ${name}'s list yet.`],
      actions: [MED_LINK],
    };
  }
  const { items, next } = medTodayLines(account);
  const body: string[] = [];
  if (/\b(yesterday|week|last|always|usually|history)\b/i.test(question))
    body.push(
      "I only show today's reminders. There is no history or score, on purpose.",
    );
  body.push(
    next ? `Next reminder: ${next}.` : "All of today's reminders are done.",
  );
  body.push(
    `"Acknowledged" means ${name} confirmed the reminder. Nobody watches her take it.`,
  );
  const asNeeded = account.medications.filter(
    (m) => m.schedule.kind === "as_needed",
  );
  if (asNeeded.length)
    body.push(
      `${list(asNeeded.map((m) => m.name))} is as needed, so it never shows as missed.`,
    );
  return {
    intent: "med_today",
    tone: "default",
    body,
    items,
    sources: [
      {
        module: "Medication reminders",
        at: todayIso(),
        verification: "record",
      },
    ],
    actions: [MED_LINK],
  };
}
