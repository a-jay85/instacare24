"use client";

import { useState } from "react";
import { Banner, Pill } from "@/components/ui";
import { useOpsSettings } from "@/lib/console/opsSettings";
import { SUMMARY_DELIVERY_MINUTES } from "@/lib/console/roles";
import {
  STATE_TONE,
  draftSummary,
  outcomeLabel,
  type CallSubject,
  type LogInput,
} from "@/lib/console/subject";
import {
  clockLabel,
  localTimeLabel,
  minutesLabel,
  minutesToClose,
  stopwatch,
  windowLabel,
} from "@/lib/console/time";
import type { CheckInState } from "@/lib/types";
import { DialPanel, type CallPhase } from "./DialPanel";
import { KnowHer } from "./KnowHer";
import { OutcomeLogger } from "./OutcomeLogger";
import { CButton, Panel } from "./primitives";

type Logged = { state: CheckInState; seconds: number | null; auto?: boolean };

/**
 * CHK-004: no-answer attempts so far and when the next retry is due. Held by
 * the console page, so going back to the queue mid-wait keeps the count.
 */
export type RetryState = { noAnswers: number[]; nextRetryAt: number | null };

export const NO_RETRIES: RetryState = { noAnswers: [], nextRetryAt: null };

/**
 * CHK-006 and the "VA leaves" edge case: a new voice starts with the old
 * one's notes, and a cover call says so.
 */
function VoiceNote({ s, vaName }: { s: CallSubject; vaName: string }) {
  if (s.usualVa !== vaName)
    return (
      <div className="mb-5">
        <Banner tone="neutral" title={`Covering for ${s.usualVa} today`}>
          {s.preferredName} usually hears {s.usualVa.split(" ")[0]}. Say who you
          are and that {s.usualVa.split(" ")[0]} is back tomorrow.
        </Banner>
      </div>
    );
  // The note is for the first call. Once this VA has logged one, it goes.
  const called =
    s.handoff &&
    s.today?.loggedAt &&
    s.today.vaName === vaName &&
    s.today.loggedAt > s.handoff.at;
  if (s.handoff && s.handoff.to === vaName && !called)
    return (
      <div className="mb-5">
        <Banner tone="sage" title={`Handed over from ${s.handoff.from}`}>
          {s.handoff.note} {s.familyName} knows you call now.
        </Banner>
      </div>
    );
  return null;
}

