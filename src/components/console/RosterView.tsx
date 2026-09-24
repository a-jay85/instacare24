"use client";

import { useState } from "react";
import { Pill } from "@/components/ui";
import {
  GAP_LIMITS,
  RETRY_LIMITS,
  saveOpsSettings,
  useOpsSettings,
} from "@/lib/console/opsSettings";
import { VA_STAFF, onShift } from "@/lib/console/roles";
import type { CallSubject } from "@/lib/console/subject";
import { CButton, Panel } from "./primitives";

const range = (lo: number, hi: number, step = 1) =>
  Array.from(
    { length: Math.floor((hi - lo) / step) + 1 },
    (_, i) => lo + i * step,
  );

/** Configurable values: Ops sets no-answer retries and the gap between them. */
function RetryRules() {
  const ops = useOpsSettings();
  const select =
    "mt-1.5 block w-full rounded-xl border border-line bg-surface px-3 py-2 text-[14px] font-normal";
  return (
    <Panel title="No-answer retries">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[13px] font-medium text-ink">
          Retries after the first call
          <select
            value={ops.retries}
            onChange={(e) =>
              saveOpsSettings({ ...ops, retries: Number(e.target.value) })
            }
            className={select}
          >
            {range(RETRY_LIMITS.min, RETRY_LIMITS.max).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[13px] font-medium text-ink">
          Minutes between tries
          <select
            value={ops.gapMinutes}
            onChange={(e) =>
              saveOpsSettings({ ...ops, gapMinutes: Number(e.target.value) })
            }
            className={select}
          >
            {range(GAP_LIMITS.min, GAP_LIMITS.max, 5).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-3 text-[12px] text-faint">
        Applies to every VA on this console from their next call. After the last
        try, the call logs itself as not reached and opens an escalation.
      </p>
    </Panel>
  );
}

/**
 * OPS-005 / CHK-006: who is on today, whose families they call, and the
 * designed hand-over when a family moves to a new voice (the "VA leaves"
 * edge case). Care Specialist only.
 */
export function RosterView({
  families,
  onHandOver,
}: {
  families: CallSubject[];
  onHandOver: (s: CallSubject, to: string, note: string) => void;
}) {
  return (
    <div className="space-y-5">
      <RetryRules />
      {VA_STAFF.map((va) => {
        const own = families.filter((f) => f.usualVa === va.name);
        const covering = VA_STAFF[0].name;
        return (
          <Panel
            key={va.name}
            title={va.name}
            action={
              va.shift ? (
                <Pill tone="moss">On today · {va.shift}</Pill>
              ) : (
                <Pill tone="amber">Off today</Pill>
              )
            }
          >
            {!va.shift && own.length ? (
              <p className="mb-3 text-[13px] text-muted">
                {covering} covers these calls today. They come back to{" "}
                {va.name.split(" ")[0]} tomorrow.
              </p>
            ) : null}
            {own.length ? (
              <ul className="divide-y divide-line">
                {own.map((s) => (
                  <Family key={s.key} s={s} onHandOver={onHandOver} />
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-muted">No families right now.</p>
            )}
          </Panel>
        );
      })}
    </div>
  );
}

function Family({
  s,
  onHandOver,
}: {
  s: CallSubject;
  onHandOver: (s: CallSubject, to: string, note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const others = VA_STAFF.filter(
    (v) => v.name !== s.usualVa && onShift(v.name),
  );
  const [to, setTo] = useState(others[0]?.name ?? "");
  const [note, setNote] = useState("");
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[14px] font-medium text-ink">
          {s.fullName}
          {s.live ? (
            <span className="ml-2 text-[11px] font-semibold text-sage-dark">
              Live family
            </span>
          ) : null}
          {s.handoff ? (
            <span className="block text-[12px] font-normal text-muted">
              From {s.handoff.from} since{" "}
              {new Date(s.handoff.at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          ) : null}
        </span>
        {open ? null : (
          <CButton
            size="sm"
            variant="secondary"
            onClick={() => setOpen(true)}
            aria-label={`Hand ${s.preferredName} to another VA`}
          >
            Hand over
          </CButton>
        )}
      </div>
      {open ? (
        <div className="mt-3 rounded-xl border border-line bg-surface p-3">
          <label className="block text-[13px] font-medium text-ink">
            New VA
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-line bg-surface px-3 py-2 text-[14px] font-normal"
            >
              {others.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-[13px] font-medium text-ink">
            What should {to.split(" ")[0] || "they"} know before the first call?
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`e.g. ${s.preferredName} likes to talk about her garden first.`}
              className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface px-3 py-2 text-[14px] font-normal text-ink outline-none placeholder:text-faint focus:border-sage focus:ring-2 focus:ring-sage/20"
            />
          </label>
          <p className="mt-2 text-[12px] text-muted">
            {s.familyName} {s.live ? "is" : "would be"} told who calls now.
          </p>
          <div className="mt-2 flex gap-2">
            <CButton
              size="sm"
              disabled={!to || !note.trim()}
              onClick={() => {
                onHandOver(s, to, note.trim());
                setOpen(false);
                setNote("");
              }}
            >
              Hand to {to.split(" ")[0]}
            </CButton>
            <CButton size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </CButton>
          </div>
        </div>
      ) : null}
    </li>
  );
}
