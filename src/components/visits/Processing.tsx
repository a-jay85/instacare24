"use client";

import { Card } from "@/components/ui";
import { pipelineStages, type VisitSource } from "@/lib/visits";

/**
 * Workflow Epics 2-8 as a stepper. `step` is the stage in progress; once it
 * passes the last stage the summary is with a human (Epic 8's review queue).
 */
export function Processing({
  source,
  label,
  step,
  specialistFirst,
}: {
  source: VisitSource;
  label: string;
  step: number;
  specialistFirst: string;
}) {
  const stages = pipelineStages(source);
  const reviewing = step >= stages.length;
  const status =
    step < 0
      ? "Starting…"
      : reviewing
        ? `Being checked by ${specialistFirst}.`
        : `${stages[step].title}…`;

  return (
    <div>
      <p className="text-[14px] text-muted">{label}</p>
      <p
        className="mt-1 font-serif text-[22px] leading-snug text-ink"
        aria-live="polite"
        role="status"
      >
        {status}
      </p>

      <ol className="mt-6 space-y-4">
        {stages.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li
              key={s.title}
              aria-current={current ? "step" : undefined}
              className="flex gap-3"
            >
              <span
                aria-hidden
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[12px] ${
                  done
                    ? "border-sage bg-sage text-white"
                    : current
                      ? "border-sage text-sage"
                      : "border-line text-faint"
                }`}
              >
                {done ? (
                  "✓"
                ) : current ? (
                  <span className="h-2 w-2 rounded-full bg-sage motion-safe:animate-pulse" />
                ) : null}
              </span>
              <span>
                <span
                  className={`block text-[15px] font-medium ${
                    done || current ? "text-ink" : "text-faint"
                  }`}
                >
                  {s.title}
                  <span className="sr-only">
                    {done ? ", done" : current ? ", in progress" : ", waiting"}
                  </span>
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                  {s.detail}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {reviewing ? (
        <Card className="mt-6 border-amber/30 bg-amber-soft/50">
          <p className="text-[15px] font-medium text-ink">
            {specialistFirst} is reading it over.
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-muted">
            Your Care Specialist checks that nothing was added and nothing reads
            as medical advice. You will hear from us as soon as it&apos;s done.
          </p>
        </Card>
      ) : (
        <p className="mt-6 text-[13px] text-faint">
          You can go back to your visits. We&apos;ll let you know when it&apos;s
          ready.
        </p>
      )}
    </div>
  );
}
