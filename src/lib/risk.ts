import type { Account, EscalationEvent, RiskTier } from "./types";

/**
 * HITL tiers from docs/sources/hitl.md. The old ElderLink slider labelled 60 as
 * "High"; the workflow puts 31-60 in Medium, so these edges win.
 */
export const RISK_TIERS: {
  tier: RiskTier;
  min: number;
  max: number;
  label: string;
  route: string;
  tone: "moss" | "amber" | "clay" | "critical";
}[] = [
  {
    tier: "green",
    min: 0,
    max: 30,
    label: "Low",
    route: "Keep monitoring. Logged to the daily check-in.",
    tone: "moss",
  },
  {
    tier: "medium",
    min: 31,
    max: 60,
    label: "Medium",
    route: "VA takes notes and adds her to the triage list for review.",
    tone: "amber",
  },
  {
    tier: "high",
    min: 61,
    max: 90,
    label: "High",
    route:
      "US Care Specialist takes it. Her primary doctor's office and family are notified at once.",
    tone: "clay",
  },
  {
    tier: "critical",
    min: 91,
    max: 100,
    label: "Critical",
    route:
      "Emergency workflow. VA is prompted to call 911 first. Doctor's office and family notified; incident report started.",
    tone: "critical",
  },
];

export function tierFor(score: number) {
  return (
    RISK_TIERS.find((t) => score >= t.min && score <= t.max) ?? RISK_TIERS[0]
  );
}

/**
 * Scripted stand-in for the AI score. Words from the call notes nudge it up.
 * There is no model behind this; it is a prototype.
 */
const SIGNALS: [RegExp, number][] = [
  [/\b(fell|fall|fallen|on the floor)\b/i, 45],
  [/\b(chest|can'?t breathe|short of breath|stroke|slurred)\b/i, 70],
  [/\b(confus|disorient|didn'?t know)\w*/i, 35],
  [/\b(dizz|swell|swollen|fever|pain)\w*/i, 20],
  [/\b(tired|sad|lonely|didn'?t eat|not eating|skipped)\w*/i, 12],
];

export function suggestRiskScore(notes: string, base = 8): number {
  let score = base;
  for (const [re, weight] of SIGNALS) if (re.test(notes)) score += weight;
  return Math.min(100, score);
}

/**
 * HITL routing (docs/sources/hitl.md) for a "something is off" log. SCRIPTED:
 * nothing is really sent; these timeline events stand in for the messages the
 * platform would send. High notifies the primary doctor and the family;
 * Critical adds the 911 prompt and an incident report. Low and Medium add
 * nothing. NTF-002: safety alerts ignore quiet hours.
 *
 * Roster parents run through a bare shell account, so every field may be
 * missing and the wording falls back to "her primary doctor's office" / "her
 * family".
 */
export function routingEvents(
  account: Partial<Account>,
  score: number,
  vaName: string,
  at: string,
): EscalationEvent[] {
  const tier = tierFor(score).tier;
  if (tier !== "high" && tier !== "critical") return [];

  const doctor = [...(account.visits ?? [])]
    .filter((v) => v.specialty === "Primary care")
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.provider;
  const office = doctor ? `${doctor}'s office` : "her primary doctor's office";
  const names = (account.members ?? []).map((m) => m.name.split(" ")[0]);
  const family = names.length
    ? names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
    : "her family";
  const by = "InstaCare24";

  const events: EscalationEvent[] = [];
  if (tier === "critical") {
    events.push({
      at,
      by: vaName,
      text: "was prompted to call 911 first if she may be in danger (Critical).",
      notice: "emergency",
    });
  }
  events.push(
    {
      at,
      by,
      text: doctor
        ? `Notified ${office} (primary doctor).`
        : `Notified ${office}.`,
      notice: "physician",
      who: office,
    },
    {
      at,
      by,
      text: `Alerted ${family} by app, text and email. Safety alerts ignore quiet hours.`,
      notice: "family",
      who: family,
    },
  );
  if (tier === "critical") {
    events.push({
      at,
      by,
      text: "Started an incident report for the care team.",
      notice: "incident",
    });
  }
  return events;
}
