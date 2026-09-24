"use client";

import Link from "next/link";
import { Card, Pill, SectionTitle, type Tone } from "@/components/ui";
import { canDeliver } from "@/lib/actions";
import { type DoseState, doseState, parentHourNow } from "@/lib/meds";
import { formatHour } from "@/lib/timezones";
import type { Account } from "@/lib/types";

const STATE: Record<DoseState, { label: string; tone: Tone }> = {
  acknowledged: { label: "Acknowledged", tone: "moss" },
  upcoming: { label: "Upcoming", tone: "neutral" },
  no_response: { label: "No response", tone: "amber" },
  starts_tomorrow: { label: "Starts tomorrow", tone: "neutral" },
  paused: { label: "Not sending yet", tone: "neutral" },
  stopped: { label: "Stopped", tone: "neutral" },
};

/**
 * MED-003: today's acknowledgements only. No history, no streaks, no
 * percentages. MED-002: as-needed medicines have no time, so they are never
 * listed as due and never read as missed.
 *
 * Uses the same doseState() as the Care tab, so a reminder whose hour has
 * passed without an answer reads the same in both places.
 */
export function TodayReminders({ account }: { account: Account }) {
  if (!canDeliver(account)) return null;

  const nowHour = parentHourNow(account.parent.parentTimezone);
  const doses = account.medications
    .flatMap((m) =>
      m.schedule.kind === "scheduled"
        ? m.schedule.hours.map((hour) => ({ med: m, hour }))
        : [],
    )
    .sort((a, b) => a.hour - b.hour);

  if (doses.length === 0) return null;

  const stateFor = (medId: string, hour: number) =>
    doseState(account, medId, hour, nowHour);

  return (
    <div className="mt-8">
      <SectionTitle>Today&apos;s reminders</SectionTitle>
      <Card className="py-3">
        <ul className="divide-y divide-line">
          {doses.map(({ med, hour }) => {
            const s = STATE[stateFor(med.id, hour)];
            return (
              <li
                key={`${med.id}-${hour}`}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium text-ink">
                    {med.name}{" "}
                    <span className="font-normal text-muted">{med.dose}</span>
                  </span>
                  <span className="block text-[13px] text-faint">
                    {formatHour(hour)} her time
                  </span>
                </span>
                <Pill tone={s.tone}>{s.label}</Pill>
              </li>
            );
          })}
        </ul>
        <Link
          href="/care/medications"
          className="mt-2 inline-flex min-h-11 items-center text-[14px] font-medium text-sage-dark"
        >
          All her medications <span aria-hidden>&nbsp;›</span>
        </Link>
      </Card>
    </div>
  );
}
