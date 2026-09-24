import { CHECK_IN, REFUSAL_THRESHOLD, REFUSAL_WINDOW_DAYS } from "./config";
import { notifyFamily } from "./notifications";
import { enforceOneEditor } from "./permissions";
import { routingEvents, tierFor } from "./risk";
import { DEFAULT_CARE_TEAM } from "./seed";
import {
  dateIn,
  detectFamilyTimezone,
  formatWindow,
  hourIn,
  shiftDate,
} from "./timezones";
import type {
  Account,
  CheckInRecord,
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
 * Calendar day as YYYY-MM-DD on her clock, never the viewer's. Check-ins and
 * reminders run parent-local (CHK-001, MED-001), so a family in Los Angeles
 * at 10 PM already sees her tomorrow.
 */
export function parentDate(account: Account, at: Date = new Date()): string {
  return dateIn(account.parent.parentTimezone, at);
}

export function parentToday(account: Account): string {
  return parentDate(account);
}

/**
 * FEED-002: every past day since check-ins began, newest first, today left
 * out. A day with no record comes back as an explicit "not checked" record,
 * so it can never just vanish from the history.
 *
 * Starts at the earliest record, or at her consent when there is none, and
 * never before her consent. Ends yesterday, or the day a death or a
 * withdrawal stopped the calls.
 */
export function pastCheckIns(account: Account): CheckInRecord[] {
  const today = parentToday(account);
  const past = account.checkIns.filter((c) => c.date < today);
  const { consent } = account.parent;
  // After a withdrawal, decidedAt is the day she said stop, not her yes.
  const consentDay =
    consent.state === "granted" && consent.decidedAt
      ? parentDate(account, new Date(consent.decidedAt))
      : null;
  const earliest = past.reduce<string | null>(
    (min, c) => (min === null || c.date < min ? c.date : min),
    null,
  );
  let start = earliest ?? consentDay;
  if (start && consentDay && consentDay > start) start = consentDay;

  const stoppedAt =
    account.deceasedAt ??
    (consent.state === "withdrawn" ? consent.decidedAt : undefined);
  let end = shiftDate(today, -1);
  if (stoppedAt) {
    const stopped = parentDate(account, new Date(stoppedAt));
    if (stopped < end) end = stopped;
  }

  const byDate = new Map(past.map((c) => [c.date, c]));
  const out: CheckInRecord[] = [];
  for (let d = end; start && d >= start; d = shiftDate(d, -1)) {
    out.push(
      byDate.get(d) ?? {
        id: `unchecked_${d}`,
        date: d,
        state: null,
        summary: null,
        loggedAt: null,
      },
    );
  }
  // Anything logged outside that range (older than consent, say) still shows.
  for (const c of past) if (!out.some((o) => o.date === c.date)) out.push(c);
  return out.sort((a, b) => b.date.localeCompare(a.date));
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
  // NTF-002: an escalation reaches the family at once, whatever the hour.
  return notifyFamily(account, "safety", input.title);
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
    declined?: boolean;
  },
): Account {
  const now = new Date().toISOString();
  const date = parentToday(account);
  const declined = input.state === "reached" && Boolean(input.declined);
  const record = {
    id: uid("chk"),
    date,
    state: input.state,
    summary: input.summary,
    loggedAt: now,
    vaName: input.vaName,
    riskScore: input.riskScore,
    // FEED-004: a second log that day must not drop what the family wrote.
    replies: account.checkIns.find((c) => c.date === date)?.replies,
    declined: declined || undefined,
  };
  account.checkIns = [
    record,
    ...account.checkIns.filter((c) => c.date !== date),
  ];
  // A late call answers today's missed window. Any new escalation below takes
  // over from it.
  for (const e of account.escalations)
    if (
      e.source === "missed_window" &&
      !e.resolvedAt &&
      parentDate(account, new Date(e.openedAt)) === date
    )
      resolveEscalation(
        account,
        e.id,
        input.vaName,
        "A call was logged after her window.",
      );

  const name = account.parent.preferredName;
  if (declined) {
    notifyFamily(
      account,
      "routine",
      `Today's check-in: ${name} picked up but didn't want to talk`,
    );
    noteRefusals(account, input.vaName);
  } else if (input.state === "reached") {
    // NTF-001: routine, so it waits out each member's quiet hours.
    notifyFamily(account, "routine", `Today's check-in: ${name} is alright`);
  } else if (input.state === "something_off") {
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

/**
 * Edge case "the parent refuses". Turning the call down is her answer, not a
 * failure. At the threshold a Care Specialist owns a plan with the family, and
 * the family is told plainly. Calls do not stop on their own: a person decides.
 */
function noteRefusals(account: Account, by: string): void {
  const since = shiftDate(parentToday(account), -(REFUSAL_WINDOW_DAYS - 1));
  const count = account.checkIns.filter(
    (c) => c.declined && c.date >= since,
  ).length;
  if (count < REFUSAL_THRESHOLD) return;
  if (account.escalations.some((e) => e.source === "refusing" && !e.resolvedAt))
    return;
  const name = account.parent.preferredName;
  const specialist = account.careTeam.specialistName;
  openEscalation(account, {
    source: "refusing",
    title: `${name} did not want to talk on ${count} calls this week`,
    detail:
      "She is picking up and saying no. That is her answer. Talk with the family and agree a plan.",
    by,
  });
  takeOwnership(
    account,
    account.escalations[0].id,
    specialist,
    'Call the family and agree a plan with them that is not "keep calling".',
  );
  notifyFamily(
    account,
    "routine",
    `${name} has not wanted to talk on ${count} calls this week. ${specialist} will call you to agree what happens next.`,
  );
}

/**
 * Family AI workflow: an emergency or safety report made in Ask. Same HITL
 * routing as a VA's "something is off" log, so High and Critical show the
 * doctor's office and the family as told, and Critical starts an incident
 * report.
 */
export function escalateFromAssistant(
  account: Account,
  input: { title: string; detail: string; by: string; riskScore?: number },
): Account {
  const now = new Date().toISOString();
  openEscalation(account, { ...input, source: "assistant" });
  if (input.riskScore !== undefined) {
    const [esc] = account.escalations;
    esc.timeline.push(
      ...routingEvents(account, input.riskScore, input.by, now, "assistant"),
    );
  }
  return account;
}

/**
 * CHK-001: her window closed today and nobody logged a call, not even a
 * no-answer. Cheap on purpose: callers check this on a timer and only write
 * when it is true.
 */
export function missedWindow(
  account: Account,
  now: Date = new Date(),
): boolean {
  if (!canDeliver(account)) return false;
  const { parent } = account;
  const tz = parent.parentTimezone;
  const start = parent.checkInWindow.startHour;
  if (hourIn(tz, now) < start + CHECK_IN.windowLengthHours) return false;
  const today = parentDate(account, now);
  if (account.checkIns.some((c) => c.date === today && c.state)) return false;
  // Calls begin in her next window after she says yes, so a yes given after
  // today's window opened has nothing to miss yet.
  const yes = parent.consent.decidedAt;
  if (
    yes &&
    parentDate(account, new Date(yes)) === today &&
    hourIn(tz, new Date(yes)) >= start
  )
    return false;
  return !account.escalations.some(
    (e) =>
      e.source === "missed_window" &&
      parentDate(account, new Date(e.openedAt)) === today,
  );
}

/** Opens the missed-window escalation once per day of hers. */
export function escalateMissedWindow(
  account: Account,
  now: Date = new Date(),
): Account {
  if (!missedWindow(account, now)) return account;
  const { parent } = account;
  return openEscalation(account, {
    source: "missed_window",
    title: `${parent.preferredName}'s window closed with no check-in logged`,
    detail: `No check-in was logged in her window, ${formatWindow(parent.checkInWindow.startHour, CHECK_IN.windowLengthHours)} her time. Find out whether anyone reached her, then call her.`,
    by: "InstaCare24",
  });
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
          autoAssignedAt: undefined,
          timeline: [
            ...e.timeline,
            { at: now, by: owner, text: `Took ownership. Next: ${nextAction}` },
          ],
        }
      : e,
  );
  return account;
}

