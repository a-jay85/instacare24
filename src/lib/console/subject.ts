import { logCheckIn, openEscalations, todayIso } from "@/lib/actions";
import type {
  Account,
  CheckInRecord,
  CheckInState,
  EmergencyContact,
  Escalation,
  NormalDay,
} from "@/lib/types";
import { hourLabel } from "./time";

export type MedLine = {
  name: string;
  dose: string;
  purpose: string;
  when: string;
  /** Today's acknowledgement only (MED-003). */
  today?: string;
};

/**
 * Everything the call screen needs about one parent, whether she is the live
 * demo account or a synthetic roster entry.
 */
export type CallSubject = {
  key: string;
  live: boolean;
  fullName: string;
  preferredName: string;
  phone: string;
  tz: string;
  windowStart: number;
  /** "Karen", "Michael and Denise": whose feed the summary lands in. */
  familyName: string;
  specialistName: string;
  normalDay: NormalDay;
  /** Newest first, today excluded. */
  history: CheckInRecord[];
  today: CheckInRecord | null;
  meds: MedLine[];
  openEscalations: Escalation[];
  emergencyContact: EmergencyContact;
};

export const LIVE_KEY = "live";

/** "Karen", "Michael and Denise": first names of everyone on the account. */
export function familyNameOf(account: Account): string {
  const names = account.members.map((m) => m.name.split(" ")[0]);
  if (names.length <= 1) return names[0] ?? "the family";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Matches on `todayIso()`, the same date `logCheckIn` stamps, so "done today" agrees with the feed. */
export function subjectFromAccount(account: Account): CallSubject {
  const p = account.parent;
  const today = todayIso();
  const meds: MedLine[] = account.medications.map((m) => {
    if (m.schedule.kind === "as_needed")
      return {
        name: m.name,
        dose: m.dose,
        purpose: m.purpose,
        when: "As needed, no reminder",
      };
    const acks = m.schedule.hours.map((h) => {
      const ack = account.medAcks.find(
        (a) => a.medId === m.id && a.date === today && a.hour === h,
      );
      const state =
        ack?.state === "acknowledged"
          ? "confirmed"
          : ack?.state === "no_response"
            ? "no response"
            : "upcoming";
      return `${hourLabel(h)} ${state}`;
    });
    return {
      name: m.name,
      dose: m.dose,
      purpose: m.purpose,
      when: m.schedule.hours.map(hourLabel).join(", "),
      today: acks.join(" · "),
    };
  });
  return {
    key: LIVE_KEY,
    live: true,
    fullName: p.fullName,
    preferredName: p.preferredName,
    phone: p.phone,
    tz: p.parentTimezone,
    windowStart: p.checkInWindow.startHour,
    familyName: familyNameOf(account),
    specialistName: account.careTeam.specialistName,
    normalDay: p.normalDay,
    history: account.checkIns
      .filter((c) => c.date !== today)
      .sort((a, b) => b.date.localeCompare(a.date)),
    today: account.checkIns.find((c) => c.date === today && c.state) ?? null,
    meds,
    openEscalations: openEscalations(account),
    emergencyContact: p.emergencyContact,
  };
}

export type LogInput = {
  state: CheckInState;
  summary: string;
  vaName: string;
  riskScore?: number;
};

/**
 * Roster parents are not real accounts, but their calls should obey exactly
 * the same rules. Run the shared `logCheckIn` on a throwaway shell and keep
 * what it produced.
 */
export function logLocally(
  subject: CallSubject,
  input: LogInput,
): { record: CheckInRecord; escalations: Escalation[] } {
  const shell = {
    parent: { preferredName: subject.preferredName },
    checkIns: [],
    escalations: [],
  } as unknown as Account;
  const out = logCheckIn(shell, input);
  return { record: out.checkIns[0], escalations: out.escalations };
}

function sentence(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "";
  const cap = t[0].toUpperCase() + t.slice(1);
  return /[.!?]$/.test(cap) ? cap : `${cap}.`;
}

/**
 * Scripted stand-in for the AI summary. No model: it wraps the VA's notes in
 * plain, family-facing framing for each of the three states.
 */
export function draftSummary(
  subject: CallSubject,
  state: CheckInState | null,
  notes: string,
  attempts: number,
): string {
  const name = subject.preferredName;
  const body = sentence(
    notes
      .replace(/\b(pt|patient|client)\b/gi, name)
      .replace(/\bshe's\b/gi, "she is"),
  );
  if (state === "not_reached")
    return [
      `We could not reach ${name} today. We called ${attempts} ${attempts === 1 ? "time" : "times"}.`,
      body,
      `${subject.specialistName}, her Care Specialist, is being alerted now and will tell you here as soon as we know she is alright.`,
    ]
      .filter(Boolean)
      .join(" ");
  if (state === "something_off")
    return [
      `${name} picked up, but something did not sound right.`,
      body,
      `${subject.specialistName}, her Care Specialist, is being alerted now and will update you here today.`,
    ]
      .filter(Boolean)
      .join(" ");
  return [
    `${name} picked up and we talked.`,
    body || "She sounded like herself.",
  ].join(" ");
}

export const STATE_LABEL: Record<CheckInState, string> = {
  reached: "Reached",
  not_reached: "Not reached",
  something_off: "Reached — something is off",
};

export const STATE_TONE: Record<CheckInState, "moss" | "amber" | "clay"> = {
  reached: "moss",
  not_reached: "amber",
  something_off: "clay",
};

export function outcomeLabel(c: CheckInRecord | undefined | null): string {
  if (!c) return "No history";
  return c.state ? STATE_LABEL[c.state] : "No check-in logged";
}
