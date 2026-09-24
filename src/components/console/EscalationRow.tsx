"use client";

import { useState } from "react";
import { Pill } from "@/components/ui";
import { ACK_TARGET_MINUTES } from "@/lib/console/roles";
import type { ConsoleEscalation } from "@/lib/console/synthetic";
import { ageMinutes, clockLabel, minutesLabel } from "@/lib/console/time";
import type { EscalationSource } from "@/lib/types";
import { CButton, FOCUS, TierPill } from "./primitives";

export const SOURCE_LABEL: Record<EscalationSource, string> = {
  something_off: "Something is off",
  no_answer: "No answer after retries",
  missed_window: "Window closed, nothing logged",
  family_request: "Family asked to talk",
  risk_score: "Risk score",
  consent_withdrawn: "Consent withdrawn",
  consent_declined: "Consent call: not now",
  assistant: "From the assistant",
  deceased: "Death reported",
};

export const ROW_COLS =
  "grid grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_minmax(0,1fr)_4.5rem_minmax(0,1fr)_minmax(0,1.6fr)_6.5rem] items-start gap-3";

export function isOverdue(e: ConsoleEscalation, now: number): boolean {
  return (
    !e.esc.resolvedAt &&
    !e.esc.owner &&
    ageMinutes(e.esc.openedAt, now) > ACK_TARGET_MINUTES
  );
}

function Form({
  label,
  placeholder,
  submit,
  variant,
  onSubmit,
}: {
  label: string;
  placeholder: string;
  submit: string;
  variant: "primary" | "secondary";
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <label className="block text-[13px] font-medium text-ink">
        {label}
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface px-3 py-2 text-[14px] font-normal text-ink outline-none placeholder:text-faint focus:border-sage focus:ring-2 focus:ring-sage/20"
        />
      </label>
      <CButton
        size="sm"
        variant={variant}
        disabled={!text.trim()}
        onClick={() => {
          onSubmit(text.trim());
          setText("");
        }}
        className="mt-2"
      >
        {submit}
      </CButton>
    </div>
  );
}

/** One escalation. Collapsed: the queue columns. Expanded: timeline and actions. */
export function EscalationRow({
  row,
  now,
  me,
  readOnly,
  canOwn,
  onTake,
  onResolve,
  onFamily,
}: {
  row: ConsoleEscalation;
  now: number;
  me: string;
  readOnly: boolean;
  canOwn: boolean;
  onTake: (nextAction: string) => void;
  onResolve: (note: string) => void;
  onFamily?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { esc } = row;
  const overdue = isOverdue(row, now);
  const age = ageMinutes(esc.openedAt, now);
  const id = `esc-${esc.id}`;

  return (
    <li
      className={`rounded-xl border ${
        overdue
          ? "border-clay/50 bg-clay-soft"
          : open
            ? "border-line bg-cream/60"
            : esc.resolvedAt
              ? "border-transparent opacity-70"
              : "border-transparent"
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={`${ROW_COLS} w-full rounded-xl px-3 py-3 text-left text-[14px] hover:bg-cream/70 ${FOCUS}`}
      >
        <span className="font-medium text-ink">
          {row.parentName}
          {row.live ? (
            <span className="block text-[11px] font-semibold text-sage-dark">
              Live family
            </span>
          ) : null}
        </span>
        <span className="min-w-0">
          <span className="block text-ink">{esc.title}</span>
          <span className="block truncate text-[12px] text-muted">
            {esc.detail}
          </span>
        </span>
        <span className="text-muted">{SOURCE_LABEL[esc.source]}</span>
        <span
          className={`tabular-nums ${overdue ? "font-semibold text-clay" : "text-ink"}`}
        >
          {minutesLabel(age)}
        </span>
        <span>
          {esc.resolvedAt ? (
            <Pill tone="moss">Resolved</Pill>
          ) : esc.owner ? (
            <span className="text-ink">{esc.owner}</span>
          ) : (
            <span
              className={overdue ? "font-semibold text-clay" : "text-amber"}
            >
              {overdue ? "Nobody · overdue" : "Nobody yet"}
            </span>
          )}
        </span>
        <span className="text-muted">
          {esc.resolvedAt
            ? esc.resolution
            : (esc.nextAction ?? "None recorded")}
        </span>
        <span>
          <TierPill tier={esc.tier} score={esc.riskScore} />
        </span>
      </button>

      {open ? (
        <div id={id} className="grid gap-4 px-3 pb-4 lg:grid-cols-2">
          <div>
            <p className="text-[14px] leading-relaxed text-ink">{esc.detail}</p>
            {row.tz ? (
              <p className="mt-3 text-[12px] text-faint">
                Times are {row.parentName.split(" ")[0]}&apos;s time.
              </p>
            ) : null}
            <ol className="mt-2 space-y-2 border-l-2 border-line pl-4">
              {esc.timeline.map((t, i) => (
                <li key={i} className="text-[13px]">
                  <span className="tabular-nums text-faint">
                    {clockLabel(t.at, row.tz)}
                  </span>{" "}
                  <span className="font-medium text-ink">{t.by}</span>{" "}
                  <span className="text-muted">{t.text}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-3">
            {onFamily ? (
              <CButton size="sm" variant="secondary" onClick={onFamily}>
                Open family page ›
              </CButton>
            ) : null}
            {readOnly || esc.resolvedAt || !canOwn ? null : (
              <>
                {esc.owner !== me ? (
                  <Form
                    label={`Take it as ${me}: what happens next?`}
                    placeholder="e.g. Call her emergency contact by 2 PM."
                    submit="Take it"
                    variant="primary"
                    onSubmit={onTake}
                  />
                ) : null}
                <Form
                  label="Resolve: what happened?"
                  placeholder="e.g. Reached her at 1:40 PM, she was at lunch."
                  submit="Resolve"
                  variant="secondary"
                  onSubmit={onResolve}
                />
              </>
            )}
          </div>
        </div>
      ) : null}
    </li>
  );
}
