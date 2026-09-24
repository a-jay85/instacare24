"use client";

import { useState } from "react";
import { Banner } from "@/components/ui";
import { clockLabel } from "@/lib/console/time";
import type { FamilyNotification, VisitSummary } from "@/lib/types";
import { CButton, ConsoleHeader, Panel } from "./primitives";

export const SOURCE_WORD: Record<VisitSummary["source"], string> = {
  audio: "Recording",
  photo: "Photo",
  pdf: "PDF",
};

export function visitDay(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">
        {title}
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((t) => (
          <li
            key={t}
            className="flex gap-2 text-[14px] leading-relaxed text-ink"
          >
            <span
              aria-hidden
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage"
            />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One draft: transcript beside the plain-English summary, flags on top. */
export function VisitDraftView({
  visit,
  parentName,
  family,
  me,
  notice,
  onBack,
  onApprove,
}: {
  visit: VisitSummary;
  parentName: string;
  family: string;
  me: string;
  /** The email and text that went out on approval, if any. */
  notice?: FamilyNotification;
  onBack: () => void;
  onApprove: (plain: string) => void;
}) {
  const d = visit.draft;
  const [editing, setEditing] = useState(false);
  const [plain, setPlain] = useState(d?.plain ?? visit.plain);
  const sent = visit.status === "ready";

  const back = (
    <CButton variant="ghost" size="sm" onClick={onBack}>
      ‹ Back to visit summaries
    </CButton>
  );

  return (
    <div>
      <div className="-ml-3 mb-2">{back}</div>
      <ConsoleHeader
        title={`${visit.provider} · ${visit.specialty}`}
        subtitle={`${parentName} · ${visitDay(visit.date)} · ${SOURCE_WORD[visit.source]}`}
      />

      {sent ? (
        <div className="mb-5" role="status">
          <Banner tone="moss" title={`Sent to ${family}`}>
            Checked by {visit.verifiedBy}
            {visit.reviewedAt ? ` at ${clockLabel(visit.reviewedAt)}` : ""}. It
            is in their visits now.{" "}
            {!notice
              ? "No email or text went out."
              : notice.deliveries.some((d) => d.held)
                ? "The email and text are held for quiet hours and go out when those end."
                : "They got an email and a text too."}
          </Banner>
        </div>
      ) : null}

      {!sent && d?.flags.length ? (
        <Panel title={`Flags · ${d.flags.length}`} className="mb-5">
          <ul className="grid gap-3 lg:grid-cols-2">
            {d.flags.map((f) => (
              <li
                key={f.title}
                className={`rounded-xl border p-3 ${
                  f.kind === "guardrail"
                    ? "border-clay/25 bg-clay-soft"
                    : "border-amber/25 bg-amber-soft"
                }`}
              >
                <p
                  className={`text-[14px] font-semibold ${
                    f.kind === "guardrail" ? "text-clay" : "text-amber"
                  }`}
                >
                  {f.title}
                </p>
                <p className="mt-1 text-[14px] text-ink italic">
                  &ldquo;{f.quote}&rdquo;
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  {f.note}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Transcript">
          <p className="max-h-[28rem] overflow-y-auto text-[14px] leading-relaxed whitespace-pre-wrap text-muted">
            {d?.transcript ?? visit.transcript}
          </p>
        </Panel>

        <Panel
          title={sent ? "What the family reads" : "Plain-English draft"}
          action={
            !sent && !editing ? (
              <CButton
                size="sm"
                variant="ghost"
                className="-my-3"
                onClick={() => setEditing(true)}
              >
                Edit
              </CButton>
            ) : null
          }
        >
          {editing && !sent ? (
            <label className="block">
              <span className="sr-only">Summary the family reads</span>
              <textarea
                rows={5}
                value={plain}
                onChange={(e) => setPlain(e.target.value)}
                className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2 font-serif text-[17px] leading-relaxed text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
              />
              <span className="mt-1 block text-[12px] text-faint">
                Light edits only. Keep to what the doctor said.
              </span>
            </label>
          ) : (
            <p className="font-serif text-[18px] leading-relaxed text-ink">
              {sent ? visit.plain : plain}
            </p>
          )}
          <List
            title="Diagnoses mentioned"
            items={d?.diagnoses ?? visit.diagnoses}
          />
          <List
            title="Medication changes"
            items={d?.medicationChanges ?? visit.medicationChanges}
          />
          <List title="Follow-ups" items={d?.followUps ?? visit.followUps} />
          <List
            title="Reminders to set"
            items={d?.reminders ?? visit.reminders}
          />
        </Panel>
      </div>

      {!sent ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <CButton disabled={!plain.trim()} onClick={() => onApprove(plain)}>
            Approve and send to family
          </CButton>
          <p className="text-[13px] text-muted">
            Signed as {me}. It goes to {family} in the app, and by email and
            text outside their quiet hours.
          </p>
        </div>
      ) : (
        <div className="mt-5">{back}</div>
      )}
    </div>
  );
}
