import type { Account, Escalation } from "@/lib/types";
import { minsAgo } from "./roster";

/**
 * Synthetic escalations, a pending consent call and metric baselines for the
 * rest of the VA's shift. Page state only, never persisted.
 */

export type ConsoleEscalation = {
  parentName: string;
  live: boolean;
  esc: Escalation;
};

/** A few other families' escalations, so the queue has shape. */
export function buildSyntheticEscalations(now: number): ConsoleEscalation[] {
  const opened = (m: number) => minsAgo(m, now);
  return [
    {
      parentName: "Helen Jennings",
      live: false,
      esc: {
        id: "esc_syn_nell",
        openedAt: opened(27),
        source: "family_request",
        title: "Susan asked to talk to someone",
        detail: "Nell sounded confused on the phone with her last night.",
        timeline: [{ at: opened(27), by: "Susan Jennings", text: "Opened" }],
      },
    },
    {
      parentName: "Beatrice Okonkwo",
      live: false,
      esc: {
        id: "esc_syn_bea",
        openedAt: opened(52),
        source: "something_off",
        title: "Bea: something is off",
        detail: "Ankles more swollen than usual, second day running.",
        riskScore: 48,
        tier: "medium",
        owner: "Dana Brooks",
        nextAction: "Call Dr. Price's office for a same-week appointment.",
        timeline: [
          { at: opened(52), by: "Priya Nair", text: "Opened" },
          {
            at: opened(44),
            by: "Dana Brooks",
            text: "Took ownership. Next: call Dr. Price's office for a same-week appointment.",
          },
        ],
      },
    },
    {
      parentName: "Soon-ja Kim",
      live: false,
      esc: {
        id: "esc_syn_soonja",
        openedAt: opened(4),
        source: "risk_score",
        title: "Soon-ja: risk score 66",
        detail:
          "Said she has not been eating since the funeral and feels dizzy on the stairs.",
        riskScore: 66,
        tier: "high",
        timeline: [{ at: opened(4), by: "Priya Nair", text: "Opened" }],
      },
    },
  ];
}

export type ConsentCandidate = {
  key: string;
  fullName: string;
  preferredName: string;
  phone: string;
  familyName: string;
  requestedAt: string;
};

export function syntheticConsent(now: number): ConsentCandidate {
  return {
    key: "r_ruth",
    fullName: "Ruth Adler",
    preferredName: "Ruth",
    phone: "(215) 555-0164",
    familyName: "Ben",
    requestedAt: minsAgo(190, now),
  };
}

/**
 * Baselines for "Today's metrics", so the strip is not computed from a single
 * family. Loosely shaped around the scope's targets.
 */
export const METRIC_BASELINE = {
  weekInWindow: 214,
  weekScheduled: 231,
  noAnswerResolvedIn2h: 3,
  noAnswerTotal: 3,
  ackMinutes: [3, 5, 6, 8, 9, 11, 12, 13, 14],
  loggingSeconds: [38, 41, 44, 47, 49, 52, 55, 58, 63, 71],
};

/**
 * Synthetic escalations obey the same shared rules as live ones: wrap one in
 * a throwaway account shell, run the shared action, unwrap.
 */
export function applyToEscalation(
  row: ConsoleEscalation,
  fn: (a: Account) => Account,
): ConsoleEscalation {
  const shell = { escalations: [row.esc] } as unknown as Account;
  return { ...row, esc: fn(shell).escalations[0] };
}
