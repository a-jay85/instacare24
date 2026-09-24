"use client";

import { useRef, useState } from "react";
import { timeIn, useNow } from "@/components/feed/time";
import { Card, Pill, SectionTitle, Select } from "@/components/ui";
import { notificationsFor, quietHoursProblem } from "@/lib/notifications";
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
  const problem = quietHoursProblem(draft);
  const tz = me?.familyTimezone ?? "America/New_York";

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
              className={`text-[13px] leading-relaxed ${problem ? "text-clay" : "text-muted"}`}
              aria-live="polite"
            >
              {problem ?? `On your clock: ${timezoneLabel(tz)}.`}
            </p>
            <EditActions
              canSave={!problem}
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
            <Row label="Your timezone" value={timezoneLabel(tz)} />
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
        {me ? <Recent account={account} memberId={me.id} tz={tz} /> : null}
      </Card>
    </div>
  );
}

/** NTF-001 / NTF-002 made visible: what went out, and what is waiting. */
function Recent({
  account,
  memberId,
  tz,
}: {
  account: Account;
  memberId: string;
  tz: string;
}) {
  const nowMs = useNow();
  const items = notificationsFor(account, memberId).slice(0, 5);
  if (!items.length || !nowMs) return null;
  return (
    <div className="mt-4 border-t border-line pt-3">
      <p className="text-[13px] font-medium text-muted">Recent notifications</p>
      <ul className="mt-2 space-y-2">
        {items.map((n) => {
          const waiting = Date.parse(n.delivery.deliverAt) > nowMs;
          const when = timeIn(n.delivery.deliverAt, tz);
          return (
            <li key={n.id} className="text-[14px] leading-snug">
              <span className="text-ink">{n.title}</span>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted">
                {n.kind === "safety" ? <Pill tone="clay">Urgent</Pill> : null}
                {waiting
                  ? `Held for quiet hours. Arrives ${when} your time.`
                  : n.delivery.held
                    ? `Held for quiet hours, sent ${when} your time.`
                    : `Sent ${when} your time.`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
