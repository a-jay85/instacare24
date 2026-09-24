import { NOTIFY_BY } from "../config";
import { channelOf } from "../notifications";
import { currentMember } from "../permissions";
import type { Account } from "../types";
import { FEED_LINK, callback } from "./answers-day";
import { firstName, stamp } from "./format";
import type { Reply } from "./types";

/**
 * Three intents from the Family AI doc's list that read data already on file:
 * Notifications, Uploaded Documents and Caregiver Activity. Scripted, like
 * the rest.
 */

/** "Notifications": what was sent to this member, and how. */
export function notificationsReply(account: Account, question: string): Reply {
  const me = currentMember(account);
  const mine = account.notifications
    .map((n) => ({ n, d: n.deliveries.find((x) => x.memberId === me?.id) }))
    .filter((x) => x.d)
    .slice(0, 3);
  if (!me || mine.length === 0)
    return {
      intent: "notifications",
      tone: "default",
      body: ["Nothing has been sent to you yet."],
      actions: [callback(account, question)],
    };
  const now = Date.now();
  return {
    intent: "notifications",
    tone: "default",
    body: [
      `Your latest ${mine.length === 1 ? "update" : `${mine.length} updates`}, sent ${NOTIFY_BY[channelOf(me)]}:`,
    ],
    items: mine.map(({ n, d }) =>
      d!.held && new Date(d!.deliverAt).getTime() > now
        ? `${n.title} Held for your quiet hours until ${stamp(d!.deliverAt)}.`
        : `${n.title} ${stamp(d!.deliverAt)}.`,
    ),
    sources: [
      {
        module: "Notifications",
        at: mine[0].n.createdAt,
        verification: "record",
      },
    ],
  };
}

/** "Uploaded Documents": visit recordings, photos and PDFs, and plan letters. */
export function documentsReply(account: Account, question: string): Reply {
  const kind = { audio: "Recording", photo: "Photo", pdf: "PDF" } as const;
  const visits = [...account.visits].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const items = [
    ...visits.map(
      (v) =>
        `${kind[v.source]} of the ${v.specialty.toLowerCase()} visit with ${v.provider}, ${v.date}${v.status === "ready" ? "" : " (still being checked)"}.`,
    ),
    ...(account.eobs.length
      ? [
          `${account.eobs.length} insurance ${account.eobs.length === 1 ? "letter" : "letters"} (explanations of benefits).`,
        ]
      : []),
  ];
  if (items.length === 0)
    return {
      intent: "documents",
      tone: "default",
      body: [
        `No documents are on file for ${account.parent.preferredName} yet. You can add a visit on the Care tab.`,
      ],
      actions: [
        { kind: "link", label: "Add a visit", href: "/care/visits/" },
        callback(account, question),
      ],
    };
  return {
    intent: "documents",
    tone: "default",
    body: [`Here is what is on file for ${account.parent.preferredName}:`],
    items,
    sources: [{ module: "Visits and insurance", verification: "record" }],
    actions: [{ kind: "link", label: "Open visits", href: "/care/visits/" }],
  };
}

/** "Caregiver Activity": what the care team did most recently. */
export function activityReply(account: Account, question: string): Reply {
  const staff = new Set([
    account.careTeam.vaName,
    account.careTeam.specialistName,
  ]);
  const events: { at: string; text: string }[] = [];
  const call = account.checkIns.find((c) => c.loggedAt && c.vaName);
  if (call)
    events.push({
      at: call.loggedAt!,
      text: `${call.vaName} logged ${account.parent.preferredName}'s check-in`,
    });
  for (const e of account.escalations)
    for (const t of e.timeline)
      if (staff.has(t.by))
        events.push({ at: t.at, text: `${t.by}: ${e.title}. ${t.text}` });
  for (const v of account.visits)
    if (v.verifiedBy && v.reviewedAt)
      events.push({
        at: v.reviewedAt,
        text: `${v.verifiedBy} checked the ${v.specialty.toLowerCase()} visit summary`,
      });
  events.sort((a, b) => b.at.localeCompare(a.at));
  const top = events.slice(0, 4);
  if (top.length === 0)
    return {
      intent: "activity",
      tone: "default",
      body: [
        `The care team hasn't logged anything for ${account.parent.preferredName} yet.`,
      ],
      actions: [callback(account, question)],
    };
  return {
    intent: "activity",
    tone: "default",
    body: [
      `The latest from ${firstName(account.careTeam.vaName)} and ${firstName(account.careTeam.specialistName)}:`,
    ],
    items: top.map((e) => `${e.text} (${stamp(e.at)})`),
    sources: [
      { module: "Care team log", at: top[0].at, verification: "record" },
    ],
    actions: [FEED_LINK],
  };
}
