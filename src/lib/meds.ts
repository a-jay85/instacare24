import { canDeliver, parentDate, parentToday } from "./actions";
import { formatHour, hourIn } from "./timezones";
import type { Account, Medication } from "./types";

/**
 * Pure helpers for the Medications screen and the Care hub.
 *
 * One clock: acks are keyed by `parentToday()` (same key the seed and
 * `acknowledgeMed` use), and "has this dose's time passed?" is answered on
 * the same wall clock (MED-001: reminders run parent-local).
 */

export type DoseState =
  | "acknowledged"
  | "upcoming"
  | "no_response"
  /** Added after this time had already passed today; first reminder is tomorrow. */
  | "starts_tomorrow"
  /** Consent not given yet (AUT-002). */
  | "paused"
  /** She withdrew consent (AUT-003), or the account is closed (BIL-002). */
  | "stopped";

/** Why no reminders are going out, or null if they are. */
export function remindersOff(
  account: Account,
): null | "pending" | "withdrawn" | "deceased" | "paused" {
  if (canDeliver(account)) return null;
  if (account.deceasedAt) return "deceased";
  if (account.parent.consent.state === "withdrawn") return "withdrawn";
  if (account.parent.consent.state === "granted") return "paused";
  return "pending";
}

/** Current hour, 0-23, in the parent's timezone. */
export function parentHourNow(timezone: string): number {
  return hourIn(timezone);
}

/**
 * True when the med went on the list today after this dose's hour, on her
 * clock. That one dose never went out; every later day's dose does.
 */
function addedAfter(account: Account, med: Medication, hour: number): boolean {
  if (!med.addedAt) return false;
  const added = new Date(med.addedAt);
  if (parentDate(account, added) !== parentToday(account)) return false;
  return hourIn(account.parent.parentTimezone, added) >= hour;
}

/** [8, 18] -> "8:00 AM · 6:00 PM" */
export function formatTimes(hours: number[]): string {
  return [...hours]
    .sort((a, b) => a - b)
    .map(formatHour)
    .join(" · ");
}

/** [8, 18] -> "8:00 AM and 6:00 PM" */
export function formatTimesSentence(hours: number[]): string {
  const labels = [...hours].sort((a, b) => a - b).map(formatHour);
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/**
 * MED-003: today's state for one scheduled dose. Today only, never history.
 * AUT-002: without her consent nothing is sent, so nothing can be missed.
 */
export function doseState(
  account: Account,
  medId: string,
  hour: number,
  nowHour: number,
): DoseState {
  const off = remindersOff(account);
  if (off) return off === "pending" || off === "paused" ? "paused" : "stopped";
  const today = parentToday(account);
  const ack = account.medAcks.find(
    (a) => a.medId === medId && a.date === today && a.hour === hour,
  );
  if (ack?.state === "acknowledged") return "acknowledged";
  if (ack?.state === "no_response") return "no_response";
  if (hour > nowHour) return "upcoming";
  // Her hour has passed. The reminder went out and is not confirmed yet,
  // unless the med was only added after that hour today.
  const med = account.medications.find((m) => m.id === medId);
  return med && addedAfter(account, med, hour)
    ? "starts_tomorrow"
    : "no_response";
}

export function scheduledMeds(account: Account): Medication[] {
  return account.medications.filter((m) => m.schedule.kind === "scheduled");
}

export function asNeededMeds(account: Account): Medication[] {
  return account.medications.filter((m) => m.schedule.kind === "as_needed");
}

/** The next reminder still to go out today, parent-local. */
export function nextReminder(
  account: Account,
  nowHour: number,
): { hour: number; meds: Medication[] } | null {
  if (!canDeliver(account)) return null;
  let best: number | null = null;
  for (const med of scheduledMeds(account)) {
    if (med.schedule.kind !== "scheduled") continue;
    for (const h of med.schedule.hours) {
      if (h > nowHour && (best === null || h < best)) best = h;
    }
  }
  if (best === null) return null;
  const hour = best;
  const meds = scheduledMeds(account).filter(
    (m) => m.schedule.kind === "scheduled" && m.schedule.hours.includes(hour),
  );
  return { hour, meds };
}

/** Hours offered in the add-medication sheet: 7 AM to 9 PM. */
export const REMINDER_HOURS = Array.from({ length: 15 }, (_, i) => 7 + i);

export function shortHour(h: number): string {
  const n = ((h + 11) % 12) + 1;
  return `${n} ${h < 12 ? "AM" : "PM"}`;
}

export function newMedId(): string {
  return `med_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Scripted "AI" label read. No model is called; a fixed sample is returned
 * after a short pause so the demo can show the confirm-before-save step.
 */
export const SAMPLE_LABEL_SCAN = {
  name: "Amlodipine",
  dose: "5 mg",
  purpose: "Blood pressure",
  hours: [9],
  instructions: "Take one tablet by mouth once daily.",
};
