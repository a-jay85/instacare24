"use client";

import { Card, Pill, SectionTitle } from "@/components/ui";
import { parentToday, pastCheckIns } from "@/lib/actions";
import { tierFor } from "@/lib/risk";
import type { Account, CheckInRecord } from "@/lib/types";
import { dayLabel } from "./time";

/** FEED-002: a day with no completed check-in never reads as empty or as fine. */
function Entry({ record, today }: { record: CheckInRecord; today: string }) {
  const unchecked = record.state === null;
  // The HITL score is a helper, so it only surfaces where it adds something.
  const tier =
    record.state === "something_off" && record.riskScore !== undefined
      ? tierFor(record.riskScore)
      : null;
  return (
    <Card className={unchecked ? "border-amber/30! bg-amber-soft/50!" : ""}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-muted">
          {dayLabel(record.date, today)}
        </span>
        <span className="flex items-center gap-1.5">
          {tier ? <Pill tone="neutral">{tier.label} risk</Pill> : null}
          {unchecked ? (
            <Pill tone="amber">Not checked</Pill>
          ) : record.state === "reached" ? (
            <Pill tone="moss">Reached</Pill>
          ) : record.state === "not_reached" ? (
            <Pill tone="clay">No answer</Pill>
          ) : (
            <Pill tone="clay">Something is off</Pill>
          )}
        </span>
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-ink">
        {record.summary ?? "No check-in was completed on this day."}
      </p>
      {record.vaName ? (
        <p className="mt-2 text-[12px] text-faint">{record.vaName}</p>
      ) : null}
    </Card>
  );
}

export function HistoryList({ account }: { account: Account }) {
  const today = parentToday(account);
  const rest = pastCheckIns(account);
  if (rest.length === 0) return null;
  return (
    <div className="mt-9">
      <SectionTitle>Earlier</SectionTitle>
      <div className="space-y-3">
        {rest.map((r) => (
          <Entry key={r.id} record={r} today={today} />
        ))}
      </div>
    </div>
  );
}
