"use client";

import { useState } from "react";
import { Banner, Pill } from "@/components/ui";
import { familyNameOf } from "@/lib/console/subject";
import { ageMinutes, clockLabel, minutesLabel } from "@/lib/console/time";
import { isoDate } from "@/lib/actions";
import { useAccount } from "@/lib/store";
import type { Account } from "@/lib/types";
import { approveVisit, awaitingReview, markOpened } from "@/lib/visits";
import { SOURCE_WORD, VisitDraftView, visitDay } from "./VisitDraftView";
import { ConsoleHeader, FOCUS, Panel } from "./primitives";

const waitLabel = (min: number) => (min < 1 ? "Just now" : minutesLabel(min));

const COLS =
  "grid grid-cols-[6.5rem_minmax(0,1.6fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_4.5rem] items-center gap-3";

/**
 * Epic 8 "Human Review Queue": AI drafts wait here for the Care Specialist.
 * Only the live family's visits exist, so the list is often empty until a
 * visit is added in the family app.
 */
export function VisitReview({
  account,
  now,
  me,
}: {
  account: Account | null;
  now: number;
  /** Always the Care Specialist: the view is only in her nav. */
  me: string;
}) {
  const { update } = useAccount();
  const [openId, setOpenId] = useState<string | null>(null);
  const visits = account?.visits ?? [];
  const pending = account ? awaitingReview(account) : [];
  const onOpen = (id: string) => update((a) => markOpened(a, id, me));
  const onApprove = (id: string, plain: string) =>
    update((a) => approveVisit(a, id, `${me}, Care Specialist`, plain));
  const today = isoDate(new Date(now));
  const doneToday = visits
    .filter((v) => v.reviewedAt && isoDate(new Date(v.reviewedAt)) === today)
    .sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""));
  const opened = visits.find((v) => v.id === openId);

  if (account && opened)
    return (
      <VisitDraftView
        visit={opened}
        parentName={account.parent.fullName}
        family={familyNameOf(account)}
        me={me}
        onBack={() => setOpenId(null)}
        onApprove={(plain) => onApprove(opened.id, plain)}
      />
    );

  return (
    <div className="space-y-5">
      <ConsoleHeader
        title="Visit summaries to check"
        subtitle="AI drafts from doctor visits. Nothing reaches the family until you approve it."
        aside={
          <span className="text-[13px] text-muted">Signed in as {me}</span>
        }
      />
      <p className="rounded-xl bg-sage-soft px-4 py-3 text-[14px] text-sage-dark">
        A person reads every AI summary before the family does. Check it against
        the transcript, clear the flags, then approve. Nothing here is advice:
        questions about her care go to her own doctors.
      </p>

      {!account ? (
        <Banner tone="amber" title="No live family in this browser">
          Load a family from Demo controls, then add a visit in the family app.
          Its draft lands here.
        </Banner>
      ) : null}

      {pending.length === 0 ? (
        <Panel title="Waiting · 0">
          <p className="py-3 text-[15px] text-muted">
            Nothing waiting. When a family adds a visit, its draft lands here
            for you to check before they see it.
          </p>
        </Panel>
      ) : (
        <div className="overflow-x-auto">
          <Panel
            title={`Waiting · ${pending.length}`}
            className="min-w-[720px]"
          >
            <div
              aria-hidden
              className={`${COLS} border-b border-line px-3 pb-2 text-[12px] font-medium text-faint`}
            >
              <span>Visit date</span>
              <span>Doctor</span>
              <span>Parent</span>
              <span>Flags</span>
              <span>Waiting</span>
            </div>
            <ol className="mt-1 space-y-1">
              {pending.map((v) => {
                const flags = v.draft?.flags ?? [];
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenId(v.id);
                        onOpen(v.id);
                      }}
                      aria-label={`Check the ${v.provider} summary for ${account?.parent.fullName}`}
                      className={`${COLS} w-full rounded-xl px-3 py-3 text-left text-[14px] hover:bg-cream/70 ${FOCUS}`}
                    >
                      <span className="text-ink tabular-nums">
                        {visitDay(v.date)}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-ink">
                          {v.provider}
                        </span>
                        <span className="block text-[12px] text-muted">
                          {v.specialty} · {SOURCE_WORD[v.source]}
                        </span>
                      </span>
                      <span className="font-medium text-ink">
                        {account?.parent.fullName}
                        <span className="block text-[11px] font-semibold text-sage-dark">
                          Live family
                        </span>
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        {flags.map((f) => (
                          <Pill
                            key={f.title}
                            tone={f.kind === "guardrail" ? "clay" : "amber"}
                          >
                            {f.kind === "guardrail"
                              ? "Safety check"
                              : "Low confidence"}
                          </Pill>
                        ))}
                      </span>
                      <span className="text-ink tabular-nums">
                        {waitLabel(ageMinutes(v.draft?.draftedAt ?? "", now))}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Panel>
        </div>
      )}

      {doneToday.length ? (
        <Panel title={`Sent to families today · ${doneToday.length}`}>
          <ul className="space-y-2">
            {doneToday.map((v) => (
              <li key={v.id} className="text-[14px]">
                <span className="tabular-nums text-faint">
                  {clockLabel(v.reviewedAt ?? "")}
                </span>{" "}
                <span className="font-medium text-ink">{v.provider}</span>{" "}
                <span className="text-muted">
                  for {account?.parent.fullName} · checked by {v.verifiedBy}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
