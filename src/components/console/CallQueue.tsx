"use client";

import { Pill } from "@/components/ui";
import {
  STATE_TONE,
  outcomeLabel,
  type CallSubject,
} from "@/lib/console/subject";
import {
  clockLabel,
  localTimeLabel,
  minutesLabel,
  minutesToClose,
  windowLabel,
} from "@/lib/console/time";
import { timezoneLabel } from "@/lib/timezones";
import { FOCUS, Panel } from "./primitives";

const COLS =
  "grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-3";

function CloseLabel({ min }: { min: number }) {
  if (min < 0)
    return (
      <span className="font-semibold text-clay">
        Closed {minutesLabel(min)} ago
      </span>
    );
  return (
    <span className={min < 30 ? "font-semibold text-clay" : "text-ink"}>
      {minutesLabel(min)} left
    </span>
  );
}

function Row({
  s,
  now,
  onOpen,
}: {
  s: CallSubject;
  now: number;
  onOpen: () => void;
}) {
  const min = minutesToClose(s.tz, s.windowStart, now);
  const last = s.history[0];
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={`${COLS} w-full rounded-xl px-3 py-3 text-left text-[14px] transition-colors hover:bg-cream ${FOCUS} ${
          min < 30 ? "bg-clay-soft/60" : ""
        }`}
      >
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink">
            {s.fullName}
            {s.live ? (
              <span className="ml-2 rounded-full bg-sage-soft px-2 py-0.5 text-[11px] font-semibold text-sage-dark">
                Live family
              </span>
            ) : null}
          </span>
          <span className="block truncate text-[12px] text-muted">
            {timezoneLabel(s.tz)}
          </span>
        </span>
        <span className="tabular-nums text-ink">
          {localTimeLabel(s.tz, now)}
        </span>
        <span className="text-muted">
          {windowLabel(s.windowStart)}
          <span className="block text-[12px]">
            <CloseLabel min={min} />
          </span>
        </span>
        <span>
          <Pill tone="moss">Consent on file</Pill>
        </span>
        <span>
          {last?.state ? (
            <Pill tone={STATE_TONE[last.state]}>{outcomeLabel(last)}</Pill>
          ) : (
            <Pill tone="amber">{outcomeLabel(last)}</Pill>
          )}
        </span>
      </button>
    </li>
  );
}

/** OPS-001: in the order they expire. No sort, no filter, on purpose. */
export function CallQueue({
  subjects,
  now,
  vaName,
  onOpen,
}: {
  subjects: CallSubject[];
  now: number;
  vaName: string;
  onOpen: (key: string) => void;
}) {
  const due = subjects
    .filter((s) => !s.today)
    .sort(
      (a, b) =>
        minutesToClose(a.tz, a.windowStart, now) -
        minutesToClose(b.tz, b.windowStart, now),
    );
  const done = subjects.filter((s) => s.today);

  return (
    <div className="space-y-6">
      <Panel
        title={`${vaName}'s calls · ${due.length} due`}
        action={
          <span className="text-[12px] text-faint">
            Ordered by window close. Times are hers, not yours.
          </span>
        }
      >
        <div
          className={`${COLS} border-b border-line px-3 pb-2 text-[12px] font-medium text-faint`}
          aria-hidden
        >
          <span>Parent</span>
          <span>Her time now</span>
          <span>Window</span>
          <span>Consent</span>
          <span>Last outcome</span>
        </div>
        {due.length ? (
          <ol className="mt-1 space-y-1">
            {due.map((s) => (
              <Row key={s.key} s={s} now={now} onOpen={() => onOpen(s.key)} />
            ))}
          </ol>
        ) : (
          <p className="px-3 py-6 text-[15px] text-muted">
            Every call for today is logged.
          </p>
        )}
      </Panel>

      <Panel title={`Done today · ${done.length}`}>
        {done.length ? (
          <ul className="divide-y divide-line">
            {done.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => onOpen(s.key)}
                  className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-[14px] hover:bg-cream ${FOCUS}`}
                >
                  <span className="font-medium text-ink">
                    {s.fullName}
                    {s.live ? (
                      <span className="ml-2 text-[12px] font-normal text-sage-dark">
                        Live family
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-3 text-muted">
                    {s.today?.state ? (
                      <Pill tone={STATE_TONE[s.today.state]}>
                        {outcomeLabel(s.today)}
                      </Pill>
                    ) : null}
                    {s.today?.loggedAt
                      ? `Logged ${clockLabel(s.today.loggedAt)} by ${s.today.vaName ?? "the VA"}`
                      : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 text-[14px] text-muted">Nothing logged yet.</p>
        )}
      </Panel>
    </div>
  );
}
