import type { CallSubject } from "./subject";
import { METRIC_BASELINE, type ConsoleEscalation } from "./synthetic";
import { ACK_TARGET_MINUTES, LOGGING_TARGET_SECONDS } from "./roles";
import { localClock, minutesToClose } from "./time";

export type Metric = {
  id: string;
  label: string;
  value: string;
  target: string;
  ok: boolean;
  detail: string;
};

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank))];
}

function loggedInWindow(s: CallSubject): boolean {
  if (!s.today?.loggedAt) return false;
  const { hour } = localClock(s.tz, new Date(s.today.loggedAt).getTime());
  return hour >= s.windowStart && hour < s.windowStart + 2;
}

/**
 * Loosely computed: a weekly baseline from the synthetic roster plus whatever
 * has happened in this session. Good enough to show the shape of the numbers.
 */
export function computeMetrics(input: {
  subjects: CallSubject[];
  escalations: ConsoleEscalation[];
  loggingSeconds: number[];
  now: number;
}): Metric[] {
  const { subjects, escalations, loggingSeconds, now } = input;

  let inWindow = METRIC_BASELINE.weekInWindow;
  let scheduled = METRIC_BASELINE.weekScheduled;
  for (const s of subjects) {
    const closed = minutesToClose(s.tz, s.windowStart, now) < 0;
    if (s.today || closed) scheduled += 1;
    if (loggedInWindow(s)) inWindow += 1;
  }
  const windowPct = (inWindow / scheduled) * 100;

  const dayAgo = now - 86_400_000;
  const recent = escalations.filter(
    (e) => new Date(e.esc.openedAt).getTime() > dayAgo,
  );

  let naOk = METRIC_BASELINE.noAnswerResolvedIn2h;
  let naTotal = METRIC_BASELINE.noAnswerTotal;
  let naPending = 0;
  for (const { esc } of recent.filter((e) => e.esc.source === "no_answer")) {
    const opened = new Date(esc.openedAt).getTime();
    const limit = opened + 2 * 3_600_000;
    if (esc.resolvedAt) {
      naTotal += 1;
      if (new Date(esc.resolvedAt).getTime() <= limit) naOk += 1;
    } else if (now > limit) naTotal += 1;
    else naPending += 1;
  }

  const acks = [...METRIC_BASELINE.ackMinutes];
  for (const { esc } of recent) {
    const opened = new Date(esc.openedAt).getTime();
    const ack = esc.timeline.find(
      (t) =>
        t.text.startsWith("Took ownership") || t.text.startsWith("Resolved"),
    );
    const at = ack ? new Date(ack.at).getTime() : now;
    acks.push((at - opened) / 60_000);
  }
  const p90 = percentile(acks, 90);

  const logs = [...METRIC_BASELINE.loggingSeconds, ...loggingSeconds];
  const median = percentile(logs, 50);

  return [
    {
      id: "window",
      label: "Check-ins inside window",
      value: `${windowPct.toFixed(1)}%`,
      target: "≥ 92% weekly",
      ok: windowPct >= 92,
      detail: `${inWindow} of ${scheduled} this week`,
    },
    {
      id: "noanswer",
      label: "No-answer resolved within 2h",
      value: `${naOk} of ${naTotal}`,
      target: "100%",
      ok: naOk === naTotal,
      detail: naPending
        ? `${naPending} still inside the 2 hours`
        : "Every one reached a known state",
    },
    {
      id: "ack",
      label: "Escalation ack, p90",
      value: `${Math.round(p90)} min`,
      target: `≤ ${ACK_TARGET_MINUTES} min`,
      ok: p90 <= ACK_TARGET_MINUTES,
      detail: `${acks.length} escalations today, open ones count their age`,
    },
    {
      id: "logging",
      label: "Median logging time",
      value: `${Math.round(median)}s`,
      target: `< ${LOGGING_TARGET_SECONDS}s`,
      ok: median < LOGGING_TARGET_SECONDS,
      detail: `${logs.length} calls logged this shift`,
    },
  ];
}