function LoggedToday({ s }: { s: CallSubject }) {
  const c = s.today;
  if (!c?.state) return null;
  return (
    <Panel title="Logged today">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={STATE_TONE[c.state]}>{outcomeLabel(c)}</Pill>
        {c.loggedAt ? (
          <span className="text-[13px] text-muted">
            {clockLabel(c.loggedAt)} by {c.vaName ?? "the VA"}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-ink">{c.summary}</p>
      <p className="mt-3 text-[13px] text-muted">
        One call a day. Anything new goes through an escalation, not a second
        log.
      </p>
    </Panel>
  );
}

function Confirmation({
  s,
  logged,
  onBack,
  onEscalations,
}: {
  s: CallSubject;
  logged: Logged;
  onBack: () => void;
  onEscalations: () => void;
}) {
  const escalated = logged.state !== "reached";
  return (
    <div className="space-y-3" aria-live="polite">
      <Banner
        tone="moss"
        title={
          logged.auto
            ? "Retries used. Logged as not reached automatically."
            : `Logged${logged.seconds !== null ? ` in ${stopwatch(logged.seconds)}` : ""}.`
        }
      >
        Summary will be in {s.familyName}&apos;s feed within{" "}
        {SUMMARY_DELIVERY_MINUTES} minutes.{" "}
        <span className="opacity-70">
          (In this prototype it is already there.)
        </span>
      </Banner>
      {escalated ? (
        <Banner tone="clay" title="Escalation opened">
          {s.specialistName} gets it now. {s.familyName} alerted immediately.
          Safety alerts ignore quiet hours.
        </Banner>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <CButton onClick={onBack}>Next call</CButton>
        {escalated ? (
          <CButton variant="secondary" onClick={onEscalations}>
            See the escalation
          </CButton>
        ) : null}
      </div>
    </div>
  );
}

/** Two columns: who she is on the left, the call and the log on the right. */
export function CallScreen({
  s,
  now,
  vaName,
  retry,
  onRetry,
  onLog,
  onBack,
  onEscalations,
}: {
  s: CallSubject;
  now: number;
  vaName: string;
  retry: RetryState;
  onRetry: (next: RetryState) => void;
  onLog: (input: LogInput, seconds: number | null) => void;
  onBack: () => void;
  onEscalations: () => void;
}) {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [phaseStartedAt, setPhaseStartedAt] = useState<number | null>(null);
  const { noAnswers, nextRetryAt } = retry;
  const [loggingStartedAt, setLoggingStartedAt] = useState<number | null>(null);
  const [logged, setLogged] = useState<Logged | null>(null);

  const ops = useOpsSettings();
  const exhausted = noAnswers.length >= 1 + ops.retries;
  const min = minutesToClose(s.tz, s.windowStart, now);

  function go(p: CallPhase) {
    setPhase(p);
    setPhaseStartedAt(Date.now());
  }

  function noAnswer() {
    const t = Date.now();
    const list = [...noAnswers, t];
    setPhase("idle");
    setPhaseStartedAt(null);
    if (list.length >= 1 + ops.retries) {
      // CHK-004: no answer after the last retry logs itself and opens the
      // escalation. Nobody has to remember to do it.
      onRetry({ noAnswers: list, nextRetryAt: null });
      const input: LogInput = {
        state: "not_reached",
        summary: draftSummary(s, "not_reached", "", list.length),
        vaName,
      };
      onLog(input, null);
      setLogged({ state: "not_reached", seconds: null, auto: true });
    } else
      onRetry({
        noAnswers: list,
        nextRetryAt: t + ops.gapMinutes * 60_000,
      });
  }

  function log(input: LogInput) {
    const seconds = loggingStartedAt
      ? (Date.now() - loggingStartedAt) / 1000
      : null;
    onLog(input, seconds);
    setLogged({ state: input.state, seconds });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <CButton size="sm" variant="ghost" onClick={onBack}>
          ‹ Call queue
        </CButton>
        <p className="text-[14px] text-muted">
          Her time {localTimeLabel(s.tz, now)} · window{" "}
          {windowLabel(s.windowStart)} ·{" "}
          <span className={min < 30 ? "font-semibold text-clay" : "text-ink"}>
            {min < 0
              ? `closed ${minutesLabel(min)} ago`
              : `${minutesLabel(min)} left`}
          </span>
          {s.live ? null : (
            <span className="ml-2 text-faint">
              · Roster family, logged locally
            </span>
          )}
        </p>
      </div>

      <VoiceNote s={s} vaName={vaName} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <KnowHer s={s} />
        <div className="space-y-5">
          {s.today && !logged ? (
            <LoggedToday s={s} />
          ) : logged ? (
            <Confirmation
              s={s}
              logged={logged}
              onBack={onBack}
              onEscalations={onEscalations}
            />
          ) : (
            <>
              <DialPanel
                retries={ops.retries}
                gapMinutes={ops.gapMinutes}
                phone={s.phone}
                now={now}
                phase={phase}
                phaseStartedAt={phaseStartedAt}
                noAnswers={noAnswers}
                nextRetryAt={nextRetryAt}
                onDial={() => go("ringing")}
                onAnswered={() => go("connected")}
                onNoAnswer={noAnswer}
                onHangUp={() => {
                  go("ended");
                  setLoggingStartedAt((v) => v ?? Date.now());
                }}
                onSkipWait={() => onRetry({ noAnswers, nextRetryAt: null })}
              />
              <OutcomeLogger
                subject={s}
                now={now}
                vaName={vaName}
                attempts={noAnswers.length}
                notReachedAllowed={exhausted}
                loggingStartedAt={loggingStartedAt}
                onStartLogging={() => setLoggingStartedAt(Date.now())}
                onLog={log}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
