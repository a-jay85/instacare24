"use client";

import {
  Banner,
  Button,
  Pill,
  Provenance,
  Sheet,
  money,
} from "@/components/ui";
import { EOB_STATUS, appealRequested, shortDate } from "@/lib/insurance";
import type { Account, Eob } from "@/lib/types";
import { owesLine } from "./EobList";

function Line({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-2 ${strong ? "border-t border-line pt-3" : ""}`}
    >
      <span
        className={`text-[14px] ${strong ? "font-medium text-ink" : "text-muted"}`}
      >
        {label}
      </span>
      <span
        className={`text-right ${strong ? "font-serif text-[22px] text-ink" : "text-[15px] font-medium text-ink"}`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * One Explanation of Benefits, read and explained. The plain-English text is
 * scripted seed data standing in for an AI read that a Care Specialist checks.
 */
export function EobSheet({
  account,
  eob,
  onClose,
  onAppeal,
}: {
  account: Account;
  eob: Eob | null;
  onClose: () => void;
  onAppeal: (eob: Eob) => void;
}) {
  if (!eob) return null;
  const status = EOB_STATUS[eob.status];
  const specialist = account.careTeam.specialistName;
  const first = specialist.split(" ")[0];
  const asked = appealRequested(account, eob);

  return (
    <Sheet open onClose={onClose} title={eob.service}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[14px] text-muted">
          {eob.provider} · {shortDate(eob.date)}
        </p>
        <Pill tone={status.tone}>{status.label}</Pill>
      </div>

      <div className="mt-4 rounded-2xl border border-line p-4">
        <Line label="The doctor billed" value={money(eob.billed)} />
        <Line label="Her plan paid" value={money(eob.planPaid)} />
        <Line
          label={eob.status === "pending" ? "She may owe" : "She owes"}
          value={money(eob.youOwe)}
          strong
        />
      </div>

      <p className="mt-4 text-[16px] leading-relaxed text-ink">{eob.plain}</p>

      {eob.flags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {eob.flags.map((f) => (
            <li key={f}>
              <Pill tone="amber">{f}</Pill>
            </li>
          ))}
        </ul>
      ) : null}

      <Provenance>Read by InstaCare24 AI · checked by {specialist}</Provenance>

      {eob.status === "denied" ? (
        <div className="mt-5">
          {asked ? (
            <Banner tone="moss" title={`${first} has the appeal.`}>
              She will call the doctor&apos;s office, gather what the plan needs
              and file the appeal. You&apos;ll hear from her as it moves.
            </Banner>
          ) : (
            <>
              <p className="mb-3 text-[14px] leading-relaxed text-muted">
                {first} can take this from here: she calls the office, gets the
                paperwork sent and files the appeal. You don&apos;t have to make
                any calls.
              </p>
              <Button full onClick={() => onAppeal(eob)}>
                Ask {first} to appeal this
              </Button>
            </>
          )}
        </div>
      ) : (
        <p className="mt-5 text-[13px] leading-relaxed text-faint">
          This letter is not a bill. {owesLine(eob)}, and the doctor&apos;s
          office sends the bill separately.
        </p>
      )}
    </Sheet>
  );
}
