"use client";

import { useLayoutEffect, type ReactNode, type Ref } from "react";
import { Button, LockNote } from "@/components/ui";
import { authorizedAgent } from "@/lib/permissions";
import type { Account } from "@/lib/types";

/** Visible keyboard focus for the small custom buttons in this module. */
export const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="shrink-0 text-[14px] text-muted">{label}</span>
      <span className="min-w-0 break-words text-right text-[15px] font-medium text-ink">
        {value}
      </span>
    </div>
  );
}

/** Keeps a pill on one line beside a heading that is allowed to wrap. */
export function HeadRow({
  title,
  aside,
}: {
  title: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <h3 className="min-w-0 text-[16px] font-semibold leading-snug text-ink">
        {title}
      </h3>
      <span className="shrink-0 whitespace-nowrap">{aside}</span>
    </div>
  );
}

export function CardHead({
  title,
  canEdit,
  editing,
  onEdit,
  editRef,
}: {
  title: string;
  canEdit: boolean;
  editing: boolean;
  onEdit: () => void;
  editRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
      {canEdit && !editing ? (
        <button
          ref={editRef}
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${title.toLowerCase()}`}
          className={`-my-2.5 -mr-3 min-h-11 rounded-lg px-3 text-[14px] font-medium text-sage underline underline-offset-4 hover:text-sage-dark ${FOCUS_RING}`}
        >
          Edit
        </button>
      ) : null}
    </div>
  );
}

/** Save / Cancel pair for the inline editors. Nothing is written until Save. */
export function EditActions({
  onSave,
  onCancel,
  canSave = true,
}: {
  onSave: () => void;
  onCancel: () => void;
  canSave?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={onSave} disabled={!canSave}>
        Save
      </Button>
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

/**
 * The shared Sheet focuses itself on open but does not hand focus back on
 * close. A layout effect runs before the Sheet's own focus effect, so it can
 * still see the button that opened it.
 */
export function useReturnFocus(open: boolean) {
  useLayoutEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    return () => {
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);
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
