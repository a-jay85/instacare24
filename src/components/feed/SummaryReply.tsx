"use client";

import { useState } from "react";
import { Button, TextArea } from "@/components/ui";
import { replyToSummary } from "@/lib/actions";
import { currentMember } from "@/lib/permissions";
import { useAccount } from "@/lib/store";
import type { Account, CheckInRecord } from "@/lib/types";
import { timeIn } from "./time";

/**
 * FEED-004: reply to today's summary. The VA sees it on her screen before
 * she next calls. Anyone on the account can reply; it changes nothing about
 * her care.
 */
export function SummaryReply({
  account,
  checkIn,
}: {
  account: Account;
  checkIn: CheckInRecord;
}) {
  const { update } = useAccount();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const me = currentMember(account);
  const va = checkIn.vaName ?? account.careTeam.vaName;
  const vaFirst = va.split(" ")[0];
  const replies = checkIn.replies ?? [];
  const tz = me?.familyTimezone ?? account.parent.parentTimezone;

  const send = () => {
    if (!me || !text.trim()) return;
    update((d) => replyToSummary(d, checkIn.id, me, text.trim()));
    setText("");
    setOpen(false);
  };

  return (
    <div className="mt-4">
      {replies.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {replies.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-line bg-surface px-4 py-3"
            >
              <p className="text-[15px] leading-relaxed text-ink">{r.text}</p>
              <p className="mt-1 text-[13px] text-faint">
                {r.memberId === me?.id ? "You" : r.name.split(" ")[0]} ·{" "}
                {timeIn(r.at, tz)} · for {vaFirst}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      {open ? (
        <div className="space-y-3">
          <TextArea
            label={`Reply to ${vaFirst}`}
            hint={`${vaFirst} reads it before she next calls. For anything urgent, use Talk to someone.`}
            placeholder="e.g. Ask her about the new neighbor."
            value={text}
            onChange={setText}
            rows={3}
          />
          <div className="flex gap-2">
            <Button onClick={send} disabled={!text.trim()}>
              Send to {vaFirst}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Reply to {vaFirst}
        </Button>
      )}
    </div>
  );
}
