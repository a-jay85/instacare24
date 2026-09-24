import type { RiskTier } from "./types";

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
      "US Care Specialist takes it. Primary physician and family are notified.",
    tone: "clay",
  },
  {
    tier: "critical",
    min: 91,
    max: 100,
    label: "Critical",
    route:
      "Emergency workflow. 911, physician and family alerted at once. Incident report filed.",
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
