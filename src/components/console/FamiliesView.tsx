"use client";

import { Banner, Pill } from "@/components/ui";
import {
  STATE_TONE,
  outcomeLabel,
  type CallSubject,
} from "@/lib/console/subject";
import { clockLabel, localTimeLabel, windowLabel } from "@/lib/console/time";
import { timezoneLabel } from "@/lib/timezones";
import { KnowHer } from "./KnowHer";
import { CButton, FOCUS, Panel } from "./primitives";

function TodayPill({ s }: { s: CallSubject }) {
  return s.today?.state ? (
    <Pill tone={STATE_TONE[s.today.state]}>{outcomeLabel(s.today)}</Pill>
  ) : (
    <Pill tone="neutral">Not called yet today</Pill>
  );
}

function Today({ s, vaName }: { s: CallSubject; vaName: string }) {
  const c = s.today;
  return (
    <Panel title="Today">
      <div className="flex flex-wrap items-center gap-2">
        <TodayPill s={s} />
        {c?.loggedAt ? (
          <span className="text-[13px] text-muted">
            {clockLabel(c.loggedAt, s.tz)} her time by {c.vaName ?? "the VA"}
          </span>
        ) : null}
      </div>
      {c?.summary ? (
        <p className="mt-3 text-[15px] leading-relaxed text-ink">{c.summary}</p>
      ) : null}
      <p className="mt-3 text-[13px] text-muted">
        Read only. {vaName} calls and logs from the call queue.
      </p>
    </Panel>
  );
}

function Detail({
  s,
  now,
  vaName,
  notice,
  onBack,
}: {
  s: CallSubject;
  now: number;
  vaName: string;
  notice: string | null;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <CButton size="sm" variant="ghost" onClick={onBack}>
          ‹ Families
        </CButton>
        <p className="text-[14px] text-muted">
          Her time {localTimeLabel(s.tz, now)} · window{" "}
          {windowLabel(s.windowStart)} · {s.phone}
        </p>
      </div>
      {notice ? (
        <div className="mb-5">
          <Banner tone="neutral" title={`${s.fullName} is not in the queue`}>
            {notice}
          </Banner>
        </div>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <KnowHer s={s} heading="Her background" />
        <div className="space-y-5">
          <Today s={s} vaName={vaName} />
        </div>
      </div>
    </div>
  );
}

/**
 * OPS-004: the Care Specialist's read-only view of each family. Same card the
 * VA reads before a call, with no dialling and no logging.
 */
export function FamiliesView({
  subjects,
  now,
  vaName,
  openKey,
  noticeFor,
  onOpen,
  onBack,
}: {
  subjects: CallSubject[];
  now: number;
  vaName: string;
  openKey: string | null;
  noticeFor: (s: CallSubject) => string | null;
  onOpen: (key: string) => void;
  onBack: () => void;
}) {
  const open = subjects.find((s) => s.key === openKey);
  if (open)
    return (
      <Detail
        s={open}
        now={now}
        vaName={vaName}
        notice={noticeFor(open)}
        onBack={onBack}
      />
    );

  const sorted = [...subjects].sort((a, b) =>
    a.fullName.localeCompare(b.fullName),
  );
  return (
    <Panel title={`Families · ${subjects.length}`}>
      <ul className="divide-y divide-line">
        {sorted.map((s) => {
          const esc = s.openEscalations.length;
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => onOpen(s.key)}
                className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-[14px] hover:bg-cream ${FOCUS}`}
              >
                <span className="min-w-0">
                  <span className="block font-medium text-ink">
                    {s.fullName}
                    {s.live ? (
                      <span className="ml-2 rounded-full bg-sage-soft px-2 py-0.5 text-[11px] font-semibold text-sage-dark">
                        Live family
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-[12px] text-muted">
                    {s.familyName} · {timezoneLabel(s.tz)}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {esc ? (
                    <Pill tone="clay">
                      {esc} open escalation{esc === 1 ? "" : "s"}
                    </Pill>
                  ) : null}
                  <TodayPill s={s} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
