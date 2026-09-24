import { tierFor } from "./risk";
import type {
  Account,
  CheckInState,
  Escalation,
  EscalationSource,
} from "./types";

/**
 * Pure updates on an Account. The family app and the staff console both call
 * these through `useAccount().update`, so a call logged in the console lands in
 * the family feed (and, through the storage event, in any other open tab).
 */

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** AUT-002 / BIL-002: nothing is delivered without consent, or after a death. */
export function canDeliver(account: Account): boolean {
  return account.parent.consent.state === "granted" && !account.deceasedAt;
}

export function openEscalations(account: Account): Escalation[] {
  return account.escalations.filter((e) => !e.resolvedAt);
}

export function openEscalation(
  account: Account,
  input: {
    source: EscalationSource;
    title: string;
    detail: string;
    by: string;
    riskScore?: number;
  },
): Account {
  const now = new Date().toISOString();
  const esc: Escalation = {
    id: uid("esc"),
    openedAt: now,
    source: input.source,
    title: input.title,
    detail: input.detail,
    riskScore: input.riskScore,
    tier:
      input.riskScore === undefined ? undefined : tierFor(input.riskScore).tier,
    timeline: [{ at: now, by: input.by, text: "Opened" }],
  };
  account.escalations = [esc, ...account.escalations];
  return account;
}

/**
 * CHK-002: exactly one state per call. "Something is off" always opens an
 * escalation. CHK-004: no answer after retries opens one too.
 */
export function logCheckIn(
  account: Account,
  input: {
    state: CheckInState;
    summary: string;
    vaName: string;
    riskScore?: number;
  },
): Account {
  const now = new Date().toISOString();
  const date = todayIso();
  const record = {
    id: uid("chk"),
    date,
    state: input.state,
    summary: input.summary,
    loggedAt: now,
    vaName: input.vaName,
    riskScore: input.riskScore,
  };
  account.checkIns = [
    record,
    ...account.checkIns.filter((c) => c.date !== date),
  ];

  const name = account.parent.preferredName;
  if (input.state === "something_off") {
    openEscalation(account, {
      source: "something_off",
      title: `${name}: something is off`,
      detail: input.summary,
      by: input.vaName,
      riskScore: input.riskScore,
    });
  } else if (input.state === "not_reached") {
    openEscalation(account, {
      source: "no_answer",
      title: `${name} did not answer`,
      detail: input.summary,
      by: input.vaName,
    });
  }
  return account;
}

/** ESC-002: taking ownership means a name and a next action, together. */
export function takeOwnership(
  account: Account,
  escId: string,
  owner: string,
  nextAction: string,
): Account {
  const now = new Date().toISOString();
  account.escalations = account.escalations.map((e) =>
    e.id === escId
      ? {
          ...e,
          owner,
          nextAction,
          timeline: [
            ...e.timeline,
            { at: now, by: owner, text: `Took ownership. Next: ${nextAction}` },
          ],
        }
      : e,
  );
  return account;
}

export function resolveEscalation(
  account: Account,
  escId: string,
  by: string,
  resolution: string,
): Account {
  const now = new Date().toISOString();
  account.escalations = account.escalations.map((e) =>
    e.id === escId
      ? {
          ...e,
          owner: e.owner ?? by,
          resolvedAt: now,
          resolution,
          timeline: [
            ...e.timeline,
            { at: now, by, text: `Resolved: ${resolution}` },
          ],
        }
      : e,
  );
  return account;
}

/** ESC-001: "Talk to someone" is a real escalation, not a dead-end modal. */
export function requestCallback(
  account: Account,
  memberName: string,
  note: string,
): Account {
  return openEscalation(account, {
    source: "family_request",
    title: `${memberName} asked to talk to someone`,
    detail: note || "Call-back requested from the family app.",
    by: memberName,
  });
}

/** AUT-003: the family is told consent was withdrawn, never the reason. */
export function withdrawConsent(account: Account, by: string): Account {
  const now = new Date().toISOString();
  account.parent.consent = {
    ...account.parent.consent,
    state: "withdrawn",
    decidedAt: now,
  };
  return openEscalation(account, {
    source: "consent_withdrawn",
    title: `${account.parent.preferredName} withdrew consent`,
    detail:
      "Check-ins stop within 24 hours. Family notified without the reason.",
    by,
  });
}

export function grantConsent(account: Account): Account {
  const now = new Date().toISOString();
  account.parent.consent = {
    ...account.parent.consent,
    state: "granted",
    decidedAt: now,
    recordingId: account.parent.consent.recordingId ?? uid("rec"),
  };
  return account;
}

export function acknowledgeMed(
  account: Account,
  medId: string,
  hour: number,
): Account {
  const date = todayIso();
  account.medAcks = [
    ...account.medAcks.filter(
      (a) => !(a.medId === medId && a.date === date && a.hour === hour),
    ),
    { medId, date, hour, state: "acknowledged" },
  ];
  return account;
}
