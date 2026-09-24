"use client";

import { CHECK_IN, CONSENT_CALL_SLA_HOURS } from "@/lib/config";
import type { Draft } from "@/lib/onboardingDraft";
import { timezoneLabel } from "@/lib/timezones";
import { Banner, Button } from "@/components/ui";
import { channel, compactWindow, familyWindow } from "./parts";

/**
 * AUT-002: the family has finished, but nothing runs until the parent herself
 * says yes on a recorded call. This screen says so plainly.
 */
export function StepDone({
  draft,
  onFeed,
  onProfile,
}: {
  draft: Draft;
  onFeed: () => void;
  onProfile: () => void;
}) {
  const name = draft.parent.preferredName.trim() || "your mother";
  const yours = familyWindow(draft, CHECK_IN.windowLengthHours);
  const agent =
    draft.agent.iAmTheAgent === false ? draft.agent.name.trim() : null;

  return (
    <div className="space-y-6 pt-2">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-moss-soft">
        <svg viewBox="0 0 20 20" aria-hidden className="h-7 w-7 fill-moss">
          <path d="M8.2 13.6 4.9 10.3l-1.2 1.2 4.5 4.5 8-8-1.2-1.2-6.8 6.8Z" />
        </svg>
      </div>
      <div>
        <h1
          tabIndex={-1}
          className="font-serif text-3xl leading-tight text-ink outline-none"
        >
          You&apos;re set up.
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">
          {name}&apos;s window is{" "}
          <span className="whitespace-nowrap font-medium text-ink">
            {compactWindow(draft.window.startHour, CHECK_IN.windowLengthHours)}
          </span>
          , {timezoneLabel(draft.parent.parentTimezone)}
          {yours ? (
            <>
              {" "}
              — <span className="whitespace-nowrap">{yours}</span> for you
            </>
          ) : null}
          .
        </p>
      </div>

      <Banner tone="amber" title={`Waiting on ${name}'s yes.`}>
        A Care Specialist will {channel.verb} her within{" "}
        {CONSENT_CALL_SLA_HOURS} hours to ask whether she is happy to get a
        daily check‑in. Daily calls start once she says yes. We will not call
        her before that.
      </Banner>

      <p className="text-[14px] leading-relaxed text-muted">
        You will see her answer in your feed either way. If she says no, you
        will hear it from us, but not why. Her reasons stay hers.
      </p>

      {agent ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-[14px] leading-relaxed text-muted">
          We&apos;ve emailed{" "}
          <span className="font-medium text-ink">{agent}</span> an invitation.
          Changes to {name}&apos;s care instructions go to them; you can see
          everything.
        </p>
      ) : null}

      <div className="space-y-3">
        <Button full onClick={onFeed}>
          Go to {name === "your mother" ? "my" : `${name}'s`} feed
        </Button>
        <Button full variant="secondary" onClick={onProfile}>
          Check what you entered
        </Button>
      </div>
    </div>
  );
}
