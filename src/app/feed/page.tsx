"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Banner, Card, Pill, SectionTitle } from "@/components/ui";
import { CHANNEL_COPY, CHECK_IN, CONSENT_CALL_SLA_HOURS } from "@/lib/config";
import { useAccount } from "@/lib/store";
import { formatWindow, timezoneLabel } from "@/lib/timezones";
import type { CheckInRecord } from "@/lib/types";

function dayLabel(date: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (date === today) return "Today";
  const d = new Date(date + "T12:00:00");
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

/** FEED-002: a day with no completed check-in never reads as empty or as fine. */
function Entry({ record }: { record: CheckInRecord }) {
  const unchecked = record.state === null;
  return (
    <Card className={unchecked ? "border-amber/30 bg-amber-soft/50" : ""}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted">
          {dayLabel(record.date)}
        </span>
        {unchecked ? (
          <Pill tone="amber">Not checked</Pill>
        ) : record.state === "reached" ? (
          <Pill tone="moss">Reached</Pill>
        ) : record.state === "not_reached" ? (
          <Pill tone="clay">No answer</Pill>
        ) : (
          <Pill tone="clay">Something is off</Pill>
        )}
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-ink">
        {record.summary ?? "No check-in was completed on this day."}
      </p>
    </Card>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const { account, ready } = useAccount();

  useEffect(() => {
    if (ready && !account) router.replace("/");
  }, [ready, account, router]);

  if (!ready || !account) return null;

  const { parent } = account;
  const channel = CHANNEL_COPY[parent.channel];
  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = account.checkIns.find((c) => c.date === today);
  const rest = account.checkIns.filter((c) => c.date !== today);

  return (
    <AppShell>
      <p className="text-[13px] font-medium text-faint">
        {parent.preferredName} · {timezoneLabel(parent.parentTimezone)}
      </p>

      {/* FEED-001: today's state is legible without scrolling and without interpreting. */}
      {parent.consent.state === "pending" ? (
        <div className="mt-3">
          <h1 className="font-serif text-[28px] leading-tight text-ink">
            We haven&apos;t spoken to {parent.preferredName} yet.
          </h1>
          <p className="mt-3 text-[16px] leading-relaxed text-muted">
            A Care Specialist will {channel.verb} her within{" "}
            {CONSENT_CALL_SLA_HOURS} hours to ask whether she wants a daily
            check-in. Nothing runs until she says yes.
          </p>
          <div className="mt-5">
            <Banner tone="amber" title="Her window is ready and waiting.">
              {formatWindow(parent.checkInWindow.startHour, CHECK_IN.windowLengthHours)},{" "}
              {timezoneLabel(parent.parentTimezone)}. Daily calls begin the
              morning after she agrees.
            </Banner>
          </div>
        </div>
      ) : parent.consent.state === "withdrawn" ? (
        <div className="mt-3">
          <h1 className="font-serif text-[28px] leading-tight text-ink">
            {parent.preferredName} asked us to stop calling.
          </h1>
          <p className="mt-3 text-[16px] leading-relaxed text-muted">
            She withdrew her consent, which is hers to do. We have stopped the
            check-ins. A Care Specialist can talk this through with you.
          </p>
        </div>
      ) : todayRecord && todayRecord.state !== null ? (
        <div className="mt-3">
          <h1 className="font-serif text-[30px] leading-tight text-ink">
            {todayRecord.state === "reached"
              ? `${parent.preferredName} is alright today.`
              : todayRecord.state === "not_reached"
                ? `We could not reach ${parent.preferredName} today.`
                : `Something is off with ${parent.preferredName} today.`}
          </h1>
          <p className="mt-3 text-[16px] leading-relaxed text-muted">
            {todayRecord.summary}
          </p>
        </div>
      ) : (
        <div className="mt-3">
          <h1 className="font-serif text-[30px] leading-tight text-ink">
            No check-in yet today.
          </h1>
          <p className="mt-3 text-[16px] leading-relaxed text-muted">
            Her window is{" "}
            {formatWindow(parent.checkInWindow.startHour, CHECK_IN.windowLengthHours)}
            , {timezoneLabel(parent.parentTimezone)}. We will tell you either
            way, before you have to wonder.
          </p>
        </div>
      )}

      {rest.length > 0 ? (
        <div className="mt-9">
          <SectionTitle>Earlier</SectionTitle>
          <div className="space-y-3">
            {rest.map((r) => (
              <Entry key={r.id} record={r} />
            ))}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
