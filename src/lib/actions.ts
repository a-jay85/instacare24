import { routingEvents, tierFor } from "./risk";
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

/**
 * Calendar day as YYYY-MM-DD in the viewer's own timezone. UTC would roll
 * over to tomorrow at 5 PM Pacific and break an evening demo.
 */
export function isoDate(d: Date): string {
  return d.toLocaleDateString("en-CA");
}

export function todayIso(): string {
  return isoDate(new Date());
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** BIL-003: the date calls resume, while a pause is running. */
export function pausedUntil(account: Account): string | null {
  const until = account.subscription.pausedUntil;
  return until && new Date(until) > new Date() ? until : null;
}

/**
 * AUT-002 / BIL-002 / BIL-003: nothing is delivered without consent, after a
 * death, or while the family has paused the service.
 */
export function canDeliver(account: Account): boolean {
  return (
    account.parent.consent.state === "granted" &&
    !account.deceasedAt &&
    !pausedUntil(account)
  );
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
    // HITL High/Critical: who else was told. The score only adds events; the
    // state alone decides whether an escalation opens (CHK-002).
    if (input.riskScore !== undefined) {
      const [esc] = account.escalations;
      esc.timeline.push(
        ...routingEvents(account, input.riskScore, input.vaName, now),
      );
    }
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

/**
 * She said no, or not now, on the consent call. Consent stays pending and a
 * person owns what happens next. Repeated refusal is a product outcome, and
 * the plan is never "keep calling".
 */
export function declineConsent(account: Account, by: string): Account {
  openEscalation(account, {
    source: "consent_declined",
    title: `${account.parent.preferredName} said not now on the consent call`,
    detail: "No check-ins will run. The family is told honestly.",
    by,
  });
  return takeOwnership(
    account,
    account.escalations[0].id,
    account.careTeam.specialistName,
    'Talk with the family about what she said and agree a plan that is not "keep calling".',
  );
}

export function consentDeclined(account: Account): boolean {
  return account.escalations.some(
    (e) => e.source === "consent_declined" && !e.resolvedAt,
  );
}

export function grantConsent(account: Account): Account {
  const now = new Date().toISOString();
  // A fresh yes closes any withdrawal still open from before.
  account.escalations = account.escalations.map((e) =>
    (e.source === "consent_withdrawn" || e.source === "consent_declined") &&
    !e.resolvedAt
      ? {
          ...e,
          resolvedAt: now,
          resolution: "Consent given again on a recorded call.",
          owner: e.owner ?? account.careTeam.specialistName,
        }
      : e,
  );
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
