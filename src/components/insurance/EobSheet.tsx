"use client";

import {
  Banner,
  Button,
  Pill,
  Provenance,
  Sheet,
  money,
} from "@/components/ui";
import {
  EOB_STATUS,
  appealRequested,
  eobAuditFor,
  shortDate,
} from "@/lib/insurance";
import { currentMember } from "@/lib/permissions";
import type { Account, Eob } from "@/lib/types";
import { owesLine } from "./EobList";
import { EobShare } from "./EobShare";

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
 * scripted seed data standing in for an AI read. No person checks it before it
 * shows here, and the screen says so. A person comes in only on an appeal.
 */
/** The letter's audit log, newest first. */
function AuditTrail({ account, eob }: { account: Account; eob: Eob }) {
  const log = eobAuditFor(account, eob.id).slice(0, 5);
  if (!log.length) return null;
  return (
    <div className="mt-5">
      <p className="text-[13px] font-medium text-ink">Who opened this letter</p>
      <ul className="mt-1.5 space-y-1 text-[13px] text-muted">
        {log.map((e, i) => (
          <li key={i}>
            {e.actor} {e.action === "share" ? "made a share link" : "opened it"}
            ,{" "}
            {new Date(e.at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
  const first = account.careTeam.specialistName.split(" ")[0];
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

      <Provenance>Read by InstaCare24 AI · not checked by a person</Provenance>

      {eob.status === "denied" ? (
        <div className="mt-5">
          {asked ? (
            <Banner tone="moss" title={`Appeal sent to ${first}.`}>
              She calls the doctor&apos;s office, gathers what the plan needs
              and files the appeal. You can follow it on the Today screen.
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
      ) : null}

      <p className="mt-5 text-[13px] leading-relaxed text-faint">
        This letter is not a bill.{" "}
        {eob.status === "denied"
          ? "Any bill comes from the doctor's office separately."
          : `${owesLine(eob)}, and the doctor's office sends the bill separately.`}
      </p>

      {/* Sharing sends her record out, so it stays with write access. */}
      {currentMember(account)?.accessLevel === "read" ? null : (
        <EobShare key={eob.id} eobId={eob.id} />
      )}
      <AuditTrail account={account} eob={eob} />
    </Sheet>
  );
}
