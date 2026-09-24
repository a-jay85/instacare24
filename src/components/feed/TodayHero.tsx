"use client";

import { Banner, Pill, type Tone } from "@/components/ui";
import { consentDeclined, todayIso } from "@/lib/actions";
import { CHANNEL_COPY, CHECK_IN, CONSENT_CALL_SLA_HOURS } from "@/lib/config";
import { formatHour, formatWindow, timezoneLabel } from "@/lib/timezones";
import type { Account, CheckInState } from "@/lib/types";
import { minutesIn, timeIn, useNow } from "./time";

/** Same words and tones as the history list, so today and Earlier agree. */
const LOGGED: Record<CheckInState, { label: string; tone: Tone }> = {
  reached: { label: "Reached", tone: "moss" },
  not_reached: { label: "No answer", tone: "clay" },
  something_off: { label: "Something is off", tone: "clay" },
};

function Hero({
  title,
  children,
  large,
}: {
  title: string;
  children?: React.ReactNode;
  large?: boolean;
}) {
  return (
    <div className="mt-3">
      <h1
        className={`font-serif leading-tight text-ink ${large ? "text-[30px]" : "text-[28px]"}`}
      >
        {title}
      </h1>
      {children}
    </div>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 text-[16px] leading-relaxed text-muted">{children}</p>
  );
}

/**
 * FEED-001: one sentence that answers "is my mother alright today", above the
 * fold, without interpreting. Precedence: deceased, withdrawn, not yet
 * consented, today's call, not checked yet.
 */
export function TodayHero({ account }: { account: Account }) {
  const nowMs = useNow();
  const { parent, careTeam } = account;
  const name = parent.preferredName;
  const channel = CHANNEL_COPY[parent.channel];
  const windowText = formatWindow(
    parent.checkInWindow.startHour,
    CHECK_IN.windowLengthHours,
  );
  const zone = timezoneLabel(parent.parentTimezone);

  // BIL-002: calm, human, no automated tone. Everything else on the page goes.
  if (account.deceasedAt) {
    return (
      <Hero title={`We are so sorry about ${name}.`}>
        <Lead>
          Everything has stopped: the calls, the reminders and the billing.
          {` ${careTeam.specialistName}`} will call you herself, whenever it
          suits you. There is nothing you need to do here.
        </Lead>
      </Hero>
    );
  }

  // AUT-003: the family is told, never the reason.
  if (parent.consent.state === "withdrawn") {
    return (
      <Hero title={`${name} asked us to stop calling.`}>
        <Lead>
          She withdrew her consent, which is hers to do. Check-ins stop within
          24 hours. A Care Specialist can talk this through with you.
        </Lead>
      </Hero>
    );
  }

  // AUT-002: her "not now" is an answer, not a retry.
  if (parent.consent.state === "pending" && consentDeclined(account)) {
    return (
      <Hero title={`${name} said not now.`}>
        <Lead>
          We asked her about a daily check-in and she said not yet, which is
          hers to decide. No calls will run and we will not keep asking her.
          {` ${careTeam.specialistName}`} will call you to talk through what she
          said.
        </Lead>
      </Hero>
    );
  }

  // AUT-002: nothing runs until she has said yes herself.
  if (parent.consent.state !== "granted") {
    return (
      <Hero title={`We haven't spoken to ${name} yet.`}>
        <Lead>
          A Care Specialist will {channel.verb} her within{" "}
          {CONSENT_CALL_SLA_HOURS} hours to ask whether she wants a daily
          check-in. Nothing runs until she says yes.
        </Lead>
        <div className="mt-5">
          <Banner tone="amber" title="Her window is ready and waiting.">
            {windowText}, {zone}. Daily calls begin the day after she
            agrees.
          </Banner>
        </div>
      </Hero>
    );
  }

  const today = account.checkIns.find((c) => c.date === todayIso());

  if (today && today.state !== null) {
    const title =
      today.state === "reached"
        ? `${name} is alright today.`
        : today.state === "not_reached"
          ? `We could not reach ${name} today.`
          : `Something is off with ${name} today.`;
    const pill = LOGGED[today.state];
    return (
      <Hero title={title} large>
        <div className="mt-3">
          <Pill tone={pill.tone}>{pill.label}</Pill>
        </div>
        <Lead>{today.summary}</Lead>
        {today.vaName || today.loggedAt ? (
          <p className="mt-3 text-[13px] text-faint">
            {today.vaName ? `${today.vaName} called` : "Logged"}
            {today.loggedAt
              ? ` · logged ${timeIn(today.loggedAt, parent.parentTimezone)} her time`
              : ""}
          </p>
        ) : null}
      </Hero>
    );
  }

  // FEED-002: an unchecked day never reads as empty or as fine. The copy
  // follows her clock: before the window, during it, and after it closes.
  const start = parent.checkInWindow.startHour;
  const end = start + CHECK_IN.windowLengthHours;
  const mins = nowMs ? minutesIn(nowMs, parent.parentTimezone) : null;
  const phase =
    mins === null
      ? "unknown"
      : mins < start * 60
        ? "before"
        : mins < end * 60
          ? "during"
          : "after";

  if (phase === "after") {
    return (
      <Hero title={`We have not heard from ${name} yet today.`} large>
        <div className="mt-3">
          <Pill tone="amber">Not checked</Pill>
        </div>
        <Lead>
          Her window closed at {formatHour(end)} her time with no check-in
          logged. {careTeam.specialistName} is following up and will update you
          here.
        </Lead>
      </Hero>
    );
  }

  return (
    <Hero title="No check-in yet today." large>
      <div className="mt-3">
        <Pill tone="amber">Not checked yet</Pill>
      </div>
      <Lead>
        {phase === "during"
          ? `Her window is open now, until ${formatHour(end)} her time.`
          : phase === "before"
            ? `${careTeam.vaName} will call her in her window, ${windowText}, ${zone}.`
            : `Her window is ${windowText}, ${zone}.`}{" "}
        We will tell you either way, before you have to wonder.
      </Lead>
    </Hero>
  );
}
