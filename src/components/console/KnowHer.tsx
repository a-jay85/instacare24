"use client";

import { Pill } from "@/components/ui";
import {
  STATE_TONE,
  outcomeLabel,
  type CallSubject,
} from "@/lib/console/subject";
import { TierPill } from "./primitives";

function dayLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-line pt-4">
      <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] text-muted">{children}</p>;
}

/**
 * CHK-005 and the VA persona: sound like you know this family. The Care
 * Specialist reads the same card on Families (OPS-004) under her own heading.
 */
export function KnowHer({
  s,
  heading = "Know her before you dial",
}: {
  s: CallSubject;
  heading?: string;
}) {
  const lastThree = s.history.slice(0, 3);
  return (
    <section
      aria-label={heading}
      className="space-y-4 rounded-2xl border border-line bg-surface p-5"
    >
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">
          {heading}
        </p>
        <p className="mt-2 font-serif text-[26px] leading-tight text-ink">
          Call her {s.preferredName}
        </p>
        <p className="text-[13px] text-muted">{s.fullName}</p>
      </div>

      <Block title="Her normal day">
        {s.normalDay.tags.length ? (
          <ul className="mb-3 flex flex-wrap gap-1.5">
            {s.normalDay.tags.map((t) => (
              <li key={t}>
                <Pill tone="sage">{t}</Pill>
              </li>
            ))}
          </ul>
        ) : null}
        {s.normalDay.notes ? (
          <blockquote className="rounded-xl border-l-4 border-sage bg-sage-soft px-4 py-3 text-[15px] leading-relaxed text-ink">
            {s.normalDay.notes}
            <footer className="mt-1 text-[12px] text-muted">
              From {s.familyName}, in their words
            </footer>
          </blockquote>
        ) : (
          <Empty>The family has not described her normal day yet.</Empty>
        )}
      </Block>

      <Block title="Last three check-ins">
        {lastThree.length ? (
          <ol className="space-y-3">
            {lastThree.map((c) => (
              <li key={c.id} className="text-[14px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">
                    {dayLabel(c.date)}
                  </span>
                  <Pill tone={c.state ? STATE_TONE[c.state] : "amber"}>
                    {outcomeLabel(c)}
                  </Pill>
                  {c.vaName ? (
                    <span className="text-[12px] text-faint">{c.vaName}</span>
                  ) : null}
                </div>
                <p className="mt-1 leading-snug text-muted">
                  {c.summary ?? "Nobody reached her and nothing was logged."}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <Empty>
            This is the first call. Introduce yourself and keep it short.
          </Empty>
        )}
      </Block>

      <Block title="Today's reminders">
        {s.meds.length ? (
          <ul className="space-y-2 text-[14px]">
            {s.meds.map((m) => (
              <li key={m.name}>
                <span className="font-medium text-ink">
                  {m.name} {m.dose}
                </span>{" "}
                <span className="text-muted">· {m.purpose}</span>
                <span className="block text-[12px] text-faint">
                  {m.today ?? m.when}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No medications on file.</Empty>
        )}
      </Block>

      <Block title="Open escalations">
        {s.openEscalations.length ? (
          <ul className="space-y-2 text-[14px]">
            {s.openEscalations.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2">
                <span className="text-ink">{e.title}</span>
                <TierPill tier={e.tier} score={e.riskScore} />
                <span className="text-[12px] text-muted">
                  {e.owner ? `with ${e.owner}` : "Nobody owns this yet"}
                </span>
                {e.nextAction ? (
                  <span className="basis-full text-[12px] text-muted">
                    Next: {e.nextAction}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>None open.</Empty>
        )}
      </Block>

      <Block title="Emergency contact">
        <p className="text-[14px] text-ink">
          {s.emergencyContact.name}{" "}
          <span className="text-muted">
            · {s.emergencyContact.relationship}
          </span>
        </p>
        <p className="text-[14px] tabular-nums text-muted">
          {s.emergencyContact.phone}
        </p>
      </Block>
    </section>
  );
}
