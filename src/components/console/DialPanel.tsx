"use client";

import { NO_ANSWER_RETRIES, RETRY_GAP_MINUTES } from "@/lib/console/roles";
import { clockLabel, stopwatch } from "@/lib/console/time";
import { CButton } from "./primitives";

export type CallPhase = "idle" | "ringing" | "connected" | "ended";

/**
 * Fake dialler. Nothing is called; the timer is the point. CHK-004 retry
 * tracking uses the scope defaults (2 retries, 20 minutes apart).
 */
export function DialPanel({
  phone,
  now,
  phase,
  phaseStartedAt,
  noAnswers,
  nextRetryAt,
  onDial,
  onAnswered,
  onNoAnswer,
  onHangUp,
  onSkipWait,
}: {
  phone: string;
  now: number;
  phase: CallPhase;
  phaseStartedAt: number | null;
  noAnswers: number[];
  nextRetryAt: number | null;
  onDial: () => void;
  onAnswered: () => void;
  onNoAnswer: () => void;
  onHangUp: () => void;
  onSkipWait: () => void;
}) {
  const attempts = 1 + NO_ANSWER_RETRIES;
  const exhausted = noAnswers.length >= attempts;
  const waiting = nextRetryAt !== null && now < nextRetryAt;
  const elapsed = phaseStartedAt ? (now - phaseStartedAt) / 1000 : 0;

  return (
    <section
      aria-label="Call"
      className="rounded-2xl border border-line bg-surface p-5"
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">
        Her phone
      </p>
      <p className="mt-1 font-serif text-[34px] leading-tight tabular-nums text-ink">
        {phone}
      </p>

      <div
        className="mt-4 flex flex-wrap items-center gap-3"
        aria-live="polite"
      >
        {phase === "ringing" ? (
          <>
            <span className="text-[15px] text-ink">
              Ringing…{" "}
              <span className="tabular-nums">{stopwatch(elapsed)}</span>
            </span>
            <CButton onClick={onAnswered}>She answered</CButton>
            <CButton variant="secondary" onClick={onNoAnswer}>
              No answer
            </CButton>
          </>
        ) : phase === "connected" ? (
          <>
            <span className="flex items-center gap-2 text-[15px] text-moss">
              <span className="h-2 w-2 animate-pulse rounded-full bg-moss" />
              On the call{" "}
              <span className="tabular-nums">{stopwatch(elapsed)}</span>
            </span>
            <CButton variant="danger" onClick={onHangUp}>
              Hang up
            </CButton>
          </>
        ) : phase === "ended" ? (
          <span className="text-[15px] text-muted">
            Call ended. Log it while it is fresh.
          </span>
        ) : (
          <CButton onClick={onDial} disabled={exhausted || waiting}>
            {noAnswers.length ? "Dial again" : "Dial"}
          </CButton>
        )}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="text-[13px] font-medium text-ink">
          No-answer retries · {NO_ANSWER_RETRIES} retries, {RETRY_GAP_MINUTES}{" "}
          min apart
        </p>
        <ol className="mt-2 flex flex-wrap gap-2">
          {Array.from({ length: attempts }, (_, i) => {
            const at = noAnswers[i];
            return (
              <li
                key={i}
                className={`rounded-xl border px-3 py-2 text-[13px] ${
                  at
                    ? "border-amber/30 bg-amber-soft text-amber"
                    : "border-line text-faint"
                }`}
              >
                {i === 0 ? "First call" : `Retry ${i}`}
                <span className="block text-[12px]">
                  {at
                    ? `No answer ${clockLabel(new Date(at).toISOString())}`
                    : "Not yet"}
                </span>
              </li>
            );
          })}
        </ol>
        {waiting && nextRetryAt ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-muted">
            <span>
              Next try in{" "}
              <span className="tabular-nums text-ink">
                {stopwatch((nextRetryAt - now) / 1000)}
              </span>
            </span>
            <CButton size="sm" variant="ghost" onClick={onSkipWait}>
              Skip the wait (demo)
            </CButton>
          </div>
        ) : null}
        {exhausted ? (
          <p className="mt-3 text-[13px] font-medium text-clay">
            Retries used. Log this as not reached. An escalation opens
            automatically and the family is told.
          </p>
        ) : null}
      </div>
    </section>
  );
}
