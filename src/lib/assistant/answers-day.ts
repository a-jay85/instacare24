import {
  confirmedOwner,
  openEscalations,
  parentToday,
  pastCheckIns,
} from "../actions";
import { CONSENT_CALL_SLA_HOURS } from "../config";
import { currentMember } from "../permissions";
import { formatWindow, shiftDate, timezoneLabel } from "../timezones";
import type { Account, CheckInRecord } from "../types";
import { medTodayLines } from "./answers-meds";
import { dayLabel, firstName, stamp } from "./format";
import type { Reply, ReplyAction, Source } from "./types";

/** Scripted answers about her day: status, check-ins, consent. No model. */

export const FEED_LINK: ReplyAction = {
  kind: "link",
  label: "Open Today",
  href: "/feed",
};

export function me(account: Account): string {
  return currentMember(account)?.name ?? "The family";
}

export function callback(
  account: Account,
  question: string,
  label?: string,
): ReplyAction {
  return {
    kind: "callback",
    label:
      label ?? `Ask ${firstName(account.careTeam.specialistName)} to call me`,
    note: `${firstName(me(account))} asked the assistant: "${question}"`,
  };
}

function checkInSource(r: CheckInRecord): Source {
  return {
    module: "Daily check-in",
    at: r.loggedAt ?? r.date,
    verification: "human_verified",
    by: r.vaName,
  };
}

function stateLabel(r: CheckInRecord): string {
  if (r.state === "reached") return "Reached";
  if (r.state === "not_reached") return "No answer";
  if (r.state === "something_off") return "Something was off";
  return "Not checked. No check-in was completed on this day";
}

export function deceasedReply(account: Account, question: string): Reply {
  return {
    intent: "status",
    tone: "default",
    body: [
      `We are so sorry. Every call and reminder for ${account.parent.preferredName} has stopped.`,
      `${account.careTeam.specialistName} can help with anything that is left, whenever you are ready.`,
    ],
    actions: [callback(account, question)],
  };
}

function consentHold(account: Account, question: string): Reply | undefined {
  const { parent } = account;
  const name = parent.preferredName;
  if (parent.consent.state === "withdrawn")
    return {
      intent: "status",
      tone: "default",
      body: [
        `${name} asked us to stop calling.`,
        "She withdrew her consent, which is hers to do. We have stopped the check-ins. A Care Specialist can talk this through with you.",
      ],
      sources: [
        {
          module: "Consent",
          at: parent.consent.decidedAt,
          verification: "record",
        },
      ],
      actions: [callback(account, question)],
    };
  if (parent.consent.state !== "granted")
    return {
      intent: "status",
      tone: "default",
      body: [
        `We haven't spoken to ${name} yet.`,
        `A Care Specialist will call her within ${CONSENT_CALL_SLA_HOURS} hours to ask whether she wants a daily check-in. Nothing runs until she says yes, so I have no updates about her day yet.`,
      ],
      sources: [
        {
          module: "Consent",
          at: parent.consent.requestedAt,
          verification: "record",
        },
      ],
      actions: [FEED_LINK],
    };
  return undefined;
}

function escalationLine(account: Account): string | undefined {
  const open = openEscalations(account);
  if (open.length === 0) return undefined;
  const e = open[0];
  const who = confirmedOwner(e)
    ? `${e.owner} has it`
    : e.owner
      ? `assigned to ${e.owner} and waiting for them to pick it up`
      : "waiting for someone to take it";
  return open.length === 1
    ? `One thing is open: ${e.title}, ${who}.`
    : `${open.length} things are open. The latest: ${e.title}, ${who}.`;
}

export function statusReply(account: Account, question: string): Reply {
  const hold = consentHold(account, question);
  if (hold) return hold;
  const { parent } = account;
  const name = parent.preferredName;
  const today = account.checkIns.find((c) => c.date === parentToday(account));
  const body: string[] = [];
  const sources: Source[] = [];

  if (today && today.state) {
    body.push(
      today.state === "reached"
        ? `${name} is alright today.`
        : today.state === "not_reached"
          ? `We could not reach ${name} today.`
          : `Something is off with ${name} today.`,
    );
    if (today.summary) body.push(today.summary);
    sources.push(checkInSource(today));
  } else {
    body.push(
      `No check-in yet today. Her window is ${formatWindow(parent.checkInWindow.startHour)}, ${timezoneLabel(parent.parentTimezone)}. We will tell you either way.`,
    );
  }
  const { next } = medTodayLines(account);
  if (!today || !today.state)
    sources.push({ module: "Check-in schedule", verification: "record" });
  if (next) {
    body.push(`Next medication reminder: ${next}.`);
    sources.push({
      module: "Medication reminders",
      at: parentToday(account),
      verification: "record",
    });
  }
  const esc = escalationLine(account);
  if (esc) {
    body.push(esc);
    sources.push({
      module: "Escalations",
      at: openEscalations(account)[0].openedAt,
      verification: "record",
    });
  }
  return {
    intent: "status",
    tone: "default",
    body,
    sources: sources.length ? sources : undefined,
    actions: [FEED_LINK],
    suggestions: ["How was her week?", "Is anyone handling anything?"],
  };
}

export function checkinsReply(account: Account, question: string): Reply {
  const hold = consentHold(account, question);
  if (hold) return { ...hold, intent: "checkins" };
  // FEED-002: days with no record come back as "not checked", never missing.
  const today = parentToday(account);
  const since = shiftDate(today, -6);
  const week = [
    ...account.checkIns.filter((c) => c.date === today && c.state),
    ...pastCheckIns(account).filter((c) => c.date >= since),
  ];
  if (week.length === 0)
    return {
      intent: "checkins",
      tone: "default",
      body: ["There are no check-ins logged this week yet."],
      actions: [FEED_LINK],
    };
  const unchecked = week.filter((c) => c.state === null).length;
  const body = [
    `Here are ${account.parent.preferredName}'s check-ins from the last 7 days.`,
  ];
  if (unchecked)
    body.push(
      `${unchecked === 1 ? "One day was" : `${unchecked} days were`} not checked. That is on us, not a sign she was fine.`,
    );
  const logged = week.find((c) => c.loggedAt);
  return {
    intent: "checkins",
    tone: "default",
    body,
    items: week.map(
      (c) =>
        `${dayLabel(c.date, today)}: ${stateLabel(c)}.${c.summary ? ` ${c.summary}` : ""}`,
    ),
    sources: logged ? [checkInSource(logged)] : undefined,
    actions: [FEED_LINK],
  };
}

export function consentReply(account: Account): Reply {
  const { consent, preferredName: name } = account.parent;
  const body =
    consent.state === "granted"
      ? [
          `${name} said yes${consent.decidedAt ? ` on ${stamp(consent.decidedAt)}` : ""}, on a recorded call. She can change her mind at any time.`,
        ]
      : consent.state === "withdrawn"
        ? [
            `${name} withdrew her consent${consent.decidedAt ? ` on ${stamp(consent.decidedAt)}` : ""}. That is hers to do, and we don't share her reasons. Check-ins have stopped.`,
          ]
        : consent.state === "pending"
          ? [
              `${name} hasn't said yes yet. A Care Specialist will call her within ${CONSENT_CALL_SLA_HOURS} hours to ask. Nothing runs until she agrees.`,
            ]
          : [`Nobody has asked ${name} yet. Nothing runs until she agrees.`];
  return {
    intent: "consent",
    tone: "default",
    body,
    sources: [
      {
        module: "Consent",
        at: consent.decidedAt ?? consent.requestedAt,
        verification: "record",
      },
    ],
  };
}