/** ESC-002: how long an escalation may sit with nobody on it. */
export const OWNER_DEADLINE_MINUTES = 120;

const OWNER_DEADLINE_NEXT = "Call the family and agree what happens next.";

/** Who has really picked it up. An automatic assignment does not count. */
export const confirmedOwner = (e: Escalation): string | undefined =>
  e.autoAssignedAt ? undefined : e.owner;

function unownedTooLong(e: Escalation, now: Date): boolean {
  return (
    !e.resolvedAt &&
    !e.owner &&
    now.getTime() - Date.parse(e.openedAt) > OWNER_DEADLINE_MINUTES * 60_000
  );
}

/**
 * ESC-002: after two hours an escalation is resolved or it has a named owner
 * and a next action. There is no third state. Cheap on purpose, like
 * missedWindow: callers check it on a timer and only write when it is true.
 */
export function anyUnownedTooLong(
  account: Account,
  now: Date = new Date(),
): boolean {
  return account.escalations.some((e) => unownedTooLong(e, now));
}

/**
 * Nobody took it in time, so it goes to the family's Care Specialist by name.
 * It stays overdue until that person confirms it (takeOwnership), and the
 * timeline says it was automatic. Roster rows in the console have no care
 * team, so they pass the owner in. A medical question falls to the clinical
 * reviewer instead (ESC-004): advice never goes to the Care Specialist.
 */
