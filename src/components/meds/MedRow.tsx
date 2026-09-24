"use client";

import { useState } from "react";
import { Card, Pill } from "@/components/ui";
import {
  type DoseState,
  doseState,
  formatTimes,
  formatTimesSentence,
  remindersOff,
} from "@/lib/meds";
import { CHANNEL_COPY } from "@/lib/config";
import { formatHour } from "@/lib/timezones";
import type { Account, Medication } from "@/lib/types";

const DOSE_PILL: Record<
  DoseState,
  { label: string; tone: "moss" | "neutral" | "amber" }
> = {
  acknowledged: { label: "She confirmed", tone: "moss" },
  upcoming: { label: "Coming up", tone: "neutral" },
  no_response: { label: "No response yet", tone: "amber" },
  starts_tomorrow: { label: "Starts tomorrow", tone: "neutral" },
  paused: { label: "Not sending yet", tone: "neutral" },
  stopped: { label: "Stopped", tone: "neutral" },
};

/**
 * One medication. Scheduled meds show today's reminder per dose (MED-003:
 * today only). As-needed meds show no time and no state at all (MED-002).
 */
export function MedRow({
  account,
  med,
  nowHour,
  canEdit,
  onRemove,
}: {
  account: Account;
  med: Medication;
  nowHour: number;
  canEdit: boolean;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const channel = CHANNEL_COPY[account.parent.channel];
  const off = remindersOff(account);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[16px] font-semibold text-ink">
            {med.name}{" "}
            <span className="font-normal text-muted">{med.dose}</span>
          </p>
          {med.purpose ? (
            <p className="mt-0.5 text-[14px] text-muted">
              For {med.purpose.toLowerCase()}
            </p>
          ) : null}
        </div>
        {canEdit && !confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="-my-2.5 -mr-1 min-h-11 shrink-0 px-1 text-[14px] font-medium text-muted underline underline-offset-4 hover:text-ink"
          >
            Remove
          </button>
        ) : null}
      </div>

      {med.schedule.kind === "scheduled" ? (
        <>
          <p className="mt-3 font-serif text-[20px] text-ink">
            {formatTimes(med.schedule.hours)}
          </p>
          {off === "withdrawn" || off === "deceased" ? null : (
            <p className="mt-0.5 text-[13px] text-muted">
              {off === "pending"
                ? "Once she agrees, we'll"
                : off === "paused"
                  ? "When the pause ends, we'll"
                  : "We'll"}{" "}
              {channel.verb} her at {formatTimesSentence(med.schedule.hours)},
              her time.
            </p>
          )}
          <ul className="mt-3 space-y-1.5" aria-label="Today">
            {[...med.schedule.hours]
              .sort((a, b) => a - b)
              .map((h) => {
                const s = DOSE_PILL[doseState(account, med.id, h, nowHour)];
                return (
                  <li
                    key={h}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-[14px] text-muted">
                      Today, {formatHour(h)}
                    </span>
                    <Pill tone={s.tone}>{s.label}</Pill>
                  </li>
                );
              })}
          </ul>
        </>
      ) : (
        <p className="mt-3 text-[14px] leading-snug text-muted">
          No reminder. Never counts as missed.
        </p>
      )}

      {med.instructions ? (
        <p className="mt-3 rounded-xl bg-cream px-3 py-2.5 text-[14px] leading-snug text-ink">
          {med.instructions}
        </p>
      ) : null}

      {confirming ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <p className="w-full text-[14px] text-ink">
            Remove {med.name}? Her reminders for it stop today.
          </p>
          <button
            type="button"
            onClick={onRemove}
            className="min-h-11 rounded-xl border border-clay/30 bg-clay-soft px-4 text-[14px] font-medium text-clay"
          >
            Yes, remove
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="min-h-11 rounded-xl border border-line px-4 text-[14px] font-medium text-ink"
          >
            Keep it
          </button>
        </div>
      ) : null}
    </Card>
  );
}
