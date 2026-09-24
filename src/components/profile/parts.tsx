"use client";

import { LockNote } from "@/components/ui";
import { authorizedAgent } from "@/lib/permissions";
import type { Account } from "@/lib/types";

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[14px] text-muted">{label}</span>
      <span className="text-right text-[15px] font-medium text-ink">
        {value}
      </span>
    </div>
  );
}

export function CardHead({
  title,
  canEdit,
  editing,
  onEdit,
}: {
  title: string;
  canEdit: boolean;
  editing: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
      {canEdit && !editing ? (
        <button
          type="button"
          onClick={onEdit}
          className="text-[14px] font-medium text-sage underline underline-offset-4"
        >
          Edit
        </button>
      ) : null}
    </div>
  );
}

/** AUT-001: named, so the read-only state explains itself instead of just blocking. */
export function AgentLock({ account }: { account: Account }) {
  const agent = authorizedAgent(account);
  return (
    <LockNote>
      Only {agent?.name ?? "the healthcare proxy"} can change this. You pay for
      the service; {agent ? agent.name.split(" ")[0] : "they"} hold
      {agent ? "s" : ""} {account.parent.preferredName}&apos;s healthcare proxy.
    </LockNote>
  );
}

export function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