export function assignUnowned(
  account: Account,
  now: Date = new Date(),
  specialist: string = account.careTeam?.specialistName ??
    DEFAULT_CARE_TEAM.specialistName,
  reviewer: string = account.careTeam?.clinicalReviewerName ??
    DEFAULT_CARE_TEAM.clinicalReviewerName,
): Account {
  account.escalations = account.escalations.map((e) => {
    if (!unownedTooLong(e, now)) return e;
    const owner = e.source === "clinical_question" ? reviewer : specialist;
    // Stamped at the deadline, the moment the rule fired.
    const at = new Date(
      Date.parse(e.openedAt) + OWNER_DEADLINE_MINUTES * 60_000,
    ).toISOString();
    return {
      ...e,
      owner,
      nextAction: OWNER_DEADLINE_NEXT,
      autoAssignedAt: at,
      timeline: [
        ...e.timeline,
        {
          at,
          by: "InstaCare24",
          text: `Nobody took this within 2 hours. Assigned to ${owner} automatically. Still overdue until ${owner} takes it.`,
        },
      ],
    };
  });
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

/**
 * AUT-003: next action and resolution are free text typed by staff. On a
 * consent withdrawal that is exactly where her reason could leak, so the family
 * sees only who has it, on Today and in Ask.
 */
export const keepsReasonPrivate = (e: Escalation) =>
  e.source === "consent_withdrawn";

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
  // AUT-005: while her capacity is in doubt, nobody records a yes.
  if (account.parent.capacity.inDoubt) return account;
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
  const date = parentToday(account);
  account.medAcks = [
    ...account.medAcks.filter(
      (a) => !(a.medId === medId && a.date === date && a.hour === hour),
    ),
    { medId, date, hour, state: "acknowledged" },
  ];
  return account;
}

/**
 * AUT-005: the caller is not sure she understood. Her yes is not recorded, and
 * a Care Specialist owns what happens instead of the call going ahead.
 */
export function raiseCapacityDoubt(
  account: Account,
  by: string,
  note: string,
): Account {
  const now = new Date().toISOString();
  account.parent.capacity = { inDoubt: true, by, at: now, note };
  openEscalation(account, {
    source: "capacity",
    title: `${account.parent.preferredName}: not sure she can decide for herself`,
    detail: note || "Raised on the consent call.",
    by,
  });
  return takeOwnership(
    account,
    account.escalations[0].id,
    account.careTeam.specialistName,
    "Talk with the family and her healthcare proxy before anyone asks her again.",
  );
}

