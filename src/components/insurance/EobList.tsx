"use client";

import { Pill, money } from "@/components/ui";
import { EOB_STATUS, appealRequested, shortDate } from "@/lib/insurance";
import type { Account, Eob } from "@/lib/types";

/** What she owes, worded honestly for each status. */
export function owesLine(eob: Eob): string {
  if (eob.status === "pending") return `She may owe about ${money(eob.youOwe)}`;
  if (eob.youOwe === 0) return "She owes nothing";
  return `She owes ${money(eob.youOwe)}`;
}

function EobRow({
  account,
  eob,
  onOpen,
}: {
  account: Account;
  eob: Eob;
  onOpen: () => void;
}) {
  const status = EOB_STATUS[eob.status];
  const asked = eob.status === "denied" && appealRequested(account, eob);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`block w-full rounded-2xl border p-5 text-left transition-colors hover:border-sage/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40 ${
        eob.status === "denied" && !asked
          ? "border-clay/30 bg-clay-soft/40"
          : "border-line bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span>
          <span className="block text-[15px] font-medium text-ink">
            {eob.service}
          </span>
          <span className="mt-0.5 block text-[13px] text-muted">
            {eob.provider} · {shortDate(eob.date)}
          </span>
        </span>
        <Pill tone={status.tone}>{status.label}</Pill>
      </div>
      <p className="mt-3 font-serif text-[22px] leading-tight text-ink">
        {owesLine(eob)}
      </p>
      {asked ? (
        <p className="mt-1 text-[13px] text-muted">
          Appeal sent to {account.careTeam.specialistName.split(" ")[0]}.
        </p>
      ) : eob.status === "denied" ? (
        <p className="mt-1 text-[13px] font-medium text-clay">
          Tap to see what can be done.
        </p>
      ) : null}
    </button>
  );
}

export function EobList({
  account,
  onOpen,
}: {
  account: Account;
  onOpen: (id: string) => void;
}) {
  const eobs = [...account.eobs].sort((a, b) => {
    // Denied claims nobody has acted on come first; then newest first.
    const rank = (e: Eob) =>
      e.status === "denied" && !appealRequested(account, e) ? 0 : 1;
    return rank(a) - rank(b) || b.date.localeCompare(a.date);
  });
  return (
    <div className="space-y-3">
      {eobs.map((e) => (
        <EobRow
          key={e.id}
          account={account}
          eob={e}
          onOpen={() => onOpen(e.id)}
        />
      ))}
    </div>
  );
}
