"use client";

import { Banner } from "@/components/ui";
import type { ConsoleEscalation } from "@/lib/console/synthetic";
import { EscalationRow, ROW_COLS, isOverdue } from "./EscalationRow";
import { Panel } from "./primitives";

function sortOpen(rows: ConsoleEscalation[], now: number) {
  const rank = (r: ConsoleEscalation) =>
    isOverdue(r, now) ? 0 : r.esc.owner ? 2 : 1;
  return [...rows].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      new Date(a.esc.openedAt).getTime() - new Date(b.esc.openedAt).getTime(),
  );
}

/**
 * OPS-003 / ESC-002: owned with a next action, or resolved. Overdue items sort
 * to the top in clay. The Care Specialist takes or resolves; the VA watches.
 * The clinical reviewer takes the family's medical questions and reads the
 * rest (ESC-004).
 */
export function EscalationsView({
  rows,
  now,
  me,
  readOnly,
  watchOnly,
  canOwn,
  onTake,
  onResolve,
  onFamily,
}: {
  rows: ConsoleEscalation[];
  now: number;
  me: string;
  readOnly: boolean;
  /** Whether this seat may take and resolve this row. */
  /** The VA: sees who has each one, takes none. */
  watchOnly: boolean;
  canOwn: (row: ConsoleEscalation) => boolean;
  onTake: (row: ConsoleEscalation, nextAction: string) => void;
  onResolve: (row: ConsoleEscalation, note: string) => void;
  /** Care Specialist only: open this parent on Families (OPS-004). */
  onFamily?: (parentName: string) => void;
}) {
  const open = sortOpen(
    rows.filter((r) => !r.esc.resolvedAt),
    now,
  );
  const resolved = rows
    .filter((r) => r.esc.resolvedAt)
    .sort((a, b) =>
      (b.esc.resolvedAt ?? "").localeCompare(a.esc.resolvedAt ?? ""),
    );

  const render = (r: ConsoleEscalation) => (
    <EscalationRow
      key={r.esc.id}
      row={r}
      now={now}
      me={me}
      readOnly={readOnly && !canOwn(r)}
      canOwn={canOwn(r)}
      onTake={(t) => onTake(r, t)}
      onResolve={(t) => onResolve(r, t)}
      onFamily={onFamily ? () => onFamily(r.parentName) : undefined}
    />
  );

  const header = (resolvedList: boolean) => (
    <div
      aria-hidden
      className={`${ROW_COLS} border-b border-line px-3 pb-2 text-[12px] font-medium text-faint`}
    >
      <span>Parent</span>
      <span>What happened</span>
      <span>Source</span>
      <span>Age</span>
      <span>{resolvedList ? "Status" : "Owner"}</span>
      <span>{resolvedList ? "Resolution" : "Next action"}</span>
      <span>Tier</span>
    </div>
  );

  return (
    <div className="space-y-5">
      {readOnly ? (
        <Banner
          tone="critical"
          title="Non-advice boundary: clinical questions go to her licensed providers."
        >
          You take the family&apos;s medical questions. Everything else here is
          read-only. No diagnosis, prescribing, treatment advice or lab
          interpretation from this console. Clinical questions go to her own
          doctors.
        </Banner>
      ) : watchOnly ? (
        <p className="rounded-xl bg-sage-soft px-4 py-3 text-[14px] text-sage-dark">
          The Care Specialist owns these. The family is already alerted.
        </p>
      ) : (
        <p className="rounded-xl bg-sage-soft px-4 py-3 text-[14px] text-sage-dark">
          Family alerted immediately when an escalation opens. Safety alerts
          ignore quiet hours. Every open item needs a named owner and a next
          action, or a resolution. There is no third state.
        </p>
      )}

      <div className="overflow-x-auto">
        <Panel title={`Open · ${open.length}`} className="min-w-[860px]">
          {header(false)}
          {open.length ? (
            <ol className="mt-1 space-y-1">{open.map(render)}</ol>
          ) : (
            <p className="px-3 py-6 text-[15px] text-muted">
              Nothing open. Every escalation is resolved.
            </p>
          )}
        </Panel>
      </div>

      {resolved.length ? (
        <div className="overflow-x-auto">
          <Panel
            title={`Resolved · ${resolved.length}`}
            className="min-w-[860px]"
          >
            {header(true)}
            <ol className="mt-1 space-y-1">{resolved.map(render)}</ol>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
