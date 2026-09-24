"use client";

import { useRef, useState } from "react";
import { Card, SectionTitle, Select } from "@/components/ui";
import { currentMember } from "@/lib/permissions";
import { useAccount } from "@/lib/store";
import { formatHour, timezoneLabel } from "@/lib/timezones";
import type { Account, QuietHours as QuietHoursT } from "@/lib/types";
import { CardHead, EditActions, Row } from "./parts";

const HOURS = Array.from({ length: 24 }, (_, h) => ({
  id: String(h),
  label: formatHour(h),
}));

/**
 * NTF-001: quiet hours are family-local, deliberately not parent-local. The
 * data model holds one setting per account, read on each member's own clock,
 * and the copy says so rather than implying it is personal.
 */
export function QuietHours({ account }: { account: Account }) {
  const { update } = useAccount();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<QuietHoursT>(account.quietHours);
  const editRef = useRef<HTMLButtonElement>(null);
  const me = currentMember(account);
  const { quietHours } = account;
  const others = account.members.length > 1;
  const same = draft.startHour === draft.endHour;

  const close = () => {
    setEditing(false);
    requestAnimationFrame(() => editRef.current?.focus());
  };

  return (
    <div className="mt-8">
      <SectionTitle>Your notifications</SectionTitle>
      <Card>
        <CardHead
          title="Quiet hours"
          canEdit
          editing={editing}
          editRef={editRef}
          onEdit={() => {
            setDraft(quietHours);
            setEditing(true);
          }}
        />
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="From"
                value={String(draft.startHour)}
                onChange={(v) => setDraft({ ...draft, startHour: Number(v) })}
                options={HOURS}
              />
              <Select
                label="Until"
                value={String(draft.endHour)}
                onChange={(v) => setDraft({ ...draft, endHour: Number(v) })}
                options={HOURS}
              />
            </div>
            <p
              className={`text-[13px] leading-relaxed ${same ? "text-clay" : "text-muted"}`}
              aria-live="polite"
            >
              {same
                ? "Pick two different times."
                : `On your clock: ${timezoneLabel(me?.familyTimezone ?? "America/New_York")}.`}
            </p>
            <EditActions
              canSave={!same}
              onCancel={close}
              onSave={() => {
                update((d) => ((d.quietHours = { ...draft }), d));
                close();
              }}
            />
          </div>
        ) : (
          <>
            <Row
              label="Held until morning"
              value={`${formatHour(quietHours.startHour)} – ${formatHour(quietHours.endHour)}`}
            />
            <Row
              label="Your timezone"
              value={timezoneLabel(me?.familyTimezone ?? "America/New_York")}
            />
            {/* NTF-002: safety alerts ignore quiet hours. */}
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              Routine updates wait for morning. Anything urgent comes through
              anyway, at any hour.
              {others
                ? " These hours apply to everyone on the account, each on their own clock."
                : ""}
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
