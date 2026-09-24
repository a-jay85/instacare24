import { CHECK_IN } from "@/lib/config";
export type ConsoleRole = "va" | "specialist" | "clinical";

export type ConsoleView =
  | "queue"
  | "escalations"
  | "families"
  | "visits"
  | "consent"
  | "roster"
  | "metrics";

export const ROLES: {
  id: ConsoleRole;
  name: string;
  title: string;
}[] = [
  { id: "va", name: "Priya Nair", title: "VA" },
  { id: "specialist", name: "Dana Brooks", title: "Care Specialist" },
  { id: "clinical", name: "Grace Lin", title: "Clinical reviewer, RN" },
];

/**
 * What each seat sees, home first. The VA calls and logs (OPS-001/002); the
 * Care Specialist owns escalations, consent calls and visit review (OPS-003,
 * AUT-002, Epic 8); the clinical reviewer takes medical questions and reads
 * the rest, with Families as her read-only view of the parent (ESC-004).
 * The VA keeps Consent calls because a parent withdraws through her (AUT-003).
 * Families is the Care Specialist's read-only copy of what the VA sees before
 * a call, so a family handed over keeps its context (OPS-004).
 */
export const VIEWS_FOR: Record<ConsoleRole, ConsoleView[]> = {
  va: ["queue", "escalations", "consent", "metrics"],
  specialist: [
    "escalations",
    "families",
    "consent",
    "visits",
    "roster",
    "metrics",
  ],
  clinical: ["escalations", "families"],
};

/**
 * OPS-005 / CHK-006: today's VA shifts. SCRIPTED staffing. Only Priya has a
 * seat in this console; the others exist so a family can move between voices
 * and a day off can be covered.
 */
export const VA_STAFF: { name: string; shift: string | null }[] = [
  { name: "Priya Nair", shift: "8 AM – 4 PM Eastern" },
  { name: "Marcus Hale", shift: "11 AM – 7 PM Eastern" },
  { name: "Ana Souza", shift: null },
];

export function onShift(name: string): boolean {
  return Boolean(VA_STAFF.find((v) => v.name === name)?.shift);
}

/**
 * CHK-006: the seat VA calls her own families, plus anyone whose usual VA is
 * off today. A family whose VA is on shift elsewhere stays with that VA.
 */
export function callsFor(va: string, usualVa: string): boolean {
  return usualVa === va || !onShift(usualVa);
}

/** The view a role may see: the one asked for if allowed, else its home. */
export function viewFor(role: ConsoleRole, view: ConsoleView): ConsoleView {
  const allowed = VIEWS_FOR[role];
  return allowed.includes(view) ? view : allowed[0];
}

export function roleFor(id: ConsoleRole) {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}

/** Configurable values table, v1 scope sheet. Ops sets these; defaults here. */
export const NO_ANSWER_RETRIES = CHECK_IN.noAnswerRetries;
export const RETRY_GAP_MINUTES = CHECK_IN.retryGapMinutes;
export const SUMMARY_DELIVERY_MINUTES = 30;
/** OPS-003 / ESC-001: acknowledgement target, minutes. */
export const ACK_TARGET_MINUTES = 15;
/** OPS-002: logging time target, seconds. */
export const LOGGING_TARGET_SECONDS = 60;