/** AUT-005: a Care Specialist has looked into it and the doubt is cleared. */
export function clearCapacityDoubt(
  account: Account,
  by: string,
  note: string,
): Account {
  account.parent.capacity = {
    inDoubt: false,
    by,
    at: new Date().toISOString(),
    note,
  };
  for (const e of account.escalations)
    if (e.source === "capacity" && !e.resolvedAt)
      resolveEscalation(account, e.id, by, note || "Capacity doubt cleared.");
  return account;
}

/**
 * ESC-004: a medical question from Ask goes to the on-call clinical reviewer.
 * It opens with nobody on it; the reviewer takes it in the console.
 */
export function askClinicalReviewer(
  account: Account,
  input: { title: string; detail: string; by: string },
): Account {
  return openEscalation(account, { ...input, source: "clinical_question" });
}

/**
 * CHK-006 edge case "the VA leaves": a family moves to a new voice as a
 * designed moment. The new VA gets the note before she dials; the family is
 * told who calls now. Nothing about her care changes.
 */
export function handOverVa(
  account: Account,
  to: string,
  note: string,
  by: string,
): Account {
  const from = account.careTeam.vaName;
  if (!to || to === from) return account;
  account.careTeam = {
    ...account.careTeam,
    vaName: to,
    vaHandoff: { from, to, note, by, at: new Date().toISOString() },
  };
  notifyFamily(
    account,
    "routine",
    `${to} calls ${account.parent.preferredName} from now on. ${from.split(" ")[0]} passed on her notes.`,
  );
  return account;
}

/**
 * ONB-004 / AUT-004: the invitee says yes. They join with view access, never
 * as payer or agent, so the one editor stays the one editor.
 */
export function acceptInvite(account: Account, inviteId: string): Account {
  const invite = account.invites.find((i) => i.id === inviteId);
  if (!invite) return account;
  account.invites = account.invites.filter((i) => i.id !== inviteId);
  account.members = [
    ...account.members,
    {
      id: uid("m"),
      name: invite.name,
      email: invite.email,
      phone: "",
      relationshipToParent: invite.relationship || "Family",
      // Their own device's clock, so quiet hours are theirs (NTF-001).
      familyTimezone: detectFamilyTimezone(),
      isPayer: false,
      isAuthorizedAgent: false,
      accessLevel: "read",
    },
  ];
  return enforceOneEditor(account);
}

/** ONB-004: someone named in onboarding signs in for the first time. */
export function joinAsMember(account: Account, memberId: string): Account {
  account.members = account.members.map((m) =>
    m.id === memberId && m.pending
      ? { ...m, pending: false, familyTimezone: detectFamilyTimezone() }
      : m,
  );
  return account;
}

/** FEED-004: a family reply to a summary, for the VA before the next call. */
export function replyToSummary(
  account: Account,
  checkInId: string,
  member: { id: string; name: string },
  text: string,
): Account {
  account.checkIns = account.checkIns.map((c) =>
    c.id === checkInId
      ? {
          ...c,
          replies: [
            ...(c.replies ?? []),
            {
              id: uid("rep"),
              memberId: member.id,
              name: member.name,
              text,
              at: new Date().toISOString(),
            },
          ],
        }
      : c,
  );
  return account;
}

/**
 * FEED-004: replies the VA has not had a call since. A reply sent after the
 * latest logged call is still waiting for her next one.
 */
export function unreadReplies(account: Account) {
  const lastCall = account.checkIns
    .map((c) => c.loggedAt)
    .filter((t): t is string => Boolean(t))
    .sort()
    .pop();
  return account.checkIns
    .flatMap((c) => c.replies ?? [])
    .filter((r) => !lastCall || r.at >= lastCall)
    .sort((a, b) => a.at.localeCompare(b.at));
}
