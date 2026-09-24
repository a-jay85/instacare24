"use client";

import type { Metric } from "@/lib/console/metrics";

/** Five numbers against the scope's targets. Status is in words, not colour alone. */
export function MetricsStrip({
  metrics,
  detailed,
}: {
  metrics: Metric[];
  detailed?: boolean;
}) {
  return (
    <dl className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      {metrics.map((m) => (
        <div
          key={m.id}
          className={`rounded-2xl border bg-surface p-4 ${
            m.ok ? "border-line" : "border-clay/40"
          }`}
        >
          <dt className="text-[12px] font-medium text-muted">{m.label}</dt>
          <dd className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span
              className={`whitespace-nowrap font-serif text-[26px] leading-none ${
                m.ok ? "text-ink" : "text-clay"
              }`}
            >
              {m.value}
            </span>
            <span
              className={`whitespace-nowrap text-[12px] font-medium ${m.ok ? "text-moss" : "text-clay"}`}
            >
              {m.ok ? "On target" : "Off target"}
            </span>
          </dd>
          <dd className="mt-1 text-[12px] text-faint">Target {m.target}</dd>
          {detailed ? (
            <dd className="mt-2 border-t border-line pt-2 text-[13px] text-muted">
              {m.detail}
            </dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
