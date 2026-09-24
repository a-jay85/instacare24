import { parentToday } from "../actions";
import type { Account, VisitSummary } from "../types";
import {
  dayLabel,
  humanDates,
  latestVisit,
  restrictedNote,
  visitSource,
} from "./format";
import type { Reply } from "./types";

/** Scripted answers for doctor visits and follow-ups. No model. */

const VISIT_LINK = {
  kind: "link" as const,
  label: "Open doctor visits",
  href: "/care/visits",
};

export function appointmentsReply(account: Account): Reply {
  const name = account.parent.preferredName;
  const visits = [...account.visits].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const withFollowUps = visits.filter((v) => v.followUps.length > 0);
  if (withFollowUps.length === 0) {
    return {
      intent: "appointments",
      tone: "default",
      body: [`I don't have any follow-ups on file for ${name}.`],
      actions: [VISIT_LINK],
    };
  }
  const deniedPt = account.eobs.some(
    (e) => e.status === "denied" && /physical therapy/i.test(e.service),
  );
  const items = withFollowUps.flatMap((v) =>
    v.followUps.map((f) => {
      const dated = /\d{4}-\d{2}-\d{2}/.test(f);
      let line = `${humanDates(f, parentToday(account))}${dated ? "" : " (not booked yet)"}. From ${v.provider}.`;
      if (deniedPt && /physical therapy/i.test(f))
        line += " The plan denied the first claim for this; ask me about it.";
      return line;
    }),
  );
  return {
    intent: "appointments",
    tone: "default",
    body: [`Here is what ${name}'s doctors asked for next.`],
    items,
    sources: withFollowUps.map(visitSource),
    actions: [VISIT_LINK],
    suggestions: deniedPt ? ["Why was physical therapy denied?"] : undefined,
  };
}

function pickVisit(
  account: Account,
  question: string,
): VisitSummary | undefined {
  const q = question.toLowerCase();
  return (
    account.visits.find((v) =>
      v.provider
        .toLowerCase()
        .split(/[\s.]+/)
        .some((w) => w.length > 3 && q.includes(w)),
    ) ??
    account.visits.find((v) =>
      q.includes(v.specialty.toLowerCase().slice(0, 5)),
    ) ??
    (/\bknee\b/i.test(q)
      ? account.visits.find((v) => /knee/i.test(v.plain))
      : undefined) ??
    latestVisit(account)
  );
}

export function visitReply(account: Account, question: string): Reply {
  const name = account.parent.preferredName;
  const v = pickVisit(account, question);
  if (!v) {
    return {
      intent: "visit",
      tone: "default",
      body: [`No doctor visits have been recorded for ${name} yet.`],
      actions: [VISIT_LINK],
    };
  }
  if (v.status === "processing") {
    return {
      intent: "visit",
      tone: "default",
      body: [
        `The ${v.provider} visit from ${dayLabel(v.date, parentToday(account))} is still being processed.`,
      ],
      sources: [visitSource(v)],
      actions: [VISIT_LINK],
    };
  }
  const privacy = restrictedNote(account);
  const body = [
    `${v.provider}, ${v.specialty.toLowerCase()}, ${dayLabel(v.date, parentToday(account))}.`,
    v.plain,
  ];
  if (v.status === "pending_review")
    body.push("A Care Specialist has not checked this summary yet.");
  const items = [
    ...(privacy ? [] : v.diagnoses.map((d) => `Doctor noted: ${d}`)),
    ...v.medicationChanges.map((c) => `Medication change: ${c}`),
    ...v.followUps.map(
      (f) => `Follow-up: ${humanDates(f, parentToday(account))}`,
    ),
    ...v.reminders.map((r) => `Reminder: ${r}`),
  ];
  return {
    intent: "visit",
    tone: "default",
    body,
    items,
    privacy,
    sources: [visitSource(v)],
    actions: [VISIT_LINK],
    suggestions: ["Any appointments coming up?", "Can I see the transcript?"],
  };
}

export function transcriptReply(account: Account, question: string): Reply {
  const v = pickVisit(account, question);
  // Nothing from a visit reaches the family before a person has checked it.
  if (!v || v.status === "pending_review") return visitReply(account, question);
  const privacy = restrictedNote(account);
  if (privacy) {
    return {
      intent: "transcript",
      tone: "default",
      body: [
        `The full transcript is part of ${account.parent.preferredName}'s medical record. Here is the plain summary instead.`,
        v.plain,
      ],
      privacy,
      sources: [visitSource(v)],
      actions: [VISIT_LINK],
    };
  }
  return {
    intent: "transcript",
    tone: "default",
    body: [
      `Transcript of the ${v.provider} visit, ${dayLabel(v.date, parentToday(account))}:`,
    ],
    items: v.transcript.split("\n"),
    sources: [
      {
        module: `Transcript, ${v.provider}`,
        at: v.date,
        verification: v.source === "audio" ? "ai_generated" : "record",
      },
    ],
    actions: [VISIT_LINK],
  };
}
