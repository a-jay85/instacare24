"use client";

import { Card, Pill } from "@/components/ui";
import { openEscalations, todayIso } from "@/lib/actions";
import type { Account, Escalation } from "@/lib/types";
import { ago, useNow } from "./time";

/**
 * AUT-003: next action and resolution are free text typed by staff. On a
 * consent withdrawal that is exactly where her reason could leak, so the family
 * sees only who has it.
 */
const keepsReasonPrivate = (e: Escalation) => e.source === "consent_withdrawn";

/** Same threshold the staff console uses for "overdue" (OPS-003). */
const ACK_TARGET_MIN = 15;

/**
 * ESC-003: the family can see that something is open and who has it. Only the
 * title, owner and next action are shown. `detail` is staff-voice and stays in
 * the console.
 */
export function EscalationCard({ account }: { account: Account }) {
  const nowMs = useNow();
  const open = [...openEscalations(account)].sort((a, b) =>
    b.openedAt.localeCompare(a.openedAt),
  );
  const today = todayIso();
  const resolvedToday = account.escalations.filter(
    (e) => e.resolvedAt && e.resolvedAt.slice(0, 10) === today,
  );

  if (open.length === 0 && resolvedToday.length === 0) return null;

  return (
    <div className="mt-6 space-y-3">
      {open.map((e) => {
        const overdue =
          !e.owner && nowMs - Date.parse(e.openedAt) > ACK_TARGET_MIN * 60_000;
        return (
          <Card
            key={e.id}
            className={e.owner ? "" : "border-amber/30 bg-amber-soft/50"}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[16px] font-semibold text-ink">{e.title}</p>
              <Pill tone={e.owner ? "sage" : "amber"}>Open</Pill>
            </div>
            {e.owner ? (
              <>
                <p className="mt-2 text-[15px] leading-relaxed text-ink">
                  {e.owner} has this.
                </p>
                {e.nextAction && !keepsReasonPrivate(e) ? (
                  <p className="mt-1 text-[14px] leading-relaxed text-muted">
                    Next: {e.nextAction}
                  </p>
                ) : null}
              </>
            ) : (
              <p
                className={`mt-2 text-[14px] leading-relaxed ${overdue ? "font-medium text-amber" : "text-muted"}`}
              >
                Waiting for a Care Specialist · opened {ago(e.openedAt, nowMs)}
              </p>
            )}
          </Card>
        );
      })}

      {resolvedToday.map((e) => (
        <p key={e.id} className="px-1 text-[13px] leading-relaxed text-faint">
          Resolved today{e.owner ? ` by ${e.owner}` : ""}: {e.title}.
          {e.resolution && !keepsReasonPrivate(e) ? ` ${e.resolution}` : ""}
        </p>
      ))}
    </div>
  );
}
