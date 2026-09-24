export type ConsoleRole = "va" | "specialist" | "clinical";

export type ConsoleView = "queue" | "escalations" | "consent" | "metrics";

export const ROLES: {
  id: ConsoleRole;
  name: string;
  title: string;
}[] = [
  { id: "va", name: "Priya Nair", title: "VA" },
  { id: "specialist", name: "Dana Brooks", title: "Care Specialist" },
  { id: "clinical", name: "RN on call", title: "Clinical reviewer" },
];

export function roleFor(id: ConsoleRole) {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}

/** Configurable values table, v1 scope sheet. Ops sets these; defaults here. */
export const NO_ANSWER_RETRIES = 2;
export const RETRY_GAP_MINUTES = 20;
export const SUMMARY_DELIVERY_MINUTES = 30;
/** OPS-003 / ESC-001: acknowledgement target, minutes. */
export const ACK_TARGET_MINUTES = 15;
/** OPS-002: logging time target, seconds. */
export const LOGGING_TARGET_SECONDS = 60;
