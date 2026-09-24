"use client";

import { useState } from "react";
import { suggestRiskScore } from "@/lib/risk";
import { LOGGING_TARGET_SECONDS } from "@/lib/console/roles";
import {
  STATE_LABEL,
  draftSummary,
  type CallSubject,
  type LogInput,
} from "@/lib/console/subject";
import { stopwatch } from "@/lib/console/time";
import type { CheckInState } from "@/lib/types";
import { CButton, FOCUS } from "./primitives";
import { RiskMeter } from "./RiskMeter";

const OUTCOMES: {
  state: CheckInState;
  hint: string;
  on: string;
}[] = [
  {
    state: "reached",
    hint: "She picked up and is herself.",
    on: "border-moss bg-moss-soft text-moss",
  },
  {
    state: "not_reached",
    hint: "Retries used, no answer.",
    on: "border-amber bg-amber-soft text-amber",
  },
  {
    state: "something_off",
    hint: "Opens an escalation.",
    on: "border-clay bg-clay-soft text-clay",
  },
];

function Stopwatch({ seconds }: { seconds: number | null }) {
  const over = seconds !== null && seconds > LOGGING_TARGET_SECONDS;
  return (
    <p
      className={`rounded-full border px-3 py-1 text-[13px] tabular-nums ${
        over
          ? "border-clay/30 bg-clay-soft text-clay"
          : "border-line bg-cream text-muted"
      }`}
    >
      Logging {seconds === null ? "0:00" : stopwatch(seconds)}{" "}
      <span className="opacity-70">
        / target under {LOGGING_TARGET_SECONDS}s
      </span>
    </p>
  );
}

/** OPS-002 and CHK-002: one of three states, logged in under a minute. */
export function OutcomeLogger({
  subject,
  now,
  vaName,
  attempts,
  notReachedAllowed,
  loggingStartedAt,
  onStartLogging,
  onLog,
}: {
  subject: CallSubject;
  now: number;
  vaName: string;
  attempts: number;
  notReachedAllowed: boolean;
  loggingStartedAt: number | null;
  onStartLogging: () => void;
  onLog: (input: LogInput) => void;
}) {
  const [state, setState] = useState<CheckInState | null>(null);
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");

  const score = suggestRiskScore(notes);
  const seconds = loggingStartedAt ? (now - loggingStartedAt) / 1000 : null;
  const name = subject.preferredName;

  function pick(s: CheckInState) {
    setState(s);
    if (!loggingStartedAt) onStartLogging();
  }

  function log() {
    if (!state) return;
    const text =
      summary.trim() ||
      draftSummary(subject, state, notes, Math.max(1, attempts));
    onLog({
      state,
      summary: text,
      vaName,
      riskScore: state === "not_reached" ? undefined : score,
    });
  }

  return (
    <section
      aria-label="Log the call"
      className="space-y-4 rounded-2xl border border-line bg-surface p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">
          Log the call
        </p>
        <Stopwatch seconds={seconds} />
      </div>

      <div
        role="radiogroup"
        aria-label="Outcome"
        className="grid gap-2 sm:grid-cols-3"
      >
        {OUTCOMES.map((o) => {
          const disabled = o.state === "not_reached" && !notReachedAllowed;
          const selected = state === o.state;
          return (
            <button
              key={o.state}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => pick(o.state)}
              className={`min-h-20 rounded-2xl border-2 p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS} ${
                selected
                  ? o.on
                  : "border-line bg-surface text-ink hover:border-sage/40"
              }`}
            >
              <span className="block text-[16px] font-semibold">
                {STATE_LABEL[o.state]}
              </span>
              <span className="mt-1 block text-[12px] opacity-80">
                {disabled ? "Logged for you when retries run out" : o.hint}
              </span>
            </button>
          );
        })}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Call notes
        </span>
        <textarea
          value={notes}
          rows={4}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={`What did ${name} say? Her words where you can.`}
          className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint focus:border-sage focus:ring-2 focus:ring-sage/20"
        />
      </label>

      <RiskMeter score={score} />
      {score >= 91 ? (
        <p
          role="alert"
          className="rounded-xl border border-clay bg-clay px-3 py-2 text-[14px] font-medium text-white"
        >
          If {name} may be in danger right now, call 911 first. Then log it as
          something is off.
        </p>
      ) : null}
      {state === "reached" && score > 60 ? (
        <p className="rounded-xl bg-amber-soft px-3 py-2 text-[13px] text-amber">
          The score reads high. If something is off, say so with the state. The
          score alone never opens an escalation.
        </p>
      ) : null}

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label
            htmlFor="family-summary"
            className="text-sm font-medium text-ink"
          >
            What {subject.familyName} will read
          </label>
          <CButton
            size="sm"
            variant="secondary"
            disabled={!state}
            onClick={() =>
              setSummary(
                draftSummary(subject, state, notes, Math.max(1, attempts)),
              )
            }
          >
            Draft summary
          </CButton>
        </div>
        <textarea
          id="family-summary"
          value={summary}
          rows={3}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Pick an outcome, then draft. If you leave this empty the draft is used."
          className="w-full resize-none rounded-xl border border-line bg-cream px-4 py-3 text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint focus:border-sage focus:ring-2 focus:ring-sage/20"
        />
        <p className="mt-1 text-[12px] text-faint">
          Scripted draft from your notes, not a model. Edit before you log.
        </p>
      </div>

      <CButton onClick={log} disabled={!state} className="w-full">
        Log call
      </CButton>
    </section>
  );
}
