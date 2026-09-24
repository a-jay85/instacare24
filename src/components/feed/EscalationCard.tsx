"use client";

import { Card, Pill } from "@/components/ui";
import {
  confirmedOwner,
  keepsReasonPrivate,
  openEscalations,
  parentDate,
  parentToday,
} from "@/lib/actions";
import { currentMember } from "@/lib/permissions";
import type { Account, Escalation } from "@/lib/types";
import { ago, useNow } from "./time";

/** The family reads their own request in the second person. */
function titleFor(e: Escalation, me: string | undefined): string {
  if (e.source === "family_request" && me && e.title.startsWith(`${me} `)) {
    return `You${e.title.slice(me.length)}`;
  }
  return e.title;
}

/** "Michael and Denise" read by Michael: "You and Denise". Capitalised. */
function withYou(names: string, me: string | undefined): string {
  const first = me?.split(" ")[0];
  const out = first
    ? names.replace(new RegExp(`\\b${first}\\b`), "you")
    : names;
  return out[0].toUpperCase() + out.slice(1);
}

/**
 * HITL High/Critical routing (src/lib/risk.ts): who was told, in plain words.
 * The incident report is internal and stays in the console.
 */
function WhoWeTold({
  e,
  me,
  name,
}: {
  e: Escalation;
  me: string | undefined;
  name: string;
}) {
  const told = e.timeline.filter(
    (t) => (t.notice === "physician" || t.notice === "family") && t.who,
  );
  const prompt = e.timeline.find((t) => t.notice === "emergency");
  if (!told.length && !prompt) return null;
  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="text-[13px] font-medium text-muted">Who we&apos;ve told</p>
      <ul className="mt-1.5 space-y-1">
        {told.map((t) => (
          <li
            key={t.notice}
            className="flex gap-2 text-[14px] leading-snug text-ink"
          >
            <span aria-hidden className="text-moss">
              ✓
            </span>
            <span>
              {withYou(t.who!, t.notice === "family" ? me : undefined)}
              {t.notice === "family" ? (
                <span className="text-muted">
                  {" "}
                  · right away, even in quiet hours
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      {prompt ? (
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Because this sounded serious, {prompt.by.split(" ")[0]} was prompted
          to call 911 first if {name} may be in danger.
        </p>
      ) : null}
    </div>
  );
}

/** Same threshold the staff console uses for "overdue" (OPS-003). */
const ACK_TARGET_MIN = 15;

/**
 * ESC-003: the family can see that something is open and who has it. Only the
 * title, owner, next action and who was notified are shown. `detail` and the
 * rest of the timeline are staff-voice and stay in the console.
 */
export function EscalationCard({ account }: { account: Account }) {
  const nowMs = useNow();
  const me = currentMember(account)?.name;
  const isOverdue = (e: Escalation) =>
    !confirmedOwner(e) &&
    nowMs - Date.parse(e.openedAt) > ACK_TARGET_MIN * 60_000;
  // OPS-003: overdue sorts to the top, as in the console. Then newest first.
  const open = [...openEscalations(account)].sort(
    (a, b) =>
      Number(isOverdue(b)) - Number(isOverdue(a)) ||
      b.openedAt.localeCompare(a.openedAt),
  );
  const today = parentToday(account);
  const resolvedToday = account.escalations.filter(
    (e) =>
      e.resolvedAt && parentDate(account, new Date(e.resolvedAt)) === today,
  );

  if (open.length === 0 && resolvedToday.length === 0) return null;

  return (
    <div className="mt-6 space-y-3">
      {open.map((e) => {
        const overdue = isOverdue(e);
        const owner = confirmedOwner(e);
        return (
          <Card
            key={e.id}
            // Card sets bg-surface itself, so the tint needs to win outright.
            className={owner ? "" : "border-amber/30! bg-amber-soft/50!"}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[16px] font-semibold text-ink">
                {titleFor(e, me)}
              </p>
              <Pill tone={owner ? "sage" : "amber"}>Open</Pill>
            </div>
            {owner ? (
              <>
                <p className="mt-2 text-[15px] leading-relaxed text-ink">
                  {owner} has this.
                </p>
                {e.nextAction && !keepsReasonPrivate(e) ? (
                  <p className="mt-1 text-[14px] leading-relaxed text-muted">
                    Next: {e.nextAction}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="mt-2 text-[15px] leading-relaxed text-ink">
                  {e.owner
                    ? `Assigned to ${e.owner}. Waiting for ${e.owner.split(" ")[0]} to pick it up.`
                    : "Waiting for a Care Specialist to pick this up."}
                </p>
                <p
                  className={`mt-1 text-[13px] ${overdue ? "font-medium text-amber" : "text-muted"}`}
                >
                  Opened {ago(e.openedAt, nowMs)}
                </p>
              </>
            )}
            <WhoWeTold e={e} me={me} name={account.parent.preferredName} />
          </Card>
        );
      })}

      {resolvedToday.map((e) => (
        <p key={e.id} className="px-1 text-[13px] leading-relaxed text-faint">
          Resolved today{e.owner ? ` by ${e.owner}` : ""}: {titleFor(e, me)}.
          {e.resolution && !keepsReasonPrivate(e) ? ` ${e.resolution}` : ""}
        </p>
      ))}
    </div>
  );
}
